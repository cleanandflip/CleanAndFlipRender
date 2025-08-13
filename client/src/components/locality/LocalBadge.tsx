import { Badge } from "@/components/ui/badge";
import { MapPin, Truck } from "lucide-react";

export function LocalBadge({ isLocal }: { isLocal: boolean }) {
  return isLocal ? (
    <Badge className="bg-emerald-600/90 text-white gap-1">
      <MapPin className="h-3 w-3" /> Local Delivery Area
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <Truck className="h-3 w-3" /> Shipping Area
    </Badge>
  );
}