import { Button } from "@/components/ui/button";
import { LogOut, AlertTriangle } from "lucide-react";
import { useState } from "react";

export function EmergencyLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleEmergencyLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // 1. Clear all browser storage immediately
      localStorage.clear();
      sessionStorage.clear();
      
      // 2. Clear all cookies by setting them to expire
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // 3. Try to call logout endpoint (but don't wait for it)
      fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      }).catch(() => {
        // Ignore errors - we're doing emergency logout
        console.log("Server logout failed, but continuing with client cleanup");
      });
      
      // 4. Force immediate page reload to clear all React state
      window.location.href = '/';
      
    } catch (error) {
      console.error("Emergency logout error:", error);
      // Force reload even if there's an error
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <span className="text-sm font-medium text-red-800">Account Issue Detected</span>
      </div>
      <p className="text-xs text-red-700 mb-3">
        If you're stuck in a blank account, use this emergency logout to reset your session.
      </p>
      <Button
        onClick={handleEmergencyLogout}
        disabled={isLoggingOut}
        variant="destructive"
        size="sm"
        className="w-full flex items-center gap-2"
        data-testid="button-emergency-logout"
      >
        <LogOut className="h-4 w-4" />
        {isLoggingOut ? "Logging Out..." : "Emergency Logout"}
      </Button>
    </div>
  );
}