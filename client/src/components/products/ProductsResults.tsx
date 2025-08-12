import { useMemo } from 'react';
import ProductCard from './product-card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Product } from '@shared/schema';

interface ProductsResultsProps {
  products: Product[];
  isLoading?: boolean;
  q?: string;
  category?: string;
  viewMode?: 'grid' | 'list';
}

export default function ProductsResults({ 
  products, 
  isLoading = false,
  q,
  category,
  viewMode = 'grid' 
}: ProductsResultsProps) {
  
  const isEmpty = !isLoading && products.length === 0;
  
  // Determine empty state type
  const emptyStateType = useMemo(() => {
    if (q) return 'no-results';
    if (category && category !== 'all') return 'category-empty';
    return 'no-products';
  }, [q, category]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <EmptyState 
        type={emptyStateType}
        showActions={true}
      />
    );
  }

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} viewMode="grid" />
      ))}
    </div>
  );
}