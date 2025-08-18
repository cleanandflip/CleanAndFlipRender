import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Dropdown from "@/components/ui/Dropdown";
import type { DropdownOption } from "@/components/ui/Dropdown";
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Eye, 
  Edit, 
  FileEdit,
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  RefreshCcw,
  User,
  MapPin,
  Phone,
  Mail,
  Ruler,
  ShoppingBag,
  Tag,
  Image as ImageIcon,
  Star
} from 'lucide-react';

interface Submission {
  id: string;
  referenceNumber: string;
  name: string;
  equipmentName?: string;
  brand?: string;
  condition: string;
  description?: string;
  images?: string[];
  askingPrice?: string | number;
  weight?: number;
  dimensions?: string;
  yearPurchased?: number;
  originalPrice?: number;
  offeredPrice?: number;
  status: string;
  adminNotes?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

const statusOptions = [
  { value: 'pending', label: 'Pending Review', color: 'bg-yellow-500' },
  { value: 'under_review', label: 'Under Review', color: 'bg-blue-500' },
  { value: 'accepted', label: 'Accepted/Offer Made', color: 'bg-green-500' },
  { value: 'declined', label: 'Declined', color: 'bg-red-500' },
  { value: 'scheduled', label: 'Pickup Scheduled', color: 'bg-purple-500' },
  { value: 'completed', label: 'Completed', color: 'bg-gray-500' },
];

const statusDropdownOptions: DropdownOption[] = [
  { value: 'all', label: 'All Statuses' },
  ...statusOptions.map(s => ({ value: s.value, label: s.label }))
];

const statusFormOptions: DropdownOption[] = statusOptions.map(s => ({ 
  value: s.value, 
  label: s.label 
}));

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusOption = statusOptions.find(s => s.value === status);
  
  if (!statusOption) {
    return (
      <Badge className="bg-gray-500 text-white">
        {status}
      </Badge>
    );
  }
  
  return (
    <Badge className={`${statusOption.color} text-white`}>
      {statusOption.label}
    </Badge>
  );
}

