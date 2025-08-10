import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Info, AlertTriangle, Bug, ChevronDown } from 'lucide-react';
import { UnifiedButton } from '@/components/admin/UnifiedButton';
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

  const ErrorCard = ({ error }: { error: ErrorLog }) => {
    const severityInfo = severityConfig[error.severity];
    const SeverityIcon = severityInfo.icon;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${severityInfo.color} text-white`}>
                <SeverityIcon className="w-3 h-3 mr-1" />
                {severityInfo.label}
              </Badge>
              <Badge variant="outline">{error.error_type}</Badge>
              {error.resolved && <Badge variant="secondary">Resolved</Badge>}
              <span className="text-sm text-muted-foreground">
                {error.occurrence_count}x occurrences
              </span>
            </div>
            {!error.resolved && (
              <UnifiedButton
                size="sm"
                variant="outline"
                onClick={() => handleResolveError(error.id)}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Resolve
              </UnifiedButton>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium text-sm">{error.message}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
              {error.file_path && (
                <div>
                  <strong>File:</strong> {error.file_path.split('/').pop()}
                  {error.line_number && `:${error.line_number}`}
                </div>
              )}
              {error.url && <div><strong>URL:</strong> {error.url}</div>}
              {error.method && <div><strong>Method:</strong> {error.method}</div>}
              {error.user_email && <div><strong>User:</strong> {error.user_email}</div>}
              {error.browser && <div><strong>Browser:</strong> {error.browser}</div>}
              {error.os && <div><strong>OS:</strong> {error.os}</div>}
              <div><strong>First:</strong> {new Date(error.created_at).toLocaleString()}</div>
              <div><strong>Last:</strong> {new Date(error.last_seen).toLocaleString()}</div>
            </div>

            {error.stack_trace && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">Stack Trace</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto whitespace-pre-wrap">
                  {error.stack_trace}
                </pre>
              </details>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search errors..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <UnifiedButton variant="outline" size="sm">
                    {filters.severity === 'all' ? 'All Severities' : 
                     filters.severity === 'critical' ? 'Critical' :
                     filters.severity === 'high' ? 'High' :
                     filters.severity === 'medium' ? 'Medium' : 'Low'}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </UnifiedButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, severity: 'all' }))}>
                    All Severities
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, severity: 'critical' }))}>
                    Critical
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, severity: 'high' }))}>
                    High
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, severity: 'medium' }))}>
                    Medium
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, severity: 'low' }))}>
                    Low
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <UnifiedButton variant="outline" size="sm">
                    {filters.resolved === 'all' ? 'All' :
                     filters.resolved === 'false' ? 'Unresolved' : 'Resolved'}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </UnifiedButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, resolved: 'all' }))}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, resolved: 'false' }))}>
                    Unresolved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, resolved: 'true' }))}>
                    Resolved
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <UnifiedButton variant="outline" size="sm">
                    {filters.timeRange === '24h' ? 'Last 24h' :
                     filters.timeRange === '7d' ? 'Last 7 days' : 'Last 30 days'}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </UnifiedButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, timeRange: '24h' }))}>
                    Last 24h
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, timeRange: '7d' }))}>
                    Last 7 days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, timeRange: '30d' }))}>
                    Last 30 days
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Error List */}
        <div>
          {errorsLoading ? (
            <div className="text-center py-8">Loading errors...</div>
          ) : errors && errors.length > 0 ? (
            <div className="space-y-4">
              {errors.map((error: ErrorLog) => (
                <ErrorCard key={error.id} error={error} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium">No Errors Found</h3>
                <p className="text-muted-foreground">
                  No errors match your current filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
  );
}