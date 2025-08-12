import ProductsResults from '@/components/products/ProductsResults';
import CategoryTabs from '@/components/products/CategoryTabs';
import { WelcomeBanner } from '@/components/ui/welcome-banner';
import { useProducts } from '@/hooks/useProducts';

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
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {total} item{total !== 1 ? 's' : ''} available
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <CategoryTabs />
          </aside>
          
          <section className="flex-1" aria-live="polite">
            <ProductsResults 
              products={products}
              isLoading={isLoading}
            />
          </section>
        </div>
      </div>
    </div>
  );
}