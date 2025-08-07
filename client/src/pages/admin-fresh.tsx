import React, { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { Package, Users, BarChart3, Settings, Heart, CreditCard, FileText, Shield } from 'lucide-react';
import { UnifiedDashboardCard } from '@/components/admin/UnifiedDashboardCard';
import { UnifiedStatCard } from '@/components/admin/UnifiedStatCard';

const ManagerTabs = {
  PRODUCTS: 'products',
  USERS: 'users', 
  ANALYTICS: 'analytics',
  CATEGORIES: 'categories',
  SYSTEM: 'system',
  WISHLIST: 'wishlist',
  STRIPE: 'stripe',
  SUBMISSIONS: 'submissions'
};

const TabButtons = [
  { id: ManagerTabs.PRODUCTS, label: 'Products', icon: Package, gradient: 'blue' },
  { id: ManagerTabs.USERS, label: 'Users', icon: Users, gradient: 'green' },
  { id: ManagerTabs.ANALYTICS, label: 'Analytics', icon: BarChart3, gradient: 'purple' },
  { id: ManagerTabs.CATEGORIES, label: 'Categories', icon: Settings, gradient: 'orange' },
  { id: ManagerTabs.WISHLIST, label: 'Wishlist', icon: Heart, gradient: 'pink' },
  { id: ManagerTabs.STRIPE, label: 'Stripe', icon: CreditCard, gradient: 'cyan' },
  { id: ManagerTabs.SUBMISSIONS, label: 'Submissions', icon: FileText, gradient: 'green' },
  { id: ManagerTabs.SYSTEM, label: 'System', icon: Shield, gradient: 'purple' }
];

function SimpleManager({ title, icon: Icon, stats }: { title: string; icon: any; stats: any[] }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <UnifiedDashboardCard gradient="blue">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-8 h-8 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">{title} Management</h2>
              <p className="text-gray-400">Manage your {title.toLowerCase()} data</p>
            </div>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            Add New
          </Button>
        </div>
      </UnifiedDashboardCard>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <UnifiedStatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={<stat.icon className="w-6 h-6 text-white" />}
            gradient={stat.gradient}
            change={stat.change}
            subtitle={stat.subtitle}
          />
        ))}
      </div>

      {/* Content */}
      <UnifiedDashboardCard>
        <div className="text-center py-12">
          <Icon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">{title} Manager</h3>
          <p className="text-gray-400 mb-6">Full functionality will be restored soon.</p>
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
            Refresh Data
          </Button>
        </div>
      </UnifiedDashboardCard>
    </div>
  );
}

export default function AdminDashboardFresh() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(ManagerTabs.PRODUCTS);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const renderActiveManager = () => {
    const commonStats = [
      { title: 'Total Items', value: '150', icon: Package, gradient: 'blue', change: 5.2, subtitle: 'This month' },
      { title: 'Active Items', value: '142', icon: Users, gradient: 'green', change: 2.1, subtitle: 'Currently active' },
      { title: 'Recent Changes', value: '8', icon: BarChart3, gradient: 'purple', change: -1.2, subtitle: 'Last 7 days' }
    ];

    switch (activeTab) {
      case ManagerTabs.PRODUCTS:
        return <SimpleManager title="Products" icon={Package} stats={commonStats} />;
      case ManagerTabs.USERS:
        return <SimpleManager title="Users" icon={Users} stats={commonStats} />;
      case ManagerTabs.ANALYTICS:
        return <SimpleManager title="Analytics" icon={BarChart3} stats={commonStats} />;
      case ManagerTabs.CATEGORIES:
        return <SimpleManager title="Categories" icon={Settings} stats={commonStats} />;
      case ManagerTabs.WISHLIST:
        return <SimpleManager title="Wishlist" icon={Heart} stats={commonStats} />;
      case ManagerTabs.STRIPE:
        return <SimpleManager title="Stripe" icon={CreditCard} stats={commonStats} />;
      case ManagerTabs.SUBMISSIONS:
        return <SimpleManager title="Submissions" icon={FileText} stats={commonStats} />;
      case ManagerTabs.SYSTEM:
        return <SimpleManager title="System" icon={Shield} stats={commonStats} />;
      default:
        return <SimpleManager title="Products" icon={Package} stats={commonStats} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Welcome back, {user.email}</p>
          </div>
          <Badge className="bg-green-600 text-white px-4 py-2 text-sm">
            ✅ FRESH START APPLIED
          </Badge>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {TabButtons.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                className={`h-16 flex flex-col gap-1 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0' 
                    : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{tab.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Active Manager */}
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        }>
          {renderActiveManager()}
        </Suspense>
      </div>
    </div>
  );
}