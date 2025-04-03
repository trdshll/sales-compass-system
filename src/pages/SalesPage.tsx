
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, FileText, ArrowUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock data for now - would come from the database
const mockSales = [
  {
    id: '1',
    customer: 'Acme Corp',
    date: '2023-03-10',
    amount: 1299.99,
    status: 'Completed'
  },
  {
    id: '2',
    customer: 'Wayne Enterprises',
    date: '2023-03-09',
    amount: 2499.50,
    status: 'Pending'
  },
  {
    id: '3',
    customer: 'Stark Industries',
    date: '2023-03-08',
    amount: 3750.00,
    status: 'Completed'
  },
  {
    id: '4',
    customer: 'Umbrella Corp',
    date: '2023-03-07',
    amount: 1899.99,
    status: 'Cancelled'
  }
];

const mockProducts = [
  { id: 'prod1', name: 'Laptop', price: 1299.99 },
  { id: 'prod2', name: 'Smartphone', price: 899.99 },
  { id: 'prod3', name: 'Monitor', price: 499.99 },
  { id: 'prod4', name: 'Keyboard', price: 99.99 },
  { id: 'prod5', name: 'Mouse', price: 49.99 },
];

const mockCustomers = [
  { id: 'cust1', name: 'Acme Corp' },
  { id: 'cust2', name: 'Wayne Enterprises' },
  { id: 'cust3', name: 'Stark Industries' },
  { id: 'cust4', name: 'Umbrella Corp' },
];

const formSchema = z.object({
  customer: z.string().min(1, 'Customer is required'),
  products: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.string().min(1, 'Quantity is required').transform(val => parseInt(val, 10)),
  })).min(1, 'At least one product is required'),
});

type FormValues = z.infer<typeof formSchema>;

const SalesPage = () => {
  const [sales, setSales] = useState(mockSales);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSale, setSelectedSale] = useState<null | any>(null);
  const [showAddSaleDialog, setShowAddSaleDialog] = useState(false);
  const [products, setProducts] = useState<{ productId: string, quantity: string }[]>([
    { productId: '', quantity: '1' },
  ]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: '',
      products: [{ productId: '', quantity: '1' }],
    },
  });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    
    // Sort the sales based on date
    const sortedSales = [...sales].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateB - dateA : dateA - dateB;
    });
    
    setSales(sortedSales);
  };

  const addProduct = () => {
    setProducts([...products, { productId: '', quantity: '1' }]);
  };

  const removeProduct = (index: number) => {
    const updatedProducts = [...products];
    updatedProducts.splice(index, 1);
    setProducts(updatedProducts);
  };

  const onSubmit = (data: FormValues) => {
    console.log('Form submitted:', data);
    
    // Calculate total amount
    let totalAmount = 0;
    data.products.forEach(product => {
      const productInfo = mockProducts.find(p => p.id === product.productId);
      if (productInfo) {
        totalAmount += productInfo.price * product.quantity;
      }
    });
    
    // Create new sale
    const newSale = {
      id: (sales.length + 1).toString(),
      customer: mockCustomers.find(c => c.id === data.customer)?.name || data.customer,
      date: new Date().toISOString().split('T')[0],
      amount: parseFloat(totalAmount.toFixed(2)),
      status: 'Pending'
    };
    
    // Add to sales list
    setSales([newSale, ...sales]);
    
    // Reset form and close dialog
    form.reset();
    setProducts([{ productId: '', quantity: '1' }]);
    setShowAddSaleDialog(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Management</h1>
        
        <Dialog open={showAddSaleDialog} onOpenChange={setShowAddSaleDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Sale</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockCustomers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Products</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addProduct}
                    >
                      Add Product
                    </Button>
                  </div>
                  
                  {products.map((product, index) => (
                    <div key={index} className="flex gap-4 items-end">
                      <div className="flex-1">
                        <FormLabel>Product</FormLabel>
                        <Select 
                          value={product.productId}
                          onValueChange={(value) => {
                            const newProducts = [...products];
                            newProducts[index].productId = value;
                            setProducts(newProducts);
                            form.setValue(`products.${index}.productId`, value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockProducts.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} (${product.price.toFixed(2)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="w-24">
                        <FormLabel>Quantity</FormLabel>
                        <Input 
                          type="number" 
                          min={1} 
                          value={product.quantity}
                          onChange={(e) => {
                            const newProducts = [...products];
                            newProducts[index].quantity = e.target.value;
                            setProducts(newProducts);
                            form.setValue(`products.${index}.quantity`, e.target.value);
                          }}
                        />
                      </div>
                      
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        disabled={products.length === 1}
                        onClick={() => removeProduct(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button type="submit">Create Sale</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>Recent Sales</span>
            <Button variant="ghost" onClick={toggleSortOrder}>
              Date <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.id}</TableCell>
                  <TableCell>{sale.customer}</TableCell>
                  <TableCell>{sale.date}</TableCell>
                  <TableCell>${sale.amount.toFixed(2)}</TableCell>
                  <TableCell>{sale.status}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesPage;
