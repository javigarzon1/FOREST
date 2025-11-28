import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RouteForm } from "@/components/RouteForm";
import { RouteList } from "@/components/RouteList";
import { RouteDetail } from "@/components/RouteDetail";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Authentication is optional - app works without login
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleRouteCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleRouteSelect = (routeId) => {
    setSelectedRouteId(routeId);
  };

  const handleBack = () => {
    setSelectedRouteId(null);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8 animate-fade-in">
          {user && (
            <div className="flex justify-end mb-4">
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Route Planner
          </h1>
          <p className="text-muted-foreground text-lg">
            Plan and track your journey with precision
          </p>
        </header>

        <main className="max-w-6xl mx-auto">
          {selectedRouteId ? (
            <RouteDetail routeId={selectedRouteId} onBack={handleBack} />
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <RouteForm onRouteCreated={handleRouteCreated} />
              </div>
              <div>
                <RouteList
                  onRouteSelect={handleRouteSelect}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            </div>
          )}
        </main>

        <footer className="mt-12 text-center text-muted-foreground text-sm">
          <p>© 2024 Route Planner. Plan your perfect route.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
