import { useQuery } from "@tanstack/react-query";
import GlassCard from "@/components/common/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Users, TrendingUp } from "lucide-react";

interface WishlistAnalytics {
  topWishlisted: Array<{ productId: string; productName: string; count: number }>;
  activeUsers: Array<{ userId: string; userName: string; email: string; itemCount: number }>;
  totalWishlistItems: number;
}

export default function WishlistAnalytics() {
  const { data: analytics, isLoading } = useQuery<WishlistAnalytics>({
    queryKey: ["/api/admin/wishlist-analytics"],
    queryFn: async () => {
      const response = await fetch('/api/admin/wishlist-analytics', { 
        credentials: 'include' 
      });
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist analytics');
      }
      return response.json();
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </GlassCard>
      </div>
    );
  }

  if (!analytics) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="text-text-muted">
          <Heart className="mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold mb-2">No Wishlist Data</h3>
          <p>Wishlist analytics will appear here once users start saving items.</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4 text-center">
          <Heart className="mx-auto mb-2 text-accent-blue" size={32} />
          <div className="text-2xl font-bold text-white">{analytics.totalWishlistItems}</div>
          <div className="text-sm text-text-secondary">Total Wishlist Items</div>
        </GlassCard>
        
        <GlassCard className="p-4 text-center">
          <Users className="mx-auto mb-2 text-green-400" size={32} />
          <div className="text-2xl font-bold text-white">{analytics.activeUsers.length}</div>
          <div className="text-sm text-text-secondary">Active Wishlist Users</div>
        </GlassCard>
        
        <GlassCard className="p-4 text-center">
          <TrendingUp className="mx-auto mb-2 text-orange-400" size={32} />
          <div className="text-2xl font-bold text-white">
            {analytics.activeUsers.length > 0 
              ? Math.round(analytics.totalWishlistItems / analytics.activeUsers.length * 10) / 10
              : 0}
          </div>
          <div className="text-sm text-text-secondary">Avg Items per User</div>
        </GlassCard>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Wishlisted Items */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <Heart className="text-accent-blue" size={20} />
            Most Wishlisted Items
          </h3>
          {analytics.topWishlisted.length > 0 ? (
            <div className="space-y-3">
              {analytics.topWishlisted.map((item, index) => (
                <div key={item.productId} className="flex justify-between items-center py-2 border-b border-glass-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-xs font-bold text-accent-blue">
                      {index + 1}
                    </div>
                    <span className="text-white font-medium truncate">{item.productName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-accent-blue font-bold">{item.count}</span>
                    <Heart size={14} className="text-accent-blue" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-text-muted py-8">
              <Heart className="mx-auto mb-2" size={32} />
              <p>No wishlist items yet</p>
            </div>
          )}
        </GlassCard>
        
        {/* Active Wishlist Users */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <Users className="text-green-400" size={20} />
            Active Wishlist Users
          </h3>
          {analytics.activeUsers.length > 0 ? (
            <div className="space-y-3">
              {analytics.activeUsers.map((user, index) => (
                <div key={user.userId} className="py-2 border-b border-glass-border last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-white font-medium">{user.userName}</div>
                      <div className="text-sm text-text-secondary truncate">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">{user.itemCount}</div>
                      <div className="text-xs text-text-muted">items</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-text-muted py-8">
              <Users className="mx-auto mb-2" size={32} />
              <p>No active wishlist users yet</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}