// UNIFIED USERS TAB
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, UserPlus, Crown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { UnifiedDataTable } from '@/components/admin/UnifiedDataTable';
import { UnifiedButton } from '@/components/admin/UnifiedButton';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'developer';
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
}

export function UsersTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', searchQuery],
    queryFn: async () => {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });

  const users: User[] = Array.isArray(usersData) ? usersData : [];

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
            {user.firstName?.[0] || user.email[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-white">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.email
              }
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (user: User) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit",
          user.role === 'developer' ? "bg-purple-500/20 text-purple-400" :
          user.role === 'admin' ? "bg-red-500/20 text-red-400" :
          "bg-blue-500/20 text-blue-400"
        )}>
          {user.role === 'developer' && <Crown className="w-3 h-3" />}
          {user.role === 'admin' && <Shield className="w-3 h-3" />}
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (user: User) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-medium",
          user.isActive 
            ? "bg-green-500/20 text-green-400" 
            : "bg-gray-500/20 text-gray-400"
        )}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      render: (user: User) => (
        <span className="text-gray-400">
          {user.lastLogin 
            ? new Date(user.lastLogin).toLocaleDateString()
            : 'Never'
          }
        </span>
      ),
      sortable: true
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (user: User) => (
        <span className="text-gray-400">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
      sortable: true
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <UnifiedMetricCard
          title="Total Users"
          value={users.length}
          icon={Users}
          change={{ value: 12, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Active Users"
          value={users.filter(u => u.isActive).length}
          icon={Users}
          change={{ value: 8, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Admins"
          value={users.filter(u => u.role === 'admin').length}
          icon={Shield}
        />
        <UnifiedMetricCard
          title="New This Month"
          value={users.filter(u => {
            const created = new Date(u.createdAt);
            const now = new Date();
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return created >= thisMonth;
          }).length}
          icon={UserPlus}
          change={{ value: 25, label: 'from last month' }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-gray-400 mt-1">Manage registered users and permissions</p>
        </div>
        <UnifiedButton
          variant="primary"
          icon={UserPlus}
          onClick={() => {/* Add user modal */}}
        >
          Add User
        </UnifiedButton>
      </div>

      {/* Table */}
      <UnifiedDataTable
        data={users}
        columns={columns}
        searchPlaceholder="Search users by name or email..."
        onSearch={setSearchQuery}
        onRefresh={refetch}
        onExport={() => console.log('Export users')}
        loading={isLoading}
        actions={{
          onView: (user) => console.log('View user:', user),
          onEdit: (user) => console.log('Edit user:', user),
          onDelete: (user) => console.log('Delete user:', user)
        }}
        pagination={{
          currentPage: 1,
          totalPages: Math.ceil(users.length / 20) || 1,
          onPageChange: (page) => console.log('Page:', page)
        }}
      />
    </div>
  );
}