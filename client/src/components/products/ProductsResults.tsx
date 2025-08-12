import * as React from "react";
import { searchService } from "@/lib/searchService";
import ProductGrid from "./product-grid";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Product } from "@shared/schema";

export type { Product };

type Props = {
  // If you already use RTK Query/SWR, replace this with your fetch hook.
  fetchProducts: (args: { q: string; category: string; sort: string; page: number }) => {
    data: Product[] | undefined;
    total?: number;
    loading: boolean;
    error?: unknown;
  };
  header?: React.ReactNode; // slot (optional)
  emptyState?: React.ReactNode; // slot (optional)
};

export default function ProductsResults({ fetchProducts, header, emptyState }: Props) {
  const [queryState, setQueryState] = React.useState(searchService.getQuery());

  // re-render on URL updates
  React.useEffect(() => {
    return searchService.subscribe(() => {
      setQueryState(searchService.getQuery());
    });
  }, []);

  const { q, category, sort, page } = queryState;
  const { data, loading, error, total } = fetchProducts({ q, category, sort, page });

  // Report loading state to search service for spinner
  React.useEffect(() => {
    searchService.setBusy(!!loading);
    return () => searchService.setBusy(false);
  }, [loading]);

  if (error) return <div role="alert" className="text-red-600 dark:text-red-400">Something went wrong.</div>;

  return (
    <section aria-live="polite">
      {header}
      
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && (data?.length ?? 0) === 0 && (
        emptyState ?? (
          <EmptyState 
            type="no-results"
            showActions={true}
          />
        )
      )}
      
      {!loading && data && data.length > 0 && (
        <ProductGrid products={data} />
      )}
      
      {/* TODO: Add pagination UI that calls searchService.setQuery({ page: n }) */}
    </section>
  );
}