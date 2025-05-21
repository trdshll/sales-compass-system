
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PlusCircle, Edit, Trash2, ArrowRight, ReceiptText, Users, Search, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";

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
  isDeleted?: boolean;
}

interface CustomerSummary {
  custno: string;
  custname: string;
  totalSales: number;
  saleCount: number;
}

interface AdminInfo {
  isAdmin: boolean;
  loaded: boolean;
}

interface DeletionReason {
  reason: string;
}

const SalesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [customerSummaries, setCustomerSummaries] = useState<CustomerSummary[]>([]);
  const [displayedCustomerSummaries, setDisplayedCustomerSummaries] = useState<CustomerSummary[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [filteredCustomerSales, setFilteredCustomerSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

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
  
  // New state variables for admin features
  const [adminInfo, setAdminInfo] = useState<AdminInfo>({ isAdmin: false, loaded: false });
  const [isDeleteReasonDialogOpen, setIsDeleteReasonDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState<DeletionReason>({ reason: '' });
  const [deletedSales, setDeletedSales] = useState<Sale[]>([]);
  const [isShowDeletedToggled, setIsShowDeletedToggled] = useState(false);
  const [showDeletedSwitchVisible, setShowDeletedSwitchVisible] = useState(false);

  // Add Detail Line function
  const addDetailLine = () => {
    setSaleForm(prev => ({
      ...prev,
      details: [
        ...prev.details,
        { prodcode: '', quantity: 1, unitPrice: 0, subtotal: 0 }
      ]
    }));
  };

  // Update Detail Line function
  const updateDetailLine = (index: number, field: string, value: any) => {
    setSaleForm(prev => {
      const updatedDetails = [...prev.details];
      
      if (field === 'prodcode') {
        // Find the product to get its price
        const selectedProduct = products.find(p => p.prodcode === value);
        const price = selectedProduct?.currentPrice || 0;
        const quantity = updatedDetails[index].quantity;
        
        updatedDetails[index] = {
          ...updatedDetails[index],
          prodcode: value,
          unitPrice: price,
          subtotal: price * quantity
        };
      } else if (field === 'quantity') {
        const numValue = Number(value);
        const price = updatedDetails[index].unitPrice;
        
        updatedDetails[index] = {
          ...updatedDetails[index],
          quantity: numValue,
          subtotal: price * numValue
        };
      }
      
      // Calculate total
      const total = updatedDetails.reduce((sum, item) => sum + item.subtotal, 0);
      
      return {
        ...prev,
        details: updatedDetails,
        total
      };
    });
  };

  // Remove Detail Line function
  const removeDetailLine = (index: number) => {
    setSaleForm(prev => {
      const updatedDetails = prev.details.filter((_, i) => i !== index);
      const total = updatedDetails.reduce((sum, item) => sum + item.subtotal, 0);
      
      return {
        ...prev,
        details: updatedDetails,
        total
      };
    });
  };

  // Add Sale function
  const addSale = async () => {
    try {
      // Validate form
      if (!saleForm.custno) {
        toast({
          variant: "destructive",
          title: "Missing customer",
          description: "Please select a customer for this sale.",
        });
        return;
      }
      
      if (!saleForm.empno) {
        toast({
          variant: "destructive",
          title: "Missing employee",
          description: "Please select an employee for this sale.",
        });
        return;
      }
      
      if (saleForm.details.some(detail => !detail.prodcode)) {
        toast({
          variant: "destructive",
          title: "Missing products",
          description: "Please select a product for each line item.",
        });
        return;
      }
      
      // Insert the sale header
      const { data: saleData, error: saleError } = await supabase
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
        
      if (saleError) throw saleError;
      
      // Insert the sale details
      const detailsToInsert = saleForm.details.map(detail => ({
        transno: saleForm.transno,
        prodcode: detail.prodcode,
        quantity: detail.quantity
      }));
      
      const { error: detailsError } = await supabase
        .from('salesdetail')
        .insert(detailsToInsert);
        
      if (detailsError) throw detailsError;
      
      toast({
        title: "Sale created",
        description: `Transaction #${saleForm.transno} has been created successfully.`
      });
      
      setIsAddDialogOpen(false);
      
      // Reset form and refresh data
      setSaleForm({
        transno: '',
        salesdate: new Date().toISOString().split('T')[0],
        custno: '',
        empno: '',
        details: [{ prodcode: '', quantity: 1, unitPrice: 0, subtotal: 0 }],
        total: 0
      });
      
      fetchNextTransactionNumber();
      fetchSales();
    } catch (error) {
      console.error('Error adding sale:', error);
      toast({
        variant: "destructive",
        title: "Error creating sale",
        description: "There was a problem creating the sale record."
      });
    }
  };

  // Update Sale function
  const updateSale = async () => {
    try {
      // Validate form
      if (!saleForm.custno) {
        toast({
          variant: "destructive",
          title: "Missing customer",
          description: "Please select a customer for this sale.",
        });
        return;
      }
      
      if (!saleForm.empno) {
        toast({
          variant: "destructive",
          title: "Missing employee",
          description: "Please select an employee for this sale.",
        });
        return;
      }
      
      if (saleForm.details.some(detail => !detail.prodcode)) {
        toast({
          variant: "destructive",
          title: "Missing products",
          description: "Please select a product for each line item.",
        });
        return;
      }
      
      // Update the sale header
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .update({
          salesdate: saleForm.salesdate,
          custno: saleForm.custno,
          empno: saleForm.empno
        })
        .eq('transno', saleForm.transno);
        
      if (saleError) throw saleError;
      
      // First delete all existing details
      const { error: deleteError } = await supabase
        .from('salesdetail')
        .delete()
        .eq('transno', saleForm.transno);
        
      if (deleteError) throw deleteError;
      
      // Insert the updated sale details
      const detailsToInsert = saleForm.details.map(detail => ({
        transno: saleForm.transno,
        prodcode: detail.prodcode,
        quantity: detail.quantity
      }));
      
      const { error: detailsError } = await supabase
        .from('salesdetail')
        .insert(detailsToInsert);
        
      if (detailsError) throw detailsError;
      
      toast({
        title: "Sale updated",
        description: `Transaction #${saleForm.transno} has been updated successfully.`
      });
      
      setIsEditDialogOpen(false);
      fetchSales();
    } catch (error) {
      console.error('Error updating sale:', error);
      toast({
        variant: "destructive",
        title: "Error updating sale",
        description: "There was a problem updating the sale record."
      });
    }
  };
  
  // Check if the current user is an admin
  const checkAdminStatus = async () => {
    if (!user) {
      setAdminInfo({ isAdmin: false, loaded: true });
      return;
    }
    
    try {
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error checking admin status:', error);
        setAdminInfo({ isAdmin: false, loaded: true });
        return;
      }
      
      setAdminInfo({ 
        isAdmin: roleData?.role === 'admin', 
        loaded: true 
      });
      
      // Only show the deleted sales toggle if user is admin
      setShowDeletedSwitchVisible(roleData?.role === 'admin');
    } catch (error) {
      console.error('Error in admin check:', error);
      setAdminInfo({ isAdmin: false, loaded: true });
    }
  };
  
  // Load sales data with consideration for soft deletes
  const fetchSales = async () => {
    try {
      let query = supabase
        .from('sales')
        .select('*');
        
      // Admin users can see both deleted and non-deleted records
      const { data, error } = await query.order('salesdate', { ascending: false });
        
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
          total,
          isDeleted: sale.deleted_at !== null
        };
      }));
      
      // Separate active and deleted sales
      const activeSales = salesWithNames.filter(sale => !sale.isDeleted);
      const softDeletedSales = salesWithNames.filter(sale => sale.isDeleted);
      
      setSales(activeSales);
      setDeletedSales(softDeletedSales);
      setFilteredSales(activeSales);
      
      // Calculate customer summaries
      const summaries: Record<string, CustomerSummary> = {};
      
      for (const sale of activeSales) {
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
      setDisplayedCustomerSummaries(Object.values(summaries));
      
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        variant: "destructive",
        title: "Error loading sales",
        description: "There was a problem loading the sales data.",
      });
    }
  };
  
  // Get the next transaction number
  const fetchNextTransactionNumber = async () => {
    try {
      // Get the latest transaction number from the database
      const { data, error } = await supabase
        .from('sales')
        .select('transno')
        .order('transno', { ascending: false })
        .limit(1);
        
      if (error) throw error;
      
      let nextNumber = 'TR00001';
      
      if (data && data.length > 0) {
        // Extract the numeric part of the transaction number
        const lastTransactionNo = data[0].transno;
        const numericPart = lastTransactionNo.replace(/^\D+/g, '');
        
        // Increment it and format back
        const nextNumericPart = parseInt(numericPart, 10) + 1;
        nextNumber = `TR${nextNumericPart.toString().padStart(5, '0')}`;
      }
      
      setSaleForm(prev => ({ ...prev, transno: nextNumber }));
      
    } catch (error) {
      console.error('Error fetching next transaction number:', error);
      // Use a fallback pattern if we can't get it from the database
      const timestamp = Date.now().toString();
      const fallbackNumber = `TR${timestamp.substring(timestamp.length - 6)}`;
      setSaleForm(prev => ({ ...prev, transno: fallbackNumber }));
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
      setFilteredCustomers(customersData || []);
      
      // Get employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employee')
        .select('empno, firstname, lastname');
        
      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);
      setFilteredEmployees(employeesData || []);
      
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
      setFilteredProducts(productsWithPrices);
    } catch (error) {
      console.error('Error fetching reference data:', error);
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: "There was a problem loading the reference data.",
      });
    }
  };
  
  // Enhanced search filter handlers that search by both ID and name
  const handleCustomerSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = customers.filter(
      customer => 
        customer.custname.toLowerCase().includes(term) || 
        customer.custno.toLowerCase().includes(term)
    );
    
    setFilteredCustomers(filtered);
  };
  
  const handleEmployeeSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredEmployees(employees);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = employees.filter(
      employee => 
        `${employee.firstname} ${employee.lastname}`.toLowerCase().includes(term) || 
        employee.empno.toLowerCase().includes(term)
    );
    
    setFilteredEmployees(filtered);
  };
  
  const handleProductSearch = (searchTerm: string, index: number) => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = products.filter(
      product => 
        product.description.toLowerCase().includes(term) || 
        product.prodcode.toLowerCase().includes(term)
    );
    
    setFilteredProducts(filtered);
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
      setFilteredCustomerSales(customerSales);
      setCustomerSearchQuery('');
      
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
    if (!adminInfo.isAdmin) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "Only administrators can delete sales records.",
      });
      return;
    }
    
    setSelectedSale(sale);
    setIsDeleteReasonDialogOpen(true);
  };
  
  // Delete sale
  const deleteSale = async () => {
    if (!selectedSale) return;
    
    try {
      if (!adminInfo.isAdmin) {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "Only administrators can delete sales records.",
        });
        setIsDeleteDialogOpen(false);
        return;
      }
      
      // Get current admin name
      const { data: profile } = await supabase.auth.getUser();
      const adminName = profile?.user?.email || 'Unknown Admin';
      
      // Create a transaction ID for this deletion
      const transactionId = `DEL-${Date.now()}-${selectedSale.transno}`;
      
      // First soft delete all related sales details
      const { error: detailsError } = await supabase
        .from('salesdetail')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id
        })
        .eq('transno', selectedSale.transno);
        
      if (detailsError) throw detailsError;
      
      // Then soft delete the sale
      const { error: saleError } = await supabase
        .from('sales')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id,
          delete_reason: deleteReason.reason
        })
        .eq('transno', selectedSale.transno);
        
      if (saleError) throw saleError;
      
      // Log the deletion
      const { error: logError } = await supabase
        .from('deletion_logs')
        .insert([
          {
            table_name: 'sales',
            record_id: selectedSale.transno,
            transaction_id: transactionId,
            deleted_by: user?.id,
            admin_name: adminName,
            reason: deleteReason.reason,
            metadata: JSON.stringify({
              salesDate: selectedSale.salesdate,
              customer: selectedSale.customerName,
              employee: selectedSale.employeeName,
              total: selectedSale.total
            })
          }
        ]);
        
      if (logError) throw logError;
      
      toast({
        title: "Sale deleted",
        description: `Transaction #${selectedSale.transno} has been soft-deleted successfully.`
      });
      
      setIsDeleteDialogOpen(false);
      setIsDeleteReasonDialogOpen(false);
      setDeleteReason({ reason: '' });
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
  
  // New function to toggle between showing active and deleted sales
  const toggleShowDeleted = () => {
    if (isShowDeletedToggled) {
      setFilteredSales(sales);
    } else {
      setFilteredSales(deletedSales);
    }
    setIsShowDeletedToggled(!isShowDeletedToggled);
  };
  
  // New function to proceed with deletion after reason is provided
  const proceedWithDeletion = () => {
    if (deleteReason.reason.trim() === '') {
      toast({
        variant: "destructive",
        title: "Reason Required",
        description: "Please provide a reason for the deletion."
      });
      return;
    }
    
    setIsDeleteReasonDialogOpen(false);
    setIsDeleteDialogOpen(true);
  };
  
  // Set up search filtering
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = isShowDeletedToggled ? deletedSales.filter(sale => 
        sale.transno.toLowerCase().includes(query) ||
        sale.customerName?.toLowerCase().includes(query) ||
        sale.employeeName?.toLowerCase().includes(query) ||
        sale.salesdate.toLowerCase().includes(query)
      ) : sales.filter(sale => 
        sale.transno.toLowerCase().includes(query) ||
        sale.customerName?.toLowerCase().includes(query) ||
        sale.employeeName?.toLowerCase().includes(query) ||
        sale.salesdate.toLowerCase().includes(query)
      );
      
      setFilteredSales(filtered);
    } else {
      setFilteredSales(isShowDeletedToggled ? deletedSales : sales);
    }
  }, [searchQuery, sales, deletedSales, isShowDeletedToggled]);

  // Set up customer search filtering
  useEffect(() => {
    if (customerSearchQuery) {
      const query = customerSearchQuery.toLowerCase();
      const filtered = customerSales.filter(sale => 
        sale.transno.toLowerCase().includes(query) ||
        sale.salesdate.toLowerCase().includes(query) ||
        String(sale.total).includes(query)
      );
      
      setFilteredCustomerSales(filtered);
    } else {
      setFilteredCustomerSales(customerSales);
    }
  }, [customerSearchQuery, customerSales]);
  
  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);
  
  useEffect(() => {
    fetchSales();
    fetchReferenceData();
    fetchNextTransactionNumber();
  }, []);
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Sales Transactions</h1>
          <div className="flex items-center space-x-2">
            {showDeletedSwitchVisible && (
              <Button 
                onClick={toggleShowDeleted}
                variant="outline"
                className={isShowDeletedToggled ? "bg-red-100 text-red-700 border-red-300" : ""}
              >
                {isShowDeletedToggled ? (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Showing Deleted
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Show Deleted
                  </>
                )}
              </Button>
            )}
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Sale
            </Button>
          </div>
        </div>
        
        {/* Customer Summaries */}
        <div>
          <Card className="shadow-md border-t-4 border-purple-500">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-purple-500" />
                Customer Sales Summaries
              </CardTitle>
              <CardDescription>View total sales by customer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search customers..." 
                    className="pl-10"
                    onChange={(e) => {
                      const query = e.target.value.toLowerCase();
                      if (query === '') {
                        setDisplayedCustomerSummaries(customerSummaries);
                      } else {
                        const filtered = customerSummaries.filter(customer => 
                          customer.custname.toLowerCase().includes(query) ||
                          customer.custno.toLowerCase().includes(query) ||
                          String(customer.totalSales).includes(query) ||
                          String(customer.saleCount).includes(query)
                        );
                        setDisplayedCustomerSummaries(filtered);
                      }
                    }}
                  />
                </div>
              </div>
              <ScrollArea className="h-[500px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedCustomerSummaries.length > 0 ? (
                    displayedCustomerSummaries.map((customer) => (
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
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        {/* Sales Transactions Table */}
        <Card className={`shadow-md border-t-4 ${isShowDeletedToggled ? 'border-red-500' : 'border-blue-500'}`}>
          <CardHeader className={`bg-gradient-to-r ${isShowDeletedToggled ? 'from-red-50 to-pink-50 dark:from-gray-800 dark:to-gray-700' : 'from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700'}`}>
            <CardTitle>
              {isShowDeletedToggled ? 'Deleted Sales Records' : 'Recent Sales'}
              {isShowDeletedToggled && adminInfo.isAdmin && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                  Admin View
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {isShowDeletedToggled 
                ? 'View previously deleted sales transactions' 
                : 'View and manage your sales transactions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search transactions..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Transaction No</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Customer</TableHead>
                    <TableHead className="font-bold">Employee</TableHead>
                    <TableHead className="font-bold text-right">Total</TableHead>
                    <TableHead className="font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableBody>
                    {filteredSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {isShowDeletedToggled 
                            ? "No deleted sales records found." 
                            : searchQuery 
                              ? "No matching sales found. Try a different search." 
                              : "No sales records found. Create your first sale by clicking \"New Sale\"."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSales.slice(0, 25).map((sale) => (
                        <TableRow key={sale.transno} className={`hover:bg-muted/30 transition-colors ${sale.isDeleted ? 'bg-red-50/30' : ''}`}>
                          <TableCell>
                            {sale.transno}
                            {sale.isDeleted && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                                Deleted
                              </span>
                            )}
                          </TableCell>
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
                              {!sale.isDeleted && (
                                <>
                                  <Button variant="outline" size="icon" className="text-blue-500 hover:text-blue-600" onClick={() => editSale(sale)} title="Edit Sale">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => confirmDeleteSale(sale)} title="Delete Sale">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
        
        {/* Add Sale Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Create New Sale</DialogTitle>
              <DialogDescription>Enter the details for the new sales transaction</DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="pr-4 max-h-[calc(90vh-10rem)]">
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="transno" className="text-sm font-medium">Transaction Number</label>
                  <Input 
                    id="transno" 
                    value={saleForm.transno} 
                    readOnly
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="salesdate" className="text-sm font-medium">Sale Date</label>
                  <Input 
                    id="salesdate" 
                    type="date" 
                    value={saleForm.salesdate} 
                    readOnly
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="custno" className="text-sm font-medium">Customer</label>
                  <Select value={saleForm.custno} onValueChange={(value) => setSaleForm({...saleForm, custno: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent showSearch onSearch={handleCustomerSearch} searchPlaceholder="Search name or customer #">
                      {filteredCustomers.map((customer) => (
                        <SelectItem key={customer.custno} value={customer.custno}>
                          {customer.custname} ({customer.custno})
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
                    <SelectContent showSearch onSearch={handleEmployeeSearch} searchPlaceholder="Search name or employee #">
                      {filteredEmployees.map((employee) => (
                        <SelectItem key={employee.empno} value={employee.empno}>
                          {employee.firstname} {employee.lastname} ({employee.empno})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4 mt-4">
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
                              <SelectContent showSearch onSearch={(value) => handleProductSearch(value, index)} searchPlaceholder="Search name or product #">
                                {filteredProducts.map((product) => (
                                  <SelectItem key={product.prodcode} value={product.prodcode}>
                                    {product.description} ({product.prodcode}) - ${product.currentPrice?.toFixed(2)}
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
            </ScrollArea>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addSale}>
                Create Sale
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Sale Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Edit Sale</DialogTitle>
              <DialogDescription>Update the details for transaction #{saleForm.transno}</DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="pr-4 max-h-[calc(90vh-10rem)]">
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="transno-edit" className="text-sm font-medium">Transaction Number</label>
                  <Input 
                    id="transno-edit" 
                    value={saleForm.transno} 
                    readOnly
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="salesdate-edit" className="text-sm font-medium">Sale Date</label>
                  <Input 
                    id="salesdate-edit" 
                    type="date" 
                    value={saleForm.salesdate} 
                    onChange={(e) => setSaleForm({...saleForm, salesdate: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="custno-edit" className="text-sm font-medium">Customer</label>
                  <Select value={saleForm.custno} onValueChange={(value) => setSaleForm({...saleForm, custno: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent showSearch onSearch={handleCustomerSearch} searchPlaceholder="Search name or customer #">
                      {filteredCustomers.map((customer) => (
                        <SelectItem key={customer.custno} value={customer.custno}>
                          {customer.custname} ({customer.custno})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="empno-edit" className="text-sm font-medium">Employee</label>
                  <Select value={saleForm.empno} onValueChange={(value) => setSaleForm({...saleForm, empno: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent showSearch onSearch={handleEmployeeSearch} searchPlaceholder="Search name or employee #">
                      {filteredEmployees.map((employee) => (
                        <SelectItem key={employee.empno} value={employee.empno}>
                          {employee.firstname} {employee.lastname} ({employee.empno})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4 mt-4">
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
                              <SelectContent showSearch onSearch={(value) => handleProductSearch(value, index)} searchPlaceholder="Search name or product #">
                                {filteredProducts.map((product) => (
                                  <SelectItem key={product.prodcode} value={product.prodcode}>
                                    {product.description} ({product.prodcode}) - ${product.currentPrice?.toFixed(2)}
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
            </ScrollArea>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateSale}>
                Update Sale
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* View Sale Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Sale Details</DialogTitle>
              <DialogDescription>
                Transaction #{selectedSale?.transno} - {selectedSale?.salesdate ? new Date(selectedSale.salesdate).toLocaleDateString() : ''}
              </DialogDescription>
            </DialogHeader>
            
            {selectedSale && (
              <ScrollArea className="pr-4 max-h-[calc(90vh-10rem)]">
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div>
                    <h3 className="font-medium">Customer</h3>
                    <p>{selectedSale.customerName}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Employee</h3>
                    <p>{selectedSale.employeeName}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Items</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSale.details?.map((detail, index) => (
                          <TableRow key={index}>
                            <TableCell>{detail.productDescription}</TableCell>
                            <TableCell>{detail.quantity}</TableCell>
                            <TableCell>${Number(detail.unitPrice).toFixed(2)}</TableCell>
                            <TableCell className="text-right">${Number(detail.subtotal).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <div className="text-lg font-medium">
                      Total: ${Number(selectedSale.total).toFixed(2)}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => { setIsViewDialogOpen(false); editSale(selectedSale!); }}>
                Edit Sale
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Sale Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete transaction #{selectedSale?.transno}? This action will soft-delete the record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={deleteSale} className="bg-red-500 hover:bg-red-600">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Delete Reason Dialog */}
        <Dialog open={isDeleteReasonDialogOpen} onOpenChange={setIsDeleteReasonDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Provide Deletion Reason</DialogTitle>
              <DialogDescription>
                As an administrator, you must provide a reason for deleting transaction #{selectedSale?.transno}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label htmlFor="delete-reason" className="text-sm font-medium">
                  Reason for Deletion
                </label>
                <Textarea 
                  id="delete-reason" 
                  placeholder="Enter the reason for deleting this transaction..."
                  value={deleteReason.reason}
                  onChange={(e) => setDeleteReason({ reason: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteReasonDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={proceedWithDeletion}
                disabled={deleteReason.reason.trim() === ''}
              >
                Proceed
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Customer Receipt Dialog */}
        <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Customer Sales Receipt</DialogTitle>
              <DialogDescription>
                {selectedCustomer?.custname} - All Transactions
              </DialogDescription>
            </DialogHeader>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search transactions..." 
                  className="pl-10"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <ScrollArea className="pr-4 max-h-[calc(90vh-14rem)]">
              <div className="space-y-4">
                {filteredCustomerSales.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No matching sales found for this customer.
                  </div>
                ) : (
                  filteredCustomerSales.map((sale) => (
                    <Collapsible key={sale.transno} className="border rounded-lg">
                      <CollapsibleTrigger className="flex justify-between items-center w-full p-4 text-left">
                        <div>
                          <h3 className="font-medium">Transaction #{sale.transno}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(sale.salesdate).toLocaleDateString()} - ${Number(sale.total).toFixed(2)}
                          </p>
                        </div>
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pb-4">
                        <div className="rounded-md border mt-2">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Unit Price</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sale.details?.map((detail, index) => (
                                <TableRow key={index}>
                                  <TableCell>{detail.productDescription}</TableCell>
                                  <TableCell>{detail.quantity}</TableCell>
                                  <TableCell>${Number(detail.unitPrice).toFixed(2)}</TableCell>
                                  <TableCell className="text-right">${Number(detail.subtotal).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                )}
              </div>
            </ScrollArea>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions: {customerSales.length}</p>
                </div>
                <div className="text-lg font-medium">
                  Total: ${selectedCustomer?.totalSales.toFixed(2)}
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsReceiptDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SalesPage;
