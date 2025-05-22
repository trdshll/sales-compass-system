
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = "admin" | "user";

interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
}

const AdminPage = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_all_users');
      
      if (error) throw error;
      
      // Convert the role string to UserRole type
      const typedUsers: UserWithRole[] = data.map((user: any) => ({
        ...user,
        role: user.role === 'admin' ? 'admin' : 'user' as UserRole
      }));
      
      setUsers(typedUsers);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to load users",
        description: error.message || "An error occurred while fetching users."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setSaving(prev => ({ ...prev, [userId]: true }));
      
      if (newRole === 'admin') {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .upsert({ 
            user_id: userId, 
            role: 'admin'
          });
        
        if (error) throw error;
      } else {
        // Remove admin role by deleting the record
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
        
        if (error) throw error;
      }
      
      setUsers(prev => 
        prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );
      
      toast({
        title: "Role updated",
        description: `User role has been updated successfully.`
      });
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update role",
        description: error.message || "An error occurred while updating the user role."
      });
    } finally {
      setSaving(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user roles and permissions in your application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userItem) => (
                      <TableRow key={userItem.id}>
                        <TableCell>
                          {userItem.email}
                          {user?.id === userItem.id && " (You)"}
                        </TableCell>
                        <TableCell>
                          <RadioGroup
                            value={userItem.role}
                            onValueChange={(value: string) => 
                              handleRoleChange(userItem.id, value as UserRole)
                            }
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="admin" id={`admin-${userItem.id}`} />
                              <Label htmlFor={`admin-${userItem.id}`}>Admin</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="user" id={`user-${userItem.id}`} />
                              <Label htmlFor={`user-${userItem.id}`}>User</Label>
                            </div>
                          </RadioGroup>
                        </TableCell>
                        <TableCell>
                          {saving[userItem.id] ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                          ) : user?.id === userItem.id ? (
                            <span className="text-sm text-muted-foreground">Cannot change your own role</span>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminPage;
