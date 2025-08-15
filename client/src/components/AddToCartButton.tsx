import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useLocality } from "@/hooks/useLocality";
import { modeFromProduct } from "@shared/fulfillment";
import { computeEffectiveAvailability } from "@shared/availability";
import { useToast } from "@/hooks/use-toast"; // or your toast util

type Props = {
  product: { id: string; /* ...anything else you pass */ };
  variantId?: string | null;
  qty?: number;
  className?: string;
};

export default function AddToCartButton({ product, variantId = null, qty = 1, className }: Props) {
  const { addMutation } = useCart();
  const { data: loc } = useLocality();
  const { toast } = useToast();
  const [clicked, setClicked] = useState(false);

  // Client-side gate (UI only). Server remains source of truth.
  const productMode = modeFromProduct(product as any);
  const userMode = loc?.effectiveModeForUser ?? "NONE";
  const eff = computeEffectiveAvailability(productMode!, userMode);

  const disabled =
    addMutation.isPending ||
    eff === "BLOCKED" ||
    !product?.id ||
    qty <= 0;

  async function onAdd() {
    setClicked(true);
    try {
      const res = await addMutation.mutateAsync({ productId: product.id, qty, variantId });
      if (res?.warning) {
        toast({ title: "Added with limit", description: res.warning });
      } else {
        toast({ title: "Added to cart" });
      }
    } catch (e: any) {
      if (e?.status === 422 && e?.body?.reasons?.length) {
        toast({ title: "Unavailable", description: e.body.reasons.join(", ") });
      } else {
        toast({ title: "Could not add to cart", description: e?.message ?? "Unknown error" });
      }
    } finally {
      setClicked(false);
    }
  }

  let label = "Add to cart";
  if (eff === "PICKUP_ONLY") label = "Add (Pickup only)";
  if (eff === "SHIPPING_ONLY") label = "Add (Ships only)";
  if (eff === "BLOCKED") label = "Unavailable in your area";

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      aria-disabled={disabled}
      onClick={onAdd}
      data-availability={eff}
      data-locality-source={loc?.source ?? "unknown"}
    >
      {addMutation.isPending ? "Adding..." : label}
    </button>
  );
}