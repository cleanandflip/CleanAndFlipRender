// UNIFIED ADMIN LAYOUT WITH CONSISTENT THEME
import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Package, Grid, FolderOpen, BarChart3, Heart, 
  Users, Settings, CreditCard, ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentTab?: string;
}

const ADMIN_TABS = [
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Grid },
  { id: 'submissions', label: 'Submissions', icon: FolderOpen },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'system', label: 'System', icon: Settings },
  { id: 'stripe', label: 'Stripe', icon: CreditCard },
];

export function AdminLayout({ children, currentTab }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  const activeTab = currentTab || location.split('/').pop() || 'products';

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#1e293b]/50 backdrop-blur">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-white mb-2">DEVELOPER DASHBOARD</h1>
          <p className="text-gray-400">Manage your Clean & Flip marketplace</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-800 bg-[#1e293b]/30">
        <div className="container mx-auto px-6">
          <nav className="flex space-x-1 -mb-px">
            {ADMIN_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(`/admin/${tab.id}`)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3",
                    "border-b-2 transition-all duration-200",
                    "text-sm font-medium",
                    isActive ? [
                      "border-blue-500 text-white",
                      "bg-blue-500/10"
                    ] : [
                      "border-transparent text-gray-400",
                      "hover:text-white hover:bg-white/5"
                    ]
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  );
}