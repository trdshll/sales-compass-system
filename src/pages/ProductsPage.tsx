
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';

// Sample data - in a real app, this would come from your database
const products = [
  { id: 1, name: 'Premium Widget', category: 'Widgets', price: 129.99, stock: 23 },
  { id: 2, name: 'Basic Gadget', category: 'Gadgets', price: 49.99, stock: 156 },
  { id: 3, name: 'Super Tool', category: 'Tools', price: 89.99, stock: 38 },
  { id: 4, name: 'Mega Accessory', category: 'Accessories', price: 19.99, stock: 290 },
  { id: 5, name: 'Ultra Device', category: 'Devices', price: 299.99, stock: 12 },
  { id: 6, name: 'Special Component', category: 'Components', price: 159.99, stock: 62 },
  { id: 7, name: 'Value Pack', category: 'Bundles', price: 399.99, stock: 8 },
];

const ProductsPage = () => {
  const { user } = useAuth();
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Products</h1>
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            Add Product
          </Button>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            className="pl-10 w-full max-w-md"
            placeholder="Search products..."
          />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        product.stock > 20 ? 'bg-green-100 text-green-800' : 
                        product.stock > 5 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.stock}
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

export default ProductsPage;
