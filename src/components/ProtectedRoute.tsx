import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "admin";
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { currentOrg, orgRole, isSuperAdmin, loading: orgLoading } = useOrg();

  if (authLoading || orgLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // If user has no org, send them to create one
  if (!currentOrg) return <Navigate to="/create-org" replace />;

  // If onboarding not completed, redirect to onboarding
  if (!currentOrg.onboarding_completed) return <Navigate to="/onboarding" replace />;

  // Check role requirement
  if (requireRole === "admin" && orgRole !== "admin" && !isSuperAdmin) {
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
