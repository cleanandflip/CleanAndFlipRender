import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Heart, Search, TrendingUp, Users } from "lucide-react";

export function WishlistManager() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for wishlist analytics since this is typically disabled in single-seller model
  const wishlistStats = {
    totalWishlists: 0,
    totalItems: 0,
    mostWishlisted: 0,
    conversionRate: 0
  };

  const { data: wishlistData = [], isLoading } = useQuery({
    queryKey: ['/api/admin/wishlists'],
    enabled: false, // Disabled since wishlists are not used in single-seller model
  });

  const filteredData = wishlistData.filter((item: any) =>
    item.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">Loading wishlist data...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Wishlist Analytics</h2>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Wishlists</p>
              <p className="text-2xl font-bold">{wishlistStats.totalWishlists}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold">{wishlistStats.totalItems}</p>
            </div>
            <Heart className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Most Wishlisted</p>
              <p className="text-2xl font-bold">{wishlistStats.mostWishlisted}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold">{wishlistStats.conversionRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search wishlist items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Wishlist Feature Disabled
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Wishlist functionality is currently disabled for the single-seller marketplace model. 
            This feature is typically used in multi-vendor platforms where customers save items 
            from different sellers.
          </p>
          <div className="mt-6">
            <Badge variant="secondary" className="text-sm">
              Single-Seller Model Active
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}