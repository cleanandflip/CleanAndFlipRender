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
import { CodebaseScanner } from '@/components/admin/CodebaseScanner';
import { CodebaseDoctor } from '@/components/admin/CodebaseDoctor';
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

interface SentryStyleErrorGroup {
  fingerprint: string;
  title: string;
  level: 'critical' | 'error' | 'warning' | 'info';
  occurrenceCount: number;
  usersAffected: number;
  firstSeen: string;
  lastSeen: string;
  occurrenceTrend: number[];
  status: 'unresolved' | 'resolved' | 'ignored';
  lastErrorInstance: {
    user?: { email?: string; ip?: string };
    browser?: string;
    os?: string;
    url?: string;
    stack_trace?: string;
  };
}

interface ErrorTrend {
  hour: string;
  count: number;
  severity: string;
}

const severityConfig = {
  critical: { color: 'bg-red-500', textColor: 'text-red-400', bgColor: 'bg-red-500/20', icon: AlertCircle, label: 'CRITICAL' },
  high: { color: 'bg-orange-500', textColor: 'text-orange-400', bgColor: 'bg-orange-500/20', icon: AlertTriangle, label: 'ERROR' },
  medium: { color: 'bg-yellow-500', textColor: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: Bug, label: 'WARNING' },
  low: { color: 'bg-blue-500', textColor: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: Info, label: 'INFO' }
};

// Simple Sparkline Component
const Sparkline = ({ data, color = '#ef4444' }: { data: number[]; color?: string }) => {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data, 1);
  const points = data.map((value, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * 100,
    y: 100 - (value / max) * 100
  }));
  
  const path = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        opacity="0.8"
      />
    </svg>
  );
};

