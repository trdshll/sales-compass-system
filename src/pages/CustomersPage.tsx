
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

// Sample data - in a real app, this would come from your database
const customers = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', purchases: 12, status: 'Active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', purchases: 8, status: 'Active' },
  { id: 3, name: 'Carol Williams', email: 'carol@example.com', purchases: 5, status: 'Inactive' },
  { id: 4, name: 'Dave Brown', email: 'dave@example.com', purchases: 15, status: 'Active' },
  { id: 5, name: 'Eve Davis', email: 'eve@example.com', purchases: 3, status: 'Active' },
  { id: 6, name: 'Frank Miller', email: 'frank@example.com', purchases: 7, status: 'Inactive' },
  { id: 7, name: 'Grace Wilson', email: 'grace@example.com', purchases: 10, status: 'Active' },
];

const CustomersPage = () => {
  const { user } = useAuth();
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Customers</h1>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            className="pl-10 w-full max-w-md"
            placeholder="Search customers..."
          />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Customer Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Purchases</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.purchases}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        customer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CustomersPage;
