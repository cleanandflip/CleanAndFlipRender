import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";

export function FreeDeliveryPill() {
  return (
    <Badge className="bg-green-100 text-green-800 gap-1 text-xs rounded-full border-green-200">
      <Truck className="h-3 w-3" />
      FREE Local Delivery
    </Badge>
  );
}