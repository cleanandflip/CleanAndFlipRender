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

// Professional Tab Navigation Component
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
    <div className="flex flex-wrap gap-3 mb-12">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`
            relative flex items-center gap-3 px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105
            ${activeTab === id 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/25 border border-blue-400/30' 
              : 'bg-gray-800/40 text-gray-300 hover:bg-gray-700/60 border border-gray-700/50 hover:border-gray-600/70 backdrop-blur-sm'
            }
          `}
        >
          <Icon className="w-5 h-5" />
          {label}
          {activeTab === id && (
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse" />
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
      <div className="min-h-screen bg-gray-950">
        <div className="container mx-auto px-6 py-8">
          {/* PROFESSIONAL DASHBOARD HEADER */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                  Developer Dashboard
                </h1>
                <p className="text-gray-400 text-xl">Professional e-commerce management suite</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-gray-800/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium">System Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Tab Navigation */}
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* TAB CONTENT AREAS */}
          <div className="mt-8">
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