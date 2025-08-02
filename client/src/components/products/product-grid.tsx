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
          <div 
            key={product.id} 
            id={`product-${product.id}`}
            className="transition-all duration-300"
          >
            <ProductCard product={product} viewMode="list" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div 
          key={product.id} 
          id={`product-${product.id}`}
          className="transition-all duration-300"
        >
          <ProductCard product={product} viewMode="grid" />
        </div>
      ))}
    </div>
  );
}
