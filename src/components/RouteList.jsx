import { useState, useEffect } from "react";
import { MapPin, Calendar, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const RouteList = ({ onRouteSelect, refreshTrigger }) => {
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRoutes();
  }, [refreshTrigger]);

  const fetchRoutes = async () => {
    try {
      const { data: routesData, error: routesError } = await supabase
        .from("routes")
        .select("*")
        .order("created_at", { ascending: false });

      if (routesError) throw routesError;

      const routesWithCounts = await Promise.all(
        routesData.map(async (route) => {
          const { count } = await supabase
            .from("waypoints")
            .select("*", { count: "exact", head: true })
            .eq("route_id", route.id);

          return {
            ...route,
            waypoint_count: count || 0,
          };
        })
      );

      setRoutes(routesWithCounts);
    } catch (error) {
      toast.error(error.message || "Failed to fetch routes");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Saved Routes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg animate-slide-up">
      <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Saved Routes ({routes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {routes.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No routes yet. Create your first route!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {routes.map((route) => (
              <button
                key={route.id}
                onClick={() => onRouteSelect(route.id)}
                className="w-full text-left p-4 rounded-lg border border-border hover:border-primary hover:shadow-md transition-all bg-card hover:bg-accent/5 group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {route.name}
                  </h3>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {route.total_distance.toFixed(2)} km
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {route.waypoint_count} waypoints
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(route.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
