import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Info, AlertTriangle, Bug, ChevronDown } from 'lucide-react';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { UnifiedDataTable } from '@/components/admin/UnifiedDataTable';
import { UnifiedButton } from '@/components/admin/UnifiedButton';
interface ErrorLog {
  id: string;
  error_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  stack_trace?: string;
  file_path?: string;
  line_number?: number;
  user_email?: string;
  url?: string;
  method?: string;
  browser?: string;
  os?: string;
  resolved: boolean;
  occurrence_count: number;
  created_at: string;
  last_seen: string;
}

interface ErrorTrend {
  hour: string;
  count: number;
  severity: string;
}

const severityConfig = {
  critical: { color: 'bg-red-500', icon: AlertCircle, label: 'Critical' },
  high: { color: 'bg-orange-500', icon: AlertTriangle, label: 'High' },
  medium: { color: 'bg-yellow-500', icon: Bug, label: 'Medium' },
  low: { color: 'bg-blue-500', icon: Info, label: 'Low' }
};

export default function ErrorDashboard() {
  const [filters, setFilters] = useState({
    severity: 'all',
    resolved: 'all',
    timeRange: '24h',
    search: ''
  });
  const [activeTab, setActiveTab] = useState('all');

  const { data: errors, isLoading: errorsLoading, refetch: refetchErrors } = useQuery({
    queryKey: ['/api/admin/errors', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== 'all' && value !== '') params.append(key, value);
      });
      const response = await fetch(`/api/admin/errors?${params}`);
      if (!response.ok) throw new Error('Failed to fetch errors');
      return response.json();
    }
  });

  const { data: trends } = useQuery({
    queryKey: ['/api/admin/errors/trends', filters.timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/errors/trends?timeRange=${filters.timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch error trends');
      return response.json();
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/errors/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/errors/stats');
      if (!response.ok) throw new Error('Failed to fetch error stats');
      return response.json();
    }
  });

  const handleResolveError = async (errorId: string) => {
    try {
      await fetch(`/api/admin/errors/${errorId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Resolved via dashboard' })
      });
      refetchErrors();
    } catch (error) {
      console.error('Failed to resolve error:', error);
    }
  };

  const ErrorListContent = ({ errors, errorsLoading, handleResolveError, tabType }: {
    errors: ErrorLog[];
    errorsLoading: boolean;
    handleResolveError: (id: string) => void;
    tabType: string;
  }) => {
    if (errorsLoading) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400">Loading errors...</div>
        </div>
      );
    }

    if (!errors || errors.length === 0) {
      const emptyMessage = {
        all: "No errors found",
        unresolved: "No unresolved errors - Great job!",
        resolved: "No resolved errors yet"
      };

      return (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">{emptyMessage[tabType as keyof typeof emptyMessage]}</h3>
          <p className="text-gray-400">
            {tabType === 'unresolved' ? 'All errors have been resolved' : 'No errors match your current filters'}
          </p>
        </div>
      );
    }

    const columns = [
      {
        key: 'severity',
        label: 'Severity',
        render: (error: ErrorLog) => {
          const severityInfo = severityConfig[error.severity];
          const SeverityIcon = severityInfo.icon;
          return (
            <div className="flex items-center gap-2">
              <Badge className={`${severityInfo.color} text-white text-xs px-2 py-1`}>
                <SeverityIcon className="w-3 h-3 mr-1" />
                {severityInfo.label}
              </Badge>
              {error.resolved && (
                <Badge className="bg-green-700 text-green-100 text-xs px-2 py-1">
                  ✓ Resolved
                </Badge>
              )}
            </div>
          );
        }
      },
      {
        key: 'message',
        label: 'Error Message',
        render: (error: ErrorLog) => (
          <div>
            <div className="font-medium text-gray-200 text-sm mb-1">{error.message}</div>
            <div className="text-xs text-gray-400">
              {error.occurrence_count}x occurrences
              {error.url && (
                <> • {error.url.replace(/^https?:\/\/[^\/]+/, '')}</>
              )}
            </div>
          </div>
        )
      },
      {
        key: 'details',
        label: 'Details',
        render: (error: ErrorLog) => (
          <div className="text-xs text-gray-400">
            <div>First: {new Date(error.created_at).toLocaleString('en-US', {
              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
            })}</div>
            <div>Last: {new Date(error.last_seen).toLocaleString('en-US', {
              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
            })}</div>
            {error.file_path && (
              <div>File: {error.file_path.split('/').pop()}{error.line_number && `:${error.line_number}`}</div>
            )}
          </div>
        )
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (error: ErrorLog) => (
          <div className="flex items-center gap-2">
            {error.stack_trace && (
              <details className="group">
                <summary className="cursor-pointer text-xs text-blue-400 hover:text-blue-300 select-none">
                  Stack Trace
                </summary>
                <div className="absolute z-10 mt-2 w-96 bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
                  <pre className="text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                    {error.stack_trace}
                  </pre>
                </div>
              </details>
            )}
            {!error.resolved && (
              <UnifiedButton
                variant="primary"
                size="sm"
                onClick={() => handleResolveError(error.id)}
              >
                Resolve
              </UnifiedButton>
            )}
          </div>
        )
      }
    ];

    return (
      <UnifiedDataTable
        data={errors}
        columns={columns}
        loading={errorsLoading}
      />
    );
  };

  // Filter errors based on active tab
  const filteredErrors = errors?.filter((error: ErrorLog) => {
    if (activeTab === 'unresolved') return !error.resolved;
    if (activeTab === 'resolved') return error.resolved;
    return true; // 'all' tab shows everything
  }) || [];

  const unresolvedCount = errors?.filter((error: ErrorLog) => !error.resolved).length || 0;
  const resolvedCount = errors?.filter((error: ErrorLog) => error.resolved).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Error Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and resolve application errors in real-time
        </p>
      </div>

      {/* Unified Metric Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <UnifiedMetricCard
            title="Total Errors"
            value={stats.total}
            subtitle={`${stats.resolved} resolved`}
            icon={AlertTriangle}
          />
          <UnifiedMetricCard
            title="Critical Issues"
            value={stats.critical}
            subtitle="Immediate attention required"
            icon={AlertCircle}
            trend="critical"
          />
          <UnifiedMetricCard
            title="Resolution Rate"
            value={`${stats.errorRate}%`}
            subtitle="Last 24 hours"
            icon={CheckCircle}
            trend="positive"
          />
          <UnifiedMetricCard
            title="Affected Users"
            value={stats.affectedUsers}
            subtitle="Users experiencing errors"
            icon={Info}
          />
        </div>
      )}

        {/* Error Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-700">
              All ({errors?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="unresolved" className="data-[state=active]:bg-red-800">
              Unresolved ({unresolvedCount})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="data-[state=active]:bg-green-800">
              Resolved ({resolvedCount})
            </TabsTrigger>
          </TabsList>

          {/* Unified Search Bar */}
          <div className="mb-6">
            <Input
              placeholder="Search errors by message, URL, or file..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="bg-gray-800/50 border-gray-700 text-gray-200 placeholder:text-gray-400 h-11 text-sm focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>

          {/* Error List Content */}
          <TabsContent value="all" className="mt-4">
            <ErrorListContent 
              errors={filteredErrors} 
              errorsLoading={errorsLoading} 
              handleResolveError={handleResolveError}
              tabType="all"
            />
          </TabsContent>
          
          <TabsContent value="unresolved" className="mt-4">
            <ErrorListContent 
              errors={filteredErrors} 
              errorsLoading={errorsLoading} 
              handleResolveError={handleResolveError}
              tabType="unresolved"
            />
          </TabsContent>
          
          <TabsContent value="resolved" className="mt-4">
            <ErrorListContent 
              errors={filteredErrors} 
              errorsLoading={errorsLoading} 
              handleResolveError={handleResolveError}
              tabType="resolved"
            />
          </TabsContent>
        </Tabs>
      </div>
  );
}