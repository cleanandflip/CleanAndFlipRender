import ProductGrid from '@/components/products/product-grid';
import SearchBar from '@/components/search/SearchBar';
import CategoryTabs from '@/components/products/CategoryTabs';
import { WelcomeBanner } from '@/components/ui/welcome-banner';
import { useProducts } from '@/hooks/useProducts';
import { globalDesignSystem as theme } from "@/styles/design-system/theme";

export default function ProductsPage() {
  const { products, isLoading, categoryLabel, total } = useProducts();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <WelcomeBanner />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            {categoryLabel === "All Categories" ? "Fitness Equipment" : categoryLabel}
          </h1>
          <p className="text-lg mb-4 text-gray-600 dark:text-gray-400">
            {total} item{total !== 1 ? 's' : ''} available
          </p>
          <SearchBar />
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <CategoryTabs />
          </aside>
          
          <section className="flex-1" aria-live="polite">
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
          </section>
        </div>
      </div>
    </div>
  );
}