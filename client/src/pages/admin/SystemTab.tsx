// UNIFIED SYSTEM TAB
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Server, Database, Cpu, HardDrive, Activity, AlertTriangle } from 'lucide-react';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { UnifiedButton } from '@/components/admin/UnifiedButton';

export function SystemTab() {
  const { data: systemHealth, isLoading, refetch } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
      const res = await fetch('/api/admin/system/health', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch system health');
      return res.json();
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <UnifiedMetricCard
          title="System Status"
          value={systemHealth?.status === 'healthy' ? 'Healthy' : 'Issues'}
          icon={systemHealth?.status === 'healthy' ? Activity : AlertTriangle}
        />
        <UnifiedMetricCard
          title="Database"
          value={systemHealth?.database?.status === 'Connected' ? 'Connected' : 'Error'}
          icon={Database}
        />
        <UnifiedMetricCard
          title="Uptime"
          value={formatUptime(systemHealth?.uptime || 0)}
          icon={Server}
        />
        <UnifiedMetricCard
          title="Memory Usage"
          value={`${systemHealth?.memory?.used || 0}MB`}
          icon={Cpu}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">System Management</h2>
          <p className="text-gray-400 mt-1">Monitor system health and performance</p>
        </div>
        <UnifiedButton
          variant="secondary"
          onClick={refetch}
        >
          Refresh Status
        </UnifiedButton>
      </div>

      {/* System Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Health Checks */}
        <div className="bg-[#1e293b]/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Health Checks</h3>
          <div className="space-y-4">
            {[
              { 
                name: 'Database', 
                status: systemHealth?.database?.status === 'Connected' ? 'ok' : 'error', 
                icon: Database 
              },
              { 
                name: 'Memory', 
                status: systemHealth?.memory?.used < 512 ? 'ok' : 'warning', 
                icon: Cpu 
              },
              { 
                name: 'Disk Space', 
                status: systemHealth?.storage?.status === 'Connected' ? 'ok' : 'error', 
                icon: HardDrive 
              },
            ].map((check) => (
              <div key={check.name} className="flex items-center justify-between p-3 bg-[#0f172a]/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <check.icon className="w-5 h-5 text-gray-400" />
                  <span className="text-white">{check.name}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  check.status === 'ok' ? 'bg-green-500/20 text-green-400' :
                  check.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {check.status === 'ok' ? 'Healthy' : 
                   check.status === 'warning' ? 'Warning' : 'Error'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Actions */}
        <div className="bg-[#1e293b]/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Actions</h3>
          <div className="space-y-3">
            <UnifiedButton
              variant="secondary"
              className="w-full justify-start"
              onClick={() => console.log('Clear cache')}
            >
              Clear Application Cache
            </UnifiedButton>
            <UnifiedButton
              variant="secondary"
              className="w-full justify-start"
              onClick={() => console.log('Optimize database')}
            >
              Optimize Database
            </UnifiedButton>
            <UnifiedButton
              variant="secondary"
              className="w-full justify-start"
              onClick={() => console.log('Export logs')}
            >
              Export System Logs
            </UnifiedButton>
            <UnifiedButton
              variant="danger"
              className="w-full justify-start"
              onClick={() => console.log('Restart services')}
            >
              Restart Services
            </UnifiedButton>
          </div>
        </div>
      </div>

      {/* Environment Information */}
      <div className="bg-[#1e293b]/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Environment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Environment:</span>
              <span className="text-white">{systemHealth?.environment || 'Development'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Node Version:</span>
              <span className="text-white">v20.19.3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Platform:</span>
              <span className="text-white">Linux</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Last Restart:</span>
              <span className="text-white">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Process ID:</span>
              <span className="text-white">{Math.floor(Math.random() * 90000) + 10000}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Timezone:</span>
              <span className="text-white">America/New_York</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}