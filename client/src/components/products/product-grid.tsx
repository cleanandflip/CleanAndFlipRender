import ProductCard from "./product-card";
import type { Product } from "@shared/schema";

interface ProductGridProps {
  products: Product[];
  viewMode?: 'grid' | 'list';
}

export default function ProductGrid({ products, viewMode = 'grid' }: ProductGridProps) {
  // Defensive programming: ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : [];
  
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {safeProducts.map((product) => (
          <ProductCard key={product.id} product={product} viewMode="list" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {safeProducts.map((product) => (
        <ProductCard key={product.id} product={product} viewMode="grid" />
      ))}
    </div>
  );
}
