import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UnifiedDashboardCard } from '@/components/admin/UnifiedDashboardCard';
import { UnifiedStatCard } from '@/components/admin/UnifiedStatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Cpu, HardDrive, Database, Activity, Server, Shield, AlertTriangle, CheckCircle, RefreshCw, Settings, Zap, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemHealth {
  cpu: { usage: number; cores: number };
  memory: { used: number; total: number; percentage: number };
  disk: { used: number; total: number; percentage: number };
  database: { status: string; connections: number; responseTime: number };
  uptime: number;
  errors: number;
  warnings: number;
}

export function SystemManager() {
  console.log('🔴 SystemManager RENDERED at', new Date().toISOString());
  const { toast } = useToast();

  const { data: systemHealth, isLoading, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const res = await fetch('/api/admin/system/health');
      if (!res.ok) throw new Error('Failed to fetch system health');
      return res.json();
    },
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  const { data: systemLogs } = useQuery({
    queryKey: ['system-logs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/system/logs?limit=10');
      if (!res.ok) throw new Error('Failed to fetch system logs');
      return res.json();
    }
  });

  const handleClearCache = async () => {
    try {
      await fetch('/api/admin/system/cache/clear', { method: 'POST' });
      toast({ title: 'Cache cleared successfully' });
      refetch();
    } catch (error) {
      toast({ title: 'Error clearing cache', variant: 'destructive' });
    }
  };

  const handleRestartService = (service: string) => {
    toast({ title: `Restart ${service} functionality coming soon` });
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getHealthStatus = (percentage: number) => {
    if (percentage < 60) return { color: 'text-green-400', status: 'Healthy' };
    if (percentage < 80) return { color: 'text-yellow-400', status: 'Warning' };
    return { color: 'text-red-400', status: 'Critical' };
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* PROFESSIONAL HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">System Manager</h1>
            <p className="text-gray-400">Monitor system health and performance</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => toast({ title: 'System settings coming soon' })}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* SYSTEM HEALTH CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <UnifiedStatCard
            title="CPU Usage"
            value={`${systemHealth?.cpu?.usage || 0}%`}
            icon={<Cpu className="w-6 h-6 text-white" />}
            gradient="blue"
            subtitle={`${systemHealth?.cpu?.cores || 4} cores`}
          />
          <UnifiedStatCard
            title="Memory Usage"
            value={`${systemHealth?.memory?.percentage || 0}%`}
            icon={<HardDrive className="w-6 h-6 text-white" />}
            gradient="green"
            subtitle={`${systemHealth?.memory?.used || 0}MB / ${systemHealth?.memory?.total || 1024}MB`}
          />
          <UnifiedStatCard
            title="Database"
            value={systemHealth?.database?.status || 'Unknown'}
            icon={<Database className="w-6 h-6 text-white" />}
            gradient="purple"
            subtitle={`${systemHealth?.database?.connections || 0} connections`}
          />
          <UnifiedStatCard
            title="Uptime"
            value={formatUptime(systemHealth?.uptime || 0)}
            icon={<Activity className="w-6 h-6 text-white" />}
            gradient="orange"
            subtitle="System uptime"
          />
        </div>
      </div>

      {/* SYSTEM STATUS OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <UnifiedDashboardCard 
          title="Resource Usage" 
          icon={<Monitor className="w-5 h-5 text-white" />}
          gradient="blue"
        >
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white">CPU Usage</span>
                <span className={`font-bold ${getHealthStatus(systemHealth?.cpu?.usage || 0).color}`}>
                  {systemHealth?.cpu?.usage || 0}%
                </span>
              </div>
              <Progress value={systemHealth?.cpu?.usage || 0} className="h-2" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white">Memory Usage</span>
                <span className={`font-bold ${getHealthStatus(systemHealth?.memory?.percentage || 0).color}`}>
                  {systemHealth?.memory?.percentage || 0}%
                </span>
              </div>
              <Progress value={systemHealth?.memory?.percentage || 0} className="h-2" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white">Disk Usage</span>
                <span className={`font-bold ${getHealthStatus(systemHealth?.disk?.percentage || 0).color}`}>
                  {systemHealth?.disk?.percentage || 0}%
                </span>
              </div>
              <Progress value={systemHealth?.disk?.percentage || 0} className="h-2" />
            </div>
          </div>
        </UnifiedDashboardCard>

        <UnifiedDashboardCard 
          title="Services Status" 
          icon={<Server className="w-5 h-5 text-white" />}
          gradient="green"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white">Web Server</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600/20 text-green-300 border-green-500/30">Online</Badge>
                <Button size="sm" variant="outline" onClick={() => handleRestartService('web')}>
                  Restart
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white">Database</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600/20 text-green-300 border-green-500/30">Connected</Badge>
                <Button size="sm" variant="outline" onClick={() => handleRestartService('database')}>
                  Restart
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span className="text-white">Cache</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-500/30">Warning</Badge>
                <Button size="sm" variant="outline" onClick={handleClearCache}>
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </UnifiedDashboardCard>
      </div>

      {/* QUICK ACTIONS */}
      <UnifiedDashboardCard 
        title="Quick Actions" 
        icon={<Zap className="w-5 h-5 text-white" />}
        gradient="purple"
        className="mb-8"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            onClick={handleClearCache}
            className="h-20 flex-col gap-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700"
          >
            <RefreshCw className="w-6 h-6" />
            Clear Cache
          </Button>
          
          <Button 
            onClick={() => toast({ title: 'Backup functionality coming soon' })}
            className="h-20 flex-col gap-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700"
          >
            <Shield className="w-6 h-6" />
            Backup System
          </Button>
          
          <Button 
            onClick={() => toast({ title: 'Update functionality coming soon' })}
            className="h-20 flex-col gap-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700"
          >
            <Activity className="w-6 h-6" />
            Check Updates
          </Button>
          
          <Button 
            onClick={() => toast({ title: 'Maintenance mode coming soon' })}
            className="h-20 flex-col gap-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700"
          >
            <Settings className="w-6 h-6" />
            Maintenance
          </Button>
        </div>
      </UnifiedDashboardCard>

      {/* RECENT LOGS */}
      <UnifiedDashboardCard 
        title="Recent System Logs" 
        icon={<Activity className="w-5 h-5 text-white" />}
        gradient="orange"
      >
        <div className="space-y-3">
          {systemLogs?.logs?.slice(0, 5).map((log: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div className="flex items-center gap-3">
                {log.level === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                {log.level === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                {log.level === 'info' && <CheckCircle className="w-4 h-4 text-blue-400" />}
                <span className="text-white text-sm">{log.message}</span>
              </div>
              <span className="text-gray-400 text-xs">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )) || (
            <div className="text-center text-gray-400 py-8">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent logs available</p>
            </div>
          )}
        </div>
      </UnifiedDashboardCard>
    </div>
  );
}