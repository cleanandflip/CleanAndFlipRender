import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin } from "lucide-react";

interface LocalityGateProps {
  isBlocked: boolean;
  children: React.ReactNode;
  onUpdateAddress?: () => void;
}

export function LocalityGate({ 
  isBlocked, 
  children, 
  onUpdateAddress 
}: LocalityGateProps) {
  if (!isBlocked) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-3">
      <Alert className="border-orange-200 bg-orange-50">
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          This item is only available for Local Delivery. Update your address to one in our delivery area to order.
        </AlertDescription>
      </Alert>
      {onUpdateAddress && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onUpdateAddress}
          className="w-full"
        >
          Update Address
        </Button>
      )}
    </div>
  );
}