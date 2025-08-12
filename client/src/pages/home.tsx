import { useState, useEffect } from 'react';
import { WelcomeBanner } from '@/components/ui/welcome-banner';
import CategoriesGrid from '@/components/categories/category-grid';
import ProductsResults from '@/components/products/ProductsResults';
import { getQuery, subscribe, clearSearch } from '@/lib/searchService';
import { useQuery } from '@tanstack/react-query';
import type { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";

// Simple featured products component
function FeaturedProductsGrid() {
  const { data: productsData, isLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ['/api/products/featured'],
  });

  const products = productsData?.products || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
            <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
            <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No featured products available at the moment.</p>
      </div>
    );
  }

  return (
    <ProductsResults 
      products={products.slice(0, 8)}
      isLoading={false}
    />
  );
}

interface InlineResultsProps {
  query: string;
  onClose: () => void;
}

function InlineResults({ query, onClose }: InlineResultsProps) {
  const { data: productsData, isLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ['/api/products', { q: query }],
    enabled: !!query
  });

  const products = productsData?.products || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Search Results for "{query}"
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {products.length} item{products.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
          >
            ← Back to Home
          </button>
        </div>

        <ProductsResults 
          products={products}
          isLoading={isLoading}
          q={query}
        />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useState(() => getQuery());
  
  // Subscribe to URL changes
  useEffect(() => {
    const unsubscribe = subscribe(setSearchParams);
    return unsubscribe;
  }, []);

  const { q } = searchParams;

  const handleCloseSearch = () => {
    // Clear search and return to home sections
    clearSearch();
  };

  // If search query exists, show inline results instead of home sections
  if (q) {
    return <InlineResults query={q} onClose={handleCloseSearch} />;
  }

  // Default home page sections
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <WelcomeBanner />
        
        {/* Hero Section */}
        <section className="text-center py-12 mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Premium Fitness Equipment
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Buy and sell quality gym equipment. Find everything you need to build your perfect home gym.
          </p>
          <Button 
            onClick={() => window.location.href = '/products'}
            size="lg"
            className="text-lg px-8 py-3"
          >
            Shop Equipment
          </Button>
        </section>

        {/* Categories Grid */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Shop by Category
          </h2>
          <CategoriesGrid />
        </section>

        {/* Featured Products */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Featured Equipment
          </h2>
          <FeaturedProductsGrid />
        </section>
      </div>
    </div>
  );
}