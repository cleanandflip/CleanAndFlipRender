import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/shared/AnimatedComponents";
import { globalDesignSystem as theme } from "@/styles/design-system/theme";
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
  Ban,
  Mail,
  Shield,
  Download
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { apiRequest } from "@/lib/queryClient";
import AddressesPanel from "@/components/dashboard/AddressesPanel";

import type { Order, EquipmentSubmission } from "@shared/schema";

// Using SSOT AddressesPanel for unified address management

function DashboardContent() {
  const { data: authData } = useAuth();
  const user = authData?.user;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const { restoreState, saveState } = useNavigationState('dashboard');
  
  // Get tab from URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const urlTab = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || 'orders');
  const [submissionTab, setSubmissionTab] = useState('open');
  const [cancellingSubmission, setCancellingSubmission] = useState<any>(null);
  
  // Update tab when URL changes
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab, activeTab]);
  
  // Initialize browser back button handling
  useBackButton();
  
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: submissions = [], isLoading: submissionsLoading, refetch: refetchSubmissions } = useQuery<EquipmentSubmission[]>({
    queryKey: ["/api/my-submissions"],
    enabled: !!user?.id,
    retry: 2,
    staleTime: 30000,
    gcTime: 0, // No client-side caching to prevent stale data
    refetchOnWindowFocus: true, // Always refetch when user returns to tab
    refetchOnMount: true, // Always refetch when component mounts
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

  // Filter submissions by status
  const filterSubmissions = (submissions: EquipmentSubmission[], tab: string) => {
    switch (tab) {
      case 'open':
        return submissions.filter(s => ['pending', 'under_review'].includes(s.status || 'pending'));
      case 'completed':
        return submissions.filter(s => ['accepted', 'declined'].includes(s.status || 'pending'));
      case 'cancelled':
        return submissions.filter(s => s.status === 'cancelled');
      default:
        return submissions;
    }
  };

  const filteredSubmissions = filterSubmissions(submissions || [], submissionTab);

  const canCancelSubmission = (submission: EquipmentSubmission) => {
    return submission.status === 'pending' || submission.status === 'under_review';
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

  useEffect(() => {
    // Cleanup effect placeholder
  }, []);
    

  // Update tab change handler
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Also save to URL for shareable links
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };


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
          <Card className="p-6 text-center">
            <Package className="mx-auto mb-3 text-accent-blue" size={32} />
            <div className="text-2xl font-bold">{orders?.length || 0}</div>
            <div className="text-sm text-text-muted">Total Orders</div>
          </Card>
          
          <Card className="p-6 text-center">
            <DollarSign className="mx-auto mb-3 text-success" size={32} />
            <div className="text-2xl font-bold">
              {submissionsLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                submissions?.length || 0
              )}
            </div>
            <div className="text-sm text-text-muted">Submissions</div>
          </Card>
          
          <Card className="p-6 text-center">
            <Settings className="mx-auto mb-3 text-purple-400" size={32} />
            <div className="text-2xl font-bold">Active</div>
            <div className="text-sm text-text-muted">Account Status</div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="flex gap-2 flex-wrap">
            <div className={`glass glass-hover rounded-lg p-1 transition-all duration-300 ${
              activeTab === 'orders' 
                ? 'ring-2 ring-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20' 
                : 'ring-1 ring-blue-500/20 hover:ring-blue-400/40'
            }`}>
              <Button
                variant={activeTab === 'orders' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('orders')}
                className={`h-8 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
                  activeTab === 'orders' 
                    ? 'bg-blue-500/30 text-blue-200 shadow-md hover:bg-blue-500/40 border border-blue-400/50' 
                    : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                }`}
              >
                Orders
              </Button>
            </div>
            <div className={`glass glass-hover rounded-lg p-1 transition-all duration-300 ${
              activeTab === 'submissions' 
                ? 'ring-2 ring-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20' 
                : 'ring-1 ring-blue-500/20 hover:ring-blue-400/40'
            }`}>
              <Button
                variant={activeTab === 'submissions' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('submissions')}
                className={`h-8 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
                  activeTab === 'submissions' 
                    ? 'bg-blue-500/30 text-blue-200 shadow-md hover:bg-blue-500/40 border border-blue-400/50' 
                    : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                }`}
              >
                Submissions
                {Array.isArray(submissions) && submissions.filter(s => s.status === 'pending').length > 0 && (
                  <Badge className={`ml-2 ${activeTab === 'submissions' ? 'bg-blue-400 text-blue-100' : 'bg-blue-500 text-white'}`} variant="secondary">
                    {submissions.filter(s => s.status === 'pending').length}
                  </Badge>
                )}
              </Button>
            </div>

            <div className={`glass glass-hover rounded-lg p-1 transition-all duration-300 ${
              activeTab === 'profile' 
                ? 'ring-2 ring-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20' 
                : 'ring-1 ring-blue-500/20 hover:ring-blue-400/40'
            }`}>
              <Button
                variant={activeTab === 'profile' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('profile')}
                className={`h-8 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
                  activeTab === 'profile' 
                    ? 'bg-blue-500/30 text-blue-200 shadow-md hover:bg-blue-500/40 border border-blue-400/50' 
                    : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                }`}
              >
                Profile
              </Button>
            </div>
            <div className={`glass glass-hover rounded-lg p-1 transition-all duration-300 ${
              activeTab === 'addresses' 
                ? 'ring-2 ring-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20' 
                : 'ring-1 ring-blue-500/20 hover:ring-blue-400/40'
            }`}>
              <Button
                variant={activeTab === 'addresses' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('addresses')}
                className={`h-8 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
                  activeTab === 'addresses' 
                    ? 'bg-blue-500/30 text-blue-200 shadow-md hover:bg-blue-500/40 border border-blue-400/50' 
                    : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                }`}
              >
                Addresses
              </Button>
            </div>
          </div>

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bebas text-2xl">ORDER HISTORY</h2>
                <SmartLink href="/orders">
                  <Button 
                    variant="primary"
                    size="sm"
                  >
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
                    <Button 
                      variant="primary"
                      size="sm"
                    >
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
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="mt-2"
                            >
                              View Details
                            </Button>
                          </SmartLink>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bebas text-2xl">EQUIPMENT SUBMISSIONS</h2>
                <SmartLink href="/sell-to-us">
                  <Button 
                    variant="primary"
                    size="sm"
                  >
                    Sell More Equipment
                  </Button>
                </SmartLink>
              </div>

              {/* Submission Status Tabs */}
              <div className="mb-6">
                <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
                  <button
                    onClick={() => setSubmissionTab('open')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      submissionTab === 'open'
                        ? 'text-black bg-[#3b82f6]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Open ({filterSubmissions(submissions || [], 'open').length})
                  </button>
                  <button
                    onClick={() => setSubmissionTab('completed')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      submissionTab === 'completed'
                        ? 'text-black bg-[#3b82f6]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Completed ({filterSubmissions(submissions || [], 'completed').length})
                  </button>
                  <button
                    onClick={() => setSubmissionTab('cancelled')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      submissionTab === 'cancelled'
                        ? 'text-black bg-[#3b82f6]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Cancelled ({filterSubmissions(submissions || [], 'cancelled').length})
                  </button>
                </div>
              </div>

              {submissionsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-pulse">
                    <Package className="mx-auto mb-4 text-gray-400" size={48} />
                    <div className="h-4 w-32 bg-gray-700 rounded mx-auto mb-2"></div>
                    <div className="h-3 w-48 bg-gray-700 rounded mx-auto"></div>
                  </div>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-xl font-semibold mb-2">
                    {submissionTab === 'open' && 'No open submissions'}
                    {submissionTab === 'completed' && 'No completed submissions'} 
                    {submissionTab === 'cancelled' && 'No cancelled submissions'}
                  </h3>
                  <p className="text-text-secondary mb-6">
                    {submissionTab === 'open' && 'Have equipment to sell? Submit it for a cash offer.'}
                    {submissionTab === 'completed' && 'Completed submissions will appear here.'}
                    {submissionTab === 'cancelled' && 'Cancelled submissions will appear here.'}
                  </p>
                  {submissionTab === 'open' && (
                    <SmartLink href="/sell-to-us">
                      <Button 
                        variant="primary"
                        size="sm"
                      >
                        Sell Equipment
                      </Button>
                    </SmartLink>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubmissions.map((submission) => {
                    console.log('🔍 Dashboard submission data:', submission);
                    const StatusIcon = getStatusIcon(submission.status || 'pending');
                    
                    return (
                      <div key={submission.id} className="glass rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {submission.name}
                              </h3>
                              <Badge className={`${getSubmissionStatusColor(submission.status || 'pending')} text-white`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {(submission.status || 'pending').replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-text-secondary font-mono mb-1">
                              {submission.referenceNumber || 'No reference number'}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const trackUrl = `/track-submission?ref=${encodeURIComponent(submission.referenceNumber || '')}`;
                                console.log('🔍 Navigating to:', trackUrl);
                                window.location.href = trackUrl;
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Track
                            </Button>
                            
                            {canCancelSubmission(submission) && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setCancellingSubmission(submission)}
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
                        {submission.status === 'accepted' && submission.offeredPrice && (
                          <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-green-400">Offer Made</p>
                                <p className="text-2xl font-bold text-green-500">
                                  ${submission.offeredPrice}
                                </p>
                              </div>
                              <AlertCircle className="w-5 h-5 text-green-400" />
                            </div>
                            <p className="text-sm text-text-secondary mt-2">
                              Please check your email to accept this offer
                            </p>
                          </div>
                        )}
                        
                        {submission.status === 'declined' && submission.adminNotes && (
                          <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                            <p className="text-sm text-red-400">Reason for decline:</p>
                            <p className="text-sm mt-1">{submission.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}



          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Header */}
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bebas text-2xl">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : 'Profile Information'
                      }
                    </h2>
                    <p className="text-text-secondary">Manage your account details and preferences</p>
                  </div>
                </div>
              </Card>

              {/* Personal Information Card */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <User className="mr-2" size={20} />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-secondary">First Name</label>
                    <p className="font-medium">{user?.firstName || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-secondary">Last Name</label>
                    <p className="font-medium">{user?.lastName || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-secondary">Email Address</label>
                    <p className="font-medium">{user?.email || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-secondary">Phone Number</label>
                    <p className="font-medium">{user?.phone || 'Not provided'}</p>
                  </div>
                </div>
              </Card>

              {/* Account Settings Card */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <Settings className="mr-2" size={20} />
                  Account Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    size="default"
                    className="justify-start h-12"
                    onClick={() => {
                      toast({
                        title: "Change Password",
                        description: "Password change functionality coming soon. You can update your password through your Google account settings for now.",
                        variant: "default"
                      });
                    }}
                  >
                    <Settings className="mr-2" size={16} />
                    Change Password
                  </Button>
                  <Button 
                    variant="outline" 
                    size="default"
                    className="justify-start h-12"
                    onClick={() => {
                      toast({
                        title: "Email Preferences",
                        description: "Email preference settings will be available soon. You'll be able to control notifications and marketing emails.",
                        variant: "default"
                      });
                    }}
                  >
                    <Mail className="mr-2" size={16} />
                    Email Preferences
                  </Button>
                  <Button 
                    variant="outline" 
                    size="default"
                    className="justify-start h-12"
                    onClick={() => {
                      toast({
                        title: "Privacy Settings",
                        description: "Privacy controls are coming soon. You'll be able to manage data visibility and account privacy options.",
                        variant: "default"
                      });
                    }}
                  >
                    <Shield className="mr-2" size={16} />
                    Privacy Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    size="default"
                    className="justify-start h-12"
                    onClick={() => {
                      const userData = {
                        profile: {
                          firstName: user?.firstName,
                          lastName: user?.lastName,
                          email: user?.email,
                          phone: user?.phone,
                        },
                        accountInfo: {
                          memberSince: user?.createdAt,
                          accountStatus: 'Active'
                        }
                      };
                      
                      const dataStr = JSON.stringify(userData, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `clean-flip-user-data-${Date.now()}.json`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      
                      toast({
                        title: "Data Downloaded",
                        description: "Your account data has been downloaded as a JSON file.",
                        variant: "default"
                      });
                    }}
                  >
                    <Download className="mr-2" size={16} />
                    Download Data
                  </Button>
                </div>
              </Card>

              {/* Account Status Card */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <CheckCircle className="mr-2" size={20} />
                  Account Status
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Account Active</span>
                  <span className="text-text-secondary">• Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </Card>
            </div>
          )}

          {/* Addresses Tab - SSOT System */}
          {activeTab === 'addresses' && (
            <div className="pt-4">
              <AddressesPanel />
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Confirmation Dialog */}
      {cancellingSubmission && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setCancellingSubmission(null)}
          />
          
          <div className="relative bg-[#1e293b] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scaleIn">
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <X className="w-5 h-5 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Cancel Equipment Submission?</h2>
              </div>
            </div>

            <div className="px-6 py-6">
              <p className="text-gray-300">
                Are you sure you want to cancel your submission for{' '}
                <strong className="text-white">{cancellingSubmission.name}</strong>?
              </p>
              <p className="text-sm text-gray-400 font-mono mt-2">
                Reference: {cancellingSubmission.referenceNumber}
              </p>
              <p className="text-gray-300 mt-4">
                This action cannot be undone. You'll need to create a new submission 
                if you want to sell this item in the future.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setCancellingSubmission(null)}
              >
                Keep Submission
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => {
                  if (cancellingSubmission) {
                    cancelSubmissionMutation.mutate(cancellingSubmission.id);
                  }
                }}
                loading={cancelSubmissionMutation.isPending}
              >
                {cancelSubmissionMutation.isPending ? 'Cancelling...' : 'Yes, Cancel Submission'}
              </Button>
            </div>
          </div>
        </div>
      )}
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
