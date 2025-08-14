import { getFulfillment } from "@/lib/products/fulfillment";

export default function ProductAvailabilityChips({ product }: { product: any }) {
  const { local, shipping } = getFulfillment(product);

  if (!local && !shipping) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {local && (
        <span className="inline-flex items-center rounded-full bg-emerald-600/15 text-emerald-300 text-xs px-2 py-1">
          🚚 Local delivery
        </span>
      )}
      {shipping && (
        <span className="inline-flex items-center rounded-full bg-blue-600/15 text-blue-300 text-xs px-2 py-1">
          📦 Nationwide shipping
        </span>
      )}
      {local && !shipping && (
        <span className="inline-flex items-center rounded-full bg-amber-600/15 text-amber-300 text-[11px] px-2 py-1">
          Local delivery only
        </span>
      )}
    </div>
  );
}