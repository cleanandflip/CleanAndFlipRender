import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { NavigationStateManager } from '@/lib/navigation-state';

interface ProductFilters {
  category?: string;
  categoryId?: string;
  categorySlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  priceMin?: number;
  priceMax?: number;
  condition?: string[] | string;
  brand?: string[] | string;
  tags?: string[] | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useProductsState() {
  const [location] = useLocation();

  // Parse filters from URL or restore from saved state
  const getInitialFilters = (): ProductFilters => {
    const savedState = NavigationStateManager.getState('/products');
    
    // Check if we're coming from a product detail page
    if (NavigationStateManager.isFromProductDetail() && savedState?.filters) {
      return savedState.filters;
    }
    
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const filters: ProductFilters = {};
    
    if (urlParams.get('category')) filters.category = urlParams.get('category')!;
    if (urlParams.get('search')) filters.search = urlParams.get('search')!;
    if (urlParams.get('minPrice')) filters.minPrice = Number(urlParams.get('minPrice'));
    if (urlParams.get('maxPrice')) filters.maxPrice = Number(urlParams.get('maxPrice'));
    if (urlParams.get('condition')) filters.condition = urlParams.get('condition')!.split(',');
    if (urlParams.get('brand')) filters.brand = urlParams.get('brand')!.split(',');
    if (urlParams.get('sortBy')) filters.sortBy = urlParams.get('sortBy')!;
    
    return filters;
  };

  const [filters, setFilters] = useState<ProductFilters>(getInitialFilters);

  // Update filters and URL
  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Update URL
    const params = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, String(value));
        }
      }
    });
    
    const newUrl = params.toString() ? `${location}?${params.toString()}` : location;
    window.history.replaceState(null, '', newUrl);
    
    // Clear saved state when filters change manually
    NavigationStateManager.clearState('/products');
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({});
    window.history.replaceState(null, '', location);
    NavigationStateManager.clearState('/products');
  };

  return { filters, updateFilters, resetFilters };
}