import { useState } from "react";
import { Plus, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateTotalDistance = (waypoints) => {
  if (waypoints.length < 2) return 0;
  
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const lat1 = parseFloat(waypoints[i].latitude);
    const lon1 = parseFloat(waypoints[i].longitude);
    const lat2 = parseFloat(waypoints[i + 1].latitude);
    const lon2 = parseFloat(waypoints[i + 1].longitude);
    
    if (!isNaN(lat1) && !isNaN(lon1) && !isNaN(lat2) && !isNaN(lon2)) {
      total += calculateDistance(lat1, lon1, lat2, lon2);
    }
  }
  return total;
};

export const RouteForm = ({ onRouteCreated }) => {
  const [routeName, setRouteName] = useState("");
  const [waypoints, setWaypoints] = useState([
    { latitude: "", longitude: "", order: 1 },
    { latitude: "", longitude: "", order: 2 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addWaypoint = () => {
    setWaypoints([...waypoints, { latitude: "", longitude: "", order: waypoints.length + 1 }]);
  };

  const removeWaypoint = (index) => {
    if (waypoints.length > 2) {
      const newWaypoints = waypoints.filter((_, i) => i !== index);
      setWaypoints(newWaypoints.map((wp, i) => ({ ...wp, order: i + 1 })));
    }
  };

  const updateWaypoint = (index, field, value) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index][field] = value;
    setWaypoints(newWaypoints);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!routeName.trim()) {
      toast.error("Please enter a route name");
      return;
    }

    // Get current user (optional)
    const { data: { user } } = await supabase.auth.getUser();

    const validWaypoints = waypoints.filter(
      wp => wp.latitude.trim() && wp.longitude.trim()
    );

    if (validWaypoints.length < 2) {
      toast.error("Please add at least 2 waypoints with valid coordinates");
      return;
    }

    setIsSubmitting(true);

    try {
      const totalDistance = calculateTotalDistance(validWaypoints);

      const { data: route, error: routeError } = await supabase
        .from("routes")
        .insert({
          name: routeName,
          total_distance: totalDistance,
          user_id: user?.id || null,
        })
        .select()
        .single();

      if (routeError) throw routeError;

      const waypointsData = validWaypoints.map((wp) => ({
        route_id: route.id,
        latitude: parseFloat(wp.latitude),
        longitude: parseFloat(wp.longitude),
        order_index: wp.order,
      }));

      const { error: waypointsError } = await supabase
        .from("waypoints")
        .insert(waypointsData);

      if (waypointsError) throw waypointsError;

      toast.success("Route created successfully!");
      setRouteName("");
      setWaypoints([
        { latitude: "", longitude: "", order: 1 },
        { latitude: "", longitude: "", order: 2 },
      ]);
      onRouteCreated();
    } catch (error) {
      toast.error(error.message || "Failed to create route");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDistance = calculateTotalDistance(waypoints);

  return (
    <Card className="shadow-lg animate-slide-up">
      <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Create New Route
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="routeName">Route Name</Label>
            <Input
              id="routeName"
              placeholder="e.g., Morning Commute"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="transition-all focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-3">
            <Label>Waypoints</Label>
            {waypoints.map((waypoint, index) => (
              <div
                key={index}
                className="flex gap-2 items-start p-3 bg-muted/50 rounded-lg animate-fade-in"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Latitude"
                        type="number"
                        step="any"
                        value={waypoint.latitude}
                        onChange={(e) => updateWaypoint(index, "latitude", e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Longitude"
                        type="number"
                        step="any"
                        value={waypoint.longitude}
                        onChange={(e) => updateWaypoint(index, "longitude", e.target.value)}
                        className="bg-white"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Waypoint {waypoint.order}
                  </p>
                </div>
                {waypoints.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWaypoint(index)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addWaypoint}
              className="w-full border-dashed border-2 hover:bg-primary/5 hover:border-primary transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Waypoint
            </Button>
          </div>

          {totalDistance > 0 && (
            <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-semibold text-primary">
                Total Distance: {totalDistance.toFixed(2)} km
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
          >
            {isSubmitting ? "Creating..." : "Create Route"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
