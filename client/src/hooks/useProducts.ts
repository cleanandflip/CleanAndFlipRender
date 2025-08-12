import { useMemo } from "react";
import { useQuery } from '@tanstack/react-query';
import { fromSlug, toSlug } from "@/lib/categories";
import type { Product } from "@shared/schema";

interface ProductsResponse {
  products: Product[];
  total: number;
}

export function useProducts() {
  // Parse current URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const q = (urlParams.get("q") || "").trim().toLowerCase();
  const categoryLabel = fromSlug(urlParams.get("category"));
  const categorySlug = toSlug(categoryLabel); // "" if All Categories

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
          // For now, we'll need to fetch category names or map them
          // This is a simplified approach - in production you'd join with categories
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
    if (q) {
      list = list.filter((product) => {
        const searchableText = [
          product.name,
          product.description,
          product.brand
        ].filter(Boolean).join(" ").toLowerCase();
        
        return searchableText.includes(q);
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