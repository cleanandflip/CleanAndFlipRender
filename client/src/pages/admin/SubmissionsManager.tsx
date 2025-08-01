import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { Pagination } from '@/components/admin/Pagination';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Search, Filter, Download, Archive, CheckCircle, XCircle, Clock, 
  Eye, Calendar as CalendarIcon, DollarSign, MapPin, Phone, Mail,
  ChevronLeft, ChevronRight, Grid, List, ArrowUpDown, RefreshCw,
  FileText, Trash2, Edit, MessageSquare, Star, MoreVertical, Package
} from 'lucide-react';
import { SubmissionsList } from '@/components/admin/SubmissionsList';
import { SubmissionsGrid } from '@/components/admin/SubmissionsGrid';
import { SubmissionAnalytics } from '@/components/admin/SubmissionAnalytics';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatStatus, getStatusVariant } from '@/utils/submissionHelpers';

interface SubmissionFilters {
  status: string;
  search: string;
  dateRange: { from: Date | null; to: Date | null };
  isLocal: boolean | null;
  sortBy: 'date' | 'price' | 'name' | 'status';
  sortOrder: 'asc' | 'desc';
  view: 'grid' | 'list';
  page: number;
  limit: number;
}

interface Submission {
  id: string;
  referenceNumber: string;
  name: string;
  description?: string;
  brand: string;
  condition: string;
  weight?: number;
  askingPrice?: number;
  images?: string[];
  status: string;
  offerAmount?: number;
  adminNotes?: string;
  phoneNumber?: string;
  userCity?: string;
  userState?: string;
  userZipCode?: string;
  isLocal?: boolean;
  distance?: number;
  createdAt: string;
  viewedByAdmin?: boolean;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

// Helper functions
const getWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  return new Date(now.setDate(diff));
};

