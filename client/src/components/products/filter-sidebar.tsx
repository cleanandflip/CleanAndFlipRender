import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { X, Filter, RotateCcw } from "lucide-react";
import type { Category } from "@shared/schema";

interface FilterSidebarProps {
  filters: {
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
  };
  onFiltersChange: (filters: any) => void;
}

export default function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [priceRange, setPriceRange] = useState([filters.minPrice || 0, filters.maxPrice || 1000]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch('/api/categories?active=true');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    }
  });

  // Fetch actual brands from database
  const { data: brandsData = [] } = useQuery<string[]>({
    queryKey: ["/api/brands"],
    queryFn: async () => {
      const response = await fetch('/api/brands');
      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }
      return response.json();
    }
  });

  // Equipment conditions
  const conditions = [
    { value: "new", label: "New", color: "bg-green-500" },
    { value: "like_new", label: "Like New", color: "bg-blue-500" },
    { value: "good", label: "Good", color: "bg-yellow-500" },
    { value: "fair", label: "Fair", color: "bg-orange-500" },
    { value: "needs_repair", label: "Needs Repair", color: "bg-red-500" },
  ];

  // Use actual brands from database, fallback to popular brands if not loaded
  const brands = brandsData.length > 0 ? brandsData : [
    "Rogue Fitness",
    "Eleiko",
    "Rep Fitness", 
    "American Barbell",
    "York Barbell",
    "CAP Barbell",
    "PowerBlock",
    "Ironmaster", 
    "Bowflex",
    "NordicTrack"
  ];

  // Sort options
  const sortOptions = [
    { value: "createdAt-desc", label: "Newest First" },
    { value: "createdAt-asc", label: "Oldest First" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A to Z" },
    { value: "views-desc", label: "Most Viewed" },
  ];

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
    setPriceRange([filters.minPrice || 0, filters.maxPrice || 1000]);
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    
    // Remove empty values
    Object.keys(newFilters).forEach(k => {
      if (newFilters[k] === "" || newFilters[k] === undefined) {
        delete newFilters[k];
      }
    });

    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Handle price range change
  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values);
    const newFilters = {
      ...localFilters,
      minPrice: values[0] > 0 ? values[0] : undefined,
      maxPrice: values[1] < 1000 ? values[1] : undefined,
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Handle sort change
  const handleSortChange = (sortValue: string) => {
    const [sortBy, sortOrder] = sortValue.split('-');
    const newFilters = {
      ...localFilters,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = { search: filters.search }; // Keep search term
    setLocalFilters(clearedFilters);
    setPriceRange([0, 1000]);
    onFiltersChange(clearedFilters);
  };

  // Count active filters
  const activeFilterCount = Object.keys(localFilters).filter(key => 
    key !== 'search' && localFilters[key] !== undefined && localFilters[key] !== ''
  ).length;

  const currentSort = localFilters.sortBy && localFilters.sortOrder 
    ? `${localFilters.sortBy}-${localFilters.sortOrder}`
    : "createdAt-desc";

  return (
    <Card className="p-6 sticky top-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter size={20} />
          <h3 className="font-bebas text-xl">FILTERS</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="bg-secondary border-bg-secondary-border">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-text-secondary hover:text-primary hover:bg-white/10"
          >
            <RotateCcw size={14} className="mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Sort */}
        <div>
          <h4 className="font-semibold mb-3">Sort By</h4>
          <div className="space-y-2">
            {sortOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  value={option.value}
                  checked={currentSort === option.value}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-4 h-4 text-accent-blue bg-transparent border-gray-600 focus:ring-accent-blue"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator className="bg-bg-secondary-border" />

        {/* Categories */}
        {categories.length > 0 && (
          <>
            <div>
              <h4 className="font-semibold mb-3">Category</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    checked={!localFilters.category && !localFilters.categoryId}
                    onChange={() => {
                      // Clear category selection
                      const newFilters = { ...localFilters };
                      delete newFilters.category;
                      delete newFilters.categoryId; 
                      delete newFilters.categorySlug;
                      setLocalFilters(newFilters);
                      onFiltersChange(newFilters);
                    }}
                    className="w-4 h-4 text-accent-blue bg-transparent border-gray-600 focus:ring-accent-blue"
                  />
                  <span className="text-sm">All Categories</span>
                </label>
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={category.id}
                      checked={localFilters.categoryId === category.id || localFilters.category === category.slug}
                      onChange={() => {
                        // Apply category filter
                        const newFilters = {
                          ...localFilters,
                          categoryId: category.id,
                          categorySlug: category.slug,
                          category: category.slug
                        };
                        setLocalFilters(newFilters);
                        onFiltersChange(newFilters);
                      }}
                      className="w-4 h-4 text-accent-blue bg-transparent border-gray-600 focus:ring-accent-blue"
                    />
                    <span className="text-sm">
                      {category.name}
                      <span className="text-xs opacity-70 ml-2">
                        ({category.productCount || 0})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <Separator className="bg-bg-secondary-border" />
          </>
        )}

        {/* Price Range */}
        <div>
          <h4 className="font-semibold mb-3">Price Range</h4>
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={handlePriceRangeChange}
              max={1000}
              min={0}
              step={10}
              className="mb-4"
            />
            <div className="flex justify-between text-sm text-text-secondary">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>
        </div>

        <Separator className="bg-bg-secondary-border" />

        {/* Condition */}
        <div>
          <h4 className="font-semibold mb-3">Condition</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="condition"
                value=""
                checked={!localFilters.condition}
                onChange={() => handleFilterChange('condition', undefined)}
                className="w-4 h-4 text-accent-blue bg-transparent border-gray-600 focus:ring-accent-blue"
              />
              <span className="text-sm">Any Condition</span>
            </label>
            {conditions.map((condition) => (
              <label key={condition.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value={condition.value}
                  checked={localFilters.condition === condition.value}
                  onChange={(e) => handleFilterChange('condition', e.target.value)}
                  className="w-4 h-4 text-accent-blue bg-transparent border-gray-600 focus:ring-accent-blue"
                />
                <div className={`w-3 h-3 rounded-full ${condition.color} mr-1`}></div>
                <span className="text-sm">{condition.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator className="bg-bg-secondary-border" />

        {/* Brand */}
        <div>
          <h4 className="font-semibold mb-3">Brand</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="brand"
                value=""
                checked={!localFilters.brand}
                onChange={() => handleFilterChange('brand', undefined)}
                className="w-4 h-4 text-accent-blue bg-transparent border-gray-600 focus:ring-accent-blue"
              />
              <span className="text-sm">Any Brand</span>
            </label>
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="brand"
                  value={brand}
                  checked={localFilters.brand === brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="w-4 h-4 text-accent-blue bg-transparent border-gray-600 focus:ring-accent-blue"
                />
                <span className="text-sm">{brand}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <>
          <Separator className="bg-bg-secondary-border my-6" />
          <div>
            <h4 className="font-semibold mb-3">Active Filters</h4>
            <div className="flex flex-wrap gap-2">
              {localFilters.category && (
                <Badge variant="secondary" className="bg-secondary border-bg-secondary-border">
                  {categories.find(c => c.id === localFilters.category)?.name || localFilters.category}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('category', undefined)}
                    className="ml-1 p-0 h-auto hover:bg-transparent"
                  >
                    <X size={12} />
                  </Button>
                </Badge>
              )}
              
              {localFilters.condition && (
                <Badge variant="secondary" className="bg-secondary border-bg-secondary-border">
                  {conditions.find(c => c.value === localFilters.condition)?.label || localFilters.condition}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('condition', undefined)}
                    className="ml-1 p-0 h-auto hover:bg-transparent"
                  >
                    <X size={12} />
                  </Button>
                </Badge>
              )}
              
              {localFilters.brand && (
                <Badge variant="secondary" className="bg-secondary border-bg-secondary-border">
                  {localFilters.brand}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('brand', undefined)}
                    className="ml-1 p-0 h-auto hover:bg-transparent"
                  >
                    <X size={12} />
                  </Button>
                </Badge>
              )}
              
              {(localFilters.minPrice || localFilters.maxPrice) && (
                <Badge variant="secondary" className="bg-secondary border-bg-secondary-border">
                  ${localFilters.minPrice || 0} - ${localFilters.maxPrice || 1000}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleFilterChange('minPrice', undefined);
                      handleFilterChange('maxPrice', undefined);
                      setPriceRange([0, 1000]);
                    }}
                    className="ml-1 p-0 h-auto hover:bg-transparent"
                  >
                    <X size={12} />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
