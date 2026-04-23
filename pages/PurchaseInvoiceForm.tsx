import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ItemsManager from '../components/ItemsManager';
import BillToSection from '../components/BillToSection';
import InvoiceDetailsSection from '../components/InvoiceDetailsSection';
import { 
  getGSTRates, 
  getCESSRates, 
  getSetting,
  getPurchaseInvoice,
  createPurchaseInvoice,
  updatePurchaseInvoice,
  getNextPurchaseInvoiceNumber,
  getPurchaseOrder
} from '../services/api';

interface PurchaseItem {
  id: number;
  product: string;
  productId: number | null;
  productData: any;
  hsn: string;
  warehouse: string;
  warehouseId: number | null;
  batchNumber: string;
  mfgDate: string;
  expDate: string;
  qty: number;
  unit: string;
  price: number;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessRate: number;
  cessAmount: number;
  discount: number;
  discountType?: 'percentage' | 'amount';
  total: number;
  batchId?: number | null;
}

const PurchaseInvoiceForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  
  // Get PO ID from query params
  const poId = searchParams.get('poId');

  // Form State
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    supplierInvoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    supplier: '',
    supplierId: null as number | null,
    paymentTerms: 'Net 30 Days',
    notes: '',
    status: 'draft'
  });

  // Items State
  const [items, setItems] = useState<PurchaseItem[]>([]);
  
  // Dynamic Data State
  const [selectedSupplierData, setSelectedSupplierData] = useState<any>(null);
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<any>(null);
  const [gstRates, setGstRates] = useState<any[]>([]);
  const [cessRates, setCessRates] = useState<any[]>([]);
  const [companyState, setCompanyState] = useState('');
  const [isProductSelectionModalOpen, setIsProductSelectionModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [poDataPopulated, setPoDataPopulated] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load data from database
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [gstRatesRes, cessRatesRes] = await Promise.all([
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

        setGstRates(gstRatesRes.data.items || []);
        setCessRates(cessRatesRes.data.items || []);
        setCompanyState(companyState);
        
        if (!isEdit) {
          try {
            const nextNumberRes = await getNextPurchaseInvoiceNumber();
            setFormData(prev => ({ ...prev, invoiceNumber: nextNumberRes.data.data.nextInvoiceNumber }));
          } catch (err) {
            console.log('Could not fetch next invoice number');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
        setDataLoaded(true);
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
          const response = await getPurchaseInvoice(Number(id));
          const invoice = response.data.data;
          
          if (invoice.supplierData) {
            setSelectedSupplierData(invoice.supplierData);
          }

          setFormData({
            invoiceNumber: invoice.invoiceNumber || '',
            supplierInvoiceNumber: invoice.supplierInvoiceNumber || '',
            date: invoice.date || '',
            dueDate: invoice.dueDate || '',
            supplier: invoice.supplier || '',
            supplierId: invoice.supplierId,
            paymentTerms: invoice.paymentTerms || 'Net 30 Days',
            notes: invoice.notes || '',
            status: invoice.status || 'draft'
          });

          const invoiceItems = invoice.purchaseInvoiceItems ? invoice.purchaseInvoiceItems.map((item: any) => ({
            id: item.id,
            product: item.productName,
            productId: item.productId,
            productData: item.productData,
            hsn: item.productData?.hsn || '',
            warehouse: item.warehouseData?.name || '',
            warehouseId: item.warehouseId,
            batchNumber: item.batchNumber || '',
            batchId: item.batchId,
            mfgDate: item.mfgDate || '',
            expDate: item.expDate || '',
            qty: Number(item.quantity),
            unit: item.unit || item.productData?.measuringUnitData?.name || '',
            price: Number(item.rate),
            gstRate: Number(item.taxRate) || 0,
            cgstRate: Number(item.cgstRate) || 0,
            sgstRate: Number(item.sgstRate) || 0,
            igstRate: Number(item.igstRate) || 0,
            cgstAmount: Number(item.cgstAmount) || 0,
            sgstAmount: Number(item.sgstAmount) || 0,
            igstAmount: Number(item.igstAmount) || 0,
            cessRate: Number(item.cessRate) || 0,
            cessAmount: Number(item.cessAmount) || 0,
            discount: Number(item.discount) || 0,
            discountType: item.discountType || 'percentage',
            total: Number(item.amount)
          })) : [];
          
          setItems(invoiceItems);
        } catch (error) {
          console.error('Error fetching purchase invoice:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchInvoice();
    }
  }, [isEdit, id]);

  // Populate from Purchase Order if coming from PO view
  useEffect(() => {
    // Fetch and populate PO data if poId is in query params and data has loaded
    if (!isEdit && poId && dataLoaded && !poDataPopulated) {
      const fetchPOData = async () => {
        try {
          console.log('Fetching PO data for ID:', poId);
          const response = await getPurchaseOrder(Number(poId));
          // API returns { success: true, data: { ... } }
          const po = response.data.data || response.data;
          
          console.log('PO data received:', po);
          
          if (!po) {
            console.error('PO not found');
            return;
          }

          // Parse items - can be in items array or purchaseOrderItems array
          let poItems = po.items || po.purchaseOrderItems || [];
          if (typeof poItems === 'string') {
            poItems = JSON.parse(poItems);
          }
          
          console.log('PO items:', poItems);
          
          // Set supplier information
          if (po.supplierData) {
            setSelectedSupplierData(po.supplierData);
          }
          
          setFormData(prev => ({
            ...prev,
            supplier: po.supplier || po.supplierData?.name || '',
            supplierId: po.supplierId || po.supplierData?.id || null,
            notes: po.number ? `Created from Purchase Order: ${po.number}` : ''
          }));

          // Map PO items to invoice items
          const invoiceItems: PurchaseItem[] = poItems.map((item: any, index: number) => {
            const productData = item.productData || null;
            
            // Handle both PO item formats (flat vs purchaseOrderItems structure)
            const productName = item.product || item.productName || productData?.name || '';
            const quantity = Number(item.qty) || Number(item.quantity) || 0;
            const price = Number(item.price) || Number(item.rate) || Number(productData?.buyingPrice) || 0;
            const unitName = item.unit || productData?.measuringUnitData?.name || '';
            
            return {
              id: Date.now() + index,
              product: productName,
              productId: item.productId || null,
              productData: productData,
              hsn: productData?.hsn || item.hsn || '',
              warehouse: po.destinationWarehouse || item.warehouse || '',
              warehouseId: po.destinationWarehouseId || item.warehouseId || null,
              batchNumber: item.batchNumber || '',
              mfgDate: item.mfgDate || '',
              expDate: item.expDate || '',
              qty: quantity,
              unit: unitName,
              price: price,
              gstRate: Number(item.gstRate) || Number(item.taxRate) || Number(productData?.gstRate) || 0,
              cgstRate: 0,
              sgstRate: 0,
              igstRate: 0,
              cgstAmount: 0,
              sgstAmount: 0,
              igstAmount: 0,
              cessRate: Number(item.cessRate) || 0,
              cessAmount: 0,
              discount: Number(item.discount) || 0,
              total: 0,
              batchId: item.batchId || null
            };
          });

          setItems(invoiceItems);
          setPoDataPopulated(true);
          console.log('PO data populated successfully with', invoiceItems.length, 'items');
        } catch (error) {
          console.error('Error fetching PO data:', error);
        }
      };
      
      fetchPOData();
    }
  }, [poId, isEdit, dataLoaded, poDataPopulated]);

  // Helpers
  const getSupplierState = () => {
    return selectedSupplierData?.billingState || selectedSupplierData?.shippingState || selectedSupplierData?.state || '';
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

  const calculateTaxBreakdown = (baseAmount: number, gstRate: number, supplierState: string) => {
    const isIntraState = !supplierState || !companyState || supplierState.toLowerCase() === companyState.toLowerCase();
    
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

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectProducts = (selectedProducts: any[]) => {
    const existingProductNames = new Set(items.map(item => item.product));
    const productsToAdd = selectedProducts.filter(product => !existingProductNames.has(product.name));
    const supplierState = getSupplierState();
    
    const newItems: PurchaseItem[] = productsToAdd.map(product => {
      const selectedBatch = (product.batchRecords || []).find((b: any) => String(b.id) === String(product.batchId));
      const buyingPrice = Number(selectedBatch?.buyingPrice ?? product.buyingPrice) || 0;
      const gstRate = Number(product.gstRateData?.rate || product.gstPercentage) || 0;
      const cessRate = Number(product.cessRateData?.value || product.cessPercentage) || 0;
      const buyingPriceIncludesTax = selectedBatch?.buyingPriceTax != null
        ? selectedBatch.buyingPriceTax === true
        : product.buyingPriceTax === true;
      const qty = 1;
      
      let basePrice = buyingPrice;
      let baseAmount = 0;
      
      if (buyingPriceIncludesTax && (gstRate > 0 || cessRate > 0)) {
        const totalTaxRate = gstRate + cessRate;
        basePrice = buyingPrice / (1 + (totalTaxRate / 100));
        baseAmount = basePrice * qty;
      } else {
        basePrice = buyingPrice;
        baseAmount = basePrice * qty;
      }
      
      const { cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount } = calculateTaxBreakdown(baseAmount, gstRate, supplierState);
      const cessAmount = baseAmount * (cessRate / 100);
      const total = baseAmount + cgstAmount + sgstAmount + igstAmount + cessAmount;
      
      return {
        id: Date.now() + Math.random(), 
        product: product.name,
        productId: product.id,
        productData: product,
        hsn: product.hsn || '',
        warehouse: '',
        warehouseId: null,
        batchNumber: product.batch || selectedBatch?.batchNumber || (product.enableBatching ? '' : 'DEFAULT'),
        mfgDate: selectedBatch?.mfgDate || '',
        expDate: selectedBatch?.expDate || '',
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
        total: total,
        batchId: product.batchId || selectedBatch?.id || null
      };
    });
    
    if (newItems.length > 0) {
      setItems([...items, ...newItems]);
    }
    setIsProductSelectionModalOpen(false);
  };

  const deleteItem = (itemId: number) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleItemChange = (itemId: number, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id !== itemId) return item;
      
      const updatedItem = { ...item };

      if (field === 'total') {
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
      }

      updatedItem[field as keyof PurchaseItem] = value as never;
      
      // Recalculate totals when qty, price, or discount changes
      if (['qty', 'price', 'discount', 'discountType', 'gstRate', 'cessRate'].includes(field)) {
        const qty = Number(updatedItem.qty) || 0;
        const price = Number(updatedItem.price) || 0;
        const discount = Math.max(0, Number(updatedItem.discount) || 0);
        const discountType = updatedItem.discountType || 'percentage';
        const gstRate = Number(updatedItem.gstRate) || 0;
        const cessRate = Number(updatedItem.cessRate) || 0;

        if (discountType === 'percentage' && discount > 100) {
          updatedItem.discount = 100;
        }
        
        const baseTotal = price * qty;
        const discountAmount = getDiscountAmount(baseTotal, discount, discountType);
        const taxableAmount = baseTotal - discountAmount;
        
        const supplierState = getSupplierState();
        const { cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount } = calculateTaxBreakdown(taxableAmount, gstRate, supplierState);
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

  // Calculate totals
  const subtotal = items.reduce((acc, item) => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    const discount = Number(item.discount) || 0;
    const baseTotal = price * qty;
    const discountAmount = getDiscountAmount(baseTotal, discount, item.discountType || 'percentage');
    return acc + (baseTotal - discountAmount);
  }, 0);

  const totalCGST = items.reduce((acc, item) => acc + (Number(item.cgstAmount) || 0), 0);
  const totalSGST = items.reduce((acc, item) => acc + (Number(item.sgstAmount) || 0), 0);
  const totalIGST = items.reduce((acc, item) => acc + (Number(item.igstAmount) || 0), 0);
  const totalCESS = items.reduce((acc, item) => acc + (Number(item.cessAmount) || 0), 0);
  const totalTax = totalCGST + totalSGST + totalIGST + totalCESS;
  const grandTotal = items.reduce((acc, item) => acc + Number(item.total), 0);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.supplier) newErrors.supplier = 'Supplier is required';
    if (!formData.invoiceNumber) newErrors.invoiceNumber = 'Invoice number is required';
    if (!formData.date) newErrors.date = 'Invoice date is required';
    
    const filledItems = items.filter(item => item.product);
    
    if (filledItems.length === 0) newErrors.items = 'Add at least one item to the invoice';
    
    filledItems.forEach((item, index) => {
      if (!item.qty || item.qty <= 0) newErrors[`item_${index}_qty`] = `Valid quantity required for item ${index + 1}`;
      if (item.productData?.enableBatching && !item.batchId) {
        newErrors[`item_${index}_batch`] = `Batch selection required for item ${index + 1}`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status: string = 'draft') => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    try {
      const supplierData = selectedSupplierData;
      
      const filledItems = items.filter(item => item.product);
      const lineDiscountTypes = filledItems.map(item => ({
        type: item.discountType || 'percentage'
      }));
      
      const invoiceData = {
        invoiceNumber: formData.invoiceNumber,
        supplierInvoiceNumber: formData.supplierInvoiceNumber,
        date: formData.date,
        dueDate: formData.dueDate || null,
        supplierId: formData.supplierId,
        supplier: formData.supplier,
        supplierDetails: {
          ...supplierData,
          selectedShippingAddress,
          lineDiscountTypes
        },
        paymentTerms: formData.paymentTerms,
        notes: formData.notes,
        items: filledItems.map(item => ({
          productId: item.productId,
          product: item.product,
          productName: item.product,
          quantity: item.qty,
          qty: item.qty,
          unit: item.unit,
          rate: item.price,
          price: item.price,
          gstRate: item.gstRate,
          taxRate: item.gstRate,
          cgstRate: item.cgstRate,
          cgstAmount: item.cgstAmount,
          sgstRate: item.sgstRate,
          sgstAmount: item.sgstAmount,
          igstRate: item.igstRate,
          igstAmount: item.igstAmount,
          cessRate: item.cessRate,
          cessAmount: item.cessAmount,
          batchNumber: item.batchNumber || ((item.productData?.batchRecords || []).find((b: any) => String(b.id) === String(item.batchId))?.batchNumber) || null,
          mfgDate: item.mfgDate || ((item.productData?.batchRecords || []).find((b: any) => String(b.id) === String(item.batchId))?.mfgDate) || null,
          expDate: item.expDate || ((item.productData?.batchRecords || []).find((b: any) => String(b.id) === String(item.batchId))?.expDate) || null,
          discount: item.discount,
          amount: item.total,
          total: item.total,
          warehouseId: item.warehouseId,
          batchId: item.batchId
        })),
        subtotal: subtotal,
        totalTax: totalTax,
        totalCGST,
        totalSGST,
        totalIGST,
        totalCESS,
        grandTotal: grandTotal,
        status: status
      };

      if (isEdit && id) {
        await updatePurchaseInvoice(Number(id), invoiceData);
      } else {
        await createPurchaseInvoice(invoiceData);
      }
      navigate('/purchase-invoices');
    } catch (error: any) {
      console.error('Error saving purchase invoice:', error);
      alert(`Failed to save purchase invoice: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const errorMessages = Object.values(errors).filter(e => e);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/purchase-invoices')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isEdit ? 'Edit Purchase Invoice' : 'New Purchase Invoice'}
                </h1>
                <p className="text-sm text-gray-500">{formData.invoiceNumber || 'Draft'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={() => handleSave('approved')}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                {saving ? 'Saving...' : 'Approve & Add Stock'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessages.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Please fix the following errors:</h3>
                <ul className="mt-2 text-sm text-red-700 dark:text-red-400 list-disc list-inside">
                  {errorMessages.map((error, i) => <li key={i}>{error}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill To & Invoice Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-6">
          <BillToSection
            customer={selectedSupplierData}
            placeholderText="Search and select a supplier..."
            addButtonLabel="+ New Supplier"
            sectionLabel="Supplier"
            showShippingAddress={false}
            onCustomerChange={(supplier) => {
              setSelectedSupplierData(supplier);
              setFormData(prev => ({
                ...prev,
                supplier: supplier?.name || '',
                supplierId: supplier?.id || null
              }));
            }}
          />

          <InvoiceDetailsSection
            title="Purchase Invoice Details"
            invoiceNumberLabel="Purchase Number"
            invoiceNumberPlaceholder="PI-0001"
            dateLabel="Purchase Date"
            dueDateLabel="Due Date"
            invoiceNumber={formData.invoiceNumber}
            date={formData.date}
            dueDate={formData.dueDate}
            errors={errors}
            onChange={handleInputChange}
          />
        </div>

        <ItemsManager
          items={items}
          config={{
            mode: 'invoice',
            showHSN: false,
            showDiscount: true,
            showGSTRates: true,
            showCESSRates: true,
            showWarehouse: false,
            showBatch: false,
            layoutStyle: 'cards'
          }}
            products={[]}
            warehouses={[]}
          gstRates={gstRates}
          cessRates={cessRates}
          onItemsChange={(updatedItems) => setItems(updatedItems as PurchaseItem[])}
          onAddProducts={() => setIsProductSelectionModalOpen(true)}
          isProductSelectionModalOpen={isProductSelectionModalOpen}
          onCloseProductModal={() => setIsProductSelectionModalOpen(false)}
          onSelectProducts={handleSelectProducts}
          onItemChange={handleItemChange}
          onDeleteItem={deleteItem}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-10">
          <div className="space-y-4"></div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 w-full lg:max-w-md ml-auto">
            <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">
              <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-[20px]">summarize</span>
              <h3 className="font-bold text-sm uppercase tracking-wide">Purchase Summary</h3>
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
                </div>
                <span className="text-2xl font-bold text-primary font-mono">₹ {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseInvoiceForm;
