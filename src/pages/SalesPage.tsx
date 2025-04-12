
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Interface definitions for data types
interface Customer {
  custno: string;
  custname: string;
}

interface Employee {
  empno: string;
  firstname: string;
  lastname: string;
}

interface Product {
  prodcode: string;
  description: string;
  currentPrice: number;
}

interface SaleItem {
  prodcode: string;
  description: string;
  quantity: number;
  unitprice: number;
  lineTotal: number;
}

const SalesPage: React.FC = () => {
  // State variables for data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const { toast } = useToast();
  
  // State for sale form
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  
  // Fetch reference data on component mount
  useEffect(() => {
    fetchReferenceData();
  }, []);

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

  // Search products by code or description
  const handleProductSearch = (searchValue: string) => {
    if (!searchValue.trim()) {
      setFilteredProducts(products);
      return;
    }
    
    const lowerCaseSearch = searchValue.toLowerCase();
    const filtered = products.filter(
      product => 
        product.prodcode.toLowerCase().includes(lowerCaseSearch) || 
        product.description.toLowerCase().includes(lowerCaseSearch)
    );
    
    setFilteredProducts(filtered);
  };

  // Search customers by name or number
  const handleCustomerSearch = (searchValue: string) => {
    if (!searchValue.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    
    const lowerCaseSearch = searchValue.toLowerCase();
    const filtered = customers.filter(
      customer => 
        customer.custno.toLowerCase().includes(lowerCaseSearch) || 
        customer.custname.toLowerCase().includes(lowerCaseSearch)
    );
    
    setFilteredCustomers(filtered);
  };

  // Search employees by name or number
  const handleEmployeeSearch = (searchValue: string) => {
    if (!searchValue.trim()) {
      setFilteredEmployees(employees);
      return;
    }
    
    const lowerCaseSearch = searchValue.toLowerCase();
    const filtered = employees.filter(
      employee => 
        employee.empno.toLowerCase().includes(lowerCaseSearch) || 
        employee.firstname.toLowerCase().includes(lowerCaseSearch) || 
        employee.lastname.toLowerCase().includes(lowerCaseSearch)
    );
    
    setFilteredEmployees(filtered);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Sales Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>New Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer</Label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger id="customer">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent showSearch onSearch={handleCustomerSearch}>
                        {filteredCustomers.map((customer) => (
                          <SelectItem key={customer.custno} value={customer.custno}>
                            {customer.custno} - {customer.custname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employee">Sales Representative</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger id="employee">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent showSearch onSearch={handleEmployeeSearch}>
                        {filteredEmployees.map((employee) => (
                          <SelectItem key={employee.empno} value={employee.empno}>
                            {employee.empno} - {employee.firstname} {employee.lastname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-2">Add Products</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="product">Product</Label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger id="product">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent showSearch onSearch={handleProductSearch}>
                          {filteredProducts.map((product) => (
                            <SelectItem key={product.prodcode} value={product.prodcode}>
                              {product.prodcode} - {product.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input 
                        id="quantity" 
                        type="number" 
                        min="1" 
                        value={quantity} 
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} 
                      />
                    </div>
                    <Button className="md:col-span-3">Add Product</Button>
                  </div>
                </div>
                
                {saleItems.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-2">Sale Items</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Product</th>
                            <th className="text-left py-2">Description</th>
                            <th className="text-right py-2">Quantity</th>
                            <th className="text-right py-2">Unit Price</th>
                            <th className="text-right py-2">Total</th>
                            <th className="text-right py-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {saleItems.map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2">{item.prodcode}</td>
                              <td className="py-2">{item.description}</td>
                              <td className="py-2 text-right">{item.quantity}</td>
                              <td className="py-2 text-right">${item.unitprice.toFixed(2)}</td>
                              <td className="py-2 text-right">${item.lineTotal.toFixed(2)}</td>
                              <td className="py-2 text-right">
                                <Button variant="ghost" size="sm">Remove</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Complete Sale</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sale Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${saleItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${saleItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Process Payment</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SalesPage;
