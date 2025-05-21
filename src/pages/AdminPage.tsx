
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserWithRole {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

const AdminPage = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Get all users with their roles from user_roles table
      const { data: userData, error: userError } = await supabase.rpc('get_all_users');
      
      if (userError) throw userError;
      
      setUsers(userData || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Failed to fetch users",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      // Check if the user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);
          
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });
          
        if (error) throw error;
      }

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast({
        title: "Role updated",
        description: `User role has been updated to ${newRole}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update role",
        description: error.message,
      });
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>
              Assign admin roles to users. Admins can perform soft deletes and see deleted records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <ScrollArea className="h-[500px]">
              <Table>
                <TableCaption>Manage user roles and permissions</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">Loading users...</TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">No users found</TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((userData) => (
                      <TableRow key={userData.id}>
                        <TableCell>{userData.email}</TableCell>
                        <TableCell>
                          <RadioGroup 
                            value={userData.role} 
                            onValueChange={(value: 'admin' | 'user') => updateUserRole(userData.id, value)}
                            className="flex flex-row space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="user" id={`user-${userData.id}`} />
                              <Label htmlFor={`user-${userData.id}`}>User</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="admin" id={`admin-${userData.id}`} />
                              <Label htmlFor={`admin-${userData.id}`}>Admin</Label>
                            </div>
                          </RadioGroup>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminPage;
