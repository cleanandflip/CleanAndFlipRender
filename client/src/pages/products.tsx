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
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  brand?: string;
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
    if (urlParams.get('search')) initialFilters.search = urlParams.get('search')!;
    if (urlParams.get('minPrice')) initialFilters.minPrice = Number(urlParams.get('minPrice'));
    if (urlParams.get('maxPrice')) initialFilters.maxPrice = Number(urlParams.get('maxPrice'));
    if (urlParams.get('condition')) initialFilters.condition = urlParams.get('condition')!;
    if (urlParams.get('brand')) initialFilters.brand = urlParams.get('brand')!;
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
    <div className="min-h-screen pt-32 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-bebas text-4xl md:text-6xl mb-4">
            {filters.category && filters.category !== 'all' 
              ? filters.category.replace('-', ' & ').toUpperCase()
              : 'SHOP EQUIPMENT'
            }
          </h1>
          <p className="text-text-secondary text-lg">
            Discover premium weightlifting equipment inspected and verified by our team.
          </p>
          
          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-text-secondary">Active filters:</span>
                
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

        {/* Search and Controls */}
        <GlassCard className="p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <SearchBar 
                value={filters.search || ''} 
                onChange={handleSearchChange}
                placeholder="Search equipment..."
              />
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center glass rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8"
                >
                  <Grid size={16} />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8"
                >
                  <List size={16} />
                </Button>
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="glass border-glass-border"
              >
                <Filter size={16} className="mr-2" />
                Filters
              </Button>
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
        </GlassCard>

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <GlassCard key={i} className="p-4">
                    <Skeleton className="w-full h-48 mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-6 w-1/4" />
                  </GlassCard>
                ))}
              </div>
            ) : data && data.products.length > 0 ? (
              <>
                <ProductGrid products={data.products} viewMode={viewMode} />
                
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
              <GlassCard className="p-12 text-center">
                <h3 className="text-xl font-semibold mb-4">No products found</h3>
                <p className="text-text-secondary mb-6">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <Button
                  onClick={() => handleFilterChange({})}
                  className="bg-accent-blue hover:bg-blue-500"
                >
                  Clear Filters
                </Button>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
