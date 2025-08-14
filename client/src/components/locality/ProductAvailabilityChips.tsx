import { Badge } from "@/components/ui/badge";
import { Truck, Package } from "lucide-react";
import { getFulfillmentFlags } from "@/lib/products/fulfillment";

interface ProductAvailabilityChipsProps {
  product: any;
  compact?: boolean;
}

export default function ProductAvailabilityChips({ product, compact }: ProductAvailabilityChipsProps) {
  const { localDelivery, nationwideShipping } = getFulfillmentFlags(product);
  if (!localDelivery && !nationwideShipping) return null;
  
  const base = compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs";
  
  return (
    <div className={`flex gap-2 ${compact ? "mt-1" : "mt-2"}`}>
      {localDelivery && (
        <span className={`${base} rounded-full bg-blue-600/10 text-blue-300`}>
          <Truck className="h-3 w-3 mr-1 inline" />
          Local delivery
        </span>
      )}
      {nationwideShipping && (
        <span className={`${base} rounded-full bg-emerald-600/10 text-emerald-300`}>
          <Package className="h-3 w-3 mr-1 inline" />
          Ships nationwide
        </span>
      )}
    </div>
  );
}

// Keep legacy named export for backward compatibility
export { ProductAvailabilityChips };