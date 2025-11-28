-- Revert to public access policies
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own routes" ON public.routes;
DROP POLICY IF EXISTS "Users can create their own routes" ON public.routes;
DROP POLICY IF EXISTS "Users can update their own routes" ON public.routes;
DROP POLICY IF EXISTS "Users can delete their own routes" ON public.routes;
DROP POLICY IF EXISTS "Users can view waypoints of their routes" ON public.waypoints;
DROP POLICY IF EXISTS "Users can create waypoints for their routes" ON public.waypoints;
DROP POLICY IF EXISTS "Users can update waypoints of their routes" ON public.waypoints;
DROP POLICY IF EXISTS "Users can delete waypoints of their routes" ON public.waypoints;

-- Make user_id nullable (optional)
ALTER TABLE public.routes ALTER COLUMN user_id DROP NOT NULL;

-- Create public access policies
CREATE POLICY "Anyone can view routes"
ON public.routes FOR SELECT
USING (true);

CREATE POLICY "Anyone can create routes"
ON public.routes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update routes"
ON public.routes FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete routes"
ON public.routes FOR DELETE
USING (true);

CREATE POLICY "Anyone can view waypoints"
ON public.waypoints FOR SELECT
USING (true);

CREATE POLICY "Anyone can create waypoints"
ON public.waypoints FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update waypoints"
ON public.waypoints FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete waypoints"
ON public.waypoints FOR DELETE
USING (true);