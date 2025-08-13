import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Info } from "lucide-react";

interface LocalBadgeProps {
  isLocal: boolean;
}

export function LocalBadge({ isLocal }: LocalBadgeProps) {
  if (isLocal) {
    return (
      <Badge 
        variant="default" 
        className="bg-green-100 text-green-800 hover:bg-green-200 text-xs rounded-full border-0"
        aria-label="Local Delivery Area"
        data-testid="badge-local-delivery-area"
      >
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Local Delivery Area
      </Badge>
    );
  }
  
  return (
    <Badge 
      variant="secondary" 
      className="bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs rounded-full border-0"
      aria-label="Shipping Area"
      data-testid="badge-shipping-area"
    >
      <Info className="h-3 w-3 mr-1" />
      Shipping Area
    </Badge>
  );
}