import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { 
  Settings, 
  Package, 
  Users, 
  BarChart3, 
  Heart,
  Grid3X3,
  Clipboard,
  CreditCard
} from "lucide-react";

import { SubmissionsManager } from "./admin/SubmissionsManager";
import { ProductsManager } from './admin/ProductsManager';
import { UserManager } from './admin/UserManager';
import { AnalyticsManager } from './admin/AnalyticsManager';
import { CategoryManager } from './admin/CategoryManager';
import { SystemManager } from './admin/SystemManager';
import { WishlistManager } from './admin/WishlistManager';
import { StripeManager } from './admin/StripeManager';

// COMPLETELY NEW ADMIN INTERFACE - DELETING OLD UI
function TabNavigation({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const tabs = [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Grid3X3 },
    { id: 'submissions', label: 'Submissions', icon: Clipboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'system', label: 'System', icon: Settings },
    { id: 'stripe', label: 'Stripe', icon: CreditCard }
  ];

  return (
    <div className="flex flex-wrap gap-4 mb-8">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`
            relative flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105
            ${activeTab === id 
              ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white shadow-2xl shadow-blue-500/30 border border-blue-400/50' 
              : 'bg-gradient-to-r from-gray-800/60 to-gray-900/60 text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/70 hover:to-gray-800/70 border border-gray-600/30 hover:border-gray-500/50 backdrop-blur-sm'
            }
          `}
          style={{
            background: activeTab === id 
              ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #7c3aed 100%)' 
              : 'linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(17, 24, 39, 0.6) 100%)',
            boxShadow: activeTab === id 
              ? '0 25px 50px -12px rgba(59, 130, 246, 0.25), 0 0 30px rgba(59, 130, 246, 0.15)' 
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderColor: activeTab === id ? 'rgba(59, 130, 246, 0.5)' : 'rgba(107, 114, 128, 0.3)'
          }}
        >
          <Icon className="w-5 h-5" />
          {label}
          {activeTab === id && (
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/10 to-purple-400/10 animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <ProtectedRoute requireAdmin={true}>
      <div 
        className="min-h-screen"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 75%, #475569 100%)',
          minHeight: '100vh'
        }}
      >
        <div className="container mx-auto px-6 py-8">
          {/* COMPLETELY NEW PROFESSIONAL HEADER */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 
                  className="text-7xl font-bold mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 30px rgba(96, 165, 250, 0.3)'
                  }}
                >
                  Developer Dashboard
                </h1>
                <p 
                  className="text-xl font-medium"
                  style={{ color: '#e2e8f0' }}
                >
                  Complete administrative control panel
                </p>
              </div>
              <div 
                className="p-6 rounded-2xl border"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <p className="text-sm font-medium text-blue-400">Admin Panel</p>
                <p className="text-2xl font-bold text-white">Active</p>
              </div>
            </div>
            
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          {/* CONTENT AREA WITH NEW UI SYSTEM */}
          <div 
            className="rounded-2xl border p-8"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
              borderColor: 'rgba(71, 85, 105, 0.3)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >

            {activeTab === 'products' && <ProductsManager />}
            {activeTab === 'categories' && <CategoryManager />}
            {activeTab === 'submissions' && <SubmissionsManager />}
            {activeTab === 'analytics' && <AnalyticsManager />}
            {activeTab === 'wishlist' && <WishlistManager />}
            {activeTab === 'users' && <UserManager />}
            {activeTab === 'system' && <SystemManager />}
            {activeTab === 'stripe' && <StripeManager />}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default AdminDashboard;