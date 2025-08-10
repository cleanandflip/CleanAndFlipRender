import ProductCard from "./product-card";
import type { Product } from "@shared/schema";

interface ProductGridProps {
  products: Product[];
  viewMode?: 'grid' | 'list';
}

export default function ProductGrid({ products, viewMode = 'grid' }: ProductGridProps) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} viewMode="list" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 p-4 sm:p-0">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} viewMode="grid" />
      ))}
    </div>
  );
}
