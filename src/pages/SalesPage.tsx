
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Search } from 'lucide-react';

// Initial sales data
const initialSales = [
  {
    id: '1',
    date: '2023-05-01',
    customer: 'Acme Corp',
    amount: 5000,
    status: 'completed',
    products: [
      { id: '1', name: 'Product A', quantity: 2, price: 2000 },
      { id: '2', name: 'Product B', quantity: 1, price: 1000 },
    ],
  },
  {
    id: '2',
    date: '2023-05-15',
    customer: 'Globex Inc',
    amount: 7500,
    status: 'completed',
    products: [
      { id: '3', name: 'Product C', quantity: 3, price: 2500 },
    ],
  },
  {
    id: '3',
    date: '2023-06-01',
    customer: 'Stark Industries',
    amount: 12000,
    status: 'pending',
    products: [
      { id: '1', name: 'Product A', quantity: 4, price: 2000 },
      { id: '4', name: 'Product D', quantity: 2, price: 2000 },
    ],
  },
];

// Products for the new sale form
const products = [
  { id: '1', name: 'Product A', price: 2000 },
  { id: '2', name: 'Product B', price: 1000 },
  { id: '3', name: 'Product C', price: 2500 },
  { id: '4', name: 'Product D', price: 2000 },
];

// Customers for the new sale form
const customers = [
  { id: '1', name: 'Acme Corp' },
  { id: '2', name: 'Globex Inc' },
  { id: '3', name: 'Stark Industries' },
  { id: '4', name: 'Wayne Enterprises' },
];

// Schema for the new sale form
const formSchema = z.object({
  customer: z.string().min(1, { message: 'Please select a customer' }),
  product: z.string().min(1, { message: 'Please select a product' }),
  quantity: z.string().transform(val => parseInt(val, 10)).refine(val => !isNaN(val) && val > 0, {
    message: 'Quantity must be a positive number',
  }),
});

type FormData = z.infer<typeof formSchema>;

const SalesPage = () => {
  const [sales, setSales] = useState(initialSales);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isNewSaleDialogOpen, setIsNewSaleDialogOpen] = useState(false);
  const [isSaleDetailsDialogOpen, setIsSaleDetailsDialogOpen] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: '',
      product: '',
      quantity: '1',
    },
  });
  
  // Filter sales based on search term
  const filteredSales = sales.filter(sale => 
    sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.amount.toString().includes(searchTerm) ||
    sale.id.includes(searchTerm)
  );
  
  // Handle view sale details
  const handleViewSaleDetails = (sale: any) => {
    setSelectedSale(sale);
    setIsSaleDetailsDialogOpen(true);
  };
  
  // Handle create new sale
  const onSubmit = (data: FormData) => {
    const selectedProduct = products.find(p => p.id === data.product);
    const selectedCustomer = customers.find(c => c.id === data.customer);
    
    if (selectedProduct && selectedCustomer) {
      const newSale = {
        id: (sales.length + 1).toString(),
        date: new Date().toISOString().split('T')[0],
        customer: selectedCustomer.name,
        amount: selectedProduct.price * parseInt(data.quantity, 10),
        status: 'completed',
        products: [
          {
            id: selectedProduct.id,
            name: selectedProduct.name,
            quantity: parseInt(data.quantity, 10),
            price: selectedProduct.price,
          },
        ],
      };
      
      setSales([...sales, newSale]);
      setIsNewSaleDialogOpen(false);
      form.reset();
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
            <p className="text-muted-foreground">Manage your sales records</p>
          </div>
          <Button onClick={() => setIsNewSaleDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sales by customer or amount..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sales Records</CardTitle>
            <CardDescription>Showing {filteredSales.length} of {sales.length} total sales</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>#{sale.id}</TableCell>
                    <TableCell>{sale.date}</TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell>${sale.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sale.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewSaleDetails(sale)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Sale details dialog */}
      <Dialog open={isSaleDetailsDialogOpen} onOpenChange={setIsSaleDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>
              Sale ID: #{selectedSale?.id} | Date: {selectedSale?.date}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                <p className="text-base">{selectedSale.customer}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedSale.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {selectedSale.status}
                </span>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Products</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale.products.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>${product.price}</TableCell>
                        <TableCell>${product.price * product.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-between font-medium">
                <span>Total Amount:</span>
                <span>${selectedSale.amount.toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* New sale dialog */}
      <Dialog open={isNewSaleDialogOpen} onOpenChange={setIsNewSaleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Sale</DialogTitle>
            <DialogDescription>
              Add a new sale record to your system
            </DialogDescription>
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
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} (${product.price})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Create Sale</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SalesPage;
