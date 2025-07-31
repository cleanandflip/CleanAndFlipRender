import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WishlistButton } from "@/components/ui";
import GlassCard from "@/components/common/glass-card";
import { useToast } from "@/hooks/use-toast";
import AddressAutocomplete from "@/components/ui/address-autocomplete";
import { SmartLink } from "@/components/ui/smart-link";
import { useNavigationState } from "@/hooks/useNavigationState";
import { useBackButton } from "@/hooks/useBackButton";
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
  X,
  Edit,
  Plus,
  Eye,
  AlertCircle,
  Calendar,
  Ban
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { apiRequest } from "@/lib/queryClient";
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
  const { restoreState, saveState } = useNavigationState('dashboard');
  const [activeTab, setActiveTab] = useState('orders');
  const [cancellingSubmission, setCancellingSubmission] = useState<any>(null);
  
  // Initialize browser back button handling
  useBackButton();
  
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: submissions = [], refetch: refetchSubmissions } = useQuery<EquipmentSubmission[]>({
    queryKey: ["/api/my-submissions"],
  });

  const { data: wishlist = [], refetch: refetchWishlist } = useQuery<(Wishlist & { product: Product })[]>({
    queryKey: ["/api/wishlist"],
    staleTime: 0, // Always consider data stale for real-time accuracy
    gcTime: 0, // No client-side caching to prevent stale data
    refetchOnWindowFocus: true, // Always refetch when user returns to tab
    refetchOnMount: 'always', // Always refetch when component mounts
  });

  const cancelSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      return await apiRequest("POST", `/api/submissions/${submissionId}/cancel`, {
        reason: 'Cancelled by user'
      });
    },
    onSuccess: () => {
      refetchSubmissions();
      toast({
        title: "Submission cancelled",
        description: "Your equipment submission has been cancelled successfully.",
      });
      setCancellingSubmission(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel submission",
        variant: "destructive",
      });
    }
  });

  // Check if submission can be cancelled
  const canCancelSubmission = (submission: any) => {
    const nonCancellableStatuses = ['scheduled', 'completed', 'cancelled'];
    return !nonCancellableStatuses.includes(submission.status);
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: Clock,
      under_review: Eye,
      accepted: CheckCircle,
      declined: X,
      scheduled: Calendar,
      completed: CheckCircle,
      cancelled: Ban
    };
    return icons[status as keyof typeof icons] || Package;
  };

  // Restore state when component mounts
  useEffect(() => {
    const savedState = restoreState();
    if (savedState) {
      // Restore scroll position
      setTimeout(() => {
        window.scrollTo(0, savedState.scrollPosition);
      }, 100);
      
      // Restore active tab
      if (savedState.activeTab) {
        setActiveTab(savedState.activeTab);
      }
    }
    
    // Also check URL for tab parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [restoreState]);

  // Save state before unmounting
  useEffect(() => {
    return () => {
      saveState({
        scrollPosition: window.scrollY,
        activeTab: activeTab
      });
    };
  }, [activeTab, saveState]);

  // Listen for wishlist updates from product cards
  useEffect(() => {
    const handleWishlistUpdate = () => {
      console.log('Dashboard: Received wishlist update event, refetching...');
      refetchWishlist();
    };
    
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
  }, [refetchWishlist]);

  // Update tab change handler
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Also save to URL for shareable links
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
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
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="glass w-full justify-start">
            <TabsTrigger value="orders" data-tab="orders" role="tab" aria-selected={activeTab === 'orders'}>Orders</TabsTrigger>
            <TabsTrigger value="submissions" data-tab="submissions" role="tab" aria-selected={activeTab === 'submissions'}>Submissions</TabsTrigger>
            <TabsTrigger value="wishlist" data-tab="wishlist" role="tab" aria-selected={activeTab === 'wishlist'}>Wishlist</TabsTrigger>
            <TabsTrigger value="profile" data-tab="profile" role="tab" aria-selected={activeTab === 'profile'}>Profile</TabsTrigger>
            <TabsTrigger value="addresses" data-tab="addresses" role="tab" aria-selected={activeTab === 'addresses'}>Addresses</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bebas text-2xl">ORDER HISTORY</h2>
                <SmartLink href="/orders">
                  <Button variant="outline" className="glass border-glass-border">
                    View All Orders
                  </Button>
                </SmartLink>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                  <p className="text-text-secondary mb-6">
                    Start shopping to see your order history here.
                  </p>
                  <SmartLink href="/products">
                    <Button className="bg-accent-blue hover:bg-blue-500">
                      Browse Products
                    </Button>
                  </SmartLink>
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
                          <SmartLink href={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm" className="glass border-glass-border mt-2">
                              View Details
                            </Button>
                          </SmartLink>
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
                <SmartLink href="/sell-to-us">
                  <Button className="bg-success hover:bg-green-600">
                    Sell More Equipment
                  </Button>
                </SmartLink>
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-xl font-semibold mb-2">No submissions yet</h3>
                  <p className="text-text-secondary mb-6">
                    Have equipment to sell? Submit it for a cash offer.
                  </p>
                  <SmartLink href="/sell-to-us">
                    <Button className="bg-success hover:bg-green-600">
                      Sell Equipment
                    </Button>
                  </SmartLink>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => {
                    const StatusIcon = getStatusIcon(submission.status || 'pending');
                    
                    return (
                      <div key={submission.id} className="glass rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {submission.equipmentName}
                              </h3>
                              <Badge className={`${getSubmissionStatusColor(submission.status || 'pending')} text-white`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {(submission.status || 'pending').replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-text-secondary font-mono mb-1">
                              {submission.referenceNumber}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <SmartLink href={`/track-submission?ref=${submission.referenceNumber}`}>
                              <Button variant="outline" size="sm" className="glass border-glass-border">
                                <Eye className="w-4 h-4 mr-1" />
                                Track
                              </Button>
                            </SmartLink>
                            
                            {canCancelSubmission(submission) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCancellingSubmission(submission)}
                                className="text-red-400 hover:text-red-300 hover:border-red-600 glass border-glass-border"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-text-secondary">Brand</p>
                            <p>{submission.brand}</p>
                          </div>
                          <div>
                            <p className="text-text-secondary">Condition</p>
                            <p className="capitalize">{submission.condition?.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <p className="text-text-secondary">Submitted</p>
                            <p>{new Date(submission.createdAt!).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-text-secondary">Asking Price</p>
                            <p className="font-medium">
                              {submission.askingPrice ? `$${submission.askingPrice}` : 'Open to offers'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Status-specific information */}
                        {submission.status === 'accepted' && submission.offerAmount && (
                          <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-green-400">Offer Made</p>
                                <p className="text-2xl font-bold text-green-500">
                                  ${submission.offerAmount}
                                </p>
                              </div>
                              <AlertCircle className="w-5 h-5 text-green-400" />
                            </div>
                            <p className="text-sm text-text-secondary mt-2">
                              Please check your email to accept this offer
                            </p>
                          </div>
                        )}
                        
                        {submission.status === 'declined' && submission.declineReason && (
                          <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                            <p className="text-sm text-red-400">Reason for decline:</p>
                            <p className="text-sm mt-1">{submission.declineReason}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bebas text-2xl">WISHLIST</h2>
                <SmartLink href="/products">
                  <Button variant="outline" className="glass border-glass-border">
                    Browse Products
                  </Button>
                </SmartLink>
              </div>

              {!wishlist || wishlist.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
                  <p className="text-text-secondary mb-6">
                    Save items you're interested in to easily find them later.
                  </p>
                  <SmartLink href="/products">
                    <Button className="bg-accent-blue hover:bg-blue-500">
                      Start Shopping
                    </Button>
                  </SmartLink>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlist?.map((item) => (
                    <div key={item.id} className="relative glass rounded-lg overflow-hidden">
                      <SmartLink href={`/products/${item.product.id}`}>
                        <div className="w-full h-48 relative bg-gray-900/30 hover:bg-gray-900/40 transition-colors overflow-hidden">
                          {item.product.images?.[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center text-text-muted">
                                <div className="text-4xl mb-2">📦</div>
                                <div className="text-sm">No Image Available</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </SmartLink>
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
                          <SmartLink href={`/products/${item.product.id}`} className="flex-1">
                            <Button className="w-full bg-accent-blue hover:bg-blue-500">
                              View Product
                            </Button>
                          </SmartLink>
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

      {/* Cancellation Confirmation Dialog */}
      <AlertDialog 
        open={!!cancellingSubmission} 
        onOpenChange={() => setCancellingSubmission(null)}
      >
        <AlertDialogContent className="glass border-glass-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Cancel Equipment Submission?</AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary">
              Are you sure you want to cancel your submission for{' '}
              <strong className="text-white">{cancellingSubmission?.equipmentName}</strong>?
              <br /><br />
              <span className="font-mono text-sm">{cancellingSubmission?.referenceNumber}</span>
              <br /><br />
              This action cannot be undone. You'll need to create a new submission 
              if you want to sell this item in the future.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass border-glass-border">Keep Submission</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelSubmissionMutation.mutate(cancellingSubmission?.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={cancelSubmissionMutation.isPending}
            >
              {cancelSubmissionMutation.isPending ? 'Cancelling...' : 'Yes, Cancel Submission'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
