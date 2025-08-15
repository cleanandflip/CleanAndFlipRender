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
        className="bg-green-100 text-green-800 hover:bg-green-200 text-xs rounded-full border-0 px-2 py-1 h-auto inline-flex w-fit"
        aria-label="Local Delivery Available"
        data-testid="badge-local-delivery"
      >
        <CheckCircle2 className="h-3 w-3 mr-1 flex-shrink-0" />
        <span className="whitespace-nowrap">Free Local Delivery</span>
      </Badge>
    );
  }
  
  return (
    <Badge 
      variant="secondary" 
      className="bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs rounded-full border-0 px-2 py-1 h-auto inline-flex w-fit"
      aria-label="Shipping Only"
      data-testid="badge-shipping-only"
    >
      <Info className="h-3 w-3 mr-1 flex-shrink-0" />
      <span className="whitespace-nowrap">Shipping Only</span>
    </Badge>
  );
}