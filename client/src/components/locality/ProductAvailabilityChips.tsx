import { Badge } from "@/components/ui/badge";

export function ProductAvailabilityChips({ 
  local, 
  ship 
}: { 
  local: boolean; 
  ship: boolean; 
}) {
  if (local && ship) return <Badge variant="outline">Local Delivery & Shipping</Badge>;
  if (local) return <Badge className="bg-emerald-600/90 text-white">Local Delivery Only</Badge>;
  return <Badge>Shipping Only</Badge>;
}