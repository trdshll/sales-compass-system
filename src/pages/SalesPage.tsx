
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

const SalesPage: React.FC = () => {
  // State variables for data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const { toast } = useToast();

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

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Sales Management</h1>
        <p>This is the sales management page. Implementation is in progress.</p>
      </div>
    </DashboardLayout>
  );
};

export default SalesPage;
