import * as React from "react";
import ProductsResults from "@/components/products/ProductsResults";
import { useProducts } from '@/hooks/useProducts';
import CategoryTabs from '@/components/products/CategoryTabs';
import { WelcomeBanner } from '@/components/ui/welcome-banner';
import { searchService } from "@/lib/searchService";
import { LocalBadge } from "@/components/locality/LocalBadge";
import { useLocality } from "@/hooks/useLocality";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

export default function ProductsPage() {
  const { user } = useAuth();
  const { data: locality } = useLocality();
  
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
      
      {/* Locality Banner - Prominent */}
      {user && locality && (
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-center gap-4 bg-gray-800/30 border border-gray-700/50 rounded-xl px-4 py-3">
            <LocalBadge isLocal={locality.isLocal} />
            <span className="text-sm text-gray-200">
              {locality.isLocal ? (
                "You are in our FREE DELIVERY zone!"
              ) : locality.hasAddress ? (
                "You're outside our Local Delivery area — shipping available"
              ) : (
                "Add your address to check if you qualify for FREE Local Delivery"
              )}
            </span>
          </div>
        </motion.div>
      )}
      
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