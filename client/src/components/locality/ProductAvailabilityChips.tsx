import { Badge } from "@/components/ui/badge";

export function ProductAvailabilityChips({ 
  local, 
  ship 
}: { 
  local: boolean; 
  ship: boolean; 
}) {
  if (local && ship) return <Badge variant="outline" className="text-xs rounded-full">Local Delivery & Shipping</Badge>;
  if (local) return <Badge className="bg-emerald-600/90 text-white text-xs rounded-full">Local Delivery Only</Badge>;
  return <Badge variant="secondary" className="text-xs rounded-full">Shipping Only</Badge>;
}