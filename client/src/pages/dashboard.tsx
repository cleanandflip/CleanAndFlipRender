import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { triggerCacheInvalidation } from "@/hooks/useRealtimeSync";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WishlistButton } from "@/components/ui";
import GlassCard from "@/components/common/glass-card";
import { useToast } from "@/hooks/use-toast";
import AddressAutocomplete from "@/components/ui/address-autocomplete";
import { 
  Package, 
  DollarSign, 
  Heart, 
  Settings, 
  User, 
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  Star,
  X,
  Edit,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { apiRequest } from "@/lib/queryClient";
import { cacheManager, getProductImageUrl } from "@/lib/cache-manager";
import type { Order, EquipmentSubmission, Wishlist, Product, Address } from "@shared/schema";

function AddressesSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const { data: addresses = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/addresses"],
    enabled: !!user?.id,
  });

  const saveAddressMutation = useMutation({
    mutationFn: async (addressData: any) => {
      return apiRequest("POST", "/api/addresses", addressData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Address updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setIsEditDialogOpen(false);
      setEditingAddress(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update address",
        variant: "destructive",
      });
    },
  });

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setIsEditDialogOpen(true);
  };

  const handleAddressSubmit = (addressData: any) => {
    saveAddressMutation.mutate(addressData);
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto"></div>
          <p className="text-text-secondary mt-4">Loading addresses...</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bebas text-2xl">SAVED ADDRESSES</h2>
        <Button className="bg-accent-blue hover:bg-blue-500">
          Add New Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-semibold mb-2">No saved addresses</h3>
          <p className="text-text-secondary mb-6">
            Add addresses to make checkout faster.
          </p>
          <Button className="bg-accent-blue hover:bg-blue-500">
            Add Address
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div key={address.id} className="p-4 glass border border-glass-border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">
                      Primary Address
                    </h3>
                    {address.isDefault && (
                      <Badge className="bg-accent-blue text-white text-xs">
                        Default
                      </Badge>
                    )}
                    {address.isLocal && (
                      <Badge className="bg-green-600 text-white text-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Local Pickup
                      </Badge>
                    )}
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {address.street}<br />
                    {address.city}, {address.state} {address.zipCode}
                  </p>
                  {address.isLocal && (
                    <p className="text-green-400 text-sm mt-2">
                      ✓ Local pickup available in Asheville area
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => handleEditAddress(address)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Address Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass border-glass-border">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <AddressAutocomplete
              onAddressSubmit={handleAddressSubmit}
              isLoading={saveAddressMutation.isPending}
              initialAddress={editingAddress}
            />
          </div>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: submissions = [] } = useQuery<EquipmentSubmission[]>({
    queryKey: ["/api/submissions"],
  });

  const { data: wishlist = [], refetch: refetchWishlist } = useQuery<(Wishlist & { product: Product })[]>({
    queryKey: ["/api/wishlist"],
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnWindowFocus: true,
    refetchOnMount: 'always'
  });

  // Listen for wishlist updates from product cards
  useEffect(() => {
    const handleWishlistUpdate = () => {
      console.log('Dashboard: Received wishlist update event, refetching...');
      refetchWishlist();
    };
    
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
  }, [refetchWishlist]);

  // Force refresh wishlist and product caches when dashboard loads
  useEffect(() => {
    if (user?.id) {
      refetchWishlist();
      // Also invalidate product queries to ensure fresh images
      cacheManager.invalidateProductCaches(queryClient);
    }
  }, [user?.id, refetchWishlist, queryClient]);

  // Wishlist removal is now handled by the unified WishlistButton component

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'processing': return 'bg-purple-500';
      case 'shipped': return 'bg-green-500';
      case 'delivered': return 'bg-green-600';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'reviewed': return 'bg-blue-500';
      case 'offer_made': return 'bg-purple-500';
      case 'accepted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen pt-32 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-bebas text-4xl md:text-6xl mb-2">
            WELCOME BACK, {user?.firstName?.toUpperCase() || 'USER'}
          </h1>
          <p className="text-text-secondary">
            Manage your orders, submissions, and account settings
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <GlassCard className="p-6 text-center">
            <Package className="mx-auto mb-3 text-accent-blue" size={32} />
            <div className="text-2xl font-bold">{orders.length}</div>
            <div className="text-sm text-text-muted">Total Orders</div>
          </GlassCard>
          
          <GlassCard className="p-6 text-center">
            <DollarSign className="mx-auto mb-3 text-success" size={32} />
            <div className="text-2xl font-bold">{submissions.length}</div>
            <div className="text-sm text-text-muted">Submissions</div>
          </GlassCard>
          
          <GlassCard className="p-6 text-center">
            <Heart className="mx-auto mb-3 text-red-400" size={32} />
            <div className="text-2xl font-bold">{wishlist?.length || 0}</div>
            <div className="text-sm text-text-muted">Wishlist Items</div>
          </GlassCard>
          
          <GlassCard className="p-6 text-center">
            <Star className="mx-auto mb-3 text-yellow-400" size={32} />
            <div className="text-2xl font-bold">4.9</div>
            <div className="text-sm text-text-muted">Customer Rating</div>
          </GlassCard>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="glass w-full justify-start">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bebas text-2xl">ORDER HISTORY</h2>
                <Link href="/orders">
                  <Button variant="outline" className="glass border-glass-border">
                    View All Orders
                  </Button>
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                  <p className="text-text-secondary mb-6">
                    Start shopping to see your order history here.
                  </p>
                  <Link href="/products">
                    <Button className="bg-accent-blue hover:bg-blue-500">
                      Browse Products
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="glass rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                            <Badge className={`${getStatusColor(order.status || 'pending')} text-white`}>
                              {(order.status || 'pending').replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-text-secondary">
                            Placed on {new Date(order.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-lg">${order.total}</div>
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm" className="glass border-glass-border mt-2">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bebas text-2xl">EQUIPMENT SUBMISSIONS</h2>
                <Link href="/sell-to-us">
                  <Button className="bg-success hover:bg-green-600">
                    Sell More Equipment
                  </Button>
                </Link>
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-xl font-semibold mb-2">No submissions yet</h3>
                  <p className="text-text-secondary mb-6">
                    Have equipment to sell? Submit it for a cash offer.
                  </p>
                  <Link href="/sell-to-us">
                    <Button className="bg-success hover:bg-green-600">
                      Sell Equipment
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="glass rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{submission.name}</h3>
                            <Badge className={`${getSubmissionStatusColor(submission.status || 'pending')} text-white`}>
                              {(submission.status || 'pending').replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-text-secondary mb-1">
                            {submission.brand && `${submission.brand} • `}
                            Condition: {submission.condition.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-text-secondary">
                            Submitted on {new Date(submission.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {submission.offerAmount && (
                            <div className="font-semibold text-lg text-success mb-2">
                              Offer: ${submission.offerAmount}
                            </div>
                          )}
                          {submission.askingPrice && (
                            <div className="text-sm text-text-muted mb-2">
                              Asked: ${submission.askingPrice}
                            </div>
                          )}
                          <Button variant="outline" size="sm" className="glass border-glass-border">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bebas text-2xl">WISHLIST</h2>
                <Link href="/products">
                  <Button variant="outline" className="glass border-glass-border">
                    Browse Products
                  </Button>
                </Link>
              </div>

              {!wishlist || wishlist.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
                  <p className="text-text-secondary mb-6">
                    Save items you're interested in to easily find them later.
                  </p>
                  <Link href="/products">
                    <Button className="bg-accent-blue hover:bg-blue-500">
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlist?.map((item) => (
                    <div key={item.id} className="relative glass rounded-lg overflow-hidden">
                      <Link href={`/products/${item.product.id}`}>
                        <img
                          src={getProductImageUrl(
                            item.product.images?.[0] || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                            item.product.updatedAt
                          )}
                          alt={item.product.name}
                          className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                          key={`${item.product.id}-${item.product.updatedAt}`}
                        />
                      </Link>
                      <div className="absolute top-2 right-2">
                        <WishlistButton 
                          productId={item.product.id}
                          size="small"
                          showTooltip={false}
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-2 text-white">{item.product.name}</h3>
                        <p className="text-accent-blue font-bold mb-3">${item.product.price}</p>
                        <div className="flex gap-2">
                          <Link href={`/products/${item.product.id}`} className="flex-1">
                            <Button className="w-full bg-accent-blue hover:bg-blue-500">
                              View Product
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <GlassCard className="p-6">
              <h2 className="font-bebas text-2xl mb-6">PROFILE INFORMATION</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4 flex items-center">
                    <User className="mr-2" size={20} />
                    Personal Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name</label>
                      <div className="glass rounded-lg px-3 py-2">{user?.firstName || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <div className="glass rounded-lg px-3 py-2">{user?.lastName || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <div className="glass rounded-lg px-3 py-2">{user?.email || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <div className="glass rounded-lg px-3 py-2">{user?.phone || 'Not provided'}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-4 flex items-center">
                    <Settings className="mr-2" size={20} />
                    Account Settings
                  </h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full glass border-glass-border justify-start">
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full glass border-glass-border justify-start">
                      Email Preferences
                    </Button>
                    <Button variant="outline" className="w-full glass border-glass-border justify-start">
                      Privacy Settings
                    </Button>
                    <Button variant="outline" className="w-full glass border-glass-border justify-start">
                      Download Data
                    </Button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <AddressesSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
