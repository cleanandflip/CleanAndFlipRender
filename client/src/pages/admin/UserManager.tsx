import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UnifiedDashboardCard } from '@/components/admin/UnifiedDashboardCard';
import { UnifiedStatCard } from '@/components/admin/UnifiedStatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, UserPlus, Shield, Edit, Trash2, Mail, Download, Search, Filter, Crown, DollarSign, User } from 'lucide-react';
import { formatCurrency } from '@/utils/submissionHelpers';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  status: 'active' | 'inactive' | 'suspended';
  totalSpent: number;
  orderCount: number;
  created_at: string;
  lastLogin: string;
}

export function UserManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });

  const handleBulkAction = (action: string) => {
    toast({ title: `Bulk ${action} functionality coming soon` });
  };

  const handleEditUser = (user: User) => {
    toast({ title: `Edit user functionality coming soon` });
  };

  const handleDeleteUser = (user: User) => {
    if (confirm(`Delete user ${user.email}?`)) {
      toast({ title: `Delete user functionality coming soon` });
    }
  };

  const handleEmailUser = (user: User) => {
    toast({ title: `Email user functionality coming soon` });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { className: 'bg-green-600/20 text-green-300 border-green-500/30' },
      inactive: { className: 'bg-gray-600/20 text-gray-300 border-gray-500/30' },
      suspended: { className: 'bg-red-600/20 text-red-300 border-red-500/30' }
    };
    return variants[status] || variants.inactive;
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* PROFESSIONAL HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Users Manager</h1>
            <p className="text-gray-400">Manage user accounts and permissions</p>
          </div>
          <div className="flex items-center gap-4">
            {selectedUsers.size > 0 && (
              <div className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-lg px-4 py-2">
                <span className="text-blue-300 text-sm font-medium">{selectedUsers.size} selected</span>
                <Button size="sm" onClick={() => handleBulkAction('action')}>
                  Bulk Action
                </Button>
              </div>
            )}
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => toast({ title: 'Create user functionality coming soon' })}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* USER STATISTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <UnifiedStatCard
            title="Total Users"
            value={data?.users?.length || 0}
            icon={<Users className="w-6 h-6 text-white" />}
            gradient="blue"
            change={8.2}
            subtitle="All registered users"
          />
          <UnifiedStatCard
            title="Active Users"
            value={data?.users?.filter((u: User) => u.status === 'active').length || 0}
            icon={<User className="w-6 h-6 text-white" />}
            gradient="green"
            change={5.1}
            subtitle="Currently active"
          />
          <UnifiedStatCard
            title="Admin Users"
            value={data?.users?.filter((u: User) => u.isAdmin).length || 0}
            icon={<Crown className="w-6 h-6 text-white" />}
            gradient="purple"
            subtitle="System administrators"
          />
          <UnifiedStatCard
            title="Total Revenue"
            value={`$${data?.users?.reduce((sum: number, u: User) => sum + (u.totalSpent || 0), 0).toFixed(2) || '0.00'}`}
            icon={<DollarSign className="w-6 h-6 text-white" />}
            gradient="orange"
            change={12.4}
            subtitle="From all customers"
          />
        </div>

        {/* ADVANCED FILTERS */}
        <UnifiedDashboardCard 
          title="Advanced Filters" 
          icon={<Filter className="w-5 h-5 text-white" />}
          gradient="blue"
          className="mb-6"
          actions={
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-700">
              <Download className="w-4 h-4 mr-2" />
              Export Users
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </UnifiedDashboardCard>
      </div>

      {/* USERS TABLE */}
      <UnifiedDashboardCard gradient="blue">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center text-white py-8">Loading users...</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-4 text-gray-300">
                    <Checkbox />
                  </th>
                  <th className="pb-4 text-gray-300">User</th>
                  <th className="pb-4 text-gray-300">Role</th>
                  <th className="pb-4 text-gray-300">Status</th>
                  <th className="pb-4 text-gray-300">Total Spent</th>
                  <th className="pb-4 text-gray-300">Orders</th>
                  <th className="pb-4 text-gray-300">Last Login</th>
                  <th className="pb-4 text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.users?.map((user: User) => (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-4">
                      <Checkbox />
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-gray-400 text-sm">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      {user.isAdmin ? (
                        <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                          <Crown className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-600/20 text-gray-300 border-gray-500/30">
                          Customer
                        </Badge>
                      )}
                    </td>
                    <td className="py-4">
                      <Badge className={getStatusBadge(user.status).className}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-4 text-white font-bold">
                      {formatCurrency(user.totalSpent || 0)}
                    </td>
                    <td className="py-4 text-gray-300">
                      {user.orderCount || 0}
                    </td>
                    <td className="py-4 text-gray-300">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEmailUser(user)}>
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </UnifiedDashboardCard>
    </div>
  );
}