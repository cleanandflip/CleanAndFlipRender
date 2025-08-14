import ProductCard from "./product-card";
import type { Product } from "@shared/schema";

interface ProductGridProps {
  products: Product[];
  viewMode?: "grid" | "list";
  compactCards?: boolean;
  loading?: boolean;
}

export default function ProductGrid({ products, viewMode = "grid", compactCards = false, loading }: ProductGridProps) {
  const safeProducts = Array.isArray(products) ? products : [];
  
  if (loading) {
    const grid = viewMode === "grid";
    return (
      <div className={grid ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-3"}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
            <div className="bg-white/10 h-48 rounded-lg mb-4"></div>
            <div className="bg-white/10 h-4 rounded mb-2"></div>
            <div className="bg-white/10 h-4 rounded w-3/4 mb-4"></div>
            <div className="bg-white/10 h-8 rounded"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (!safeProducts.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No products found.</p>
      </div>
    );
  }

  const grid = viewMode === "grid";
  return (
    <div className={grid ? "grid grid-cols-2 md:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
      {safeProducts?.map((p) => (
        <ProductCard key={p.id} product={p} viewMode={viewMode} compact={compactCards} />
      ))}
    </div>
  );
}