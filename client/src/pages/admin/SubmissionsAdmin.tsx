import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Dropdown from "@/components/ui/Dropdown";
import type { DropdownOption } from "@/components/ui/Dropdown";
import { Textarea } from '@/components/ui/textarea';
// Removed old Dialog imports - using custom modal styling
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useScrollLock } from '@/hooks/useScrollLock';
import { 
  Package, 
  Eye, 
  Edit, 
  X,
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
  Star,
  AlertCircle
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
  { value: 'pending', label: 'Pending Review', color: 'bg-amber-500/20 text-amber-300 border-amber-500/50' },
  { value: 'reviewing', label: 'Under Review', color: 'bg-blue-500/20 text-blue-300 border-blue-500/50' },
  { value: 'under_review', label: 'Under Review', color: 'bg-blue-500/20 text-blue-300 border-blue-500/50' },
  { value: 'approved', label: 'Approved', color: 'bg-green-500/20 text-green-300 border-green-500/50' },
  { value: 'accepted', label: 'Accepted/Offer Made', color: 'bg-green-500/20 text-green-300 border-green-500/50' },
  { value: 'declined', label: 'Declined', color: 'bg-orange-500/20 text-orange-300 border-orange-500/50' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500/20 text-red-300 border-red-500/50' },
  { value: 'scheduled', label: 'Pickup Scheduled', color: 'bg-violet-500/20 text-violet-300 border-violet-500/50' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' },
];

const statusDropdownOptions: DropdownOption[] = [
  { value: 'all', label: 'All Statuses' },
  ...statusOptions.map(s => ({ value: s.value, label: s.label }))
];

const statusFormOptions: DropdownOption[] = statusOptions.map(s => ({ 
  value: s.value, 
  label: s.label 
}));

// Enhanced Status Badge Component with Modern Colors
function StatusBadge({ status }: { status: string }) {
  const statusOption = statusOptions.find(s => s.value === status.toLowerCase());
  
  if (!statusOption) {
    return (
      <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/50 font-medium px-2 py-1 text-xs">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }
  
  return (
    <Badge className={`${statusOption.color} border font-medium px-2 py-1 text-xs`}>
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

  // Lock body scroll when any modal is open
  useScrollLock(!!(editingSubmission || viewingSubmission));
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

      {/* Edit Submission Modal - styled like Category Modal */}
      {editingSubmission && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingSubmission(null);
          }}
        >
          <div className="bg-[#1e293b] border border-gray-700 rounded-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-slideUp">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-[#1e293b] to-[#2d3748]">
              <div>
                <h2 className="text-xl font-bold text-white">Edit Submission</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {editingSubmission.referenceNumber} - {editingSubmission.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={editingSubmission.status} />
                <button
                  onClick={() => setEditingSubmission(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                >
                  <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
                </button>
              </div>
            </div>

            <EditSubmissionForm
              submission={editingSubmission}
              onSave={handleUpdateSubmission}
              onCancel={() => setEditingSubmission(null)}
              isLoading={updateSubmissionMutation.isPending}
            />
          </div>
        </div>
      )}

      {/* View Submission Modal - styled like Category Modal */}
      {viewingSubmission && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingSubmission(null);
          }}
        >
          <div className="bg-[#1e293b] border border-gray-700 rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-slideUp">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-[#1e293b] to-[#2d3748]">
              <div>
                <h2 className="text-xl font-bold text-white">Submission Details</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {viewingSubmission.referenceNumber} - {viewingSubmission.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={viewingSubmission.status} />
                <button
                  onClick={() => setViewingSubmission(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                >
                  <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
                </button>
              </div>
            </div>

            <ViewSubmissionDetails submission={viewingSubmission} />
          </div>
        </div>
      )}
    </div>
  );
}

// Edit Submission Form Component - styled like Category Modal
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
    offeredPrice: submission.offeredPrice?.toString() || '',
  });

  const [initialData] = useState(formData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      status: formData.status,
      adminNotes: formData.adminNotes,
      offeredPrice: formData.offeredPrice ? Number(formData.offeredPrice) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-[#0f172a]/50">
      <div className="p-6 space-y-8">
        
        {/* Equipment Summary */}
        <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            Equipment Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
              <div className="px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white">
                {submission.name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Brand</label>
              <div className="px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white">
                {submission.brand || 'Not specified'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Condition</label>
              <div className="px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white capitalize">
                {submission.condition?.replace('_', ' ')}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Asking Price</label>
              <div className="px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-green-400 font-medium">
                {submission.askingPrice ? `$${submission.askingPrice}` : 'Open to offers'}
              </div>
            </div>
          </div>
        </div>

        {/* Status Management */}
        <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-400" />
            Status Management
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Status <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="pending">Pending Review</option>
                <option value="reviewing">Under Review</option>
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Offered Price (optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.offeredPrice}
                onChange={(e) => setFormData({ ...formData, offeredPrice: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter offer amount"
              />
            </div>
          </div>
        </div>

        {/* Admin Notes */}
        <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            Admin Notes
          </h3>
          
          <textarea
            value={formData.adminNotes}
            onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
            rows={6}
            className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
            placeholder="Add internal notes about this submission, pricing decisions, quality assessments, communication history, etc..."
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-4 bg-[#1e293b]">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-400 transition-all duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center gap-2"
        >
          {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

// View Submission Details Component - styled like Category Modal
function ViewSubmissionDetails({ submission }: { submission: Submission }) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#0f172a]/50">
      <div className="p-6 space-y-8">
        
        {/* Equipment Information */}
        <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            Equipment Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Equipment Name</label>
              <div className="px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white font-medium">
                {submission.name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Brand</label>
              <div className="px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white">
                {submission.brand || 'Not specified'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Condition</label>
              <div className="px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white capitalize">
                {submission.condition?.replace('_', ' ')}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Asking Price</label>
              <div className="px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-green-400 font-bold text-lg">
                {submission.askingPrice ? `$${submission.askingPrice}` : 'Open to offers'}
              </div>
            </div>
            
            {submission.weight && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Weight</label>
                <div className="px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white">
                  {submission.weight} lbs
                </div>
              </div>
            )}

            {submission.offeredPrice && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Our Offer</label>
                <div className="px-4 py-3 bg-green-500/20 border border-green-500 rounded-lg text-green-400 font-bold text-lg">
                  ${submission.offeredPrice}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seller Information */}
        <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            Seller Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <div className="px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white">
                {submission.user?.email || 'N/A'}
              </div>
            </div>
            
            {submission.user?.name && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                <div className="px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white">
                  {submission.user.name}
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Submitted</label>
              <div className="px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white">
                {new Date(submission.createdAt).toLocaleString()}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Reference #</label>
              <div className="px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-blue-400 font-mono">
                {submission.referenceNumber}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {submission.description && (
          <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              Description
            </h3>
            
            <div className="px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-gray-300 leading-relaxed">
              {submission.description}
            </div>
          </div>
        )}

        {/* Admin Notes */}
        {submission.adminNotes && (
          <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-red-700/50">
            <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Admin Notes
            </h3>
            
            <div className="px-4 py-3 bg-red-900/20 border border-red-700 rounded-lg text-gray-300 leading-relaxed">
              {submission.adminNotes}
            </div>
          </div>
        )}

        {/* Images */}
        {submission.images && submission.images.length > 0 && (
          <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-400" />
              Equipment Images ({submission.images.length})
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {submission.images.map((image, index) => (
                <div 
                  key={index} 
                  className="group relative aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => window.open(image, '_blank')}
                >
                  <img
                    src={image}
                    alt={`${submission.name} - Image ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {index + 1} / {submission.images.length}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-blue-500/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Click to view full size
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}