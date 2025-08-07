import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  UserPlus,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingCart,
  Heart,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isAdmin: boolean;
  city: string;
  state: string;
  zipCode: string;
  isLocalCustomer: boolean;
  stripeCustomerId?: string;
  createdAt: string;
  lastLoginAt?: string;
  totalOrders: number;
  totalSpent: number;
  wishlistCount: number;
  submissionsCount: number;
}

interface UsersTabCompleteProps {
  className?: string;
}

export const UsersTabComplete: React.FC<UsersTabCompleteProps> = ({ className }) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const queryClient = useQueryClient();
  
  // Fetch users with advanced filtering
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', { search, roleFilter, locationFilter, statusFilter, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        role: roleFilter,
        location: locationFilter,
        status: statusFilter,
        page: page.toString(),
        limit: limit.toString()
      });
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });
  
  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (!response.ok) throw new Error('Failed to update user role');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User role updated successfully');
    },
    onError: () => {
      toast.error('Failed to update user role');
    }
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete user');
    }
  });
  
  // Export users
  const exportUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/export', {
        method: 'GET'
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Users exported successfully');
    } catch (error) {
      toast.error('Failed to export users');
    }
  };
  
  // Get status badge
  const getStatusBadge = (user: User) => {
    if (user.isAdmin) {
      return <Badge variant="destructive">Admin</Badge>;
    }
    
    if (user.lastLoginAt) {
      const daysSinceLogin = Math.floor(
        (Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLogin <= 7) {
        return <Badge variant="default">Active</Badge>;
      } else if (daysSinceLogin <= 30) {
        return <Badge variant="secondary">Recent</Badge>;
      } else {
        return <Badge variant="outline">Inactive</Badge>;
      }
    }
    
    return <Badge variant="outline">New</Badge>;
  };
  
  const users = usersData?.users || [];
  const totalUsers = usersData?.total || 0;
  const totalPages = Math.ceil(totalUsers / limit);
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-white dark:text-white">
            Users Management
          </h2>
          <Badge variant="secondary" className="ml-2">
            {totalUsers} total
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={exportUsers} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="local">Local Customers</SelectItem>
            <SelectItem value="remote">Remote Customers</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="new">New</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Users Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  <p className="mt-2 text-gray-500">Loading users...</p>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-500">No users found</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {user.city}, {user.state} {user.zipCode}
                      {user.isLocalCustomer && (
                        <Badge variant="secondary" className="ml-2">Local</Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-3 h-3" />
                        Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </div>
                      {user.lastLoginAt && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          Last seen {format(new Date(user.lastLoginAt), 'MMM d')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3" />
                          {user.totalOrders}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${user.totalSpent}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {user.wishlistCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {user.submissionsCount}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(user)}
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateRoleMutation.mutate({
                            userId: user.id,
                            role: user.isAdmin ? 'customer' : 'admin'
                          })}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteUserMutation.mutate(user.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalUsers)} of {totalUsers} users
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            
            <span className="px-3 py-1 text-sm">
              Page {page} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {/* User Details Modal */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedUser.firstName} {selectedUser.lastName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white dark:text-white">Contact Information</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <p>Email: {selectedUser.email}</p>
                    <p>Location: {selectedUser.city}, {selectedUser.state} {selectedUser.zipCode}</p>
                    <p>Customer Type: {selectedUser.isLocalCustomer ? 'Local' : 'Remote'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-white dark:text-white">Account Details</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <p>Role: {selectedUser.isAdmin ? 'Administrator' : 'Customer'}</p>
                    <p>Member since: {format(new Date(selectedUser.createdAt), 'MMMM d, yyyy')}</p>
                    {selectedUser.lastLoginAt && (
                      <p>Last login: {format(new Date(selectedUser.lastLoginAt), 'MMMM d, yyyy')}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white dark:text-white">Activity Summary</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <p>Total Orders: {selectedUser.totalOrders}</p>
                    <p>Total Spent: ${selectedUser.totalSpent}</p>
                    <p>Wishlist Items: {selectedUser.wishlistCount}</p>
                    <p>Equipment Submissions: {selectedUser.submissionsCount}</p>
                  </div>
                </div>
                
                {selectedUser.stripeCustomerId && (
                  <div>
                    <h4 className="font-semibold text-white dark:text-white">Payment Information</h4>
                    <div className="mt-2 space-y-2 text-sm">
                      <p>Stripe Customer: {selectedUser.stripeCustomerId}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};