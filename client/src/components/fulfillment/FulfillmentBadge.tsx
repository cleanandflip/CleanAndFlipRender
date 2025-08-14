import * as React from "react";
import { Truck, Package } from "lucide-react";

type FulfillmentMode = "LOCAL_ONLY" | "LOCAL_AND_SHIPPING";

type Size = "sm" | "md" | "lg";

export type FulfillmentBadgeProps = {
  mode: FulfillmentMode;
  size?: Size;            // default: md
  stacked?: boolean;      // for narrow spaces; default: false (side-by-side)
  className?: string;
  showTooltips?: boolean; // default: true
};

const sizeMap: Record<Size, string> = {
  sm: "text-[11px] px-2 py-1 gap-1",
  md: "text-xs px-2.5 py-1.5 gap-1.5",
  lg: "text-sm px-3 py-2 gap-2",
};

function pillBase(extra = "") {
  return [
    "inline-flex items-center rounded-full",
    "ring-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,.06)]",
    "whitespace-nowrap select-none",
    extra,
  ].join(" ");
}

function LocalPill({ size, title }: { size: Size; title?: string }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={pillBase(
        `bg-emerald-600 text-emerald-50 ring-emerald-400/25 ${sizeMap[size]}`
      )}
      title={title}
    >
      <Truck className="h-[1.05em] w-[1.05em]" aria-hidden />
      <span>Local delivery</span>
    </span>
  );
}

function LocalOnlyPill({ size, title }: { size: Size; title?: string }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={pillBase(
        `bg-emerald-600 text-emerald-50 ring-emerald-400/25 ${sizeMap[size]}`
      )}
      title={title}
    >
      <Truck className="h-[1.05em] w-[1.05em]" aria-hidden />
      <span>Local delivery only</span>
    </span>
  );
}

function ShippingPill({ size, title }: { size: Size; title?: string }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={pillBase(
        `bg-muted text-foreground/80 ring-border/60 ${sizeMap[size]}`
      )}
      title={title}
    >
      <Package className="h-[1.05em] w-[1.05em]" aria-hidden />
      <span>Shipping</span>
    </span>
  );
}

export function FulfillmentBadge({
  mode,
  size = "md",
  stacked = false,
  className,
  showTooltips = true,
}: FulfillmentBadgeProps) {
  const localTitle = showTooltips
    ? "Delivered by C&F within 24–48h in the local zone."
    : undefined;
  const shippingTitle = showTooltips
    ? "Ships via carrier; rates shown at checkout."
    : undefined;

  if (mode === "LOCAL_ONLY") {
    return (
      <div className={["flex items-center", className].filter(Boolean).join(" ")}>
        <LocalOnlyPill size={size} title={localTitle} />
      </div>
    );
  }

  // LOCAL_AND_SHIPPING
  return (
    <div
      className={[
        stacked ? "flex flex-col gap-2" : "flex flex-row items-center gap-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <LocalPill size={size} title={localTitle} />
      <ShippingPill size={size} title={shippingTitle} />
    </div>
  );
}

export default FulfillmentBadge;