export function SubmissionsManager() {
  const [filters, setFilters] = useState<SubmissionFilters>({
    status: 'all',
    search: '',
    dateRange: { from: null, to: null },
    isLocal: null,
    sortBy: 'date',
    sortOrder: 'desc',
    view: 'list',
    page: 1,
    limit: 20
  });
  
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main data query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-submissions', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: filters.status,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      });
      
      if (filters.isLocal !== null) params.append('isLocal', filters.isLocal.toString());
      if (filters.dateRange.from) params.append('dateFrom', filters.dateRange.from.toISOString());
      if (filters.dateRange.to) params.append('dateTo', filters.dateRange.to.toISOString());
      
      const res = await fetch(`/api/admin/submissions?${params}`, {
        credentials: 'include'
      });
      
      if (!res.ok) throw new Error('Failed to fetch submissions');
      return res.json();
    },
    retry: 2,
    staleTime: 0
  });

  // Status tabs with counts
  const statusTabs = [
    { value: 'all', label: 'All', count: data?.total || 0, color: 'default' },
    { value: 'pending', label: 'Pending', count: data?.pending || 0, color: 'default' },
    { value: 'under_review', label: 'Under Review', count: data?.under_review || 0, color: 'secondary' },
    { value: 'accepted', label: 'Accepted', count: data?.accepted || 0, color: 'secondary' },
    { value: 'scheduled', label: 'Scheduled', count: data?.scheduled || 0, color: 'secondary' },
    { value: 'completed', label: 'Completed', count: data?.completed || 0, color: 'secondary' },
    { value: 'rejected', label: 'Rejected', count: data?.rejected || 0, color: 'destructive' },
    { value: 'cancelled', label: 'Cancelled', count: data?.cancelled || 0, color: 'outline' }
  ];
  
  // Saved filter presets
  const filterPresets = [
    { label: 'Needs Action', filters: { status: 'pending', sortBy: 'date' as const } },
    { label: 'High Value', filters: { sortBy: 'price' as const, sortOrder: 'desc' as const } },
    { label: 'Local Only', filters: { isLocal: true } },
    { label: 'This Week', filters: { dateRange: { from: getWeekStart(), to: new Date() } } },
    { label: 'Rejected Items', filters: { status: 'rejected' } }
  ];

  // Individual submission actions
  const handleEditSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    toast({
      title: "Edit Submission",
      description: `Edit functionality for ${submission.name} coming soon`,
    });
  };

  const handleAddNote = async (submission: Submission) => {
    const note = prompt('Add a note for this submission:');
    if (note) {
      try {
        const res = await fetch(`/api/admin/submissions/${submission.id}/note`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note }),
          credentials: 'include'
        });
        if (res.ok) {
          toast({ title: "Note added successfully" });
          refetch();
        }
      } catch (error) {
        toast({ title: "Error adding note", variant: "destructive" });
      }
    }
  };

  const handleArchiveSubmission = async (submission: Submission) => {
    if (confirm('Archive this submission?')) {
      try {
        const res = await fetch(`/api/admin/submissions/${submission.id}/archive`, {
          method: 'PUT',
          credentials: 'include'
        });
        if (res.ok) {
          toast({ title: "Submission archived" });
          refetch();
        }
      } catch (error) {
        toast({ title: "Error archiving submission", variant: "destructive" });
      }
    }
  };

  const handleDeleteSubmission = async (submission: Submission) => {
    if (confirm('Delete this submission permanently?')) {
      try {
        const res = await fetch(`/api/admin/submissions/${submission.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (res.ok) {
          toast({ title: "Submission deleted" });
          refetch();
        }
      } catch (error) {
        toast({ title: "Error deleting submission", variant: "destructive" });
      }
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedSubmissions.size === 0) return;
    
    const confirmMessage = `Are you sure you want to ${action} ${selectedSubmissions.size} submissions?`;
    if (!confirm(confirmMessage)) return;
    
    try {
      const res = await fetch('/api/admin/submissions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          submissionIds: Array.from(selectedSubmissions)
        })
      });
      
      if (!res.ok) throw new Error('Failed to perform bulk action');
      
      setSelectedSubmissions(new Set());
      refetch();
      toast({
        title: "Success",
        description: `Successfully ${action}d ${selectedSubmissions.size} submissions`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} submissions`,
        variant: "destructive",
      });
    }
  };
  
  // Export functionality
  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams({ 
        format,
        status: filters.status,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      
      if (filters.isLocal !== null) params.append('isLocal', filters.isLocal.toString());
      if (filters.dateRange.from) params.append('dateFrom', filters.dateRange.from.toISOString());
      if (filters.dateRange.to) params.append('dateTo', filters.dateRange.to.toISOString());
      
      const res = await fetch(`/api/admin/submissions/export?${params}`, {
        credentials: 'include'
      });
      
      if (!res.ok) throw new Error('Failed to export');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submissions-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `Submissions exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export submissions",
        variant: "destructive",
      });
    }
  };

  const updateSubmission = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return await apiRequest('PUT', `/api/admin/submissions/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-submissions'] });
      toast({
        title: "Submission Updated",
        description: "The submission has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update submission. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleStatusUpdate = async (submission: Submission, status: string) => {
    const updates: any = { status };
    
    if (status === 'offer_made' && offerAmount) {
      updates.offerAmount = Number(offerAmount);
    }
    
    if (adminNotes) {
      updates.adminNotes = adminNotes;
    }

    await updateSubmission.mutateAsync({ id: submission.id, updates });
    
    // Clear form
    setOfferAmount('');
    setAdminNotes('');
    
    if (status === 'offer_made') {
      toast({
        title: "Offer Sent",
        description: `Offer of $${offerAmount} sent to ${submission.user?.email}`,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'reviewed': return <Package className="w-4 h-4" />;
      case 'offer_made': return <DollarSign className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'reviewed': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'offer_made': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'accepted': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'scheduled': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-8 h-8 animate-spin mx-auto mb-4 text-accent-blue" />
          <p className="text-text-muted">Loading submissions...</p>
        </div>
      </div>
    );
  }



  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.isLocal !== null) count++;
    if (filters.dateRange.from) count++;
    return count;
  };

  return (
    <DashboardLayout
      title="Equipment Submissions"
      description="Manage and process equipment buy requests"
      totalCount={data?.total || 0}
      searchPlaceholder="Search by reference, name, brand..."
      onSearch={(query) => setFilters({ ...filters, search: query, page: 1 })}
      onRefresh={refetch}
      onExport={handleExport}
      viewMode="both"
      currentView={filters.view}
      onViewChange={(view) => setFilters({ ...filters, view })}
      isLoading={isLoading}
      activeFiltersCount={getActiveFiltersCount()}
      sortOptions={[
        { value: 'date-desc', label: 'Newest First' },
        { value: 'date-asc', label: 'Oldest First' },
        { value: 'price-desc', label: 'Highest Price' },
        { value: 'price-asc', label: 'Lowest Price' },
        { value: 'name-asc', label: 'Name A-Z' },
        { value: 'name-desc', label: 'Name Z-A' }
      ]}
      onSort={(value) => {
        const [sortBy, sortOrder] = value.split('-');
        setFilters({ ...filters, sortBy: sortBy as any, sortOrder: sortOrder as any });
      }}
      filters={
        <div className="space-y-4">
          {/* Analytics Section */}
          <div className="mb-6">
            <SubmissionAnalytics />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters({ ...filters, status: v, page: 1 })}
            >
              <SelectTrigger className="glass border-glass-border">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="glass border-glass-border">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.isLocal === null ? 'all' : filters.isLocal.toString()}
              onValueChange={(v) => setFilters({ 
                ...filters, 
                isLocal: v === 'all' ? null : v === 'true',
                page: 1 
              })}
            >
              <SelectTrigger className="glass border-glass-border">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent className="glass border-glass-border">
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="true">Local (Asheville)</SelectItem>
                <SelectItem value="false">Remote</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="glass border-glass-border justify-start">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {filters.dateRange.from ? (
                    filters.dateRange.to ? (
                      `${filters.dateRange.from.toLocaleDateString()} - ${filters.dateRange.to.toLocaleDateString()}`
                    ) : (
                      filters.dateRange.from.toLocaleDateString()
                    )
                  ) : (
                    'Date Range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 glass border-glass-border">
                <Calendar
                  mode="range"
                  selected={filters.dateRange as any}
                  onSelect={(range) => setFilters({ ...filters, dateRange: (range as any) || { from: null, to: null } })}
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline" 
              onClick={() => setFilters({
                ...filters,
                status: 'all',
                isLocal: null,
                dateRange: { from: null, to: null },
                page: 1
              })}
              className="glass border-glass-border"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      }
    >
      {/* Bulk Actions */}
      {selectedSubmissions.size > 0 && (
        <div className="mb-4 p-4 glass rounded-lg border border-blue-500/30 bg-blue-900/20">
          <div className="flex items-center justify-between">
            <p className="text-blue-300">
              {selectedSubmissions.size} submission{selectedSubmissions.size > 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('archive')}
                className="glass border-glass-border"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('reject')}
                className="glass border-glass-border"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkAction('delete')}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Display */}
      {filters.view === 'grid' ? (
        <SubmissionsGrid
          submissions={data?.data || []}
          selectedSubmissions={selectedSubmissions}
          onSelectSubmission={(id) => {
            const newSelected = new Set(selectedSubmissions);
            if (newSelected.has(id)) {
              newSelected.delete(id);
            } else {
              newSelected.add(id);
            }
            setSelectedSubmissions(newSelected);
          }}
          onViewDetails={(submission) => {
            setSelectedSubmission({
              ...submission,
              description: submission.description || '',
              images: submission.images || []
            });
          }}
        />
      ) : (
        <SubmissionsList
          submissions={data?.data || []}
          selectedSubmissions={selectedSubmissions}
          onSelectSubmission={(id) => {
            const newSelected = new Set(selectedSubmissions);
            if (newSelected.has(id)) {
              newSelected.delete(id);
            } else {
              newSelected.add(id);
            }
            setSelectedSubmissions(newSelected);
          }}
          onViewDetails={(submission) => {
            setSelectedSubmission({
              ...submission,
              description: submission.description || '',
              images: submission.images || []
            });
          }}
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={filters.page}
        totalPages={Math.ceil((data?.total || 0) / filters.limit)}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />
    </DashboardLayout>
  );
}
