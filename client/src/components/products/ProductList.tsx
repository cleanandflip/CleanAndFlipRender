import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import ProductCard from './product-card';
import type { Product } from '@shared/schema';

interface ProductListProps {
  products: Product[];
  loading?: boolean;
}

export default function ProductList({ products, loading }: ProductListProps) {
  const { user } = useAuth();
  
  // Extract all product IDs for batch wishlist checking
  const productIds = useMemo(() => products.map(p => p.id), [products]);
  
  // Batch wishlist check to reduce API spam
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist-batch', productIds.sort()],
    queryFn: async () => {
      if (!user || !productIds.length) return {};
      
      const response = await fetch('/api/wishlist/check-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ productIds })
      });
      
      if (!response.ok) return {};
      return response.json();
    },
    enabled: !!user && productIds.length > 0,
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (loading) {
    return (
      <div className="products-grid">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-image"></div>
            <div className="p-5 space-y-3">
              <div className="skeleton-text w-full"></div>
              <div className="skeleton-text w-3/4"></div>
              <div className="skeleton-text w-1/2"></div>
              <div className="h-10 bg-gray-800/50 rounded-lg mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="products-grid">
      {products.map((product, index) => (
        <div key={product.id} style={{ animationDelay: `${(index % 4) * 0.1}s` }}>
          <ProductCard 
            product={product}
            isWishlisted={wishlistData?.[product.id] || false}
          />
        </div>
      ))}
    </div>
  );
}