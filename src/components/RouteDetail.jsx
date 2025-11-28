
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Navigation2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export const RouteDetail = ({ routeId, onBack }) => {
  const [route, setRoute] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRouteDetails();
  }, [routeId]);

  const fetchRouteDetails = async () => {
    try {
      const { data: routeData, error: routeError } = await supabase
        .from("routes")
        .select("*")
        .eq("id", routeId)
        .single();

      if (routeError) throw routeError;

      const { data: waypointsData, error: waypointsError } = await supabase
        .from("waypoints")
        .select("*")
        .eq("route_id", routeId)
        .order("order_index");

      if (waypointsError) throw waypointsError;

      setRoute(routeData);
      setWaypoints(waypointsData);
    } catch (error) {
      toast.error(error.message || "Failed to fetch route details");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="h-96 bg-muted/50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!route || waypoints.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Route not found</p>
          <Button onClick={onBack} className="mt-4 w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Routes
          </Button>
        </CardContent>
      </Card>
    );
  }

  const center = [waypoints[0].latitude, waypoints[0].longitude];
  const positions = waypoints.map((wp) => [wp.latitude, wp.longitude]);

  return (
    <div className="space-y-4 animate-slide-up">
      <Button
        onClick={onBack}
        variant="ghost"
        className="hover:bg-primary/10 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Routes
      </Button>

      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white">
          <CardTitle className="flex items-center gap-2">
            <Navigation2 className="h-5 w-5" />
            {route.name}
          </CardTitle>
          <p className="text-white/90 text-sm mt-1">
            Total Distance: {route.total_distance.toFixed(2)} km
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[400px] w-full">
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {waypoints.map((waypoint) => (
                <Marker key={waypoint.id} position={[waypoint.latitude, waypoint.longitude]}>
                  <Popup>
                    Waypoint {waypoint.order_index}: {waypoint.latitude.toFixed(6)}, {waypoint.longitude.toFixed(6)}
                  </Popup>
                </Marker>
              ))}
              <Polyline
                positions={positions}
                pathOptions={{ color: "#0A4E8E", weight: 4, opacity: 0.7 }}
              />
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Waypoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {waypoints.map((waypoint) => (
              <div
                key={waypoint.id}
                className="p-3 bg-muted/50 rounded-lg flex items-center gap-3 hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-semibold text-sm">
                  {waypoint.order_index}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Waypoint {waypoint.order_index}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {waypoint.latitude.toFixed(6)}, {waypoint.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
