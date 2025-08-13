import { Badge } from "@/components/ui/badge";
import { Check, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function LocalBadge({ isLocal }: { isLocal: boolean }) {
  const badge = isLocal ? (
    <Badge className="bg-emerald-600/90 text-white gap-1 rounded-full text-xs" aria-label="Local Delivery Area">
      <Check className="h-3 w-3" /> Local Delivery Area
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1 rounded-full text-xs" aria-label="Shipping Area">
      <Info className="h-3 w-3" /> Shipping Area
    </Badge>
  );

  const tooltipContent = isLocal 
    ? "You qualify for FREE Local Delivery within our 50-mile service zone."
    : "You're outside our local zone. Shipping is available on eligible items.";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}