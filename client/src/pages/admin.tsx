import { useRoute } from "wouter";
import { ProtectedRoute } from "@/lib/protected-route";

// Import unified admin components
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProductsTab } from './admin/ProductsTab';
import { AnalyticsTab } from './admin/AnalyticsTab';
import { CategoriesTab } from './admin/CategoriesTab';
import { UsersTab } from './admin/UsersTab';
import { SystemTab } from './admin/SystemTab';
import { StripeTab } from './admin/StripeTab';
import { WishlistTab } from './admin/WishlistTab';
import { SubmissionsTab } from './admin/SubmissionsTab';

export function AdminDashboard() {
  const [, params] = useRoute('/admin/:tab?');
  const tab = params?.tab || 'products';

  const renderTab = () => {
    switch(tab) {
      case 'products': return <ProductsTab />;
      case 'analytics': return <AnalyticsTab />;
      case 'categories': return <CategoriesTab />;
      case 'users': return <UsersTab />;
      case 'system': return <SystemTab />;
      case 'stripe': return <StripeTab />;
      case 'wishlist': return <WishlistTab />;
      case 'submissions': return <SubmissionsTab />;
      default: return <ProductsTab />;
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminLayout currentTab={tab}>
        {renderTab()}
      </AdminLayout>
    </ProtectedRoute>
  );
}

export default AdminDashboard;