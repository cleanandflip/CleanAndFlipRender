import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Settings, 
  Package, 
  Users, 
  BarChart3, 
  Database, 
  Activity,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Heart,
  Grid3X3,
  Clipboard
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { apiRequest, broadcastProductUpdate } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLiveData } from "@/hooks/use-live-data";

import CategoryManagement from "@/components/admin/category-management";
import { SubmissionsManager } from "./admin/SubmissionsManager";
import { ProductsManager } from './admin/ProductsManager';
import { UserManager } from './admin/UserManager';
import { AnalyticsManager } from './admin/AnalyticsManager';
import { CategoryManager } from './admin/CategoryManager';
import { SystemManager } from './admin/SystemManager';
import { WishlistManager } from './admin/WishlistManager';
import StripeManager from './admin/StripeManager';
import type { Product, User, Order } from "@shared/schema";

interface AdminStats {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
}

function StatCard({ title, value, icon: Icon, trend }: { 
  title: string; 
  value: string | number; 
  icon: any; 
  trend?: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm">{title}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {trend && <p className="text-sm text-green-400">{trend}</p>}
        </div>
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
    </Card>
  );
}



function Analytics() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return response.json();
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-bebas text-2xl">ANALYTICS</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Page Views" 
          value={analyticsData?.pageViews?.current?.toLocaleString() || "0"} 
          icon={Eye} 
          trend={`${analyticsData?.pageViews?.change > 0 ? '+' : ''}${analyticsData?.pageViews?.change || 0}% from last week`} 
        />
        <StatCard 
          title="Active Users" 
          value={analyticsData?.activeUsers?.current?.toLocaleString() || "0"} 
          icon={Users} 
          trend={`${analyticsData?.activeUsers?.change > 0 ? '+' : ''}${analyticsData?.activeUsers?.change || 0}% from last week`} 
        />
        <StatCard 
          title="Conversion Rate" 
          value={`${analyticsData?.conversionRate?.current || 0}%`} 
          icon={TrendingUp} 
          trend={`${analyticsData?.conversionRate?.change > 0 ? '+' : ''}${analyticsData?.conversionRate?.change || 0}% from last week`} 
        />
        <StatCard 
          title="Avg Order Value" 
          value={`$${analyticsData?.avgOrderValue?.current || 0}`} 
          icon={DollarSign} 
          trend={`${analyticsData?.avgOrderValue?.change > 0 ? '+' : ''}${analyticsData?.avgOrderValue?.change || 0}% from last week`} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Top Products</h3>
          {analyticsData?.topProducts?.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.topProducts.map((product: any, index: number) => (
                <div key={product.productId} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-text-secondary">Sold: {product.totalSold}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${product.revenue}</p>
                    <p className="text-sm text-text-secondary">#{index + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-text-secondary py-8">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No product sales yet</p>
              <p className="text-sm">Sales data will appear when orders are placed</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
          {analyticsData?.recentActivity?.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{activity.details}</p>
                    <p className="text-sm text-text-secondary">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">{activity.type.replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-text-secondary py-8">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Activity will appear when orders are processed</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch('/api/admin/users', { credentials: 'include' });
      if (!response.ok) {
        return [];
      }
      return response.json();
    }
  });

  const filteredUsers = (users || []).filter(user => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bebas text-2xl">USER MANAGEMENT</h2>
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.firstName} {user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.isAdmin ? "default" : "secondary"}>
                    {user.role || "user"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Select defaultValue={user.role || "user"}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="developer">Developer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function SystemSettings() {
  const { toast } = useToast();
  const { data: systemHealth } = useQuery({
    queryKey: ["/api/admin/system/health"],
    queryFn: async () => {
      const response = await fetch('/api/admin/system/health', { credentials: 'include' });
      if (!response.ok) return null;
      return response.json();
    }
  });

  const { data: dbStatus } = useQuery({
    queryKey: ["/api/admin/system/db-check"],
    queryFn: async () => {
      const response = await fetch('/api/admin/system/db-check', { credentials: 'include' });
      if (!response.ok) return null;  
      return response.json();
    }
  });

  const handleExport = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/export/${type}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      // Safe removal with timeout to prevent race conditions
      setTimeout(() => {
        if (a.parentNode === document.body) {
          document.body.removeChild(a);
        }
      }, 100);
      
      toast({ description: `${type} data exported successfully` });
    } catch (error) {
      console.error('Export error:', error);
      toast({ description: `Failed to export ${type} data`, variant: "destructive" });
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <h2 className="font-bebas text-2xl">SYSTEM SETTINGS</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5" />
            <h3 className="font-semibold">Database Status</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Status:</span>
              <Badge className={(dbStatus as any)?.status === 'Connected' ? "bg-green-500" : "bg-red-500"}>
                {(dbStatus as any)?.status || 'Unknown'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Provider:</span>
              <span>Neon PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span>Connection Pool:</span>
              <span>{(dbStatus as any)?.pool || 'Unknown'}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5" />
            <h3 className="font-semibold">System Health</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Server:</span>
              <Badge className={(systemHealth as any)?.status === 'Healthy' ? "bg-green-500" : "bg-red-500"}>
                {(systemHealth as any)?.status || 'Unknown'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Memory Usage:</span>
              <span>{(systemHealth as any)?.memoryPercent || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span>Uptime:</span>
              <span>{formatUptime((systemHealth as any)?.uptime || 0)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-semibold">Recent Errors</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="text-text-secondary">No recent errors</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5" />
            <h3 className="font-semibold">Export Data</h3>
          </div>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleExport('products')}
            >
              Export Products CSV
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleExport('users')}
            >
              Export Users CSV
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleExport('orders')}
            >
              Export Orders CSV
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const { data: stats, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      return response.json();
    },
    refetchInterval: 30000
  });

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refetchStats]);

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-background-primary text-text-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="font-bebas text-4xl mb-2">DEVELOPER DASHBOARD</h1>
            <p className="text-text-secondary">Manage your Clean & Flip marketplace</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Products" 
              value={stats?.totalProducts || 0} 
              icon={Package} 
            />
            <StatCard 
              title="Total Users" 
              value={stats?.totalUsers || 0} 
              icon={Users} 
            />
            <StatCard 
              title="Total Orders" 
              value={stats?.totalOrders || 0} 
              icon={ShoppingCart} 
            />
            <StatCard 
              title="Revenue" 
              value={`$${stats?.totalRevenue || 0}`} 
              icon={DollarSign} 
            />
          </div>

          {/* Main Dashboard Tabs */}
          <div className="space-y-6">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={activeTab === 'products' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('products')}
                className="flex items-center gap-2 h-8 px-3"
              >
                <Package className="w-4 h-4" />
                Products
              </Button>
              <Button
                variant={activeTab === 'categories' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('categories')}
                className="flex items-center gap-2 h-8 px-3"
              >
                <Grid3X3 className="w-4 h-4" />
                Categories
              </Button>
              <Button
                variant={activeTab === 'submissions' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('submissions')}
                className="flex items-center gap-2 h-8 px-3"
              >
                <Clipboard className="w-4 h-4" />
                Submissions
              </Button>
              <Button
                variant={activeTab === 'analytics' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('analytics')}
                className="flex items-center gap-2 h-8 px-3"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Button>
              <Button
                variant={activeTab === 'wishlist' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('wishlist')}
                className="flex items-center gap-2 h-8 px-3"
              >
                <Heart className="w-4 h-4" />
                Wishlist
              </Button>
              <Button
                variant={activeTab === 'users' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('users')}
                className="flex items-center gap-2 h-8 px-3"
              >
                <Users className="w-4 h-4" />
                Users
              </Button>
              <Button
                variant={activeTab === 'system' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('system')}
                className="flex items-center gap-2 h-8 px-3"
              >
                <Settings className="w-4 h-4" />
                System
              </Button>
              <Button
                variant={activeTab === 'stripe' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('stripe')}
                className="flex items-center gap-2 h-8 px-3"
              >
                <DollarSign className="w-4 h-4" />
                Stripe
              </Button>
            </div>

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