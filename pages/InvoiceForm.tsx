
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import InlineAsyncSelect from '../components/InlineAsyncSelect';
import ItemsManager from '../components/ItemsManager';
import BillToSection from '../components/BillToSection';
import InvoiceDetailsSection from '../components/InvoiceDetailsSection';
import { getProducts, getWarehouses, getInvoice, createInvoice, updateInvoice, getNextInvoiceNumber, searchProducts, getProductBatches, getGSTRates, getCESSRates, getSetting } from '../services/api';

const InvoiceForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Form State
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customer: ''
  });

  // Items State
  const [items, setItems] = useState<any[]>([]);
  
  // Dynamic Data State
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCustomerData, setSelectedCustomerData] = useState<any>(null);
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<any>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [gstRates, setGstRates] = useState<any[]>([]);
  const [cessRates, setCessRates] = useState<any[]>([]);
  const [companyState, setCompanyState] = useState('');
  const [isProductSelectionModalOpen, setIsProductSelectionModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Load data from database
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsRes, warehousesRes, gstRatesRes, cessRatesRes] = await Promise.all([
          getProducts(1, 1000),
          getWarehouses(1, 1000),
          getGSTRates(1, 1000),
          getCESSRates(1, 1000)
        ]);
        
        let companyState = '';
        try {
          const companyStateRes = await getSetting('company_state');
          companyState = companyStateRes.data.value || '';
        } catch (err) {
          console.log('Company state setting not found');
        }

        setProducts(productsRes.data.items || []);
        setWarehouses(warehousesRes.data.items || []);
        setGstRates(gstRatesRes.data.items || []);
        setCessRates(cessRatesRes.data.items || []);
        setCompanyState(companyState);
        
        if (!isEdit) {
          const nextNumberRes = await getNextInvoiceNumber();
          setFormData(prev => ({ ...prev, invoiceNumber: nextNumberRes.data.data.nextInvoiceNumber }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isEdit]);

  // Load invoice data when editing
  useEffect(() => {
    if (isEdit && id) {
      const fetchInvoice = async () => {
        setLoading(true);
        try {
          const response = await getInvoice(Number(id));
          const invoice = response.data.data;
          
          if (invoice.partyData) {
            setSelectedCustomerData(invoice.partyData);
          }

          // Restore the shipping address that was saved with this invoice
          if (invoice.customerDetails?.selectedShippingAddress) {
            setSelectedShippingAddress(invoice.customerDetails.selectedShippingAddress);
          }

          setFormData({
            invoiceNumber: invoice.invoiceNumber || '',
            date: invoice.date || '',
            dueDate: invoice.dueDate || '',
            customer: invoice.customer || ''
          });
          const savedLineDiscountTypes = Array.isArray(invoice.customerDetails?.lineDiscountTypes)
            ? invoice.customerDetails.lineDiscountTypes
            : [];
          const invoiceItems = invoice.invoiceItems ? invoice.invoiceItems.map((item: any) => ({
            id: item.id,
            product: item.productName,
            productId: item.productId,
            productData: item.productData,
            hsn: item.productData?.hsn || '',
            warehouse: item.warehouseData?.name || '',
            batch: item.batchData?.batchNumber || '',
            qty: Number(item.quantity),
            unit: item.unit || item.productData?.measuringUnitData?.name || '',
            price: Number(item.rate),
            gstRate: Number(item.taxRate),
            cessRate: Number(item.cessRate || 0),
            discount: Number(item.discount || 0),
            discountType: item.discountType,
            total: Number(item.amount),
            batchId: item.batchId,
            warehouseId: item.warehouseId
          })).map((invoiceItem: any, index: number) => ({
            ...invoiceItem,
            discountType: invoiceItem.discountType || savedLineDiscountTypes?.[index]?.type || 'percentage'
          })) : (typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items || []);
          
          setItems(invoiceItems);
        } catch (error) {
          console.error('Error fetching invoice:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchInvoice();
    }
  }, [isEdit, id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const filledItems = items.filter(item => item.product);
      
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!saving && filledItems.length > 0) {
          handleSave();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!saving && filledItems.length > 0) {
          handleGenerateInvoice();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        addItem();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [saving, items]);

  // Helpers
  const getCustomerState = () => {
    return selectedCustomerData?.billingState || selectedCustomerData?.shippingState || selectedCustomerData?.state || '';
  };

  const calculateTaxBreakdown = (baseAmount: number, gstRate: number, customerState: string) => {
    // If no customer state or company state is found, assume intra-state (CGST+SGST)
    // You might want to change this default behavior based on requirements
    const isIntraState = !customerState || !companyState || customerState.toLowerCase() === companyState.toLowerCase();
    
    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isIntraState) {
      cgstRate = gstRate / 2;
      sgstRate = gstRate / 2;
      cgstAmount = baseAmount * (cgstRate / 100);
      sgstAmount = baseAmount * (sgstRate / 100);
    } else {
      igstRate = gstRate;
      igstAmount = baseAmount * (igstRate / 100);
    }

    return { cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount };
  };

  const getDiscountAmount = (baseAmount: number, discountValue: number, discountType?: string) => {
    const safeBaseAmount = Math.max(0, Number(baseAmount) || 0);
    const safeDiscountValue = Math.max(0, Number(discountValue) || 0);

    if (discountType === 'amount') {
      return Math.min(safeDiscountValue, safeBaseAmount);
    }

    const discountPercent = Math.min(safeDiscountValue, 100);
    return safeBaseAmount * (discountPercent / 100);
  };

  const getSellingPriceConfig = (product: any, batchId?: string | number | null) => {
    const normalizedBatchId = batchId != null ? String(batchId) : '';
    const batchRecords = Array.isArray(product?.batchRecords) ? product.batchRecords : [];

    let selectedBatch = normalizedBatchId
      ? batchRecords.find((b: any) => String(b.id) === normalizedBatchId)
      : null;

    if (!selectedBatch && normalizedBatchId && String(product?.batchId || '') === normalizedBatchId) {
      selectedBatch = {
        sellingPrice: product?.batchSellingPrice,
        sellingPriceTax: product?.batchSellingPriceTax
      };
    }

    const sellingPrice = Number(selectedBatch?.sellingPrice ?? product?.sellingPrice) || 0;
    const sellingPriceIncludesTax = selectedBatch?.sellingPriceTax != null
      ? selectedBatch.sellingPriceTax === true
      : product?.sellingPriceTax === true;

    return { sellingPrice, sellingPriceIncludesTax };
  };

  // Recalculate taxes when customer changes
  useEffect(() => {
    if (items.length > 0) {
      const customerState = getCustomerState();
      
      setItems(prevItems => prevItems.map(item => {
        const qty = Number(item.qty) || 0;
        const price = Number(item.price) || 0;
        const discount = Number(item.discount) || 0;
        const discountType = item.discountType || 'percentage';
        const gstRate = Number(item.gstRate) || 0;
        const cessRate = Number(item.cessRate) || 0;
        
        const baseTotal = price * qty;
        const discountAmount = getDiscountAmount(baseTotal, discount, discountType);
        const taxableAmount = baseTotal - discountAmount;
        
        const { cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount } = calculateTaxBreakdown(taxableAmount, gstRate, customerState);
        const cessAmount = taxableAmount * (cessRate / 100);
        
        return {
          ...item,
          cgstRate, sgstRate, igstRate,
          cgstAmount, sgstAmount, igstAmount,
          cessAmount,
          total: taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount
        };
      }));
    }
  }, [formData.customer, companyState]);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    setIsProductSelectionModalOpen(true);
  };

  const handleSelectProducts = (selectedProducts: any[]) => {
    const existingProductNames = new Set(items.map(item => item.product));
    const productsToAdd = selectedProducts.filter(product => !existingProductNames.has(product.name));
    const customerState = getCustomerState();
    
    const newItems = productsToAdd.map(product => {
      const { sellingPrice, sellingPriceIncludesTax } = getSellingPriceConfig(product, product.batchId);
      const gstRate = Number(product.gstRateData?.rate || product.gstPercentage) || 0;
      const cessRate = Number(product.cessRateData?.value || product.cessPercentage) || 0;
      const qty = Number(product.quantity) || 1;
      
      let basePrice = sellingPrice;
      let baseAmount = 0;
      
      if (sellingPriceIncludesTax && (gstRate > 0 || cessRate > 0)) {
        const totalTaxRate = gstRate + cessRate;
        basePrice = sellingPrice / (1 + (totalTaxRate / 100));
        baseAmount = basePrice * qty;
      } else {
        basePrice = sellingPrice;
        baseAmount = basePrice * qty;
      }
      
      const { cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount } = calculateTaxBreakdown(baseAmount, gstRate, customerState);
      const cessAmount = baseAmount * (cessRate / 100);
      const total = baseAmount + cgstAmount + sgstAmount + igstAmount + cessAmount;
      
      return {
        id: Date.now() + Math.random(), 
        product: product.name,
        productId: product.id,
        productData: product,
        hsn: product.hsn || '',
        warehouse: product.warehouse || '',
        batch: product.batch || '',
        warehouseId: product.warehouseId || null,
        batchId: product.batchId || null,
        qty: qty,
        unit: product.measuringUnitData?.name || product.measuringUnit || '', 
        price: basePrice, 
        gstRate: gstRate,
        cgstRate, sgstRate, igstRate,
        cgstAmount, sgstAmount, igstAmount,
        cessRate: cessRate,
        cessAmount: cessAmount,
        discount: 0,
        discountType: 'percentage',
        total: total 
      };
    });
    
    if (newItems.length > 0) {
      setItems([...items, ...newItems]);
    }
  };

  const deleteItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (itemId: number, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id !== itemId) return item;
      
      const updatedItem = { ...item };
      
      if (field === 'product') {
        const product = products.find(p => p.name === value);
        if (product) {
          const { sellingPrice, sellingPriceIncludesTax } = getSellingPriceConfig(product, null);
          const gstRate = Number(product.gstRateData?.rate || product.gstPercentage) || 0;
          const cessRate = Number(product.cessRateData?.value || product.cessPercentage) || 0;
          
          updatedItem.product = value;
          updatedItem.productId = product.id;
          updatedItem.productData = product;
          updatedItem.hsn = product.hsn || '';
          updatedItem.warehouse = '';
          updatedItem.batch = '';
          updatedItem.warehouseId = null;
          updatedItem.batchId = null;
          updatedItem.unit = product.measuringUnitData?.name || product.measuringUnit || '';
          
          let basePrice = sellingPrice;
          let baseAmount = 0;
          
          if (sellingPriceIncludesTax && (gstRate > 0 || cessRate > 0)) {
            const totalTaxRate = gstRate + cessRate;
            basePrice = sellingPrice / (1 + (totalTaxRate / 100));
            baseAmount = basePrice * updatedItem.qty;
          } else {
            basePrice = sellingPrice;
            baseAmount = basePrice * updatedItem.qty;
          }
          
          updatedItem.price = basePrice;
          updatedItem.gstRate = gstRate;
          updatedItem.cessRate = cessRate;
          updatedItem.discount = 0;
          updatedItem.discountType = 'percentage';
        }
      } else if (field === 'unit') {
        updatedItem.unit = value;
        const product = item.productData || products.find(p => p.name === item.product);
        const canonicalProduct = products.find(p => String(p.id) === String(item.productId)) || product;
        
        const altUnit = canonicalProduct?.altMeasuringUnitData?.name || canonicalProduct?.altMeasuringUnit;
        
        if (canonicalProduct && altUnit && canonicalProduct.conversionRatio) {
          const { sellingPrice, sellingPriceIncludesTax } = getSellingPriceConfig(canonicalProduct, item.batchId);
          const gstRate = Number(canonicalProduct.gstRateData?.rate || canonicalProduct.gstPercentage) || 0;
          const cessRate = Number(canonicalProduct.cessRateData?.value || canonicalProduct.cessPercentage) || 0;
          const conversionRatio = Number(canonicalProduct.conversionRatio) || 1;
          
          let basePrice = sellingPrice;
          
          if (sellingPriceIncludesTax && (gstRate > 0 || cessRate > 0)) {
            const totalTaxRate = gstRate + cessRate;
            basePrice = sellingPrice / (1 + (totalTaxRate / 100));
          }
          
          if (value === altUnit) {
            updatedItem.price = basePrice / conversionRatio;
          } else {
            updatedItem.price = basePrice;
          }
          
          const baseAmount = updatedItem.price * updatedItem.qty;
          updatedItem.gstRate = gstRate;
          updatedItem.cessRate = cessRate;
        }
      } else if (field === 'total') {
        const newTotal = Number(value);
        updatedItem.total = newTotal;
        
        const qty = Number(updatedItem.qty) || 1;
        const discount = Math.max(0, Number(updatedItem.discount) || 0);
        const discountType = updatedItem.discountType || 'percentage';
        const gstRate = Number(updatedItem.gstRate) || 0;
        const cessRate = Number(updatedItem.cessRate) || 0;
        
        const totalTaxRate = gstRate + cessRate;
        const discountFactor = 1 - (Math.min(discount, 100) / 100);
        
        if (qty > 0) {
          const taxableAmount = newTotal / (1 + (totalTaxRate / 100));

          if (discountType === 'amount') {
            const baseAmount = taxableAmount + discount;
            updatedItem.price = baseAmount / qty;
          } else if (discountFactor > 0) {
            const baseAmount = taxableAmount / discountFactor;
            updatedItem.price = baseAmount / qty;
          }
        }
        
        return updatedItem;
      } else {
        updatedItem[field] = value;
      }

      const qty = Number(updatedItem.qty) || 0;
      const price = Number(updatedItem.price) || 0;
      const gstRate = Number(updatedItem.gstRate) || 0;
      const cessRate = Number(updatedItem.cessRate) || 0;
      const discount = Math.max(0, Number(updatedItem.discount) || 0);
      const discountType = updatedItem.discountType || 'percentage';

      if (discountType === 'percentage' && discount > 100) {
        updatedItem.discount = 100;
      }

      if (field === 'qty' || field === 'price' || field === 'gstRate' || field === 'cessRate' || field === 'discount' || field === 'discountType') {
        const baseTotal = price * qty;
        const discountAmount = getDiscountAmount(baseTotal, discount, discountType);
        const taxableAmount = baseTotal - discountAmount;
        
        const customerState = getCustomerState();
        const { cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount } = calculateTaxBreakdown(taxableAmount, gstRate, customerState);
        const cessAmount = taxableAmount * (cessRate / 100);
        
        updatedItem.cgstRate = cgstRate;
        updatedItem.sgstRate = sgstRate;
        updatedItem.igstRate = igstRate;
        updatedItem.cgstAmount = cgstAmount;
        updatedItem.sgstAmount = sgstAmount;
        updatedItem.igstAmount = igstAmount;
        updatedItem.cessAmount = cessAmount;
        updatedItem.total = taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount;
      } else {
        const baseTotal = price * qty;
        const discountAmount = getDiscountAmount(baseTotal, discount, discountType);
        const taxableAmount = baseTotal - discountAmount;
        
        const customerState = getCustomerState();
        const { cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount } = calculateTaxBreakdown(taxableAmount, gstRate, customerState);
        const cessAmount = taxableAmount * (cessRate / 100);
        
        updatedItem.cgstRate = cgstRate;
        updatedItem.sgstRate = sgstRate;
        updatedItem.igstRate = igstRate;
        updatedItem.cgstAmount = cgstAmount;
        updatedItem.sgstAmount = sgstAmount;
        updatedItem.igstAmount = igstAmount;
        updatedItem.cessAmount = cessAmount;
        updatedItem.total = taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount;
      }
      
      return updatedItem;
    }));
  };

  const subtotal = items.reduce((acc, item) => {
    const base = Number(item.price) * Number(item.qty);
    const discount = getDiscountAmount(base, Number(item.discount || 0), item.discountType || 'percentage');
    return acc + (base - discount);
  }, 0);
  
  const totalCGST = items.reduce((acc, item) => acc + (Number(item.cgstAmount) || 0), 0);
  const totalSGST = items.reduce((acc, item) => acc + (Number(item.sgstAmount) || 0), 0);
  const totalIGST = items.reduce((acc, item) => acc + (Number(item.igstAmount) || 0), 0);
  const totalCESS = items.reduce((acc, item) => acc + (Number(item.cessAmount) || 0), 0);

  const totalTax = items.reduce((acc, item) => {
    const baseAmount = Number(item.price) * Number(item.qty);
    const discountAmount = getDiscountAmount(baseAmount, Number(item.discount || 0), item.discountType || 'percentage');
    const taxableAmount = baseAmount - discountAmount;
    
    // Use calculated amounts if available, otherwise fallback to rate calculation
    const cgst = Number(item.cgstAmount) || (taxableAmount * (Number(item.cgstRate) / 100)) || 0;
    const sgst = Number(item.sgstAmount) || (taxableAmount * (Number(item.sgstRate) / 100)) || 0;
    const igst = Number(item.igstAmount) || (taxableAmount * (Number(item.igstRate) / 100)) || 0;
    const cess = Number(item.cessAmount) || (taxableAmount * (Number(item.cessRate) / 100)) || 0;
    
    return acc + cgst + sgst + igst + cess;
  }, 0);

  const grandTotal = items.reduce((acc, item) => acc + Number(item.total), 0);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.customer) newErrors.customer = 'Customer is required';
    if (!formData.invoiceNumber) newErrors.invoiceNumber = 'Invoice number is required';
    if (!formData.date) newErrors.date = 'Invoice date is required';
    
    const filledItems = items.filter(item => item.product);
    
    if (filledItems.length === 0) newErrors.items = 'Add at least one item to the invoice';
    
    filledItems.forEach((item, index) => {
      if (!item.qty || item.qty <= 0) newErrors[`item_${index}_qty`] = `Valid quantity required for item ${index + 1}`;
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    try {
      const customerData = selectedCustomerData;
      
      const filledItems = items.filter(item => item.product);
      const lineDiscountTypes = filledItems.map(item => ({
        type: item.discountType || 'percentage'
      }));
      
      const invoiceData = {
        invoiceNumber: formData.invoiceNumber,
        date: formData.date,
        dueDate: formData.dueDate || null,
        partyId: customerData ? customerData.id : null,
        customer: formData.customer,
        customerDetails: {
          ...customerData,
          selectedShippingAddress: selectedShippingAddress,
          lineDiscountTypes
        },
        items: filledItems,
        subtotal: subtotal,
        totalTax: totalTax,
        totalCGST,
        totalSGST,
        totalIGST,
        totalCESS,
        grandTotal: grandTotal,
        status: 'draft'
      };

      if (isEdit && id) {
        await updateInvoice(Number(id), invoiceData);
      } else {
        await createInvoice(invoiceData);
      }
      navigate('/invoices');
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      
      if (error.response?.data?.code === 'DUPLICATE_INVOICE_NUMBER') {
        try {
          const nextNumberRes = await getNextInvoiceNumber();
          const suggestedNumber = nextNumberRes.data.nextInvoiceNumber;
          
          if (window.confirm(`Invoice number "${formData.invoiceNumber}" already exists. Would you like to use "${suggestedNumber}" instead?`)) {
            setFormData(prev => ({ ...prev, invoiceNumber: suggestedNumber }));
            setErrors(prev => ({ ...prev, invoiceNumber: '' }));
          }
        } catch (err) {
          alert(`Invoice number already exists. Please use a different invoice number.`);
        }
      } else {
        alert(`Failed to save invoice: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    try {
      const customerData = selectedCustomerData;
      
      const filledItems = items.filter(item => item.product);
      const lineDiscountTypes = filledItems.map(item => ({
        type: item.discountType || 'percentage'
      }));
      
      const invoiceData = {
        invoiceNumber: formData.invoiceNumber,
        date: formData.date,
        dueDate: formData.dueDate || null,
        partyId: customerData ? customerData.id : null,
        customer: formData.customer,
        customerDetails: {
          ...customerData,
          selectedShippingAddress: selectedShippingAddress,
          lineDiscountTypes
        },
        items: filledItems,
        subtotal: subtotal,
        totalTax: totalTax,
        totalCGST,
        totalSGST,
        totalIGST,
        totalCESS,
        grandTotal: grandTotal,
        status: 'generated'
      };

      if (isEdit && id) {
        await updateInvoice(Number(id), invoiceData);
      } else {
        await createInvoice(invoiceData);
      }
      navigate('/invoices');
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      
      if (error.response?.data?.code === 'DUPLICATE_INVOICE_NUMBER') {
        try {
          const nextNumberRes = await getNextInvoiceNumber();
          const suggestedNumber = nextNumberRes.data.nextInvoiceNumber;
          
          if (window.confirm(`Invoice number "${formData.invoiceNumber}" already exists. Would you like to use "${suggestedNumber}" instead?`)) {
            setFormData(prev => ({ ...prev, invoiceNumber: suggestedNumber }));
            setErrors(prev => ({ ...prev, invoiceNumber: '' }));
          }
        } catch (err) {
          alert(`Invoice number already exists. Please use a different invoice number.`);
        }
      } else {
        alert(`Failed to generate invoice: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-[1400px] mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {isEdit ? 'Edit Invoice' : 'Create New Invoice'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-base">
          {isEdit ? 'Update invoice details.' : 'Fill in the details below to generate a new invoice.'}
        </p>
      </div>

      {/* Error Banner */}
      {Object.values(errors).filter(e => e).length > 0 && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-red-500">error</span>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">Please fix the following errors:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-400">
                {Object.values(errors).filter(e => e).map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
            <button onClick={() => setErrors({})} className="text-red-500 hover:text-red-700">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Bill To & Invoice Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-6">
        {/* Bill To Section */}
        <BillToSection
          customer={selectedCustomerData}
          selectedAddress={selectedShippingAddress}
          onCustomerChange={(customer) => {
            setSelectedCustomerData(customer);
            setFormData(prev => ({ ...prev, customer: customer?.name || '' }));
          }}
          onShippingAddressChange={(address) => setSelectedShippingAddress(address)}
        />

        {/* Invoice Details */}
        <InvoiceDetailsSection
          title="Invoice Details"
          invoiceNumberLabel="Invoice Number"
          invoiceNumberPlaceholder="INV-2025-001"
          dateLabel="Invoice Date"
          dueDateLabel="Due Date"
          invoiceNumber={formData.invoiceNumber}
          date={formData.date}
          dueDate={formData.dueDate}
          errors={errors}
          onChange={handleInputChange}
        />
      </div>

      {/* Line Items */}
      <ItemsManager
        items={items}
        config={{
          mode: 'invoice',
          showHSN: false,
          showDiscount: true,
          showGSTRates: true,
          showCESSRates: true,
          layoutStyle: 'cards'
        }}
        products={products}
        warehouses={warehouses}
        gstRates={gstRates}
        cessRates={cessRates}
        onItemsChange={setItems}
        onAddProducts={addItem}
        isProductSelectionModalOpen={isProductSelectionModalOpen}
        onCloseProductModal={() => setIsProductSelectionModalOpen(false)}
        onSelectProducts={handleSelectProducts}
        onItemChange={handleItemChange}
        onDeleteItem={deleteItem}
      />

      {/* Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-10">
        <div className="space-y-4">
          {/* Space for future notes/terms */}
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 w-full lg:max-w-md ml-auto">
          <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">
            <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-[20px]">summarize</span>
            <h3 className="font-bold text-sm uppercase tracking-wide">Invoice Summary</h3>
          </div>
          
          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Subtotal (Excl. Tax)</span>
              <span className="font-bold text-gray-900 dark:text-white font-mono">₹ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Total Tax</span>
              <span className="font-bold text-gray-900 dark:text-white font-mono">+ ₹ {totalTax.toFixed(2)}</span>
            </div>
            <div className="my-4 border-t border-dashed border-gray-300 dark:border-gray-700"></div>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Grand Total</span>
                <span className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {items.filter(item => item.product).length} line items
                </span>
              </div>
              <span className="text-2xl font-bold text-primary tracking-tight font-mono">₹ {grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 z-40">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
            Auto-save enabled
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              type="button"
              onClick={() => navigate('/invoices')} 
              disabled={saving}
              className="flex-1 sm:flex-none h-10 px-6 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            
            <button 
              type="button"
              onClick={handleSave}
              disabled={saving || items.filter(item => item.product).length === 0}
              className="flex-1 sm:flex-none h-10 px-6 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save Draft
            </button>
            
            <button 
              type="button"
              onClick={handleGenerateInvoice}
              disabled={saving || items.filter(item => item.product).length === 0}
              className="flex-1 sm:flex-none h-10 px-6 rounded-md bg-primary text-white font-medium hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Generate Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default InvoiceForm;
