import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";

export function FreeDeliveryPill() {
  return (
    <Badge 
      className="bg-green-100 text-green-800 hover:bg-green-200 text-xs border-0"
      data-testid="pill-free-delivery"
    >
      <Truck className="h-3 w-3 mr-1" />
      FREE Local Delivery
    </Badge>
  );
}