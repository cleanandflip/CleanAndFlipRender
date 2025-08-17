import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Server, 
  Activity, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  HardDrive,
  Cpu,
  MemoryStick,
  RefreshCw,
  Shield,
  Zap
} from 'lucide-react';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    status: 'connected' | 'disconnected';
    latency: number;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    requestsPerMinute: number;
  };
  alerts: SystemAlert[];
  timestamp: string;
}

interface SystemAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface PerformanceMetrics {
  summary: any;
  metrics: any[];
  slowRoutes: Array<{
    route: string;
    method: string;
    avgDuration: number;
    count: number;
    maxDuration: number;
  }>;
}

export default function SystemDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch system health data
  const { data: systemHealth, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['/api/admin/system/health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch performance metrics
  const { data: performanceData, isLoading: perfLoading, refetch: refetchPerformance } = useQuery({
    queryKey: ['/api/admin/system/performance'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch system alerts
  const { data: alertsData, refetch: refetchAlerts } = useQuery({
    queryKey: ['/api/admin/system/alerts'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchHealth(),
        refetchPerformance(),
        refetchAlerts()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const runDiagnostics = async () => {
    try {
      const response = await fetch('/api/admin/system/diagnostics', {
        method: 'POST'
      });
      const diagnostics = await response.json();
      
      // Show diagnostics results in a modal or alert
      console.log('Diagnostics results:', diagnostics);
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch(`/api/admin/system/alerts/${alertId}/resolve`, {
        method: 'POST'
      });
      refetchAlerts();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getAlertVariant = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">System Dashboard</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runDiagnostics}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              <Shield className="w-4 h-4 mr-2" />
              Run Diagnostics
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={refreshing}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                <Server className="w-4 h-4 mr-2" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {((systemHealth as any)?.system?.status) === 'healthy' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
                <span className={`font-medium ${getStatusColor(((systemHealth as any)?.system?.status) || 'unknown')}`}>
                  {(((systemHealth as any)?.system?.status) || 'UNKNOWN').toString().toUpperCase()}
                </span>
              </div>
              {((systemHealth as any)?.system?.uptime) != null && (
                <p className="text-xs text-gray-400 mt-2">
                  Uptime: {formatUptime(Number(((systemHealth as any)?.system?.uptime) || 0))}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                <MemoryStick className="w-4 h-4 mr-2" />
                Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress 
                  value={Number(((systemHealth as any)?.system?.memory?.percentage) || 0)} 
                  className="h-2"
                />
                <p className="text-sm text-white">
                  {Number(((systemHealth as any)?.system?.memory?.used) || 0)}MB / {Number(((systemHealth as any)?.system?.memory?.total) || 0)}MB
                </p>
                <p className="text-xs text-gray-400">
                  {Number(((systemHealth as any)?.system?.memory?.percentage) || 0)}% used
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                <Database className="w-4 h-4 mr-2" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  ((systemHealth as any)?.system?.database?.status) === 'connected' 
                    ? 'bg-green-500' 
                    : 'bg-red-500'
                }`} />
                <span className="text-sm text-white">
                  {((((systemHealth as any)?.system?.database?.status) || 'UNKNOWN') as string).toUpperCase()}
                </span>
              </div>
              {((systemHealth as any)?.system?.database?.latency) != null && (
                <p className="text-xs text-gray-400 mt-2">
                  Latency: {Number(((systemHealth as any)?.system?.database?.latency) || 0)}ms
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm text-white">
                  Avg: {Number(((systemHealth as any)?.system?.performance?.avgResponseTime) || 0)}ms
                </p>
                <p className="text-sm text-white">
                  Errors: {Number(((systemHealth as any)?.system?.performance?.errorRate) || 0)}%
                </p>
                <p className="text-xs text-gray-400">
                  {Number(((systemHealth as any)?.system?.performance?.requestsPerMinute) || 0)} req/min
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts */}
        {(((alertsData as any)?.alerts) || []).length > 0 && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                Active Alerts ({alertsData.alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(((alertsData as any)?.alerts) || []).map((alert: any) => (
                  <Alert key={alert.id} variant={getAlertVariant(alert.level) as any}>
                    <AlertDescription className="flex justify-between items-center">
                      <div>
                        <Badge variant="outline" className="mr-2">
                          {alert.level.toUpperCase()}
                        </Badge>
                        {alert.message}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(alert.id)}
                        className="ml-4"
                      >
                        Resolve
                      </Button>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Metrics */}
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList className="bg-gray-800">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Slow Routes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(((performanceData as any)?.slowRoutes) || []).slice(0, 5).map((route: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 rounded bg-gray-800">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {route.method} {route.route}
                          </p>
                          <p className="text-xs text-gray-400">
                            {route.count} requests
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white">{route.avgDuration}ms avg</p>
                          <p className="text-xs text-gray-400">{route.maxDuration}ms max</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {((performanceData as any)?.summary) && Object.entries((performanceData as any).summary).map(([key, stats]: [string, any]) => (
                      <div key={key} className="p-3 rounded bg-gray-800">
                        <h4 className="text-sm font-medium text-white mb-2">{key}</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Count: </span>
                            <span className="text-white">{stats.count}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Avg: </span>
                            <span className="text-white">{Math.round(stats.avg)}ms</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Min: </span>
                            <span className="text-white">{Math.round(stats.min)}ms</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Max: </span>
                            <span className="text-white">{Math.round(stats.max)}ms</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="database">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Database Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Database monitoring features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-white">Runtime Information</h4>
                    <div className="text-xs space-y-1">
                      <p className="text-gray-400">Node.js Version: <span className="text-white">{process.version}</span></p>
                      <p className="text-gray-400">Platform: <span className="text-white">{process.platform}</span></p>
                      <p className="text-gray-400">Architecture: <span className="text-white">{process.arch}</span></p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-white">Environment</h4>
                    <div className="text-xs space-y-1">
                      <p className="text-gray-400">NODE_ENV: <span className="text-white">{process.env.NODE_ENV}</span></p>
                      <p className="text-gray-400">Port: <span className="text-white">{process.env.PORT || 5000}</span></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}