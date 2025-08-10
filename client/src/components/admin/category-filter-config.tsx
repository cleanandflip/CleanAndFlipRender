import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FilterConfig {
  brand?: string[];
  condition?: string[];
  priceMin?: number;
  priceMax?: number;
  tags?: string[];
}

interface CategoryFilterConfigProps {
  category: any;
  onUpdate: (filters: FilterConfig) => void;
}

const CONDITION_OPTIONS = ['New', 'Like New', 'Excellent', 'Good', 'Fair'];

export default function CategoryFilterConfig({ category, onUpdate }: CategoryFilterConfigProps) {
  const [filters, setFilters] = useState<FilterConfig>(category.filterConfig || {});
  const [newTag, setNewTag] = useState('');

  // Fetch available filter options from products
  const { data: filterOptions } = useQuery({
    queryKey: ['/api/admin/products/filter-options'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/products/filter-options');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
        throw error;
      }
    }
  });

  useEffect(() => {
    setFilters(category.filterConfig || {});
  }, [category.filterConfig]);

  const handleBrandToggle = (brand: string, checked: boolean) => {
    const currentBrands = filters.brand || [];
    const newBrands = checked 
      ? [...currentBrands, brand]
      : currentBrands.filter(b => b !== brand);
    
    setFilters({ ...filters, brand: newBrands.length > 0 ? newBrands : undefined });
  };

  const handleConditionToggle = (condition: string, checked: boolean) => {
    const currentConditions = filters.condition || [];
    const newConditions = checked 
      ? [...currentConditions, condition]
      : currentConditions.filter(c => c !== condition);
    
    setFilters({ ...filters, condition: newConditions.length > 0 ? newConditions : undefined });
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    const currentTags = filters.tags || [];
    if (!currentTags.includes(newTag.trim())) {
      setFilters({ ...filters, tags: [...currentTags, newTag.trim()] });
    }
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    setFilters({ ...filters, tags: newTags.length > 0 ? newTags : undefined });
  };

  const handleSave = () => {
    // Clean up empty arrays and undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== undefined && value !== null && value !== '';
      })
    );
    onUpdate(cleanFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== ''
  );

  return (
    <Card className="p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Category Filter Configuration</h3>
        {hasActiveFilters && (
          <Badge variant="secondary" className="bg-accent-blue/20 text-accent-blue border-accent-blue/30">
            {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v).length} filters active
          </Badge>
        )}
      </div>
      
      <p className="text-text-secondary text-sm mb-6">
        Configure filters that automatically apply when users click this category on the homepage
      </p>

      <div className="space-y-6">
        {/* Brand Selection */}
        {filterOptions?.brands && filterOptions.brands.length > 0 && (
          <div>
            <Label className="text-white mb-3 block">Brands</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filterOptions.brands.map((brand: string) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={(filters.brand || []).includes(brand)}
                    onCheckedChange={(checked) => handleBrandToggle(brand, checked as boolean)}
                  />
                  <Label htmlFor={`brand-${brand}`} className="text-sm text-text-secondary cursor-pointer">
                    {brand}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Condition Selection */}
        <div>
          <Label className="text-white mb-3 block">Condition</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CONDITION_OPTIONS.map((condition) => (
              <div key={condition} className="flex items-center space-x-2">
                <Checkbox
                  id={`condition-${condition}`}
                  checked={(filters.condition || []).includes(condition)}
                  onCheckedChange={(checked) => handleConditionToggle(condition, checked as boolean)}
                />
                <Label htmlFor={`condition-${condition}`} className="text-sm text-text-secondary cursor-pointer">
                  {condition}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-white mb-3 block">Price Range</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-text-secondary text-sm mb-2 block">Min Price ($)</Label>
              <Input
                type="number"
                value={filters.priceMin || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  priceMin: e.target.value ? Number(e.target.value) : undefined 
                })}
                placeholder="0"
                className="glass bg-white/5 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-text-secondary text-sm mb-2 block">Max Price ($)</Label>
              <Input
                type="number"
                value={filters.priceMax || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  priceMax: e.target.value ? Number(e.target.value) : undefined 
                })}
                placeholder="999"
                className="glass bg-white/5 border-white/20 text-white"
              />
            </div>
          </div>
        </div>

        {/* Custom Tags */}
        <div>
          <Label className="text-white mb-3 block">Custom Tags</Label>
          
          {/* Current Tags */}
          {filters.tags && filters.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {filters.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-accent-blue/20 text-accent-blue border-accent-blue/30">
                  {tag}
                  <button 
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:text-red-400"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          {/* Add New Tag */}
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              placeholder="Add custom tag"
              className="glass bg-white/5 border-white/20 text-white flex-1"
            />
            <Button 
              onClick={addTag}
              size="sm"
              className="bg-accent-blue hover:bg-blue-500"
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>

        {/* Filter Presets */}
        <div>
          <Label className="text-white mb-3 block">Quick Presets</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ condition: ['New', 'Like New', 'Excellent'] })}
              className="glass border-white/20 text-text-secondary hover:bg-white/10"
            >
              High Quality Only
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ priceMax: 100 })}
              className="glass border-white/20 text-text-secondary hover:bg-white/10"
            >
              Budget Friendly ($100 or less)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ tags: ['sale', 'clearance'] })}
              className="glass border-white/20 text-text-secondary hover:bg-white/10"
            >
              Sale Items
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({})}
              className="glass border-white/20 text-text-secondary hover:bg-white/10"
            >
              Clear All
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 pt-6 border-t border-white/10">
        <Button
          onClick={handleSave}
          className="bg-accent-blue hover:bg-blue-500 text-white"
        >
          Save Filter Configuration
        </Button>
      </div>
    </Card>
  );
}