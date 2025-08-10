import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Info, AlertTriangle, Bug, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-200">{emptyMessage[tabType as keyof typeof emptyMessage]}</h3>
            <p className="text-gray-400">
              {tabType === 'unresolved' ? 'All errors have been resolved' : 'No errors match your current filters'}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {errors.map((error: ErrorLog) => (
          <ErrorCard key={error.id} error={error} />
        ))}
      </div>
    );
  };

  const ErrorCard = ({ error }: { error: ErrorLog }) => {
    const severityInfo = severityConfig[error.severity];
    const SeverityIcon = severityInfo.icon;

    return (
      <Card className="mb-3 bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
        <CardContent className="p-4">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-3">
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
              <span className="text-xs text-gray-500">
                {error.occurrence_count}x
              </span>
            </div>
            {!error.resolved && (
              <Button
                size="sm"
                onClick={() => handleResolveError(error.id)}
                className="h-7 text-xs bg-green-700 hover:bg-green-600 text-white border-0"
              >
                Mark Resolved
              </Button>
            )}
          </div>

          {/* Error Message */}
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-100 leading-tight">
              {error.message}
            </h3>
          </div>

          {/* Compact Info Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400 mb-3">
            {error.url && (
              <div className="truncate">
                <span className="text-gray-500">URL:</span> {error.url.replace(/^https?:\/\/[^\/]+/, '')}
              </div>
            )}
            <div>
              <span className="text-gray-500">First:</span> {new Date(error.created_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
            {error.file_path && (
              <div className="truncate">
                <span className="text-gray-500">File:</span> {error.file_path.split('/').pop()}{error.line_number && `:${error.line_number}`}
              </div>
            )}
            <div>
              <span className="text-gray-500">Last:</span> {new Date(error.last_seen).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric', 
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          </div>

          {/* Stack Trace Toggle */}
          {error.stack_trace && (
            <details className="group">
              <summary className="cursor-pointer text-xs text-blue-400 hover:text-blue-300 select-none">
                <span className="group-open:rotate-90 inline-block transform transition-transform">▶</span>
                Stack Trace
              </summary>
              <pre className="mt-2 p-2 bg-black rounded text-xs overflow-x-auto text-gray-300 border border-gray-800 max-h-48 overflow-y-auto">
                {error.stack_trace}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
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

        {/* Error Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.resolved} resolved
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Critical Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                <p className="text-xs text-muted-foreground">
                  Requires immediate attention
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.errorRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Affected Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.affectedUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Unique users with errors
                </p>
              </CardContent>
            </Card>
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

          {/* Simple Search Bar */}
          <div className="mb-4">
            <Input
              placeholder="Search errors by message, URL, or file..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-gray-200 placeholder:text-gray-400 h-10"
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