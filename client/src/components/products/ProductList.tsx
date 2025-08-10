import React from 'react';
import ProductCard from './product-card';
import type { Product } from '@shared/schema';

interface ProductListProps {
  products: Product[];
  loading?: boolean;
}

export default function ProductList({ products, loading }: ProductListProps) {

  if (loading) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 p-4 sm:p-0">
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

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 p-4 sm:p-0">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product}
          viewMode="grid"
        />
      ))}
    </div>
  );
}