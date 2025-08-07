import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UnifiedDashboardCard } from '@/components/admin/UnifiedDashboardCard';
import { UnifiedStatCard } from '@/components/admin/UnifiedStatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, Clock, CheckCircle, XCircle, DollarSign, Search, Filter, Download, Eye, MessageSquare } from 'lucide-react';
import { formatCurrency } from '@/utils/submissionHelpers';
import { useToast } from '@/hooks/use-toast';

interface Submission {
  id: string;
  reference_number: string;
  equipment_type: string;
  brand: string;
  model: string;
  condition: string;
  asking_price: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  submitted_at: string;
  user_email: string;
  notes?: string;
}

export function SubmissionsManager() {
  console.log('🔴 SubmissionsManager RENDERED at', new Date().toISOString());
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-submissions', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter
      });
      const res = await fetch(`/api/admin/submissions?${params}`);
      if (!res.ok) throw new Error('Failed to fetch submissions');
      return res.json();
    }
  });

  const handleStatusUpdate = async (submissionId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      refetch();
      toast({ title: `Submission ${newStatus} successfully` });
    } catch (error) {
      toast({ title: "Error updating submission", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { className: 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30' },
      approved: { className: 'bg-green-600/20 text-green-300 border-green-500/30' },
      rejected: { className: 'bg-red-600/20 text-red-300 border-red-500/30' },
      completed: { className: 'bg-blue-600/20 text-blue-300 border-blue-500/30' }
    };
    return variants[status] || variants.pending;
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* PROFESSIONAL HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Submissions Manager</h1>
            <p className="text-gray-400">Manage equipment submissions and valuations</p>
          </div>
          <div className="flex items-center gap-4">
            {selectedSubmissions.size > 0 && (
              <div className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-lg px-4 py-2">
                <span className="text-blue-300 text-sm font-medium">{selectedSubmissions.size} selected</span>
                <Button size="sm" onClick={() => toast({ title: 'Bulk actions coming soon' })}>
                  Bulk Action
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* SUBMISSION STATISTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <UnifiedStatCard
            title="Total Submissions"
            value={data?.submissions?.length || 0}
            icon={<Package className="w-6 h-6 text-white" />}
            gradient="blue"
            change={15.3}
            subtitle="All submissions"
          />
          <UnifiedStatCard
            title="Pending Review"
            value={data?.submissions?.filter((s: Submission) => s.status === 'pending').length || 0}
            icon={<Clock className="w-6 h-6 text-white" />}
            gradient="orange"
            subtitle="Awaiting review"
          />
          <UnifiedStatCard
            title="Approved"
            value={data?.submissions?.filter((s: Submission) => s.status === 'approved').length || 0}
            icon={<CheckCircle className="w-6 h-6 text-white" />}
            gradient="green"
            change={8.7}
            subtitle="Successfully approved"
          />
          <UnifiedStatCard
            title="Total Value"
            value={`$${data?.submissions?.reduce((sum: number, s: Submission) => sum + (s.asking_price || 0), 0).toFixed(2) || '0.00'}`}
            icon={<DollarSign className="w-6 h-6 text-white" />}
            gradient="purple"
            subtitle="Estimated value"
          />
        </div>

        {/* ADVANCED FILTERS */}
        <UnifiedDashboardCard 
          title="Advanced Filters" 
          icon={<Filter className="w-5 h-5 text-white" />}
          gradient="blue"
          className="mb-6"
          actions={
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-700">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by reference, brand, model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="Equipment Type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="barbells">Barbells</SelectItem>
                <SelectItem value="plates">Plates</SelectItem>
                <SelectItem value="dumbbells">Dumbbells</SelectItem>
                <SelectItem value="racks">Racks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </UnifiedDashboardCard>
      </div>

      {/* SUBMISSIONS TABLE */}
      <UnifiedDashboardCard gradient="blue">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center text-white py-8">Loading submissions...</div>
          ) : data?.submissions?.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No submissions found</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-4 text-gray-300">
                    <Checkbox />
                  </th>
                  <th className="pb-4 text-gray-300">Reference</th>
                  <th className="pb-4 text-gray-300">Equipment</th>
                  <th className="pb-4 text-gray-300">Brand/Model</th>
                  <th className="pb-4 text-gray-300">Condition</th>
                  <th className="pb-4 text-gray-300">Asking Price</th>
                  <th className="pb-4 text-gray-300">Status</th>
                  <th className="pb-4 text-gray-300">Submitted</th>
                  <th className="pb-4 text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.submissions?.map((submission: Submission) => (
                  <tr key={submission.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-4">
                      <Checkbox />
                    </td>
                    <td className="py-4">
                      <span className="text-blue-400 font-mono text-sm">
                        {submission.reference_number}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="text-white">{submission.equipment_type}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="text-white">{submission.brand}</div>
                      <div className="text-gray-400 text-sm">{submission.model}</div>
                    </td>
                    <td className="py-4 text-gray-300">{submission.condition}</td>
                    <td className="py-4 text-white font-bold">
                      {formatCurrency(submission.asking_price || 0)}
                    </td>
                    <td className="py-4">
                      <Badge className={getStatusBadge(submission.status).className}>
                        {submission.status}
                      </Badge>
                    </td>
                    <td className="py-4 text-gray-300">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        {submission.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleStatusUpdate(submission.id, 'approved')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleStatusUpdate(submission.id, 'rejected')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </UnifiedDashboardCard>
    </div>
  );
}