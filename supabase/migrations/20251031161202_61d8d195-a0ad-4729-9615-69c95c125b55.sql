-- Step 1: Create user profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone, but only updatable by owner
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Step 2: Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data->>'display_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Add user_id column to routes table
ALTER TABLE public.routes ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 4: Add input validation constraints
ALTER TABLE public.routes ADD CONSTRAINT name_length CHECK (length(name) > 0 AND length(name) <= 100);
ALTER TABLE public.waypoints ADD CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90);
ALTER TABLE public.waypoints ADD CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180);

-- Step 5: Drop old permissive policies
DROP POLICY IF EXISTS "Anyone can view routes" ON public.routes;
DROP POLICY IF EXISTS "Anyone can create routes" ON public.routes;
DROP POLICY IF EXISTS "Anyone can view waypoints" ON public.waypoints;
DROP POLICY IF EXISTS "Anyone can create waypoints" ON public.waypoints;

-- Step 6: Create proper user-scoped RLS policies for routes
CREATE POLICY "Users can view their own routes"
ON public.routes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own routes"
ON public.routes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routes"
ON public.routes FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routes"
ON public.routes FOR DELETE
USING (auth.uid() = user_id);

-- Step 7: Create user-scoped RLS policies for waypoints (based on route ownership)
CREATE POLICY "Users can view waypoints of their own routes"
ON public.waypoints FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.routes WHERE routes.id = waypoints.route_id AND routes.user_id = auth.uid()
));

CREATE POLICY "Users can create waypoints for their own routes"
ON public.waypoints FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.routes WHERE routes.id = waypoints.route_id AND routes.user_id = auth.uid()
));

CREATE POLICY "Users can update waypoints of their own routes"
ON public.waypoints FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.routes WHERE routes.id = waypoints.route_id AND routes.user_id = auth.uid()
));

CREATE POLICY "Users can delete waypoints of their own routes"
ON public.waypoints FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.routes WHERE routes.id = waypoints.route_id AND routes.user_id = auth.uid()
));