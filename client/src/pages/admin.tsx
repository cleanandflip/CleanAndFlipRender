import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/common/glass-card";
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
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLiveData } from "@/hooks/use-live-data";
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
    <GlassCard className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm">{title}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {trend && <p className="text-sm text-green-400">{trend}</p>}
        </div>
        <Icon className="w-8 h-8 text-accent-blue" />
      </div>
    </GlassCard>
  );
}

function ProductManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: productsData, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ["/api/products"],
  });

  const products = productsData?.products || [];

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ description: "Product deleted successfully" });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({ 
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, status }: { productId: string; status: string }) => {
      return apiRequest('PUT', `/api/admin/products/${productId}/stock`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ description: "Stock status updated" });
    }
  });

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleViewProduct = (productId: string) => {
    window.open(`/products/${productId}`, '_blank');
  };

  const handleStockUpdate = (productId: string, status: string) => {
    updateStockMutation.mutate({ productId, status });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bebas text-2xl">PRODUCT MANAGEMENT</h2>
        <Button 
          className="bg-accent-blue hover:bg-blue-500"
          onClick={() => toast({ description: "Add Product feature coming soon!" })}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <GlassCard className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>${product.price}</TableCell>
                <TableCell>{product.categoryId}</TableCell>
                <TableCell>{product.quantity || 0}</TableCell>
                <TableCell>
                  <Badge variant={(product.quantity || 0) > 0 ? "default" : "destructive"}>
                    {(product.quantity || 0) > 0 ? "In Stock" : "Out of Stock"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewProduct(product.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => toast({ description: "Edit Product feature coming soon!" })}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GlassCard>
    </div>
  );
}

function Analytics() {
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  return (
    <div className="space-y-6">
      <h2 className="font-bebas text-2xl">ANALYTICS</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Page Views" value="12,543" icon={Eye} trend="+12% from last week" />
        <StatCard title="Active Users" value="892" icon={Users} trend="+8% from last week" />
        <StatCard title="Conversion Rate" value="3.2%" icon={TrendingUp} trend="+0.5% from last week" />
        <StatCard title="Avg Order Value" value="$287" icon={DollarSign} trend="+15% from last week" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">New user registration</span>
              <span className="text-xs text-text-secondary">2 min ago</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Order #1234 completed</span>
              <span className="text-xs text-text-secondary">5 min ago</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Product added to cart</span>
              <span className="text-xs text-text-secondary">8 min ago</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Rogue Ohio Power Bar</span>
              <span className="text-sm font-semibold">23 sold</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Concept2 RowErg</span>
              <span className="text-sm font-semibold">18 sold</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Bumper Plate Set</span>
              <span className="text-sm font-semibold">15 sold</span>
            </div>
          </div>
        </GlassCard>
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
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

      <GlassCard className="p-6">
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
      </GlassCard>
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
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
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
        <GlassCard className="p-6">
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
        </GlassCard>

        <GlassCard className="p-6">
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
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-semibold">Recent Errors</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="text-text-secondary">No recent errors</div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
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
        </GlassCard>
      </div>
    </div>
  );
}

function AdminDashboard() {
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
          <Tabs defaultValue="products" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                System
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <ProductManagement />
            </TabsContent>

            <TabsContent value="analytics">
              <Analytics />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="system">
              <SystemSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default AdminDashboard;