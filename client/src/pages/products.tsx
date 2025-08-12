import * as React from "react";
import ProductsResults from "@/components/products/ProductsResults";
import { useProducts } from '@/hooks/useProducts';
import CategoryTabs from '@/components/products/CategoryTabs';
import { WelcomeBanner } from '@/components/ui/welcome-banner';
import { searchService } from "@/lib/searchService";

export default function ProductsPage() {
  // No extra search input here. Header SearchBar drives q.
  // Reset page to 1 whenever q/category/sort changes (optional: put in fetch hook).
  React.useEffect(() => {
    return searchService.subscribe(() => {
      // if you keep page in URL, your results component will pick it up automatically
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <WelcomeBanner />
      
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <CategoryTabs />
        </aside>
        
        <section className="flex-1">
          <ProductsResults
            fetchProducts={useProducts}
            emptyState={<div className="text-center py-16 text-gray-500">No products found. Try another query.</div>}
          />
        </section>
      </div>
    </div>
  );
}