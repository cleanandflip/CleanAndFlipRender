import * as React from "react";
import { Link } from "wouter";
import FulfillmentBadge from "@/components/fulfillment/FulfillmentBadge";
import { useLocality } from "@/hooks/useLocality";
import { getFulfillmentModeFromProduct, isLocalOnlyBlocked } from "@shared/fulfillment";
import { cn } from "@/lib/utils";
import ImageWithFallback from "@/components/ImageWithFallback";

type FulfillmentMode = "LOCAL_ONLY" | "LOCAL_AND_SHIPPING";

export type ProductCardProduct = {
  id: string;
  slug?: string;           // if slugs exist
  name: string;
  brand?: string;
  price: string | number;  // handle both string and number prices
  images?: string[];       // array of image URLs
  isLocalDeliveryAvailable?: boolean;
  isShippingAvailable?: boolean;
};

type Props = {
  product: ProductCardProduct;
  onAdd?: (id: string) => Promise<void> | void;
};

function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `$${numPrice.toFixed(2)}`;
}

export function ProductCard({ product, onAdd }: Props) {
  const locality = useLocality();
  const isLocal = locality?.isLocal;
  
  const fulfillmentMode = getFulfillmentModeFromProduct(product);
  const blocked = isLocalOnlyBlocked(fulfillmentMode, isLocal);

  const imageUrl = product.images?.[0] || '/placeholder-product.jpg';
  const href = product.slug ? `/products/${product.slug}` : `/products/${product.id}`;

  async function handleAdd() {
    if (blocked) return;
    await onAdd?.(product.id);
  }

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl bg-card/60 ring-1 ring-border/40",
        "hover:ring-border transition p-3 gap-2 min-h-[22rem]"
      )}
      data-testid="product-card"
    >
      <Link href={href}>
        <div className="aspect-[4/3] overflow-hidden rounded-xl block cursor-pointer">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <h3 className="text-base font-semibold tracking-[-0.01em] line-clamp-1">
            <Link href={href}>
              <span className="hover:underline cursor-pointer">
                {product.name}
              </span>
            </Link>
          </h3>
          {product.brand && (
            <span className="text-foreground/60 text-xs line-clamp-1">
              {product.brand}
            </span>
          )}
        </div>

        <div className="text-lg font-bold tracking-tight">
          {formatPrice(product.price)}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-1">
          <FulfillmentBadge mode={fulfillmentMode} size="md" />
        </div>

        <div className="mt-auto">
          <button
            type="button"
            onClick={handleAdd}
            disabled={blocked}
            aria-disabled={blocked}
            title={blocked ? "Not available in your area" : "Add to cart"}
            className={cn(
              "w-full inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium",
              blocked
                ? "bg-muted text-foreground/40 cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:opacity-95"
            )}
            data-testid={blocked ? "add-disabled" : "add-enabled"}
          >
            {blocked ? "Not available in your area" : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;