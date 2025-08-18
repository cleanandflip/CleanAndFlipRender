// Enhanced Admin Dashboard with comprehensive user management
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, EyeOff, Search, RefreshCw, Users, UserCheck, Shield, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  auth_provider: string;
  providers: string[];
  email_verified_at: string | null;
  last_login_at: string | null;
  last_ip: string;
  mfa_enabled: boolean;
  orders_count: number;
  lifetime_value: number;
  active_sessions: number;
  created_at: string;
  picture_url: string | null;
}

interface SystemOverview {
  environment: string;
  database: {
    host: string;
    name: string;
    role: string;
    timestamp: string;
  };
  system: {
    uptime: number;
    nodeVersion: string;
    memory: any;
    pid: number;
  };
  stats: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    activeSessions: number;
  };
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [userFilters, setUserFilters] = useState({
    query: '',
    role: '',
    status: '',
    provider: '',
    page: 1,
    pageSize: 25
  });

  const { data: systemOverview, isLoading: systemLoading } = useQuery({
    queryKey: ['/api/admin/system/overview'],
    retry: false,
  });

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/admin/users', userFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(userFilters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Admin access required: ${response.status}`);
      }
      
      return response.json();
    },
    retry: false,
  });

  const handleFilterChange = (key: string, value: string) => {
    setUserFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : prev.page // Reset page when filters change
    }));
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  if (!systemOverview && systemLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="admin-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="dashboard-title">
            Developer Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive system monitoring and user management
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1" data-testid="environment-badge">
          {systemOverview?.environment || 'Unknown'} Environment
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6" data-testid="admin-tabs">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">
            Products
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="system" data-testid="tab-system">
            <Shield className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4" data-testid="overview-content">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="total-users">
                  {systemOverview?.stats?.totalUsers || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="active-sessions">
                  {systemOverview?.stats?.activeSessions || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="total-products">
                  {systemOverview?.stats?.totalProducts || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="total-orders">
                  {systemOverview?.stats?.totalOrders || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span data-testid="system-uptime">
                    {systemOverview?.system ? formatUptime(systemOverview.system.uptime) : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Usage:</span>
                  <span data-testid="memory-usage">
                    {systemOverview?.system ? formatMemory(systemOverview.system.memory.heapUsed) : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Node.js:</span>
                  <span data-testid="node-version">
                    {systemOverview?.system?.nodeVersion || 'Unknown'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Host:</span>
                  <span className="text-sm font-mono" data-testid="db-host">
                    {systemOverview?.database?.host || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Database:</span>
                  <span data-testid="db-name">
                    {systemOverview?.database?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>User:</span>
                  <span data-testid="db-role">
                    {systemOverview?.database?.role || 'Unknown'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4" data-testid="users-content">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Comprehensive user management with role-based access control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search users..."
                    value={userFilters.query}
                    onChange={(e) => handleFilterChange('query', e.target.value)}
                    data-testid="user-search"
                  />
                </div>
                <Select value={userFilters.role} onValueChange={(value) => handleFilterChange('role', value)}>
                  <SelectTrigger className="w-32" data-testid="filter-role">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userFilters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="w-32" data-testid="filter-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => refetchUsers()} variant="outline" data-testid="refresh-users">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Loading users...
                </div>
              ) : usersData?.users ? (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b font-medium text-sm">
                      <div className="col-span-3">User</div>
                      <div className="col-span-2">Auth</div>
                      <div className="col-span-2">Activity</div>
                      <div className="col-span-2">Commerce</div>
                      <div className="col-span-2">Sessions</div>
                      <div className="col-span-1">Actions</div>
                    </div>
                    
                    {usersData.users.map((user: AdminUser) => (
                      <div key={user.id} className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-muted/50" data-testid={`user-row-${user.id}`}>
                        <div className="col-span-3 flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.picture_url || ''} />
                            <AvatarFallback>
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium" data-testid={`user-name-${user.id}`}>
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground" data-testid={`user-email-${user.id}`}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-span-2 space-y-1">
                          <Badge variant="outline" data-testid={`user-role-${user.id}`}>
                            {user.role}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {user.providers.join(", ") || user.auth_provider}
                          </div>
                        </div>
                        
                        <div className="col-span-2 text-sm">
                          <div data-testid={`user-last-login-${user.id}`}>
                            {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                          </div>
                          <div className="text-muted-foreground" data-testid={`user-ip-${user.id}`}>
                            {user.last_ip}
                          </div>
                        </div>
                        
                        <div className="col-span-2 text-sm">
                          <div data-testid={`user-orders-${user.id}`}>
                            {user.orders_count} orders
                          </div>
                          <div className="text-muted-foreground" data-testid={`user-ltv-${user.id}`}>
                            ${user.lifetime_value.toFixed(2)} LTV
                          </div>
                        </div>
                        
                        <div className="col-span-2 text-sm">
                          <Badge variant={user.active_sessions > 0 ? "default" : "secondary"} data-testid={`user-sessions-${user.id}`}>
                            {user.active_sessions} active
                          </Badge>
                        </div>
                        
                        <div className="col-span-1">
                          <Button variant="outline" size="sm" data-testid={`view-user-${user.id}`}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {usersData.pagination && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {usersData.users.length} of {usersData.pagination.total} users
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFilterChange('page', Math.max(1, userFilters.page - 1))}
                          disabled={userFilters.page <= 1}
                          data-testid="users-prev-page"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFilterChange('page', userFilters.page + 1)}
                          disabled={userFilters.page >= usersData.pagination.totalPages}
                          data-testid="users-next-page"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No access or data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" data-testid="products-content">
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Product management interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" data-testid="analytics-content">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" data-testid="system-content">
          <Card>
            <CardHeader>
              <CardTitle>System Administration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">System administration tools coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" data-testid="security-content">
          <Card>
            <CardHeader>
              <CardTitle>Security Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Security monitoring interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}