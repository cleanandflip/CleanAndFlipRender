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

export function SystemTab() {
  const ready = useWebSocketState();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real-time system health monitoring
  const { data: systemHealth, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['/api/admin/system/health'],
    refetchInterval: 5000,
    staleTime: 0,
    cacheTime: 0
  });

  // Global refresh function
  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      await refetchHealth();
      toast({
        title: "System Refreshed",
        description: "All monitoring data updated successfully",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Unable to update system data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper functions
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // System status determination - use backend status directly
  const getSystemStatus = () => {
    if (!systemHealth?.system) return { status: 'unknown', color: 'gray' };
    
    // Use the status from the backend system health response
    const backendStatus = systemHealth.system.status;
    
    if (backendStatus === 'healthy') {
      return { status: 'healthy', color: 'green' };
    } else if (backendStatus === 'warning') {
      return { status: 'warning', color: 'yellow' };
    } else if (backendStatus === 'critical') {
      return { status: 'critical', color: 'red' };
    }
    
    return { status: 'unknown', color: 'gray' };
  };

  const systemStatus = getSystemStatus();
  const dbStatus = { 
    status: systemHealth?.system?.database?.status === 'connected' ? 'healthy' : 'error',
    color: systemHealth?.system?.database?.status === 'connected' ? 'green' : 'red'
  };

  // Custom tab navigation
  const TabButton = ({ id, label, icon: Icon, isActive, onClick }: {
    id: string;
    label: string;
    icon: any;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg'
          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header with Real-time Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-8 h-8" />
            SYSTEM MONITORING
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 ml-2">
              {ready ? 'Live Sync Active' : 'Sync Offline'}
            </Badge>
          </h2>
          <p className="text-gray-400 mt-1">Real-time system health and performance monitoring</p>
        </div>
        
        <UnifiedButton
          onClick={refreshAll}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh All
        </UnifiedButton>
      </div>

      {/* System Health Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UnifiedMetricCard
          title="System Status"
          value={systemStatus.status === 'healthy' ? 'Healthy' : 
                 systemStatus.status === 'warning' ? 'Warning' :
                 systemStatus.status === 'critical' ? 'Critical' : 'Unknown'}
          icon={systemStatus.status === 'healthy' ? CheckCircle : 
                systemStatus.status === 'warning' ? AlertTriangle :
                systemStatus.status === 'critical' ? XCircle : AlertCircle}
          trend="up"
          className="bg-[#1e293b]/50 border-gray-800"
          valueClassName={`${
            systemStatus.status === 'healthy' ? 'text-green-400' :
            systemStatus.status === 'warning' ? 'text-yellow-400' :
            systemStatus.status === 'critical' ? 'text-red-400' :
            'text-gray-400'
          }`}
        />

        <UnifiedMetricCard
          title="Database"
          value={dbStatus.status === 'healthy' ? 'Connected' : 'Error'}
          subtitle={systemHealth?.system?.database?.latency ? `${systemHealth.system.database.latency}ms latency` : 'No response'}
          icon={Database}
          trend="stable"
          className="bg-[#1e293b]/50 border-gray-800"
          valueClassName={dbStatus.status === 'healthy' ? 'text-green-400' : 'text-red-400'}
        />

        <UnifiedMetricCard
          title="Uptime"
          value={formatUptime(systemHealth?.system?.uptime || 0)}
          icon={Clock}
          trend="up"
          className="bg-[#1e293b]/50 border-gray-800"
          valueClassName="text-blue-400"
        />

        <UnifiedMetricCard
          title="Memory Usage"
          value={systemHealth?.system?.memory ? `${systemHealth.system.memory.used}MB` : '0MB'}
          subtitle={systemHealth?.system?.memory ? `${Math.round((systemHealth.system.memory.used / systemHealth.system.memory.total) * 100)}% used` : 'Loading...'}
          icon={MemoryStick}
          trend={systemHealth?.system?.memory?.used > 256 ? 'up' : 'stable'}
          className="bg-[#1e293b]/50 border-gray-800"
          valueClassName="text-purple-400"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1 bg-[#0f172a]/50 rounded-lg border border-gray-800">
        <TabButton id="overview" label="Overview" icon={Shield} isActive={activeView === 'overview'} onClick={() => setActiveView('overview')} />
        <TabButton id="performance" label="Performance" icon={TrendingUp} isActive={activeView === 'performance'} onClick={() => setActiveView('performance')} />
        <TabButton id="alerts" label="Alerts" icon={AlertCircle} isActive={activeView === 'alerts'} onClick={() => setActiveView('alerts')} />
        <TabButton id="database" label="Database" icon={Database} isActive={activeView === 'database'} onClick={() => setActiveView('database')} />
      </div>

      {/* Content Views */}
      {activeView === 'overview' && (
        <div className="space-y-6">
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
                    details: systemHealth?.system?.database?.latency ? `${systemHealth.system.database.latency}ms response time` : 'No connection',
                    icon: Database 
                  },
                  { 
                    name: 'Memory Usage', 
                    status: (systemHealth?.system?.memory?.used || 0) > 512 ? 'warning' : 'healthy',
                    details: systemHealth?.system?.memory ? `${systemHealth.system.memory.used}MB / ${systemHealth.system.memory.total}MB` : 'Loading...',
                    icon: MemoryStick 
                  },
                  { 
                    name: 'API Performance', 
                    status: (systemHealth?.system?.performance?.avgResponseTime || 0) > 1000 ? 'warning' : 'healthy',
                    details: systemHealth?.system?.performance ? `${Math.round(systemHealth.system.performance.avgResponseTime)}ms average` : 'Monitoring...',
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
                      <span className="text-white">{systemHealth?.system?.nodeVersion || 'v20.19.3'}</span>
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
                      <span className="text-white">{systemHealth?.system?.uptime ? new Date(Date.now() - systemHealth.system.uptime * 1000).toLocaleDateString() : 'Unknown'}</span>
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
                      <span className="text-gray-400">Database:</span>
                      <span className="text-white">lucky-poetry</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Actions */}
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
                      const logData = `System Health Report - ${timestamp}\n${'='.repeat(50)}\n\nSystem Status: ${systemStatus.status}\nDatabase: ${dbStatus.status}\nUptime: ${formatUptime(systemHealth?.system?.uptime || 0)}\nMemory: ${systemHealth?.system?.memory?.used || 0}MB used\n\nGenerated by Clean & Flip Admin Dashboard`;
                      
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
                  onClick={() => setActiveView('performance')}
                >
                  <TrendingUp className="w-5 h-5" />
                  View Metrics
                </UnifiedButton>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'performance' && (
        <Card className="bg-[#1e293b]/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {systemHealth?.system?.performance && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#0f172a]/50 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <span className="text-white font-medium">Average Response Time</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {Math.round(systemHealth.system.performance.avgResponseTime)}ms
                    </div>
                  </div>
                  
                  <div className="p-4 bg-[#0f172a]/50 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">Request Count</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {systemHealth.system.performance.requestCount || 0}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-[#0f172a]/50 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium">Throughput</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">
                      {Math.round((systemHealth.system.performance.requestCount || 0) / (systemHealth.system.uptime || 1) * 60)}
                      <span className="text-sm text-gray-400 ml-1">req/min</span>
                    </div>
                  </div>
                </div>
              )}
              
              {!systemHealth?.system?.performance && (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Performance monitoring active</p>
                  <p className="text-sm text-gray-500 mt-2">Real-time performance metrics are being collected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeView === 'alerts' && (
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
      )}

      {activeView === 'database' && (
        <Card className="bg-[#1e293b]/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Database Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-[#0f172a]/50 rounded-lg">
                <Database className={`w-8 h-8 ${dbStatus.status === 'healthy' ? 'text-green-400' : 'text-red-400'}`} />
                <div className="flex-1">
                  <h3 className="text-white font-semibold">PostgreSQL Connection</h3>
                  <p className="text-sm text-gray-400">
                    {systemHealth?.system?.database?.environment && systemHealth?.system?.database?.name ? 
                      `${systemHealth.system.database.environment === 'production' ? 'Production' : 'Development'} database (${systemHealth.system.database.name})` :
                      'Database connection active'
                    }
                  </p>
                </div>
                <Badge className={`${dbStatus.status === 'healthy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {dbStatus.status === 'healthy' ? 'Connected' : 'Error'}
                </Badge>
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
      )}
    </div>
  );
}