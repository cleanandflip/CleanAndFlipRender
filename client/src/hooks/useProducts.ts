import { useMemo, useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { fromSlug, toSlug } from "@/lib/categories";
import { searchService } from '@/lib/searchService';
import type { Product } from "@shared/schema";

interface ProductsResponse {
  products: Product[];
  total: number;
}

// Updated function signature to match ProductsResults component requirements
export function useProducts(args?: { q: string; category: string; sort: string; page: number }) {
  const [query, setQuery] = useState(() => searchService.getQuery());
  
  // Subscribe to URL changes
  useEffect(() => {
    return searchService.subscribe(() => {
      setQuery(searchService.getQuery());
    });
  }, []);
  
  // Use args if provided, otherwise use URL state
  const { q, category: categorySlug } = args || query;
  const categoryLabel = fromSlug(categorySlug);

  // Fetch all products from API
  const { data: productsResponse, isLoading, error } = useQuery<ProductsResponse>({
    queryKey: ['/api/products'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - products don't change often
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  const allProducts = Array.isArray(productsResponse?.products) ? productsResponse.products : [];

  // Client-side filtering based on URL parameters
  const filteredProducts = useMemo(() => {
    let list = allProducts;

    // Filter by category if specified
    if (categorySlug) {
      list = list.filter((product) => {
        // Match against the database category slug from categoryId
        if (product.categoryId) {
          // Category mapping for the 8 storage-friendly categories
          const categoryMap: Record<string, string> = {
            'cat-dumbbells-new': 'dumbbells',
            'cat-kettlebells-new': 'kettlebells', 
            'cat-weight-plates': 'weight-plates',
            'cat-barbells-new': 'barbells',
            'cat-adjustable-dumbbells-new': 'adjustable-dumbbells',
            'cat-resistance-bands-new': 'resistance-and-bands',
            'cat-medicine-balls-new': 'medicine-balls',
            'cat-mats-accessories-new': 'mats-and-accessories'
          };
          const productCategorySlug = categoryMap[product.categoryId] || '';
          return productCategorySlug === categorySlug;
        }
        return false;
      });
    }

    // Filter by search query if specified
    if (q.trim()) {
      const searchTerm = q.trim().toLowerCase();
      list = list.filter((product) => {
        const searchableText = [
          product.name,
          product.description,
          product.brand,
          product.subcategory
        ].filter(Boolean).join(" ").toLowerCase();
        
        return searchableText.includes(searchTerm);
      });
    }

    return list;
  }, [allProducts, q, categorySlug]);

  return {
    data: filteredProducts,
    total: filteredProducts.length,
    loading: isLoading,
    error,
// SSOT: Unified system
    products: filteredProducts,
    categoryLabel,
    hasSearchQuery: Boolean(q?.trim()),
    query: q || '',
    categorySlug: categorySlug || '',
  };
}