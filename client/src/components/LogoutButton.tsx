import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const { logoutMutation } = useAuth();

  const handleLogout = async () => {
    try {
      // Force immediate logout by clearing everything locally first
      localStorage.clear();
      sessionStorage.clear();
      
      // Then call the logout mutation
      await logoutMutation.mutateAsync();
      
      // Force page reload to ensure clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if server logout fails, clear local state and reload
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
      variant="outline"
      className="flex items-center gap-2"
      data-testid="button-logout"
    >
      <LogOut className="h-4 w-4" />
      {logoutMutation.isPending ? "Logging out..." : "Log Out"}
    </Button>
  );
}