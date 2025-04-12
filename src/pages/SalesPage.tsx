
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
