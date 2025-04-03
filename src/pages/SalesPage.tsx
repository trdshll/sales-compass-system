
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PlusCircle } from 'lucide-react';

// Define types for our data
interface Customer {
  custno: string;
  custname: string;
}

interface Product {
  prodcode: string;
  description: string;
}

interface Employee {
  empno: string;
  firstname: string;
  lastname: string;
}

interface SalesDetail {
  prodcode: string;
  quantity: number;
  productDescription?: string;
}

interface Sale {
  transno: string;
  salesdate: string;
  custno: string;
  empno: string;
  customerName?: string;
  employeeName?: string;
  details?: SalesDetail[];
}

const SalesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Form state for adding new sale
  const [newSale, setNewSale] = useState<{
    transno: string;
    salesdate: string;
    custno: string;
    empno: string;
    details: Array<{
      prodcode: string;
      quantity: number;
    }>;
  }>({
    transno: '',
    salesdate: new Date().toISOString().split('T')[0],
    custno: '',
    empno: '',
    details: [{ prodcode: '', quantity: 0 }]
  });
  
  // Load sales data
  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('salesdate', { ascending: false });
        
      if (error) throw error;
      
      // Get customer and employee names
      const salesWithNames = await Promise.all((data || []).map(async (sale) => {
        // Get customer name
        let customerName = 'Unknown';
        if (sale.custno) {
          const { data: custData } = await supabase
            .from('customer')
            .select('custname')
            .eq('custno', sale.custno)
            .single();
          
          if (custData) customerName = custData.custname || 'Unknown';
        }
        
        // Get employee name
        let employeeName = 'Unknown';
        if (sale.empno) {
          const { data: empData } = await supabase
            .from('employee')
            .select('firstname, lastname')
            .eq('empno', sale.empno)
            .single();
          
          if (empData) employeeName = `${empData.firstname || ''} ${empData.lastname || ''}`.trim() || 'Unknown';
        }
        
        return {
          ...sale,
          customerName,
          employeeName
        };
      }));
      
      setSales(salesWithNames);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        variant: "destructive",
        title: "Error loading sales",
        description: "There was a problem loading the sales data.",
      });
    }
  };
  
  // Load customers, employees, and products
  const fetchReferenceData = async () => {
    try {
      // Get customers
      const { data: customersData, error: customersError } = await supabase
        .from('customer')
        .select('custno, custname');
        
      if (customersError) throw customersError;
      setCustomers(customersData || []);
      
      // Get employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employee')
        .select('empno, firstname, lastname');
        
      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);
      
      // Get products
      const { data: productsData, error: productsError } = await supabase
        .from('product')
        .select('prodcode, description');
        
      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching reference data:', error);
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: "There was a problem loading the reference data.",
      });
    }
  };
  
  // Load sales details for a specific sale
  const viewSaleDetails = async (sale: Sale) => {
    try {
      setSelectedSale(sale);
      
      const { data, error } = await supabase
        .from('salesdetail')
        .select('*')
        .eq('transno', sale.transno);
        
      if (error) throw error;
      
      // Get product descriptions
      const detailsWithProducts = await Promise.all((data || []).map(async (detail) => {
        const { data: prodData } = await supabase
          .from('product')
          .select('description')
          .eq('prodcode', detail.prodcode)
          .single();
        
        return {
          ...detail,
          productDescription: prodData?.description || 'Unknown Product'
        };
      }));
      
      setSelectedSale({
        ...sale,
        details: detailsWithProducts
      });
      
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching sale details:', error);
      toast({
        variant: "destructive",
        title: "Error loading details",
        description: "There was a problem loading the sale details.",
      });
    }
  };
  
  // Add a new sale
  const addSale = async () => {
    try {
      // First insert the sales record
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .insert([
          {
            transno: newSale.transno,
            salesdate: newSale.salesdate,
            custno: newSale.custno,
            empno: newSale.empno
          }
        ])
        .select();
      
      if (salesError) throw salesError;
      
      // Then insert the sales details
      const salesDetails = newSale.details.map(detail => ({
        transno: newSale.transno,
        prodcode: detail.prodcode,
        quantity: detail.quantity
      }));
      
      const { error: detailsError } = await supabase
        .from('salesdetail')
        .insert(salesDetails);
      
      if (detailsError) throw detailsError;
      
      toast({
        title: "Sale created",
        description: `Transaction #${newSale.transno} has been created successfully.`,
      });
      
      // Reset form and reload data
      setNewSale({
        transno: '',
        salesdate: new Date().toISOString().split('T')[0],
        custno: '',
        empno: '',
        details: [{ prodcode: '', quantity: 0 }]
      });
      
      setIsAddDialogOpen(false);
      fetchSales();
    } catch (error) {
      console.error('Error adding sale:', error);
      toast({
        variant: "destructive",
        title: "Error creating sale",
        description: "There was a problem creating the sale record.",
      });
    }
  };
  
  // Add a new detail line to the sale
  const addDetailLine = () => {
    setNewSale({
      ...newSale,
      details: [...newSale.details, { prodcode: '', quantity: 0 }]
    });
  };
  
  // Update sale detail line
  const updateDetailLine = (index: number, field: string, value: string | number) => {
    const updatedDetails = [...newSale.details];
    
    if (field === 'prodcode') {
      updatedDetails[index] = {
        ...updatedDetails[index],
        prodcode: value as string
      };
    } else if (field === 'quantity') {
      // Convert string to number
      const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
      updatedDetails[index] = {
        ...updatedDetails[index],
        quantity: numValue
      };
    }
    
    setNewSale({
      ...newSale,
      details: updatedDetails
    });
  };
  
  // Remove a detail line
  const removeDetailLine = (index: number) => {
    if (newSale.details.length > 1) {
      const updatedDetails = [...newSale.details];
      updatedDetails.splice(index, 1);
      setNewSale({
        ...newSale,
        details: updatedDetails
      });
    }
  };
  
  useEffect(() => {
    fetchSales();
    fetchReferenceData();
  }, []);
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Sales Transactions</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>View and manage your sales transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No sales records found. Create your first sale by clicking "New Sale".
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.transno}>
                      <TableCell>{sale.transno}</TableCell>
                      <TableCell>{new Date(sale.salesdate).toLocaleDateString()}</TableCell>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell>{sale.employeeName}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => viewSaleDetails(sale)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Add Sale Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Sale</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="transno" className="text-sm font-medium">Transaction Number</label>
                <Input 
                  id="transno" 
                  value={newSale.transno} 
                  onChange={(e) => setNewSale({...newSale, transno: e.target.value})}
                  placeholder="Enter transaction number"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="salesdate" className="text-sm font-medium">Sale Date</label>
                <Input 
                  id="salesdate" 
                  type="date" 
                  value={newSale.salesdate} 
                  onChange={(e) => setNewSale({...newSale, salesdate: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="custno" className="text-sm font-medium">Customer</label>
                <Select value={newSale.custno} onValueChange={(value) => setNewSale({...newSale, custno: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.custno} value={customer.custno}>
                        {customer.custname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="empno" className="text-sm font-medium">Employee</label>
                <Select value={newSale.empno} onValueChange={(value) => setNewSale({...newSale, empno: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.empno} value={employee.empno}>
                        {employee.firstname} {employee.lastname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Sale Details</h3>
                <Button type="button" size="sm" variant="outline" onClick={addDetailLine}>
                  Add Product
                </Button>
              </div>
              
              {newSale.details.map((detail, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 items-end">
                  <div className="col-span-3">
                    <label className="text-sm font-medium">Product</label>
                    <Select 
                      value={detail.prodcode} 
                      onValueChange={(value) => updateDetailLine(index, 'prodcode', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.prodcode} value={product.prodcode}>
                            {product.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <Input 
                      type="number" 
                      value={detail.quantity} 
                      onChange={(e) => updateDetailLine(index, 'quantity', e.target.value)}
                      min="1"
                    />
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon"
                    disabled={newSale.details.length <= 1}
                    onClick={() => removeDetailLine(index)}
                  >
                    &times;
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addSale}>
                Create Sale
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* View Sale Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Sale Details - {selectedSale?.transno}</DialogTitle>
            </DialogHeader>
            
            {selectedSale && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Transaction Number</p>
                    <p className="font-medium">{selectedSale.transno}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(selectedSale.salesdate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{selectedSale.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Employee</p>
                    <p className="font-medium">{selectedSale.employeeName}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Items</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.details?.length ? (
                        selectedSale.details.map((detail, index) => (
                          <TableRow key={index}>
                            <TableCell>{detail.productDescription}</TableCell>
                            <TableCell className="text-right">{detail.quantity}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                            No details found for this sale.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SalesPage;
