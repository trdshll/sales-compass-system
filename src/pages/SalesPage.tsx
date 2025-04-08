import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PlusCircle, Edit, Trash2, ArrowRight, ReceiptText, Users } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Define types for our data
interface Customer {
  custno: string;
  custname: string;
}

interface Product {
  prodcode: string;
  description: string;
  currentPrice?: number;
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
  unitPrice?: number;
  subtotal?: number;
}

interface Sale {
  transno: string;
  salesdate: string;
  custno: string;
  empno: string;
  customerName?: string;
  employeeName?: string;
  details?: SalesDetail[];
  total?: number;
}

interface CustomerSummary {
  custno: string;
  custname: string;
  totalSales: number;
  saleCount: number;
}

const SalesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerSummaries, setCustomerSummaries] = useState<CustomerSummary[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  
  // Form state for adding/editing sale
  const [saleForm, setSaleForm] = useState<{
    transno: string;
    salesdate: string;
    custno: string;
    empno: string;
    details: Array<{
      prodcode: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
    total: number;
  }>({
    transno: '',
    salesdate: new Date().toISOString().split('T')[0],
    custno: '',
    empno: '',
    details: [{ prodcode: '', quantity: 1, unitPrice: 0, subtotal: 0 }],
    total: 0
  });
  
  // Calculate total for the current form
  const calculateTotal = () => {
    const total = saleForm.details.reduce((sum, detail) => sum + (detail.subtotal || 0), 0);
    setSaleForm(prev => ({ ...prev, total }));
    return total;
  };
  
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
        
        // Get details and calculate total
        const { data: detailsData } = await supabase
          .from('salesdetail')
          .select('*')
          .eq('transno', sale.transno);
          
        let total = 0;
        const details = await Promise.all((detailsData || []).map(async (detail) => {
          // Get product info
          const { data: prodData } = await supabase
            .from('product')
            .select('description')
            .eq('prodcode', detail.prodcode)
            .single();

          // Get current price
          const { data: priceData } = await supabase
            .from('pricehist')
            .select('unitprice')
            .eq('prodcode', detail.prodcode)
            .order('effdate', { ascending: false })
            .limit(1);
          
          const unitPrice = priceData && priceData[0] ? priceData[0].unitprice : 0;
          const subtotal = Number(unitPrice) * Number(detail.quantity);
          total += subtotal;
          
          return {
            ...detail,
            productDescription: prodData?.description || 'Unknown Product',
            unitPrice,
            subtotal
          };
        }));
        
        return {
          ...sale,
          customerName,
          employeeName,
          details,
          total
        };
      }));
      
      setSales(salesWithNames);
      
      // Calculate customer summaries
      const summaries: Record<string, CustomerSummary> = {};
      
      for (const sale of salesWithNames) {
        if (!summaries[sale.custno]) {
          summaries[sale.custno] = {
            custno: sale.custno,
            custname: sale.customerName || 'Unknown',
            totalSales: 0,
            saleCount: 0
          };
        }
        
        summaries[sale.custno].totalSales += sale.total || 0;
        summaries[sale.custno].saleCount += 1;
      }
      
      setCustomerSummaries(Object.values(summaries));
      
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        variant: "destructive",
        title: "Error loading sales",
        description: "There was a problem loading the sales data.",
      });
    }
  };
  
  // Load customers, employees, and products with prices
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
      
      // Get products with current prices
      const { data: productsData, error: productsError } = await supabase
        .from('product')
        .select('prodcode, description');
        
      if (productsError) throw productsError;
      
      // Get current prices for all products
      const productsWithPrices = await Promise.all((productsData || []).map(async (product) => {
        const { data: priceData } = await supabase
          .from('pricehist')
          .select('unitprice')
          .eq('prodcode', product.prodcode)
          .order('effdate', { ascending: false })
          .limit(1);
          
        return {
          ...product,
          currentPrice: priceData && priceData[0] ? priceData[0].unitprice : 0
        };
      }));
      
      setProducts(productsWithPrices);
    } catch (error) {
      console.error('Error fetching reference data:', error);
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: "There was a problem loading the reference data.",
      });
    }
  };
  
  // Load sale details for viewing
  const viewSaleDetails = async (sale: Sale) => {
    try {
      setSelectedSale(sale);
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
  
  // View customer receipt (summary of all sales)
  const viewCustomerReceipt = async (customer: CustomerSummary) => {
    try {
      setSelectedCustomer(customer);
      
      // Filter sales for this customer
      const customerSales = sales.filter(sale => sale.custno === customer.custno);
      setCustomerSales(customerSales);
      
      setIsReceiptDialogOpen(true);
    } catch (error) {
      console.error('Error preparing customer receipt:', error);
      toast({
        variant: "destructive",
        title: "Error loading receipt",
        description: "There was a problem loading the customer receipt.",
      });
    }
  };
  
  // Set up sale for editing
  const editSale = (sale: Sale) => {
    const formattedDetails = sale.details?.map(detail => ({
      prodcode: detail.prodcode,
      quantity: Number(detail.quantity),
      unitPrice: Number(detail.unitPrice || 0),
      subtotal: Number(detail.subtotal || 0)
    })) || [];
    
    setSaleForm({
      transno: sale.transno,
      salesdate: sale.salesdate,
      custno: sale.custno,
      empno: sale.empno,
      details: formattedDetails,
      total: sale.total || 0
    });
    
    setSelectedSale(sale);
    setIsEditDialogOpen(true);
  };
  
  // Set up sale for deletion
  const confirmDeleteSale = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDeleteDialogOpen(true);
  };
  
  // Delete sale
  const deleteSale = async () => {
    if (!selectedSale) return;
    
    try {
      // First delete all related sales details
      const { error: detailsError } = await supabase
        .from('salesdetail')
        .delete()
        .eq('transno', selectedSale.transno);
        
      if (detailsError) throw detailsError;
      
      // Then delete the sale
      const { error: saleError } = await supabase
        .from('sales')
        .delete()
        .eq('transno', selectedSale.transno);
        
      if (saleError) throw saleError;
      
      toast({
        title: "Sale deleted",
        description: `Transaction #${selectedSale.transno} has been deleted successfully.`
      });
      
      setIsDeleteDialogOpen(false);
      fetchSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        variant: "destructive",
        title: "Error deleting sale",
        description: "There was a problem deleting the sale record."
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
            transno: saleForm.transno,
            salesdate: saleForm.salesdate,
            custno: saleForm.custno,
            empno: saleForm.empno
          }
        ])
        .select();
      
      if (salesError) throw salesError;
      
      // Then insert the sales details
      const salesDetails = saleForm.details.map(detail => ({
        transno: saleForm.transno,
        prodcode: detail.prodcode,
        quantity: detail.quantity
      }));
      
      const { error: detailsError } = await supabase
        .from('salesdetail')
        .insert(salesDetails);
      
      if (detailsError) throw detailsError;
      
      toast({
        title: "Sale created",
        description: `Transaction #${saleForm.transno} has been created successfully.`,
      });
      
      // Reset form and reload data
      resetForm();
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
  
  // Update an existing sale
  const updateSale = async () => {
    if (!selectedSale) return;
    
    try {
      // Update the sales record
      const { error: salesError } = await supabase
        .from('sales')
        .update({
          salesdate: saleForm.salesdate,
          custno: saleForm.custno,
          empno: saleForm.empno
        })
        .eq('transno', saleForm.transno);
      
      if (salesError) throw salesError;
      
      // Delete existing details and insert new ones
      const { error: deleteError } = await supabase
        .from('salesdetail')
        .delete()
        .eq('transno', saleForm.transno);
        
      if (deleteError) throw deleteError;
      
      // Insert updated details
      const salesDetails = saleForm.details.map(detail => ({
        transno: saleForm.transno,
        prodcode: detail.prodcode,
        quantity: detail.quantity
      }));
      
      const { error: detailsError } = await supabase
        .from('salesdetail')
        .insert(salesDetails);
      
      if (detailsError) throw detailsError;
      
      toast({
        title: "Sale updated",
        description: `Transaction #${saleForm.transno} has been updated successfully.`,
      });
      
      // Reset form and reload data
      resetForm();
      setIsEditDialogOpen(false);
      fetchSales();
    } catch (error) {
      console.error('Error updating sale:', error);
      toast({
        variant: "destructive",
        title: "Error updating sale",
        description: "There was a problem updating the sale record.",
      });
    }
  };
  
  // Reset form to initial state
  const resetForm = () => {
    setSaleForm({
      transno: '',
      salesdate: new Date().toISOString().split('T')[0],
      custno: '',
      empno: '',
      details: [{ prodcode: '', quantity: 1, unitPrice: 0, subtotal: 0 }],
      total: 0
    });
  };
  
  // Add a new detail line to the sale
  const addDetailLine = () => {
    setSaleForm({
      ...saleForm,
      details: [...saleForm.details, { prodcode: '', quantity: 1, unitPrice: 0, subtotal: 0 }]
    });
  };
  
  // Update sale detail line
  const updateDetailLine = (index: number, field: string, value: string | number) => {
    const updatedDetails = [...saleForm.details];
    
    if (field === 'prodcode') {
      const prodcode = value as string;
      const product = products.find(p => p.prodcode === prodcode);
      const unitPrice = product?.currentPrice || 0;
      const quantity = updatedDetails[index].quantity;
      
      updatedDetails[index] = {
        ...updatedDetails[index],
        prodcode,
        unitPrice,
        subtotal: quantity * unitPrice
      };
    } else if (field === 'quantity') {
      // Convert string to number
      const quantity = typeof value === 'string' ? parseInt(value, 10) : value;
      const unitPrice = updatedDetails[index].unitPrice;
      
      updatedDetails[index] = {
        ...updatedDetails[index],
        quantity,
        subtotal: quantity * unitPrice
      };
    }
    
    setSaleForm({
      ...saleForm,
      details: updatedDetails
    });
    
    // Update total after a brief delay to ensure state has updated
    setTimeout(calculateTotal, 0);
  };
  
  // Remove a detail line
  const removeDetailLine = (index: number) => {
    if (saleForm.details.length > 1) {
      const updatedDetails = [...saleForm.details];
      updatedDetails.splice(index, 1);
      
      setSaleForm({
        ...saleForm,
        details: updatedDetails
      });
      
      // Update total after a brief delay
      setTimeout(calculateTotal, 0);
    }
  };
  
  // Initialize form for adding a new sale
  const initAddSaleForm = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };
  
  useEffect(() => {
    fetchSales();
    fetchReferenceData();
  }, []);
  
  // Recalculate total whenever details change
  useEffect(() => {
    calculateTotal();
  }, [saleForm.details]);
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Sales Transactions</h1>
          <Button onClick={initAddSaleForm} className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </div>
        
        {/* Customer Summaries */}
        <div className="mb-6">
          <Card className="shadow-md border-t-4 border-purple-500">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-purple-500" />
                Customer Sales Summaries
              </CardTitle>
              <CardDescription>View total sales by customer</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {customerSummaries.length > 0 ? (
                  customerSummaries.map((customer) => (
                    <Card key={customer.custno} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-base font-medium">{customer.custname}</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2 px-4">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Total Sales: <span className="font-medium text-base">${customer.totalSales.toFixed(2)}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Number of Transactions: {customer.saleCount}
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter className="py-2 px-4">
                        <Button 
                          variant="outline" 
                          className="w-full flex items-center justify-center text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          onClick={() => viewCustomerReceipt(customer)}
                        >
                          <ReceiptText className="mr-2 h-4 w-4" />
                          View Receipt
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No customer summaries available. Create sales to see customer summaries.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sales Transactions Table */}
        <Card className="shadow-md border-t-4 border-blue-500">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>View and manage your sales transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Transaction No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No sales records found. Create your first sale by clicking "New Sale".
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => (
                      <TableRow key={sale.transno} className="hover:bg-muted/30 transition-colors">
                        <TableCell>{sale.transno}</TableCell>
                        <TableCell>{new Date(sale.salesdate).toLocaleDateString()}</TableCell>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell>{sale.employeeName}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${Number(sale.total).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="icon" onClick={() => viewSaleDetails(sale)} title="View Details">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="text-blue-500 hover:text-blue-600" onClick={() => editSale(sale)} title="Edit Sale">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => confirmDeleteSale(sale)} title="Delete Sale">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* Add Sale Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Sale</DialogTitle>
              <DialogDescription>Enter the details for the new sales transaction</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="transno" className="text-sm font-medium">Transaction Number</label>
                <Input 
                  id="transno" 
                  value={saleForm.transno} 
                  onChange={(e) => setSaleForm({...saleForm, transno: e.target.value})}
                  placeholder="Enter transaction number"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="salesdate" className="text-sm font-medium">Sale Date</label>
                <Input 
                  id="salesdate" 
                  type="date" 
                  value={saleForm.salesdate} 
                  onChange={(e) => setSaleForm({...saleForm, salesdate: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="custno" className="text-sm font-medium">Customer</label>
                <Select value={saleForm.custno} onValueChange={(value) => setSaleForm({...saleForm, custno: value})}>
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
                <Select value={saleForm.empno} onValueChange={(value) => setSaleForm({...saleForm, empno: value})}>
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
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saleForm.details.map((detail, index) => (
                      <TableRow key={index}>
                        <TableCell>
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
                                  {product.description} - ${product.currentPrice?.toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        
                        <TableCell>
                          <Input 
                            type="number" 
                            value={detail.quantity} 
                            onChange={(e) => updateDetailLine(index, 'quantity', e.target.value)}
                            min="1"
                            className="w-20"
                          />
                        </TableCell>
                        
                        <TableCell>
                          ${detail.unitPrice?.toFixed(2)}
                        </TableCell>
                        
                        <TableCell>
                          ${detail.subtotal?.toFixed(2)}
                        </TableCell>
                        
                        <TableCell>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            disabled={saleForm.details.length <= 1}
                            onClick={() => removeDetailLine(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-end text-lg font-medium">
                Total: ${saleForm.total?.toFixed(2)}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addSale} className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800">
                Create Sale
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Sale Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Sale - {saleForm.transno}</DialogTitle>
              <DialogDescription>Update the details for this sales transaction</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Transaction Number</label>
                <Input 
                  value={saleForm.transno} 
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="salesdate" className="text-sm font-medium">Sale Date</label>
                <Input 
                  id="salesdate" 
                  type="date" 
                  value={saleForm.salesdate} 
                  onChange={(e) => setSaleForm({...saleForm, salesdate: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="custno" className="text-sm font-medium">Customer</label>
                <Select value={saleForm.custno} onValueChange={(value) => setSaleForm({...saleForm, custno: value})}>
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
                <Select value={saleForm.empno} onValueChange={(value) => setSaleForm({...saleForm, empno: value})}>
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
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saleForm.details.map((detail, index) => (
                      <TableRow key={index}>
                        <TableCell>
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
                                  {product.description} - ${product.currentPrice?.toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        
                        <TableCell>
