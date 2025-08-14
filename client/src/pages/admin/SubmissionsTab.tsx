// UNIFIED SUBMISSIONS TAB
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, Clock, CheckCircle, XCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { UnifiedDataTable } from '@/components/admin/UnifiedDataTable';
import { UnifiedButton } from '@/components/admin/UnifiedButton';
import { useToast } from '@/hooks/use-toast';
import { EnhancedSubmissionModal } from '@/components/admin/modals/EnhancedSubmissionModal';
import { useWebSocketState } from "@/hooks/useWebSocketState";


interface Submission {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submitterName: string;
  submittedAt: string;
  category: string;
  estimatedValue: number;
}

export function SubmissionsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const { toast } = useToast();
  const ready = useWebSocketState();

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

  // Action handlers
  const handleView = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowSubmissionModal(true);
  };

  const handleEdit = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowSubmissionModal(true);
  };

  const handleEditOriginal = (submission: Submission) => {
    console.log('Review:', submission);
    toast({
      title: "Review Submission",
      description: `Opening review form for "${submission.title}"`,
    });
  };

  const handleDelete = async (submission: Submission) => {
    if (!confirm(`Are you sure you want to delete submission "${submission.title}"? This action cannot be undone.`)) return;
    
    try {
      const res = await fetch(`/api/admin/submissions/${submission.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        refetch();
        toast({
          title: "Submission Deleted",
          description: `"${submission.title}" submission has been permanently deleted`,
        });
      } else {
        throw new Error('Failed to delete submission');
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete submission. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportSubmissions = async () => {
    try {
      const csvHeaders = 'Title,Submitter,Category,Estimated Value,Status,Submitted Date\n';
      const csvData = submissions.map((s: Submission) => 
        `"${s.title}","${s.submittedBy}","${s.category}","$${s.estimatedValue.toFixed(2)}","${s.status}","${new Date(s.submittedAt).toLocaleDateString()}"`
      ).join('\n');
      
      const fullCsv = csvHeaders + csvData;
      const blob = new Blob([fullCsv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submissions-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: `Exported ${submissions.length} submissions to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export submissions data",
        variant: "destructive",
      });
    }
  };

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
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">Equipment Submissions</h2>
            <div className="flex items-center gap-2">
              {ready ? (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
                  <Wifi className="w-3 h-3 text-green-400 animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">Live Sync</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full">
                  <WifiOff className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-red-400 font-medium">Offline</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-400 mt-1">Review and manage user equipment submissions</p>
        </div>
        <div className="flex gap-3">
          <UnifiedButton
            variant="secondary"
            icon={RefreshCw}
            onClick={() => {
              refetch();
              toast({
                title: "Data Refreshed",
                description: "Submissions data has been updated",
              });
            }}
          >
            Refresh
          </UnifiedButton>
          <UnifiedButton
            variant="secondary"
            onClick={() => {
              // Export submissions data
              const csvHeaders = 'Submitter,Title,Category,Est. Value,Status,Submitted Date\n';
              const csvData = submissions.map((s: Submission) => 
                `"${s.submitterName}","${s.title}","${s.category}","$${s.estimatedValue}","${s.status}","${new Date(s.submittedAt).toLocaleDateString()}"`
              ).join('\n');
              
              const fullCsv = csvHeaders + csvData;
              const blob = new Blob([fullCsv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `submissions-export-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
              
              toast({
                title: "Export Complete",
                description: `Exported ${submissions.length} submissions to CSV`,
              });
            }}
          >
            Export Data
          </UnifiedButton>
        </div>
      </div>

      {/* Table */}
      <UnifiedDataTable
        data={submissions}
        columns={columns}
        searchPlaceholder="Search submissions by title or submitter..."
        onSearch={setSearchQuery}
        onRefresh={refetch}
        onExport={handleExportSubmissions}
        loading={isLoading}
        actions={{
          onView: handleView,
          onEdit: handleEdit,
          onDelete: handleDelete
        }}
        pagination={{
          currentPage: 1,
          totalPages: Math.ceil(submissions.length / 20) || 1,
          onPageChange: (page) => console.log('Page:', page)
        }}
      />

      {/* Modal */}
      {showSubmissionModal && (
        <EnhancedSubmissionModal 
          submission={selectedSubmission}
          onClose={() => {
            setShowSubmissionModal(false);
            setSelectedSubmission(null);
          }} 
          onSave={refetch}
        />
      )}
    </div>
  );
}