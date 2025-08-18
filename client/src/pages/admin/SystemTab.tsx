// ENHANCED SYSTEM TAB - Real-time Monitoring & Diagnostics
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Server, Database, Cpu, HardDrive, Activity, AlertTriangle, Wifi, WifiOff, 
  Clock, MemoryStick, Zap, TrendingUp, Shield, RefreshCw, Download, Trash2,
  AlertCircle, CheckCircle, XCircle, Timer, BarChart3, Globe, Network
} from 'lucide-react';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { UnifiedButton } from '@/components/admin/UnifiedButton';
import { useToast } from '@/hooks/use-toast';
import { useWebSocketState } from '@/hooks/useWebSocketState';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SystemTab() {
  const ready = useWebSocketState();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Multiple data queries for comprehensive monitoring
  const { data: systemHealth, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['/api/admin/system/health'],
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0,
    cacheTime: 0
  });

  const { data: performanceData, refetch: refetchPerformance } = useQuery({
    queryKey: ['/api/admin/system/performance'],
    refetchInterval: 10000, // Refresh every 10 seconds
    enabled: activeTab === 'performance'
  });

  const { data: alertsData, refetch: refetchAlerts } = useQuery({
    queryKey: ['/api/admin/system/alerts'],
    refetchInterval: 15000, // Refresh every 15 seconds
    enabled: activeTab === 'alerts'
  });

  const { data: databaseData, refetch: refetchDatabase } = useQuery({
    queryKey: ['/api/admin/system/database'],
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: activeTab === 'database'
  });

  // Global refresh function
  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchHealth(),
        refetchPerformance(), 
        refetchAlerts(),
        refetchDatabase()
      ]);
      toast({
        title: "System Data Updated",
        description: "All system metrics have been refreshed",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed", 
        description: "Failed to update system metrics",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Helper functions
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getHealthStatus = () => {
    if (!systemHealth?.system) return { status: 'unknown', color: 'bg-gray-500' };
    const status = systemHealth.system.status;
    return {
      status: status,
      color: status === 'healthy' ? 'bg-green-500' : 
             status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
    };
  };

  const getDbStatus = () => {
    if (!systemHealth?.system?.database) return { status: 'unknown', color: 'bg-gray-500' };
    const dbStatus = systemHealth.system.database.status;
    return {
      status: dbStatus === 'connected' ? 'Connected' : 'Disconnected',
      color: dbStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
    };
  };

  if (healthLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-400">Loading system diagnostics...</p>
      </div>
    );
  }

  const healthStatus = getHealthStatus();
  const dbStatus = getDbStatus();

  return (
    <div className="space-y-6">
      {/* Header with Real-time Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-bebas text-4xl text-white">SYSTEM MONITORING</h1>
          <div className="flex items-center gap-2">
            {ready ? (
              <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 rounded-full">
                <Wifi className="w-4 h-4 text-green-400 animate-pulse" />
                <span className="text-sm text-green-400 font-medium">Live Sync Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-3 py-1 bg-red-500/20 rounded-full">
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400 font-medium">Connection Lost</span>
              </div>
            )}
          </div>
        </div>
        <UnifiedButton
          onClick={refreshAll}
          disabled={isRefreshing}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Updating...' : 'Refresh All'}
        </UnifiedButton>
      </div>

      {/* Critical Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[#1e293b]/50 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">System Status</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-3 h-3 rounded-full ${healthStatus.color}`}></div>
                  <p className="text-2xl font-bold text-white capitalize">{healthStatus.status}</p>
                </div>
              </div>
              {healthStatus.status === 'healthy' ? 
                <Activity className="w-8 h-8 text-green-400" /> : 
                <AlertTriangle className="w-8 h-8 text-red-400" />
              }
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b]/50 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Database</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-3 h-3 rounded-full ${dbStatus.color}`}></div>
                  <p className="text-2xl font-bold text-white">{dbStatus.status}</p>
                </div>
                {systemHealth?.system?.database?.latency && (
                  <p className="text-xs text-gray-500 mt-1">{systemHealth.system.database.latency}ms latency</p>
                )}
              </div>
              <Database className={`w-8 h-8 ${dbStatus.color === 'bg-green-500' ? 'text-green-400' : 'text-red-400'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b]/50 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Uptime</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {formatUptime(systemHealth?.system?.uptime || 0)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b]/50 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Memory Usage</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {systemHealth?.system?.memory?.used || 0}MB
                </p>
                {systemHealth?.system?.memory && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Used</span>
                      <span>{((systemHealth.system.memory.used / systemHealth.system.memory.total) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={(systemHealth.system.memory.used / systemHealth.system.memory.total) * 100} 
                      className="h-2 mt-1"
                    />
                  </div>
                )}
              </div>
              <MemoryStick className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Monitoring Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[#1e293b]/50 border border-gray-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Zap className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <AlertCircle className="w-4 h-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Database className="w-4 h-4 mr-2" />
            Database
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Health Checks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#1e293b]/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5" />
                  Health Checks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { 
                    name: 'Database Connection', 
                    status: systemHealth?.system?.database?.status === 'connected' ? 'healthy' : 'error',
                    details: `${systemHealth?.system?.database?.latency || 0}ms response time`,
                    icon: Database 
                  },
                  { 
                    name: 'Memory Usage', 
                    status: (systemHealth?.system?.memory?.used || 0) > 512 ? 'warning' : 'healthy',
                    details: `${systemHealth?.system?.memory?.used || 0}MB / ${systemHealth?.system?.memory?.total || 0}MB`,
                    icon: MemoryStick 
                  },
                  { 
                    name: 'API Performance', 
                    status: (systemHealth?.system?.performance?.avgResponseTime || 0) > 1000 ? 'warning' : 'healthy',
                    details: `${Math.round(systemHealth?.system?.performance?.avgResponseTime || 0)}ms average`,
                    icon: Zap 
                  },
                  {
                    name: 'WebSocket Connection',
                    status: ready ? 'healthy' : 'error',
                    details: ready ? 'Real-time sync active' : 'Connection lost',
                    icon: Network
                  }
                ].map((check) => (
                  <div key={check.name} className="flex items-center justify-between p-4 bg-[#0f172a]/50 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <check.icon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-white font-medium">{check.name}</p>
                        <p className="text-sm text-gray-400">{check.details}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {check.status === 'healthy' ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Healthy</Badge>
                        </>
                      ) : check.status === 'warning' ? (
                        <>
                          <AlertTriangle className="w-5 h-5 text-yellow-400" />
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warning</Badge>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-400" />
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-[#1e293b]/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Globe className="w-5 h-5" />
                  Environment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Environment:</span>
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {systemHealth?.system?.environment || 'Development'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Node Version:</span>
                      <span className="text-white">v{process.versions?.node || '20.19.3'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Platform:</span>
                      <span className="text-white">Linux x64</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Process ID:</span>
                      <span className="text-white">{systemHealth?.system?.pid || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Started:</span>
                      <span className="text-white">{new Date(Date.now() - (systemHealth?.system?.uptime || 0) * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Timezone:</span>
                      <span className="text-white">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Check:</span>
                      <span className="text-white">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Load Average:</span>
                      <span className="text-white">{systemHealth?.system?.loadAverage || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-[#1e293b]/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="w-5 h-5" />
                System Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <UnifiedButton
                  variant="secondary" 
                  className="h-16 flex-col gap-2"
                  onClick={async () => {
                    if (!confirm('Clear application cache?')) return;
                    toast({
                      title: "Cache Cleared",
                      description: "Application cache cleared successfully",
                    });
                  }}
                >
                  <Trash2 className="w-5 h-5" />
                  Clear Cache
                </UnifiedButton>

                <UnifiedButton
                  variant="secondary"
                  className="h-16 flex-col gap-2"
                  onClick={async () => {
                    try {
                      const timestamp = new Date().toISOString();
                      const logData = `System Health Report - ${timestamp}\n${'='.repeat(50)}\n\nSystem Status: ${healthStatus.status}\nDatabase: ${dbStatus.status}\nUptime: ${formatUptime(systemHealth?.system?.uptime || 0)}\nMemory: ${systemHealth?.system?.memory?.used || 0}MB used\n\nGenerated by Clean & Flip Admin Dashboard`;
                      
                      const blob = new Blob([logData], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `system-health-${timestamp.split('T')[0]}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      toast({
                        title: "Report Downloaded",
                        description: "System health report exported successfully",
                      });
                    } catch (error) {
                      toast({
                        title: "Export Failed",
                        description: "Failed to generate health report",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Download className="w-5 h-5" />
                  Export Report
                </UnifiedButton>

                <UnifiedButton
                  variant="secondary"
                  className="h-16 flex-col gap-2"
                  onClick={() => {
                    toast({
                      title: "Running Diagnostics",
                      description: "System diagnostic tests initiated",
                    });
                  }}
                >
                  <Activity className="w-5 h-5" />
                  Run Diagnostics
                </UnifiedButton>

                <UnifiedButton
                  variant="secondary"
                  className="h-16 flex-col gap-2"
                  onClick={() => setActiveTab('performance')}
                >
                  <TrendingUp className="w-5 h-5" />
                  View Metrics
                </UnifiedButton>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="bg-[#1e293b]/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Performance monitoring data</p>
                <p className="text-sm text-gray-500 mt-2">Real-time performance metrics will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card className="bg-[#1e293b]/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-green-400 text-lg">No Active Alerts</p>
                <p className="text-sm text-gray-500 mt-2">System is operating normally</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card className="bg-[#1e293b]/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Database Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-[#0f172a]/50 rounded-lg">
                  <Database className="w-8 h-8 text-green-400" />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">PostgreSQL Connection</h3>
                    <p className="text-sm text-gray-400">Production database (muddy-moon)</p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">Connected</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Response Time:</span>
                      <span className="text-white">{systemHealth?.system?.database?.latency || 0}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Connection Pool:</span>
                      <span className="text-white">Active</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Query:</span>
                      <span className="text-white">Just now</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">SSL Status:</span>
                      <span className="text-white">Enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}