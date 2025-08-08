import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Database, 
  Mail, 
  CreditCard, 
  Shield, 
  Download, 
  FileText, 
  Zap,
  Server,
  Activity,
  HardDrive,
  Wifi
} from 'lucide-react';

interface SystemHealth {
  database: { status: 'healthy' | 'warning' | 'error'; message: string };
  redis: { status: 'healthy' | 'warning' | 'error'; message: string };
  storage: { status: 'healthy' | 'warning' | 'error'; message: string };
  memory: { used: number; total: number; percentage: number };
  cpu: { usage: number };
  uptime: number;
}

export function SystemManager() {
  const [activeSection, setActiveSection] = useState('general');

  const sections = [
    { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'email', label: 'Email Configuration', icon: Mail },
    { id: 'payment', label: 'Payment Settings', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'backup', label: 'Backup & Export', icon: Download },
    { id: 'logs', label: 'System Logs', icon: FileText },
    { id: 'cache', label: 'Cache Management', icon: Zap }
  ];

  const { data: systemHealth, isLoading } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
      const res = await fetch('/api/admin/system/health', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch system health');
      return res.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Healthy</Badge>;
      case 'warning': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warning</Badge>;
      case 'error': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-border glass p-6">
          <h2 className="text-lg font-semibold mb-4 text-white bebas-neue">System Settings</h2>
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  variant={activeSection === section.id ? 'primary' : 'ghost'}
                  className="w-full justify-start gap-3"
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </Button>
              );
            })}
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeSection === 'general' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white bebas-neue mb-2">System Overview</h1>
                <p className="text-white">Monitor your Clean & Flip system health and performance</p>
              </div>

              {/* System Health Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Database</p>
                      <p className="text-lg font-bold text-white">{systemHealth?.database?.status || 'Unknown'}</p>
                    </div>
                    <Database className={`w-6 h-6 ${getStatusColor(systemHealth?.database?.status || 'unknown')}`} />
                  </div>
                  <div className="mt-2">
                    {getStatusBadge(systemHealth?.database?.status || 'unknown')}
                  </div>
                </Card>

                <Card className="glass p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Cache</p>
                      <p className="text-lg font-bold text-white">{systemHealth?.redis?.status || 'Disabled'}</p>
                    </div>
                    <Zap className={`w-6 h-6 ${getStatusColor(systemHealth?.redis?.status || 'warning')}`} />
                  </div>
                  <div className="mt-2">
                    {getStatusBadge(systemHealth?.redis?.status || 'warning')}
                  </div>
                </Card>

                <Card className="glass p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Storage</p>
                      <p className="text-lg font-bold text-white">{systemHealth?.storage?.status || 'Unknown'}</p>
                    </div>
                    <HardDrive className={`w-6 h-6 ${getStatusColor(systemHealth?.storage?.status || 'unknown')}`} />
                  </div>
                  <div className="mt-2">
                    {getStatusBadge(systemHealth?.storage?.status || 'unknown')}
                  </div>
                </Card>

                <Card className="glass p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Uptime</p>
                      <p className="text-lg font-bold text-white">{systemHealth?.uptime ? formatUptime(systemHealth.uptime) : 'Unknown'}</p>
                    </div>
                    <Activity className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="mt-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Online</Badge>
                  </div>
                </Card>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Memory Usage</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white">Used</span>
                      <span className="text-white">{systemHealth?.memory?.used || 0} MB</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{ width: `${systemHealth?.memory?.percentage || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white">
                      <span>0 MB</span>
                      <span>{systemHealth?.memory?.total || 0} MB</span>
                    </div>
                  </div>
                </Card>

                <Card className="glass p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">CPU Usage</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white">Current</span>
                      <span className="text-white">{systemHealth?.cpu?.usage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{ width: `${systemHealth?.cpu?.usage || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="glass p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="gap-2">
                    <Database className="w-4 h-4" />
                    Database Backup
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Zap className="w-4 h-4" />
                    Clear Cache
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export Logs
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'database' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white bebas-neue mb-2">Database Management</h1>
                <p className="text-white">Monitor and manage your PostgreSQL database</p>
              </div>

              <Card className="glass p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Database Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Connection Status</span>
                    {getStatusBadge(systemHealth?.database?.status || 'unknown')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">Provider</span>
                    <span className="text-white">Neon PostgreSQL</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">Environment</span>
                    <Badge variant="outline">Development</Badge>
                  </div>
                </div>
              </Card>

              <Card className="glass p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Database Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="gap-2">
                    <Database className="w-4 h-4" />
                    Run Migrations
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Backup Database
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Activity className="w-4 h-4" />
                    Check Integrity
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Zap className="w-4 h-4" />
                    Optimize Tables
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'logs' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white bebas-neue mb-2">System Logs</h1>
                <p className="text-white">View and analyze system activity logs</p>
              </div>

              <Card className="glass p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Recent Log Entries</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <div className="text-sm font-mono bg-gray-800/50 p-2 rounded">
                    <span className="text-green-400">[INFO]</span> <span className="text-gray-400">2025-01-01 17:41:32</span> Database connected successfully
                  </div>
                  <div className="text-sm font-mono bg-gray-800/50 p-2 rounded">
                    <span className="text-blue-400">[DEBUG]</span> <span className="text-gray-400">2025-01-01 17:41:30</span> Performance: Enable Redis for better caching
                  </div>
                  <div className="text-sm font-mono bg-gray-800/50 p-2 rounded">
                    <span className="text-green-400">[INFO]</span> <span className="text-gray-400">2025-01-01 17:41:28</span> Server started on port 5000
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}