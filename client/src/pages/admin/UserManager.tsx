import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Edit, Trash2, Plus, Search, Shield, User } from "lucide-react";
import type { User as UserType } from "@shared/schema";

export function UserManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => apiRequest(`/api/users/${userId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: "User deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error deleting user", variant: "destructive" });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => 
      apiRequest(`/api/users/${userId}/role`, 'PATCH', { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: "User role updated successfully" });
    },
    onError: () => {
      toast({ title: "Error updating user role", variant: "destructive" });
    },
  });

  const filteredUsers = (users as UserType[]).filter((user: UserType) =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleRoleChange = (userId: number, newRole: string) => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'seller': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">Loading users...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <h2 className="text-2xl font-bold">User Management</h2>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: UserType) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role || 'user')}>
                      {user.role || 'user'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRoleChange(
                          Number(user.id), 
                          user.role === 'developer' ? 'user' : 'developer'
                        )}
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        {user.role === 'developer' ? 'Remove Developer' : 'Make Developer'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(Number(user.id))}
                        disabled={deleteUserMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found matching your search.
          </div>
        )}
      </Card>
    </div>
  );
}