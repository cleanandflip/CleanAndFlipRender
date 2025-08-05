import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WishlistButton } from "@/components/ui";
import { ProductPrice } from "@/components/ui";
import { SmartLink } from "@/components/ui/smart-link";
import { routes } from "@/config/routes";
import { Heart, ShoppingCart, ArrowLeft } from "lucide-react";
import type { Product } from "@shared/schema";

export default function Wishlist() {
  const { user } = useAuth();
  
  const { data: wishlistItems, isLoading, error } = useQuery({
    queryKey: ['/api/wishlist'],
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center py-16">
            <Heart className="mx-auto mb-6 text-red-500" size={64} />
            <h1 className="text-3xl font-bold mb-4">Sign In to View Your Wishlist</h1>
            <p className="text-text-muted mb-8">
              Save your favorite equipment and never lose track of what you want.
            </p>
            <Button asChild variant="primary" size="lg">
              <SmartLink href="/auth">Sign In</SmartLink>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="aspect-square mb-4" />
                <Skeleton className="h-4 mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-8" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Error Loading Wishlist</h1>
            <p className="text-text-muted mb-8">
              Something went wrong while loading your wishlist. Please try again.
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  const products = (wishlistItems as any)?.products || [];

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" asChild className="p-2">
              <SmartLink href="/products">
                <ArrowLeft size={20} />
              </SmartLink>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Heart className="text-red-500" size={32} />
                My Wishlist
              </h1>
              <p className="text-text-muted">
                {products.length} {products.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {products.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-16">
            <Heart className="mx-auto mb-6 text-gray-500" size={64} />
            <h2 className="text-2xl font-bold mb-4">Your Wishlist is Empty</h2>
            <p className="text-text-muted mb-8">
              Start browsing our equipment and save your favorites here.
            </p>
            <Button asChild variant="primary" size="lg">
              <SmartLink href="/products">Browse Equipment</SmartLink>
            </Button>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: Product) => (
              <Card key={product.id} className="group overflow-hidden">
                <div className="relative">
                  {/* Wishlist Button */}
                  <div className="absolute top-3 right-3 z-10">
                    <WishlistButton 
                      productId={product.id}
                      size="md"
                      showTooltip={true}
                    />
                  </div>
                  
                  {/* Product Image */}
                  <SmartLink href={routes.productDetail(product.id)}>
                    <div className="aspect-square bg-gray-900/30 overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-4xl">📦</div>
                        </div>
                      )}
                    </div>
                  </SmartLink>
                </div>
                
                {/* Product Info */}
                <div className="p-4">
                  <SmartLink href={routes.productDetail(product.id)}>
                    <h3 className="font-medium mb-2 line-clamp-2 hover:text-accent-blue transition-colors">
                      {product.name}
                    </h3>
                  </SmartLink>
                  
                  {product.brand && (
                    <p className="text-sm text-text-muted mb-3">{product.brand}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <ProductPrice 
                      price={product.price}
                      originalPrice={(product as any).originalPrice}
                      size="large"
                    />
                    
                    <Button variant="primary" size="sm" asChild>
                      <SmartLink href={routes.productDetail(product.id)}>
                        <ShoppingCart size={16} className="mr-2" />
                        View
                      </SmartLink>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}