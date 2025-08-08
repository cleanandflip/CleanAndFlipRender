// UNIFIED SUBMISSIONS TAB
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, Clock, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { UnifiedDataTable } from '@/components/admin/UnifiedDataTable';

interface Submission {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: string;
  category: string;
  estimatedValue: number;
}

export function SubmissionsTab() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: submissionsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-submissions', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: 'all',
        search: searchQuery,
        sortBy: 'date',
        sortOrder: 'desc',
        page: '1',
        limit: '20'
      });
      const res = await fetch(`/api/admin/submissions?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch submissions');
      return res.json();
    }
  });

  const submissions: Submission[] = submissionsData?.submissions || [];

  const columns = [
    {
      key: 'title',
      label: 'Submission',
      render: (submission: Submission) => (
        <div>
          <p className="font-medium text-white">{submission.title}</p>
          <p className="text-sm text-gray-500 line-clamp-2">{submission.description}</p>
        </div>
      )
    },
    {
      key: 'submittedBy',
      label: 'Submitted By',
      render: (submission: Submission) => (
        <span className="text-gray-300">{submission.submittedBy}</span>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (submission: Submission) => (
        <span className="text-blue-400">{submission.category}</span>
      )
    },
    {
      key: 'estimatedValue',
      label: 'Est. Value',
      render: (submission: Submission) => (
        <span className="font-medium text-green-400">${submission.estimatedValue}</span>
      ),
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      render: (submission: Submission) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit",
          submission.status === 'approved' ? "bg-green-500/20 text-green-400" :
          submission.status === 'rejected' ? "bg-red-500/20 text-red-400" :
          "bg-yellow-500/20 text-yellow-400"
        )}>
          {submission.status === 'approved' && <CheckCircle className="w-3 h-3" />}
          {submission.status === 'rejected' && <XCircle className="w-3 h-3" />}
          {submission.status === 'pending' && <Clock className="w-3 h-3" />}
          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
        </span>
      )
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
      render: (submission: Submission) => (
        <span className="text-gray-400">
          {new Date(submission.submittedAt).toLocaleDateString()}
        </span>
      ),
      sortable: true
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <UnifiedMetricCard
          title="Total Submissions"
          value={submissions.length}
          icon={FolderOpen}
          change={{ value: 15, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Pending Review"
          value={submissions.filter(s => s.status === 'pending').length}
          icon={Clock}
          change={{ value: -5, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Approved"
          value={submissions.filter(s => s.status === 'approved').length}
          icon={CheckCircle}
          change={{ value: 12, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Est. Total Value"
          value={`$${submissions.reduce((sum, s) => sum + s.estimatedValue, 0).toLocaleString()}`}
          icon={FolderOpen}
          change={{ value: 8, label: 'from last month' }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Equipment Submissions</h2>
          <p className="text-gray-400 mt-1">Review and manage user equipment submissions</p>
        </div>
      </div>

      {/* Table */}
      <UnifiedDataTable
        data={submissions}
        columns={columns}
        searchPlaceholder="Search submissions by title or submitter..."
        onSearch={setSearchQuery}
        onRefresh={refetch}
        onExport={() => console.log('Export submissions')}
        loading={isLoading}
        actions={{
          onView: (submission) => console.log('View submission:', submission),
          onEdit: (submission) => console.log('Review submission:', submission),
          onDelete: (submission) => console.log('Delete submission:', submission)
        }}
        pagination={{
          currentPage: 1,
          totalPages: Math.ceil(submissions.length / 20) || 1,
          onPageChange: (page) => console.log('Page:', page)
        }}
      />
    </div>
  );
}