-- Create routes table
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  total_distance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create waypoints table
CREATE TABLE IF NOT EXISTS public.waypoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waypoints ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this demo)
CREATE POLICY "Anyone can view routes"
ON public.routes FOR SELECT
USING (true);

CREATE POLICY "Anyone can create routes"
ON public.routes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view waypoints"
ON public.waypoints FOR SELECT
USING (true);

CREATE POLICY "Anyone can create waypoints"
ON public.waypoints FOR INSERT
WITH CHECK (true);

-- Create index on waypoints for better performance
CREATE INDEX IF NOT EXISTS idx_waypoints_route_id ON public.waypoints(route_id);
CREATE INDEX IF NOT EXISTS idx_waypoints_order ON public.waypoints(route_id, order_index);