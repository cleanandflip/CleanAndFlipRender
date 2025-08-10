import { useQuery } from '@tanstack/react-query';
import ProductGrid from '@/components/products/product-grid';
import SearchBar from '@/components/search/SearchBar';
import FilterSidebar from '@/components/products/filter-sidebar';
import { WelcomeBanner } from '@/components/ui/welcome-banner';
import type { Product } from '@shared/schema';

export default function ProductsPage() {
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <WelcomeBanner />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Premium Fitness Equipment
          </h1>
          <SearchBar />
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 flex-shrink-0">
            <FilterSidebar filters={{}} onFiltersChange={() => {}} />
          </div>
          
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
                    <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
                    <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-3/4 mb-4"></div>
                    <div className="bg-gray-200 dark:bg-gray-700 h-8 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <ProductGrid products={products} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}