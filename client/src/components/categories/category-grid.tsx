import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import GlassCard from "@/components/common/glass-card";

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  productCount: number;
}

export default function CategoryGrid() {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/categories?active=true');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
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
      <GlassCard className="p-12 text-center">
        <h3 className="text-xl font-semibold mb-2">No Categories Available</h3>
        <p className="text-text-secondary">Categories will appear here once they are added by administrators.</p>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {categories.map(category => (
        <Link 
          key={category.id}
          href={`/products?category=${category.slug}`}
          className="group relative overflow-hidden rounded-lg glass hover:scale-105 transition-transform duration-200"
        >
          <div className="aspect-square relative">
            {category.imageUrl ? (
              <img 
                src={category.imageUrl} 
                alt={category.name}
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