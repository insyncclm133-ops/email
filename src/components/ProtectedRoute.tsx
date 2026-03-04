import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "admin";
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { currentOrg, orgRole, isPlatformAdmin, loading: orgLoading } = useOrg();

  if (authLoading || orgLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Platform admins can use the app without creating an org
  if (!currentOrg && !isPlatformAdmin) return <Navigate to="/create-org" replace />;

  // Skip onboarding check for platform admins without an org
  if (currentOrg && !currentOrg.onboarding_completed && !isPlatformAdmin) return <Navigate to="/onboarding" replace />;

  // Check role requirement
  if (requireRole === "admin" && orgRole !== "admin" && !isPlatformAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">You need admin privileges for this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
