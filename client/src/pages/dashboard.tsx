import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import GlassCard from "@/components/common/glass-card";
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
  Star
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import type { Order, EquipmentSubmission, Wishlist, Product } from "@shared/schema";

function DashboardContent() {
  const { user } = useAuth();
  
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: submissions = [] } = useQuery<EquipmentSubmission[]>({
    queryKey: ["/api/submissions"],
  });

  const { data: wishlist = [] } = useQuery<(Wishlist & { product: Product })[]>({
    queryKey: ["/api/wishlist"],
  });

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
            WELCOME BACK, {mockUser.firstName?.toUpperCase()}
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
            <div className="text-2xl font-bold">{wishlist.length}</div>
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
                            <Badge className={`${getStatusColor(order.status)} text-white`}>
                              {order.status.replace('_', ' ').toUpperCase()}
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
                            <Badge className={`${getSubmissionStatusColor(submission.status)} text-white`}>
                              {submission.status.replace('_', ' ').toUpperCase()}
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

              {wishlist.length === 0 ? (
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
                  {wishlist.map((item) => (
                    <div key={item.id} className="glass rounded-lg overflow-hidden">
                      <img
                        src={item.product.images?.[0] || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"}
                        alt={item.product.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold mb-2">{item.product.name}</h3>
                        <p className="text-accent-blue font-bold mb-3">${item.product.price}</p>
                        <div className="flex gap-2">
                          <Link href={`/products/${item.product.id}`} className="flex-1">
                            <Button className="w-full bg-accent-blue hover:bg-blue-500">
                              View Product
                            </Button>
                          </Link>
                          <Button variant="outline" size="icon" className="glass border-glass-border">
                            <Heart className="h-4 w-4 text-red-400 fill-current" />
                          </Button>
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
                      <div className="glass rounded-lg px-3 py-2">{mockUser.firstName}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <div className="glass rounded-lg px-3 py-2">{mockUser.lastName}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <div className="glass rounded-lg px-3 py-2">{mockUser.email}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <div className="glass rounded-lg px-3 py-2">{mockUser.phone}</div>
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
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bebas text-2xl">SAVED ADDRESSES</h2>
                <Button className="bg-accent-blue hover:bg-blue-500">
                  Add New Address
                </Button>
              </div>

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
            </GlassCard>
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