export default function SubmissionsAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all submissions - using explicit fetch to debug the response
  const { data: submissionsResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/submissions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/submissions', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Raw fetch response:', data);
      return data;
    },
  });

  // Extract submissions array from API response
  const submissions = (submissionsResponse?.data || []) as Submission[];
  const submissionsTotal = submissionsResponse?.total || 0;
  const submissionsPending = submissionsResponse?.pending || 0;

  // Debug logging - can be removed once working
  // console.log('🔍 Debug - submissionsResponse:', submissionsResponse);
  // console.log('🔍 Debug - submissions array:', submissions);
  // console.log('🔍 Debug - submissions length:', submissions?.length);

  // Update submission mutation
  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Submission> }) => {
      return await apiRequest('PUT', `/api/admin/submissions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/submissions'] });
      setEditingSubmission(null);
      toast({
        title: 'Submission Updated',
        description: 'The submission has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update submission.',
        variant: 'destructive',
      });
    },
  });

  const handleUpdateSubmission = (data: Partial<Submission>) => {
    if (editingSubmission) {
      updateSubmissionMutation.mutate({ id: editingSubmission.id, data });
    }
  };

  const getStatusColor = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return statusConfig?.color || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return statusConfig?.label || status;
  };

  // Filter submissions  
  const filteredSubmissions = submissions?.filter((submission: Submission) => {
    const matchesSearch = 
      submission.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.user?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-bebas text-4xl">SUBMISSIONS MANAGEMENT</h1>
        <div className="glass glass-hover rounded-lg p-1 inline-block">
          <Button
            onClick={async () => {
              setIsRefreshing(true);
              await refetch();
              setTimeout(() => setIsRefreshing(false), 500);
            }}
            variant="outline"
            className="h-8 bg-white hover:bg-gray-100 text-black border-white transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            disabled={isRefreshing}
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by reference, name, brand, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass border-border"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Dropdown
              options={statusDropdownOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Filter by status"
              className="glass border-border"
            />
          </div>
        </div>
      </Card>

      {/* Submissions List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent-blue mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading submissions...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="mx-auto mb-4 text-text-secondary" size={48} />
              <h3 className="text-lg font-semibold mb-2">No Submissions Found</h3>
              <p className="text-text-secondary">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No equipment submissions have been received yet.'}
              </p>
            </Card>
          ) : (
            filteredSubmissions.map((submission: Submission) => (
              <Card key={submission.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{submission.name}</h3>
                      <Badge className={`${getStatusColor(submission.status)} text-white`}>
                        {getStatusLabel(submission.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-secondary font-mono mb-1">
                      {submission.referenceNumber}
                    </p>
                    <p className="text-sm text-text-secondary">
                      Submitted {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="glass glass-hover rounded-lg p-1 inline-block">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingSubmission(submission)}
                        className="h-8 bg-white hover:bg-gray-100 text-black border border-white transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                    <div className="glass glass-hover rounded-lg p-1 inline-block">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSubmission(submission)}
                        className="h-8 bg-white hover:bg-gray-100 text-black border border-white transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-text-secondary">Brand</p>
                    <p>{submission.brand || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Submitter</p>
                    <p>{submission.user?.email || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Condition</p>
                    <p className="capitalize">{submission.condition?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Asking Price</p>
                    <p className="font-medium">
                      {submission.askingPrice ? `$${submission.askingPrice}` : 'Open to offers'}
                    </p>
                  </div>
                </div>

                {submission.adminNotes && (
                  <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-400 mb-1">Admin Notes:</p>
                    <p className="text-sm">{submission.adminNotes}</p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Edit Submission Modal */}
      <Dialog open={!!editingSubmission} onOpenChange={() => setEditingSubmission(null)}>
        <DialogContent className="bg-[#0F172A] border border-[rgba(59,130,246,0.2)] max-w-3xl backdrop-blur-xl shadow-2xl">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 -mx-6 -mt-6 px-6 pt-6 pb-4 mb-6 border-b border-[rgba(59,130,246,0.2)]">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileEdit className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    Edit Submission
                  </DialogTitle>
                  <p className="text-sm text-blue-300 font-mono">
                    {editingSubmission?.referenceNumber}
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>
          
          {editingSubmission && (
            <EditSubmissionForm
              submission={editingSubmission}
              onSave={handleUpdateSubmission}
              onCancel={() => setEditingSubmission(null)}
              isLoading={updateSubmissionMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Submission Modal */}
      <Dialog open={!!viewingSubmission} onOpenChange={() => setViewingSubmission(null)}>
        <DialogContent className="bg-[#0F172A] border border-[rgba(59,130,246,0.2)] max-w-5xl backdrop-blur-xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 -mx-6 -mt-6 px-6 pt-6 pb-4 mb-6 border-b border-[rgba(59,130,246,0.2)] sticky top-0 z-10 backdrop-blur-xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Eye className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-white">
                      Submission Details
                    </DialogTitle>
                    <p className="text-sm text-blue-300 font-mono">
                      {viewingSubmission?.referenceNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={viewingSubmission?.status || 'pending'} />
                </div>
              </div>
            </DialogHeader>
          </div>
          
          {viewingSubmission && (
            <ViewSubmissionDetails submission={viewingSubmission} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Edit Submission Form Component
function EditSubmissionForm({ 
  submission, 
  onSave, 
  onCancel, 
  isLoading 
}: {
  submission: Submission;
  onSave: (data: Partial<Submission>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    status: submission.status,
    adminNotes: submission.adminNotes || '',
    offeredPrice: submission.offeredPrice || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      status: formData.status,
      adminNotes: formData.adminNotes,
      offeredPrice: formData.offeredPrice ? Number(formData.offeredPrice) : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Equipment Summary */}
      <div className="bg-[#1e293b]/50 border border-[rgba(59,130,246,0.1)] rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Package className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{submission.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Brand</p>
                <p className="text-white">{submission.brand || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-400">Condition</p>
                <p className="text-white capitalize">{submission.condition?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-gray-400">Asking Price</p>
                <p className="text-green-400 font-medium">
                  {submission.askingPrice ? `$${submission.askingPrice}` : 'Open to offers'}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Current Status</p>
                <StatusBadge status={submission.status} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-3">
              <Tag className="w-4 h-4 text-blue-400" />
              Status
            </label>
            <Dropdown
              options={statusFormOptions}
              value={formData.status}
              onChange={(value: string) => setFormData(prev => ({ ...prev, status: value }))}
              placeholder="Select status"
              className="bg-[#1e293b]/50 border-[rgba(59,130,246,0.2)] text-white"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-3">
              <DollarSign className="w-4 h-4 text-green-400" />
              Offered Price (optional)
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.offeredPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, offeredPrice: e.target.value }))}
              className="bg-[#1e293b]/50 border-[rgba(59,130,246,0.2)] text-white placeholder-gray-400"
              placeholder="Enter offer amount"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-white mb-3">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            Admin Notes
          </label>
          <Textarea
            value={formData.adminNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
            className="bg-[#1e293b]/50 border-[rgba(59,130,246,0.2)] text-white placeholder-gray-400"
            rows={4}
            placeholder="Add internal notes about this submission, pricing decisions, quality assessments, etc..."
          />
        </div>

        <DialogFooter className="pt-6 border-t border-[rgba(59,130,246,0.1)]">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} loading={isLoading}>
            {isLoading ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
}

// View Submission Details Component
function ViewSubmissionDetails({ submission }: { submission: Submission }) {
  return (
    <div className="space-y-8 pb-6">
      {/* Equipment Overview Card */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-[rgba(59,130,246,0.2)] rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Package className="w-8 h-8 text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{submission.name}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(submission.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(submission.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-400">
              {submission.askingPrice ? `$${submission.askingPrice}` : 'Open to offers'}
            </p>
            <p className="text-sm text-gray-400">Asking Price</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Equipment Details */}
        <div className="bg-[#1e293b]/50 border border-[rgba(59,130,246,0.1)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Equipment Details</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
              <Tag className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Brand</p>
                <p className="text-white font-medium">{submission.brand || 'Not specified'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
              <Star className="w-4 h-4 text-yellow-400" />
              <div>
                <p className="text-xs text-gray-400">Condition</p>
                <p className="text-white font-medium capitalize">{submission.condition?.replace('_', ' ')}</p>
              </div>
            </div>
            
            {submission.weight && (
              <div className="flex items-center gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
                <Package className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-xs text-gray-400">Weight</p>
                  <p className="text-white font-medium">{submission.weight} lbs</p>
                </div>
              </div>
            )}

            {submission.dimensions && (
              <div className="flex items-center gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
                <Ruler className="w-4 h-4 text-orange-400" />
                <div>
                  <p className="text-xs text-gray-400">Dimensions</p>
                  <p className="text-white font-medium">{submission.dimensions}</p>
                </div>
              </div>
            )}

            {submission.yearPurchased && (
              <div className="flex items-center gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
                <Calendar className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-xs text-gray-400">Year Purchased</p>
                  <p className="text-white font-medium">{submission.yearPurchased}</p>
                </div>
              </div>
            )}

            {submission.originalPrice && (
              <div className="flex items-center gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-xs text-gray-400">Original Price</p>
                  <p className="text-white font-medium">${submission.originalPrice}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seller Information */}
        <div className="bg-[#1e293b]/50 border border-[rgba(59,130,246,0.1)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Seller Information</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
              <Mail className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-white font-medium">{submission.user?.email || 'N/A'}</p>
              </div>
            </div>

            {submission.user?.name && (
              <div className="flex items-center gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
                <User className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-xs text-gray-400">Name</p>
                  <p className="text-white font-medium">{submission.user.name}</p>
                </div>
              </div>
            )}

            {submission.offeredPrice && (
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-xs text-green-300">Our Offer</p>
                  <p className="text-xl font-bold text-green-400">${submission.offeredPrice}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description & Notes */}
      <div className="space-y-6">
        {submission.description && (
          <div className="bg-[#1e293b]/50 border border-[rgba(59,130,246,0.1)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Description</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">{submission.description}</p>
          </div>
        )}

        {submission.adminNotes && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <MessageSquare className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-red-400">Admin Notes</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">{submission.adminNotes}</p>
          </div>
        )}
      </div>

      {/* Images Gallery */}
      {submission.images && submission.images.length > 0 && (
        <div className="bg-[#1e293b]/50 border border-[rgba(59,130,246,0.1)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <ImageIcon className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Equipment Images</h3>
            <Badge variant="secondary" className="ml-auto">
              {submission.images.length} {submission.images.length === 1 ? 'Photo' : 'Photos'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {submission.images?.map((image, index) => (
              <div key={index} className="group relative aspect-square rounded-lg overflow-hidden bg-[#0F172A]/50 border border-[rgba(59,130,246,0.1)] hover:border-blue-400/40 transition-colors">
                <img
                  src={image}
                  alt={`${submission.name} - Image ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {index + 1} of {submission.images?.length || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}