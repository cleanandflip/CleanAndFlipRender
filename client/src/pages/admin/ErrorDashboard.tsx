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
    const [expandedError, setExpandedError] = useState<string | null>(null);

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

    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-800/50 text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-700">
          <div className="col-span-1"></div>
          <div className="col-span-1">SEVERITY</div>
          <div className="col-span-5">ERROR MESSAGE</div>
          <div className="col-span-3">DETAILS</div>
          <div className="col-span-2">ACTIONS</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-800/50">
          {errors.map((error: ErrorLog, index) => {
            const severityInfo = severityConfig[error.severity];
            const SeverityIcon = severityInfo.icon;
            const isExpanded = expandedError === error.id;

            return (
              <div key={error.id}>
                <div className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-800/30 transition-colors group">
                  {/* Expand Toggle */}
                  <div className="col-span-1 flex items-center">
                    <button
                      onClick={() => setExpandedError(isExpanded ? null : error.id)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      <ChevronDown 
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`} 
                      />
                    </button>
                  </div>

                  {/* Severity */}
                  <div className="col-span-1 flex items-center">
                    <div className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${severityInfo.color.replace('bg-', 'bg-')}`}></div>
                      <span className="text-xs font-medium text-gray-300 hidden sm:inline">
                        {severityInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Error Message */}
                  <div className="col-span-5 flex flex-col justify-center">
                    <div className="font-medium text-gray-200 text-sm leading-tight mb-1">
                      {error.message}
                    </div>
                    <div className="text-xs text-gray-500">
                      {error.occurrence_count}x occurrences • {error.error_type}
                      {error.resolved && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-800/20 text-green-400 border border-green-700/30">
                          ✓ Resolved
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="col-span-3 flex flex-col justify-center text-xs text-gray-400">
                    <div>First: {new Date(error.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric'
                    })} {new Date(error.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric', minute: '2-digit', hour12: true
                    })}</div>
                    <div>Last: {new Date(error.last_seen).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric'
                    })} {new Date(error.last_seen).toLocaleTimeString('en-US', {
                      hour: 'numeric', minute: '2-digit', hour12: true
                    })}</div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center gap-2">
                    {error.stack_trace && (
                      <UnifiedButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedError(isExpanded ? null : error.id)}
                        className="text-xs"
                      >
                        Stack Trace
                      </UnifiedButton>
                    )}
                    {!error.resolved && (
                      <UnifiedButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleResolveError(error.id)}
                        className="text-xs"
                      >
                        Resolve
                      </UnifiedButton>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-gray-900/30">
                    <div className="ml-8 pl-4 border-l-2 border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                        {error.url && (
                          <div>
                            <div className="text-xs font-medium text-gray-300 mb-1">URL</div>
                            <div className="text-gray-400 font-mono text-xs break-all bg-gray-800/50 px-2 py-1 rounded">
                              {error.url}
                            </div>
                          </div>
                        )}
                        {error.file_path && (
                          <div>
                            <div className="text-xs font-medium text-gray-300 mb-1">File</div>
                            <div className="text-gray-400 font-mono text-xs bg-gray-800/50 px-2 py-1 rounded">
                              {error.file_path}{error.line_number && `:${error.line_number}`}
                            </div>
                          </div>
                        )}
                        {error.browser && error.browser !== 'Unknown' && (
                          <div>
                            <div className="text-xs font-medium text-gray-300 mb-1">Browser</div>
                            <div className="text-gray-400 text-xs bg-gray-800/50 px-2 py-1 rounded">
                              {error.browser}
                            </div>
                          </div>
                        )}
                        {error.user_email && (
                          <div>
                            <div className="text-xs font-medium text-gray-300 mb-1">User</div>
                            <div className="text-gray-400 text-xs bg-gray-800/50 px-2 py-1 rounded">
                              {error.user_email}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {error.stack_trace && (
                        <div>
                          <div className="text-xs font-medium text-gray-300 mb-2">Stack Trace</div>
                          <pre className="text-xs text-gray-300 bg-black/50 border border-gray-700 rounded p-3 overflow-x-auto max-h-64 overflow-y-auto font-mono">
                            {error.stack_trace}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
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

      {/* Sentry-style Tabs */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg mb-6">
        <div className="flex">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 text-sm font-medium transition-colors border-r border-gray-700 ${
              activeTab === 'all'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            All ({errors?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('unresolved')}
            className={`px-6 py-3 text-sm font-medium transition-colors border-r border-gray-700 ${
              activeTab === 'unresolved'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            Unresolved ({unresolvedCount})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'resolved'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>

        {/* Search Bar Inside Tab Container */}
        <div className="p-4 border-t border-gray-700">
          <Input
            placeholder="Search errors by message, URL, or file..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="bg-gray-800/50 border-gray-600 text-gray-200 placeholder:text-gray-400 h-10 text-sm focus:border-blue-500 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Error List Content */}
      <div className="mb-6">
        <ErrorListContent 
          errors={filteredErrors} 
          errorsLoading={errorsLoading} 
          handleResolveError={handleResolveError}
          tabType={activeTab}
        />
      </div>


      </div>
  );
}