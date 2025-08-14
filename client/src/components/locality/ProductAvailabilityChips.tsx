import { getFulfillment } from "@/lib/products/fulfillment";

export default function ProductAvailabilityChips({ product }: { product: any }) {
  const { local, shipping } = getFulfillment(product);

  // nothing available → render nothing
  if (!local && !shipping) return null;

  // Local-only → one chip, clearly labeled (no emoji)
  if (local && !shipping) {
    return (
      <div className="mt-2">
        <span className="inline-flex items-center rounded-full bg-amber-600/15 text-amber-100 text-xs px-2 py-1">
          Local delivery only
        </span>
      </div>
    );
  }

  // Both or shipping-only
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {local && (
        <span className="inline-flex items-center rounded-full bg-emerald-600/15 text-emerald-100 text-xs px-2 py-1">
          Local delivery
        </span>
      )}
      {shipping && (
        <span className="inline-flex items-center rounded-full bg-blue-600/15 text-blue-100 text-xs px-2 py-1">
          Nationwide shipping
        </span>
      )}
    </div>
  );
}