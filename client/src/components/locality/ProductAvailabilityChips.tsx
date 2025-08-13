import { Badge } from "@/components/ui/badge";
import { Truck, Package } from "lucide-react";

interface ProductAvailabilityChipsProps {
  local: boolean;
  ship: boolean;
}

export function ProductAvailabilityChips({ local, ship }: ProductAvailabilityChipsProps) {
  if (local && ship) {
    return (
      <Badge 
        variant="outline" 
        className="text-xs"
        data-testid="chip-local-and-shipping"
      >
        <Truck className="h-3 w-3 mr-1" />
        Local Delivery & Shipping
      </Badge>
    );
  }
  
  if (local && !ship) {
    return (
      <Badge 
        variant="outline" 
        className="text-xs text-blue-700 border-blue-200"
        data-testid="chip-local-only"
      >
        <Truck className="h-3 w-3 mr-1" />
        Local Delivery Only
      </Badge>
    );
  }
  
  if (!local && ship) {
    return (
      <Badge 
        variant="outline" 
        className="text-xs"
        data-testid="chip-shipping-only"
      >
        <Package className="h-3 w-3 mr-1" />
        Shipping Only
      </Badge>
    );
  }
  
  return null;
}