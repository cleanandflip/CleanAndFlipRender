import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { DataTable } from '@/components/admin/DataTable';
import { Pagination } from '@/components/admin/Pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { 
  UserPlus, 
  MoreVertical, 
  Shield, 
  Mail, 
  Ban,
  CalendarIcon,
  Download
} from 'lucide-react';
import { formatCurrency } from '@/utils/submissionHelpers';

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: 'user' | 'developer' | 'admin';
  isAdmin: boolean;
  isLocalCustomer: boolean;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  lastActiveAt?: string;
  status: 'active' | 'inactive' | 'suspended';
}

const defaultFilters = {
  search: '',
  role: 'all',
  status: 'all',
  dateRange: { from: null, to: null },
  sortBy: 'created',
  sortOrder: 'desc' as 'asc' | 'desc',
  page: 1,
  limit: 20
};

export function UserManager() {
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: filters.search,
        role: filters.role,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      });
      
      if (filters.dateRange.from) params.append('dateFrom', (filters.dateRange.from as Date).toISOString());
      if (filters.dateRange.to) params.append('dateTo', (filters.dateRange.to as Date).toISOString());
      
      const res = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      });
      
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();

      return data;
    },
    retry: 2
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "User updated successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update user",
        variant: "destructive" 
      });
    }
  });

  // Individual user actions
  const handleViewUser = (user: User) => {
    toast({
      title: "User Details",
      description: `User details for ${user.email} coming soon`,
    });
  };

  const handleEmailUser = (user: User) => {
    window.location.href = `mailto:${user.email}?subject=Account Information`;
  };

  const handleToggleAdmin = async (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    updateUserMutation.mutate({
      userId: user.id,
      updates: { role: newRole }
    });
  };

  const handleSuspendUser = async (user: User) => {
    if (confirm(`${user.status === 'suspended' ? 'Unsuspend' : 'Suspend'} ${user.email}?`)) {
      const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
      updateUserMutation.mutate({
        userId: user.id,
        updates: { status: newStatus }
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    const confirmActions: Record<string, string> = {
      activate: 'activate these users',
      suspend: 'suspend these users',
      delete: 'delete these users',
      export: 'export these users'
    };
    
    if (action !== 'export' && !confirm(`Are you sure you want to ${confirmActions[action]}?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, userIds: Array.from(selectedUsers) })
      });

      if (!res.ok) throw new Error('Bulk action failed');

      if (action === 'export') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        refetch();
        setSelectedUsers(new Set());
        toast({ title: `Successfully ${action}d ${selectedUsers.size} users` });
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: `Failed to ${action} users`,
        variant: "destructive" 
      });
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        format,
        search: filters.search,
        role: filters.role,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      const res = await fetch(`/api/admin/users/export?${params}`, {
        credentials: 'include'
      });
      
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({ 
        title: "Export failed", 
        description: "Could not export users data",
        variant: "destructive" 
      });
    }
  };

  const columns = [
    { key: 'select', label: '', width: '50px' },
    { 
      key: 'name', 
      label: 'Name', 
      sortable: true,
      render: (user: User) => (
        <div>
          <div className="font-medium">
            {user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.email.split('@')[0]
            }
          </div>
          <div className="text-xs text-text-muted">{user.email}</div>
        </div>
      )
    },
    { 
      key: 'role', 
      label: 'Role', 
      sortable: true,
      render: (user: User) => (
        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
          {user.role === 'admin' ? 'Admin' : user.role === 'developer' ? 'Developer' : 'Customer'}
        </Badge>
      )
    },
    { 
      key: 'orders', 
      label: 'Orders', 
      sortable: true,
      render: (user: User) => user.totalOrders || 0
    },
    { 
      key: 'spent', 
      label: 'Total Spent', 
      sortable: true,
      render: (user: User) => formatCurrency(user.totalSpent || 0)
    },
    { 
      key: 'location', 
      label: 'Location', 
      render: (user: User) => (
        <Badge variant={user.isLocalCustomer ? 'default' : 'outline'}>
          {user.isLocalCustomer ? 'Local' : 'Remote'}
        </Badge>
      )
    },
    { 
      key: 'joined', 
      label: 'Joined', 
      sortable: true,
      render: (user: User) => new Date(user.createdAt).toLocaleDateString()
    },
    { key: 'actions', label: 'Actions', width: '100px' }
  ];

  return (
    <DashboardLayout
      title="User Management"
      description="Manage customer accounts and permissions"
      totalCount={data?.total || 0}
      searchPlaceholder="Search users by name, email, or location..."
      onSearch={(query) => setFilters({ ...filters, search: query, page: 1 })}
      onRefresh={refetch}
      onExport={handleExport}
      isLoading={isLoading}
      sortOptions={[
        { value: 'name-asc', label: 'Name A-Z' },
        { value: 'name-desc', label: 'Name Z-A' },
        { value: 'created-desc', label: 'Newest First' },
        { value: 'created-asc', label: 'Oldest First' },
        { value: 'spent-desc', label: 'Highest Spent' },
        { value: 'orders-desc', label: 'Most Orders' }
      ]}
      onSort={(value) => {
        const [sortBy, sortOrder] = value.split('-');
        setFilters({ ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
      }}
      filters={
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={filters.role}
            onValueChange={(v) => setFilters({ ...filters, role: v, page: 1 })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">Customers</SelectItem>
              <SelectItem value="developer">Developers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filters.status}
            onValueChange={(v) => setFilters({ ...filters, status: v, page: 1 })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                Date Range
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 glass border-border">
              <Calendar
                mode="range"
                selected={filters.dateRange as any}
                onSelect={(range) => setFilters({ ...filters, dateRange: (range as any) || { from: null, to: null } })}
              />
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            onClick={() => setFilters(defaultFilters)}
          >
            Clear Filters
          </Button>
        </div>
      }
      actions={
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Invite User
        </Button>
      }
    >
      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
          <p className="text-primary">
            {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('export')}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('activate')}
            >
              Activate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction('suspend')}
            >
              Suspend
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.users || []}
        selectedRows={selectedUsers}
        onSelectRow={(id) => {
          const newSelected = new Set(selectedUsers);
          if (newSelected.has(id)) {
            newSelected.delete(id);
          } else {
            newSelected.add(id);
          }
          setSelectedUsers(newSelected);
        }}
        onSort={(column, order) => {
          setFilters({ ...filters, sortBy: column, sortOrder: order });
        }}
        isLoading={isLoading}
        actions={(user) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleViewUser(user)}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEmailUser(user)}>
                <Mail className="w-4 h-4 mr-2" />
                Email User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleAdmin(user)}>
                <Shield className="w-4 h-4 mr-2" />
                {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleSuspendUser(user)}
                className="text-red-400"
              >
                <Ban className="w-4 h-4 mr-2" />
                {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'} User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <Pagination
        currentPage={filters.page}
        totalPages={Math.ceil((data?.total || 0) / filters.limit)}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />
    </DashboardLayout>
  );
}