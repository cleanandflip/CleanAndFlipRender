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
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  RefreshCcw
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
        <Button
          onClick={async () => {
            setIsRefreshing(true);
            await refetch();
            setTimeout(() => setIsRefreshing(false), 500);
          }}
          variant="outline"
          className="glass border-border"
          disabled={isRefreshing}
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingSubmission(submission)}
                      className="glass glass-hover rounded-lg"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingSubmission(submission)}
                      className="glass glass-hover rounded-lg"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
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
        <DialogContent className="glass border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              Edit Submission: {editingSubmission?.referenceNumber}
            </DialogTitle>
          </DialogHeader>
          
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
        <DialogContent className="glass border-border max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              Submission Details: {viewingSubmission?.referenceNumber}
            </DialogTitle>
          </DialogHeader>
          
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Status</label>
        <Dropdown
          options={statusFormOptions}
          value={formData.status}
          onChange={(value: string) => setFormData(prev => ({ ...prev, status: value }))}
          placeholder="Select status"
          className="glass border-border"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Offered Price (optional)</label>
        <Input
          type="number"
          step="0.01"
          value={formData.offeredPrice}
          onChange={(e) => setFormData(prev => ({ ...prev, offeredPrice: e.target.value }))}
          className="glass border-border"
          placeholder="Enter offer amount"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Admin Notes</label>
        <Textarea
          value={formData.adminNotes}
          onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
          className="glass border-border"
          rows={4}
          placeholder="Add notes about this submission..."
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-accent-blue hover:bg-blue-600">
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// View Submission Details Component
function ViewSubmissionDetails({ submission }: { submission: Submission }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-4 text-accent-blue">Equipment Details</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-text-secondary">Name</p>
              <p>{submission.name}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Brand</p>
              <p>{submission.brand || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Category</p>
              <p className="capitalize">{submission.category}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Condition</p>
              <p className="capitalize">{submission.condition?.replace('_', ' ')}</p>
            </div>
            {submission.weight && (
              <div>
                <p className="text-sm text-text-secondary">Weight</p>
                <p>{submission.weight} lbs</p>
              </div>
            )}
            {submission.dimensions && (
              <div>
                <p className="text-sm text-text-secondary">Dimensions</p>
                <p>{submission.dimensions}</p>
              </div>
            )}
            {submission.yearPurchased && (
              <div>
                <p className="text-sm text-text-secondary">Year Purchased</p>
                <p>{submission.yearPurchased}</p>
              </div>
            )}
            {submission.originalPrice && (
              <div>
                <p className="text-sm text-text-secondary">Original Price</p>
                <p>${submission.originalPrice}</p>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4 text-accent-blue">Seller Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-text-secondary">Email</p>
              <p>{submission.sellerEmail}</p>
            </div>
            {submission.sellerPhone && (
              <div>
                <p className="text-sm text-text-secondary">Phone</p>
                <p>{submission.sellerPhone}</p>
              </div>
            )}
            {submission.sellerLocation && (
              <div>
                <p className="text-sm text-text-secondary">Location</p>
                <p>{submission.sellerLocation}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-text-secondary">Asking Price</p>
              <p>{submission.askingPrice ? `$${submission.askingPrice}` : 'Open to offers'}</p>
            </div>
            {submission.offeredPrice && (
              <div>
                <p className="text-sm text-text-secondary">Our Offer</p>
                <p className="text-green-400 font-semibold">${submission.offeredPrice}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {submission.description && (
        <div>
          <h3 className="font-semibold mb-2 text-accent-blue">Description</h3>
          <p className="text-text-secondary">{submission.description}</p>
        </div>
      )}
      
      {submission.notes && (
        <div>
          <h3 className="font-semibold mb-2 text-accent-blue">Seller Notes</h3>
          <p className="text-text-secondary">{submission.notes}</p>
        </div>
      )}
      
      {submission.adminNotes && (
        <div>
          <h3 className="font-semibold mb-2 text-red-400">Admin Notes</h3>
          <p className="text-text-secondary">{submission.adminNotes}</p>
        </div>
      )}
      
      {submission.images && submission.images.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4 text-accent-blue">Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {submission.images.map((image, index) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden glass">
                <img
                  src={image}
                  alt={`Equipment ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}