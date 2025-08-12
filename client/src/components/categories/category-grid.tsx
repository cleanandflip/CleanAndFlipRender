import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/shared/AnimatedComponents";
import { globalDesignSystem as theme } from "@/styles/design-system/theme";
import ImageWithFallback from "@/components/ImageWithFallback";

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  productCount: number;
  filterConfig?: Record<string, any>;
}

export default function CategoryGrid() {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories', 'active'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/categories?active=true');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        // Failed to fetch categories
        throw error; // Re-throw for TanStack Query to handle
      }
    },
    staleTime: 0, // Always fresh for real-time updates
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="aspect-square glass rounded-lg animate-pulse">
            <div className="w-full h-full bg-white/10 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!categories.length) {
    return (
      <Card className="p-12 text-center">
        <h3 
          className="text-xl font-semibold mb-2"
          style={{ color: theme.colors.text.primary }}
        >
          No Categories Available
        </h3>
        <p style={{ color: theme.colors.text.secondary }}>
          Categories will appear here once they are added by administrators.
        </p>
      </Card>
    );
  }

  const buildCategoryUrl = (category: Category) => {
    const params = new URLSearchParams();
    
    // Always include category slug
    params.set('category', category.slug);
    
    // Add all configured filters from category
    const filters = category.filterConfig || {};
    
    if (filters.brand?.length) {
      params.set('brand', Array.isArray(filters.brand) ? filters.brand.join(',') : filters.brand);
    }
    if (filters.condition?.length) {
      params.set('condition', Array.isArray(filters.condition) ? filters.condition.join(',') : filters.condition);
    }
    if (filters.priceMin !== undefined) {
      params.set('priceMin', filters.priceMin.toString());
    }
    if (filters.priceMax !== undefined) {
      params.set('priceMax', filters.priceMax.toString());
    }
    if (filters.tags?.length) {
      params.set('tags', Array.isArray(filters.tags) ? filters.tags.join(',') : filters.tags);
    }
    
    return `/products?${params.toString()}`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {categories.map(category => (
        <Link 
          key={category.id}
          href={buildCategoryUrl(category)}
          className="group relative overflow-hidden rounded-lg glass hover:scale-105 transition-transform duration-200"
        >
          <div className="aspect-square relative">
            {category.imageUrl ? (
              <ImageWithFallback
                src={category.imageUrl} 
                alt={category.name}
                logKey={`category:${category.slug || category.name}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-accent-blue/20 to-purple-500/20 flex items-center justify-center">
                <span className="text-4xl font-bebas text-white/80">{category.name.charAt(0)}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-semibold text-lg font-bebas tracking-wide">
                {category.name.toUpperCase()}
              </h3>
              <p className="text-white/80 text-sm">
                {category.productCount} {category.productCount === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}