import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase redirects here after OAuth
    // The session is automatically handled by the auth middleware
    // Redirect to the intended destination or home
    const target = sessionStorage.getItem("alaq:after-auth") || "/";
    sessionStorage.removeItem("alaq:after-auth");

    // Small delay to ensure auth state is updated
    const timer = setTimeout(() => {
      void navigate({ to: target, replace: true });
    }, 500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
