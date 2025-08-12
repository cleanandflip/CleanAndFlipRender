import { useMemo, useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { fromSlug, toSlug } from "@/lib/categories";
import { getQuery, subscribe } from '@/lib/searchService';
import type { Product } from "@shared/schema";

interface ProductsResponse {
  products: Product[];
  total: number;
}

interface SearchParams {
  q?: string;
  category?: string;
  sort?: string;
  page?: number;
}

export function useProducts() {
  const [searchQuery, setSearchQuery] = useState<SearchParams>(() => getQuery());
  
  // Subscribe to URL changes
  useEffect(() => {
    const unsubscribe = subscribe(setSearchQuery);
    return unsubscribe;
  }, []);
  
  const { q, category: categorySlug } = searchQuery;
  const categoryLabel = fromSlug(categorySlug);

  // Fetch all products from API
  const { data: productsResponse, isLoading, error } = useQuery<ProductsResponse>({
    queryKey: ['/api/products'],
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
    products: filteredProducts, 
    isLoading, 
    error,
    q, 
    categoryLabel, 
    categorySlug,
    total: filteredProducts.length
  };
}