export default function ErrorDashboard() {
  const [filters, setFilters] = useState({
    level: 'all',
    status: 'unresolved',
    timeRange: '24h',
    search: ''
  });
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const { data: errors, isLoading: errorsLoading, refetch: refetchErrors } = useQuery({
    queryKey: ['/api/admin/errors', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== 'all' && value !== '') params.append(key, value);
      });
      try {
        const response = await fetch(`/api/admin/errors?${params}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch errors:', error);
        throw error;
      }
    }
  });

  const { data: trends } = useQuery({
    queryKey: ['/api/admin/errors/trends', filters.timeRange],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/admin/errors/trends?timeRange=${filters.timeRange}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch error trends:', error);
        throw error;
      }
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/errors/stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/errors/stats');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch error stats:', error);
        throw error;
      }
    }
  });

  const handleResolveError = async (fingerprint: string) => {
    try {
      // Find all errors matching this fingerprint
      const errorsToResolve = errors?.filter((error: any) => 
        `${error.message}-${error.error_type}` === fingerprint
      );
      
      if (!errorsToResolve || errorsToResolve.length === 0) {
        console.error('No errors found for fingerprint:', fingerprint);
        return;
      }

      // Resolve each error in the group
      const resolvePromises = errorsToResolve.map((error: any) => 
        fetch(`/api/admin/errors/${error.id}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: 'Resolved via Sentry-style dashboard' })
        })
      );

      const responses = await Promise.all(resolvePromises);
      
      // Check if all requests succeeded
      const allSucceeded = responses.every(response => response.ok);
      
      if (!allSucceeded) {
        throw new Error('Failed to resolve some errors in the group');
      }

      // Refetch errors to update the list
      refetchErrors();
    } catch (error: any) {
      console.error('Failed to resolve error group:', error);
    }
  };

  // Convert regular errors to Sentry-style grouped errors
  const convertToSentryStyle = (errors: ErrorLog[]): SentryStyleErrorGroup[] => {
    if (!errors) return [];
    
    // Group errors by fingerprint (message + error_type)
    const grouped = errors.reduce((acc, error) => {
      const fingerprint = `${error.message}-${error.error_type}`;
      if (!acc[fingerprint]) {
        acc[fingerprint] = {
          fingerprint,
          title: error.message,
          level: error.severity === 'high' ? 'error' : 
                 error.severity === 'critical' ? 'critical' :
                 error.severity === 'medium' ? 'warning' : 'info',
          occurrenceCount: 0,
          usersAffected: 0,
          firstSeen: error.created_at,
          lastSeen: error.last_seen,
          occurrenceTrend: Array.from({length: 24}, () => Math.floor(Math.random() * 5)), // Mock trend data
          status: error.resolved ? 'resolved' : 'unresolved',
          lastErrorInstance: {
            user: error.user_email ? { email: error.user_email } : undefined,
            browser: error.browser,
            os: error.os,
            url: error.url,
            stack_trace: error.stack_trace
          }
        };
      }
      acc[fingerprint].occurrenceCount += error.occurrence_count;
      acc[fingerprint].usersAffected += 1;
      return acc;
    }, {} as Record<string, SentryStyleErrorGroup>);
    
    return Object.values(grouped);
  };

  const ErrorGroupCard = ({ errorGroup, onResolve }: {
    errorGroup: SentryStyleErrorGroup;
    onResolve: (fingerprint: string) => void;
  }) => {
    const isExpanded = expandedError === errorGroup.fingerprint;
    const severityInfo = severityConfig[errorGroup.level === 'error' ? 'high' : 
                                           errorGroup.level === 'critical' ? 'critical' :
                                           errorGroup.level === 'warning' ? 'medium' : 'low'];

    return (
      <div className="bg-[#1e293b]/50 border border-gray-800 rounded-xl backdrop-blur hover:border-gray-700/50 transition-all duration-200">
        {/* Header Row */}
        <div className="p-4 flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center space-x-4 flex-1">
            {/* Severity Badge */}
            <span className={`px-2 py-1 rounded text-xs font-medium ${severityInfo.bgColor} ${severityInfo.textColor}`}>
              {severityInfo.label}
            </span>
            
            {/* Error Title */}
            <div className="flex-1">
              <h3 className="text-gray-200 font-medium text-sm">
                {errorGroup.title}
              </h3>
              <p className="text-gray-400 text-xs mt-1">
                {errorGroup.title.substring(0, 100)}...
              </p>
            </div>
          </div>
          
          {/* Middle - Stats */}
          <div className="flex items-center space-x-6 px-4">
            {/* Occurrence Count */}
            <div className="text-center">
              <div className="text-gray-200 font-semibold">{errorGroup.occurrenceCount}</div>
              <div className="text-gray-500 text-xs">EVENTS</div>
            </div>
            
            {/* Users Affected */}
            <div className="text-center">
              <div className="text-gray-200 font-semibold">{errorGroup.usersAffected}</div>
              <div className="text-gray-500 text-xs">USERS</div>
            </div>
            
            {/* Trend Sparkline */}
            <div className="w-20 h-8">
              <Sparkline data={errorGroup.occurrenceTrend} color="#ef4444" />
            </div>
          </div>
          
          {/* Right Side - Time & Actions */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-gray-400 text-xs">
                First: {new Date(errorGroup.firstSeen).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric'
                })}
              </div>
              <div className="text-gray-400 text-xs">
                Last: {new Date(errorGroup.lastSeen).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric'
                })}
              </div>
            </div>
            
            {/* Expand Toggle */}
            <button
              onClick={() => setExpandedError(isExpanded ? null : errorGroup.fingerprint)}
              className="p-2 hover:bg-gray-800/50 rounded transition-colors"
            >
              <ChevronDown 
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {/* Action Dropdown */}
            {errorGroup.status === 'unresolved' && (
              <UnifiedButton
                variant="primary"
                size="sm"
                onClick={() => onResolve(errorGroup.fingerprint)}
                className="text-xs"
              >
                Resolve
              </UnifiedButton>
            )}
          </div>
        </div>
        
        {/* Expandable Details */}
        {isExpanded && (
          <div className="border-t border-gray-800 p-4 bg-[#1e293b]/70">
            {/* Stack Trace */}
            {errorGroup.lastErrorInstance.stack_trace && (
              <div className="mb-4">
                <h4 className="text-gray-400 text-xs uppercase mb-2">Stack Trace</h4>
                <pre className="bg-black/80 rounded p-3 text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto font-mono border border-gray-800">
                  {errorGroup.lastErrorInstance.stack_trace}
                </pre>
              </div>
            )}
            
            {/* Context Tags */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <span className="text-gray-500 text-xs">Browser</span>
                <p className="text-gray-200 text-sm">{errorGroup.lastErrorInstance.browser || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">OS</span>
                <p className="text-gray-200 text-sm">{errorGroup.lastErrorInstance.os || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">User</span>
                <p className="text-gray-200 text-sm">{errorGroup.lastErrorInstance.user?.email || 'Anonymous'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">URL</span>
                <p className="text-gray-200 text-sm truncate">{errorGroup.lastErrorInstance.url || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Convert and filter errors
  const sentryErrorGroups = convertToSentryStyle(errors || []);
  
  const filteredErrorGroups = sentryErrorGroups.filter((group) => {
    // Filter by status
    if (filters.status !== 'all' && group.status !== filters.status) return false;
    
    // Filter by level
    if (filters.level !== 'all' && group.level !== filters.level) return false;
    
    // Filter by search
    if (filters.search && !group.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    
    return true;
  });

  const unresolvedCount = sentryErrorGroups.filter(g => g.status === 'unresolved').length;
  const resolvedCount = sentryErrorGroups.filter(g => g.status === 'resolved').length;
  const criticalCount = sentryErrorGroups.filter(g => g.level === 'critical').length;
  const totalCount = sentryErrorGroups.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Error Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and resolve application errors in real-time
        </p>
      </div>

      {/* Codebase Scanner */}
      <CodebaseScanner />

      {/* Sentry-style Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
          <div className="text-xs text-gray-400">Critical Errors</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-orange-400">{totalCount}</div>
          <div className="text-xs text-gray-400">Total Errors (24h)</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-yellow-400">{sentryErrorGroups.reduce((acc, g) => acc + g.usersAffected, 0)}</div>
          <div className="text-xs text-gray-400">Affected Users</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-green-400">{totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}%</div>
          <div className="text-xs text-gray-400">Resolution Rate</div>
        </div>
      </div>

      {/* Sentry-style Filters */}
      <div className="flex items-center space-x-4 mb-6">
        {/* Search */}
        <Input
          type="text"
          placeholder="Search errors..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder:text-gray-400"
        />
        
        {/* Level Filter */}
        <select 
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          value={filters.level}
          onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
        >
          <option value="all">All Levels</option>
          <option value="critical">Critical</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        
        {/* Status Filter */}
        <select 
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
        >
          <option value="unresolved">Unresolved</option>
          <option value="resolved">Resolved</option>
          <option value="all">All Status</option>
        </select>
        
        {/* Time Filter */}
        <select 
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          value={filters.timeRange}
          onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Sentry-style Error Groups */}
      <div className="space-y-4">
        {errorsLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading errors...</div>
          </div>
        ) : filteredErrorGroups.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              {filters.status === 'unresolved' ? 'No unresolved errors - Great job!' : 'No errors found'}
            </h3>
            <p className="text-gray-400">
              {filters.status === 'unresolved' ? 'All errors have been resolved' : 'No errors match your current filters'}
            </p>
          </div>
        ) : (
          filteredErrorGroups.map((errorGroup) => (
            <ErrorGroupCard
              key={errorGroup.fingerprint}
              errorGroup={errorGroup}
              onResolve={handleResolveError}
            />
          ))
        )}
      </div>

      {/* Enhanced Codebase Doctor Tab */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Advanced Codebase Analysis
        </h3>
        <CodebaseDoctor />
      </div>

      </div>
  );
}