// UNIFIED USERS TAB WITH LIVE SYNC
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Crown, Shield, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { UnifiedDataTable } from '@/components/admin/UnifiedDataTable';
import { UnifiedButton } from '@/components/admin/UnifiedButton';
import { useToast } from '@/hooks/use-toast';
import { EnhancedUserModal } from '@/components/admin/modals/EnhancedUserModal';
import { useSocket } from '@/hooks/useSingletonSocket.tsx';
import { useWebSocketReady } from '@/hooks/useWebSocketState';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'developer';
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
}

export function UsersTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { subscribe } = useSocket();
  const ready = useWebSocketReady();

  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', searchQuery],
    queryFn: async () => {
      try {
        const res = await fetch('/api/users', { credentials: 'include' });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
        }
        return await res.json();
      } catch (error) {
        console.error('Failed to fetch users:', error);
        throw error;
      }
    }
  });

  // Handle live sync updates
  useEffect(() => {
    if (lastMessage?.type === 'user_update') {
      // Invalidate and refetch users data
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      
      // Show sync animation
      const tableElement = document.querySelector('[data-table="users"]');
      if (tableElement) {
        tableElement.classList.add('animate-liveSync');
        setTimeout(() => {
          tableElement.classList.remove('animate-liveSync');
        }, 800);
      }
    }
  }, [lastMessage, queryClient]);

  const users: User[] = Array.isArray(usersData) ? usersData : [];

  // Action handlers
  const handleView = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete "${user.firstName} ${user.lastName}"? This action cannot be undone.`)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      refetch(); // Refresh the data
      toast({
        title: "User Deleted",
        description: `${user.firstName} ${user.lastName} has been permanently deleted`,
      });
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportUsers = async () => {
    try {
      // Generate CSV data for users
      const csvHeaders = 'Name,Email,Role,Status,Last Login,Created Date\n';
      const csvData = users.map((u: User) => 
        `"${u.firstName} ${u.lastName}","${u.email}","${u.role}","${u.isActive ? 'Active' : 'Inactive'}","${u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}","${new Date(u.createdAt).toLocaleDateString()}"`
      ).join('\n');
      
      const fullCsv = csvHeaders + csvData;
      const blob = new Blob([fullCsv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: `Exported ${users.length} users to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export users data",
        variant: "destructive",
      });
    }
  };

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
          "bg-blue-500/20 text-blue-400"
        )}>
          {user.role === 'developer' && <Crown className="w-3 h-3" />}
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
          title="Developers"
          value={users.filter(u => u.role === 'developer').length}
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
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">User Management</h2>
            <div className="flex items-center gap-2">
              {ready ? (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
                  <Wifi className="w-3 h-3 text-green-400 animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">Live Sync</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full">
                  <WifiOff className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-red-400 font-medium">Offline</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-400 mt-1">Manage registered users and permissions</p>
        </div>
        <UnifiedButton
          variant="primary"
          icon={UserPlus}
          onClick={() => {
            setSelectedUser(null);
            setShowUserModal(true);
          }}
        >
          Add User
        </UnifiedButton>
      </div>

      {/* Table */}
      <div data-table="users">
        <UnifiedDataTable
          data={users}
          columns={columns}
          searchPlaceholder="Search users by name or email..."
          onSearch={setSearchQuery}
          onRefresh={refetch}
          onExport={handleExportUsers}
          loading={isLoading}
          actions={{
            onView: handleView,
            onEdit: handleEdit,
            onDelete: handleDelete
          }}
          pagination={{
            currentPage: 1,
            totalPages: Math.ceil(users.length / 20) || 1,
            onPageChange: (page) => console.log('Page:', page)
          }}
        />
      </div>

      {/* Modal */}
      {showUserModal && (
        <EnhancedUserModal 
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }} 
          onSave={refetch}
        />
      )}
    </div>
  );
}