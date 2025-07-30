import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ProductGrid from "@/components/products/product-grid";
import FilterSidebar from "@/components/products/filter-sidebar";
import SearchBar from "@/components/products/search-bar";
import FilterChip from "@/components/products/filter-chip";
import GlassCard from "@/components/common/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, Grid, List } from "lucide-react";
import type { Product } from "@shared/schema";

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

export default function Products() {
  const [location] = useLocation();
  const [filters, setFilters] = useState<ProductFilters>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 20;

  // Parse URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialFilters: ProductFilters = {};
    
    if (urlParams.get('category')) initialFilters.category = urlParams.get('category')!;
    if (urlParams.get('categoryId')) initialFilters.categoryId = urlParams.get('categoryId')!;
    if (urlParams.get('categorySlug')) initialFilters.categorySlug = urlParams.get('categorySlug')!;
    if (urlParams.get('search')) initialFilters.search = urlParams.get('search')!;
    if (urlParams.get('minPrice')) initialFilters.minPrice = Number(urlParams.get('minPrice'));
    if (urlParams.get('maxPrice')) initialFilters.maxPrice = Number(urlParams.get('maxPrice'));
    if (urlParams.get('priceMin')) initialFilters.priceMin = Number(urlParams.get('priceMin'));
    if (urlParams.get('priceMax')) initialFilters.priceMax = Number(urlParams.get('priceMax'));
    if (urlParams.get('condition')) initialFilters.condition = urlParams.get('condition')!.split(',');
    if (urlParams.get('brand')) initialFilters.brand = urlParams.get('brand')!.split(',');
    if (urlParams.get('tags')) initialFilters.tags = urlParams.get('tags')!.split(',');
    if (urlParams.get('sortBy')) initialFilters.sortBy = urlParams.get('sortBy')!;
    if (urlParams.get('sortOrder')) initialFilters.sortOrder = urlParams.get('sortOrder') as 'asc' | 'desc';
    
    setFilters(initialFilters);
  }, [location]);

  // Remove a specific filter
  const removeFilter = (filterType: string, value: string) => {
    const newFilters = { ...filters };
    
    if (filterType === 'brand' || filterType === 'condition' || filterType === 'tags') {
      const currentValues = Array.isArray(newFilters[filterType]) ? newFilters[filterType] : [];
      newFilters[filterType] = currentValues.filter(v => v !== value);
      if (newFilters[filterType].length === 0) {
        delete newFilters[filterType];
      }
    } else {
      delete newFilters[filterType];
    }
    
    setFilters(newFilters);
    setCurrentPage(0);
  };

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'category' && value === 'all') return false;
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  }).length;

  const { data, isLoading, error, refetch } = useQuery<{ products: Product[]; total: number }>({
    queryKey: [
      "/api/products",
      {
        ...filters,
        limit: itemsPerPage,
        offset: currentPage * itemsPerPage,
      },
    ],
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: 'always', // Always refetch when component mounts
    staleTime: 0, // Always fetch fresh data for critical inventory accuracy
    gcTime: 0, // Don't cache - always get fresh data (v5)
    refetchInterval: 30000, // Auto-refetch every 30 seconds for live updates
  });

  // Add global event listener for real-time admin updates
  useEffect(() => {
    const handleProductUpdate = () => {
      console.log('Product update event received - force refreshing products page');
      refetch();
    };

    const handleStorageUpdate = () => {
      console.log('Storage update event received - force refreshing products page');
      refetch();
    };

    // Listen for global product update events
    window.addEventListener('productUpdated', handleProductUpdate);
    window.addEventListener('storageChanged', handleStorageUpdate);
    
    return () => {
      window.removeEventListener('productUpdated', handleProductUpdate);
      window.removeEventListener('storageChanged', handleStorageUpdate);
    };
  }, [refetch]);

  const handleFilterChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    setCurrentPage(0);
    
    // Update URL
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString());
      }
    });
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  const handleSearchChange = (search: string) => {
    handleFilterChange({ ...filters, search });
  };

  const totalPages = data ? Math.ceil(data.total / itemsPerPage) : 0;

  if (error) {
    return (
      <div className="min-h-screen pt-32 px-6">
        <div className="max-w-6xl mx-auto">
          <GlassCard className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading Products</h1>
            <p className="text-text-secondary">Please try again later.</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 pt-32 pb-16">
        <div className="container mx-auto px-6">
          <h1 className="text-5xl font-bold text-white mb-4">
            {filters.category && filters.category !== 'all' 
              ? filters.category.replace('-', ' & ').toUpperCase()
              : 'Shop Equipment'
            }
          </h1>
          <p className="text-gray-400 text-xl leading-relaxed max-w-2xl">
            Discover premium weightlifting equipment inspected and verified by our team in Asheville, NC.
          </p>
          
          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-sm text-gray-400 font-medium">Active filters:</span>
                
                {/* Brand filters */}
                {filters.brand && Array.isArray(filters.brand) && filters.brand.map(brand => (
                  <FilterChip 
                    key={`brand-${brand}`} 
                    label={brand} 
                    onRemove={() => removeFilter('brand', brand)} 
                  />
                ))}
                
                {/* Condition filters */}
                {filters.condition && Array.isArray(filters.condition) && filters.condition.map(condition => (
                  <FilterChip 
                    key={`condition-${condition}`} 
                    label={condition} 
                    onRemove={() => removeFilter('condition', condition)} 
                  />
                ))}
                
                {/* Price filters */}
                {filters.priceMin && (
                  <FilterChip 
                    label={`Min: $${filters.priceMin}`} 
                    onRemove={() => removeFilter('priceMin', '')} 
                  />
                )}
                {filters.priceMax && (
                  <FilterChip 
                    label={`Max: $${filters.priceMax}`} 
                    onRemove={() => removeFilter('priceMax', '')} 
                  />
                )}
                
                {/* Tag filters */}
                {filters.tags && Array.isArray(filters.tags) && filters.tags.map(tag => (
                  <FilterChip 
                    key={`tag-${tag}`} 
                    label={`#${tag}`} 
                    onRemove={() => removeFilter('tags', tag)} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters Bar - Clean & Spacious */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-20">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-6">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search equipment..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            
            {/* View Controls */}
            <div className="flex items-center gap-3">
              <button 
                className={`p-3 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-5 h-5 text-gray-300" />
              </button>
              <button 
                className={`p-3 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-5 h-5 text-gray-300" />
              </button>
              <button 
                className="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-3 hover:bg-gray-700 transition-colors"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300 font-medium">Filters</span>
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
            <span>
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${data?.total || 0} products found`
              )}
            </span>
            
            {data && data.total > itemsPerPage && (
              <span>
                Page {currentPage + 1} of {totalPages}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-6 py-8">
        <p className="text-gray-400 mb-8 text-lg">
          {isLoading ? (
            <div className="h-6 w-32 bg-gray-800 rounded animate-pulse" />
          ) : (
            `${data?.total || 0} products found`
          )}
        </p>
        
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <FilterSidebar
                filters={filters}
                onFiltersChange={handleFilterChange}
              />
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-gray-900 rounded-xl overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-gray-800" />
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-gray-800 rounded w-3/4" />
                      <div className="h-4 bg-gray-800 rounded w-1/2" />
                      <div className="h-8 bg-gray-800 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data && data.products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {data.products.map(product => (
                    <ProductCard key={product.id} product={product} viewMode={viewMode} />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="glass border-glass-border"
                      >
                        Previous
                      </Button>
                      
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pageNum = currentPage < 3 ? i : currentPage - 2 + i;
                        if (pageNum >= totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "outline"}
                            onClick={() => setCurrentPage(pageNum)}
                            className="glass border-glass-border"
                          >
                            {pageNum + 1}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="outline"
                        disabled={currentPage === totalPages - 1}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="glass border-glass-border"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-900 rounded-xl p-16 text-center">
                <div className="text-8xl mb-6 opacity-40">🔍</div>
                <h3 className="text-2xl font-bold text-white mb-4">No products found</h3>
                <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <button
                  onClick={() => handleFilterChange({})}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
