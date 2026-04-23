import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ItemsManager from '../components/ItemsManager';
import { getProducts, getWarehouses, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, searchCustomers, getGSTRates, getCESSRates } from '../services/api';
import axios from 'axios';

const PurchaseOrderForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    number: '',
    supplier: '',
    supplierId: null as number | null,
    date: new Date().toISOString().split('T')[0],
    validUntil: '',
    destinationWarehouse: '',
    notes: ''
  });

  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [gstRates, setGstRates] = useState<any[]>([]);
  const [cessRates, setCessRates] = useState<any[]>([]);
  const [isProductSelectionModalOpen, setIsProductSelectionModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Supplier search state
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [supplierSearchResults, setSupplierSearchResults] = useState<any[]>([]);
  const [isSearchingSuppliers, setIsSearchingSuppliers] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);

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
        setProducts(productsRes.data.items || []);
        setWarehouses(warehousesRes.data.items || []);
        setGstRates(gstRatesRes.data.items || []);
        setCessRates(cessRatesRes.data.items || []);

        if (!isEdit) {
          const response = await axios.get('http://localhost:5000/api/purchase-orders/next-number');
          setFormData(prev => ({ ...prev, number: response.data.nextPONumber }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isEdit]);

  useEffect(() => {
    if (isEdit && id && warehouses.length > 0) {
      const fetchPO = async () => {
        setLoading(true);
        try {
          const response = await getPurchaseOrder(Number(id));
          const po = response.data.data;
          
          // If there's supplier data, add to suppliers list and use supplier name
          let supplierName = '';
          if (po.supplierData) {
            supplierName = po.supplierData.name || '';
            setSuppliers(prev => {
              const exists = prev.some(s => s.id === po.supplierData.id);
              return exists ? prev : [...prev, po.supplierData];
            });
          }
          
          // Find warehouse name from warehouseId
          const warehouse = warehouses.find(w => w.id === po.warehouseId);
          const warehouseName = warehouse?.name || po.destinationWarehouse || '';
          
          setFormData({
            number: po.number || '',
            supplier: supplierName,
            supplierId: po.supplierId || null,
            date: po.date ? po.date.split('T')[0] : '',
            validUntil: po.expectedDeliveryDate ? po.expectedDeliveryDate.split('T')[0] : '',
            destinationWarehouse: warehouseName,
            notes: po.notes || ''
          });
          
          // Map items from backend format to frontend format
          const poItems = typeof po.items === 'string' ? JSON.parse(po.items) : (po.items || []);
          const mappedItems = poItems.map((item: any) => {
            // Get hsn and unit from stored values or fallback to product data
            const productData = item.productData || {};
            return {
              id: item.id || Date.now() + Math.random(),
              product: item.productName || item.product || '',
              productId: item.productId || null,
              productData: productData,
              hsn: item.hsn || productData.hsn || '',
              warehouse: warehouseName,
              batch: item.batch || '',
              qty: item.quantity || item.qty || 0,
              unit: item.unit || productData.measuringUnitData?.name || 'pcs',
              price: item.rate || item.price || 0,
              gstRate: item.taxRate || item.gstRate || 0,
              cessRate: item.cessRate || 0,
              discount: item.discount || 0,
              total: item.amount || item.total || 0
            };
          });
          setItems(mappedItems);
        } catch (error) {
          console.error('Error fetching PO:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchPO();
    }
  }, [isEdit, id, warehouses]);

  // Debounced supplier search
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (supplierSearchQuery.length > 0) {
        setIsSearchingSuppliers(true);
        try {
          const response = await searchCustomers(supplierSearchQuery, 10);
          setSupplierSearchResults(response.data.items || []);
        } catch (error) {
          console.error('Error searching suppliers:', error);
          setSupplierSearchResults([]);
        } finally {
          setIsSearchingSuppliers(false);
        }
      } else {
        setSupplierSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [supplierSearchQuery]);

  const handleSelectProducts = (selectedProducts: any[]) => {
    const existingProductNames = new Set(items.map(item => item.product));
    const productsToAdd = selectedProducts.filter(product => !existingProductNames.has(product.name));
    
    const newItems = productsToAdd.map(product => {
      // Extract GST rate from product's gstRateData association
      const gstRate = product.gstRateData?.rate 
        ? parseFloat(product.gstRateData.rate) 
        : (product.gstRate || 0);
      
      // Extract CESS rate from product's cessRateData association
      const cessRate = product.cessRateData?.value 
        ? parseFloat(product.cessRateData.value) 
        : (product.cessRate || 0);
      
      const qty = product.quantity || 1;
      const price = product.buyingPrice || 0;
      
      return {
        id: Date.now() + Math.random(),
        product: product.name,
        productId: product.id,
        productData: product,
        hsn: product.hsn || '',
        warehouse: formData.destinationWarehouse || '',
        batch: '',
        qty: qty,
        unit: product.measuringUnitData?.name || product.measuringUnit || 'pcs',
        price: price,
        gstRate: gstRate,
        cessRate: cessRate,
        discount: 0,
        total: qty * price
      };
    });
    
    if (newItems.length > 0) {
      setItems([...items, ...newItems]);
    }
    setIsProductSelectionModalOpen(false);
  };

  const handleItemChange = (itemId: number, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'product') {
          const product = products.find(p => p.name === value);
          if (product) {
            updatedItem.productId = product.id;
            updatedItem.productData = product;
            updatedItem.price = product.buyingPrice || 0;
            updatedItem.unit = product.measuringUnitData?.name || product.measuringUnit || 'pcs';
            updatedItem.hsn = product.hsn || '';
          }
        }
        
        if (['qty', 'price'].includes(field)) {
          const qty = parseFloat(updatedItem.qty) || 0;
          const price = parseFloat(updatedItem.price) || 0;
          updatedItem.total = qty * price;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleRemoveItem = (itemId: number) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.qty) * parseFloat(item.price)), 0);
  const totalTax = 0; // No tax calculation for PO
  const grandTotal = subtotal;

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.supplier) newErrors.supplier = 'Supplier is required';
    if (!formData.number) newErrors.number = 'PO number is required';
    if (!formData.date) newErrors.date = 'PO date is required';
    
    const filledItems = items.filter(item => item.product);
    if (filledItems.length === 0) newErrors.items = 'Add at least one item to the purchase order';
    
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
      const supplierData = suppliers.find(s => s.name === formData.supplier) || 
                           supplierSearchResults.find(s => s.name === formData.supplier);
      
      const filledItems = items.filter(item => item.product);
      
      // Find warehouseId from warehouse name
      const warehouse = warehouses.find(w => w.name === formData.destinationWarehouse);
      
      // Map items to match PurchaseOrderItem model
      const mappedItems = filledItems.map(item => ({
        productName: item.product,
        productId: item.productId,
        hsn: item.hsn || '',
        unit: item.unit || 'pcs',
        quantity: Number(item.qty) || 0,
        rate: Number(item.price) || 0,
        taxRate: Number(item.gstRate) || 0,
        cessRate: Number(item.cessRate) || 0,
        taxAmount: 0,
        amount: Number(item.total) || 0
      }));
      
      const poData = {
        number: formData.number,
        supplierId: supplierData?.id || formData.supplierId,
        date: formData.date,
        expectedDeliveryDate: formData.validUntil || null,
        warehouseId: warehouse?.id || null,
        items: mappedItems,
        subtotal: subtotal,
        totalTax: totalTax,
        grandTotal: grandTotal,
        status: 'Draft',
        notes: formData.notes
      };

      if (isEdit && id) {
        await updatePurchaseOrder(Number(id), poData);
      } else {
        await createPurchaseOrder(poData);
      }
      navigate('/purchase-orders');
    } catch (error: any) {
      console.error('Error saving PO:', error);
      alert(`Failed to save purchase order: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePO = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    try {
      const supplierData = suppliers.find(s => s.name === formData.supplier) || 
                           supplierSearchResults.find(s => s.name === formData.supplier);
      
      const filledItems = items.filter(item => item.product);
      
      // Find warehouseId from warehouse name
      const warehouse = warehouses.find(w => w.name === formData.destinationWarehouse);
      
      // Map items to match PurchaseOrderItem model
      const mappedItems = filledItems.map(item => ({
        productName: item.product,
        productId: item.productId,
        hsn: item.hsn || '',
        unit: item.unit || 'pcs',
        quantity: Number(item.qty) || 0,
        rate: Number(item.price) || 0,
        taxRate: Number(item.gstRate) || 0,
        cessRate: Number(item.cessRate) || 0,
        taxAmount: 0,
        amount: Number(item.total) || 0
      }));
      
      const poData = {
        number: formData.number,
        supplierId: supplierData?.id || formData.supplierId,
        date: formData.date,
        expectedDeliveryDate: formData.validUntil || null,
        warehouseId: warehouse?.id || null,
        items: mappedItems,
        subtotal: subtotal,
        totalTax: totalTax,
        grandTotal: grandTotal,
        status: 'Sent',
        notes: formData.notes
      };

      if (isEdit && id) {
        await updatePurchaseOrder(Number(id), poData);
      } else {
        await createPurchaseOrder(poData);
      }
      navigate('/purchase-orders');
    } catch (error: any) {
      console.error('Error generating PO:', error);
      alert(`Failed to generate purchase order: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading purchase order data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-[1400px] mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {isEdit ? 'Edit Purchase Order' : 'Create New Purchase Order'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-base">
          {isEdit ? 'Update purchase order details.' : 'Fill in the details below to create a new purchase order.'}
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

      {/* Supplier & PO Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-6">
        {/* Supplier Section */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                Supplier <span className="text-red-500">*</span>
              </h3>
            </div>
            
            <div className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  value={supplierSearchQuery || formData.supplier}
                  onChange={(e) => {
                    setSupplierSearchQuery(e.target.value);
                    if (!e.target.value) {
                      setFormData(prev => ({ ...prev, supplier: '', supplierId: null }));
                    }
                  }}
                  placeholder="Search and select a supplier..."
                  className={`w-full h-11 pl-10 pr-4 rounded-md border ${errors.supplier ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-400 shadow-sm hover:border-gray-400 dark:hover:border-gray-600`}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 dark:text-gray-400 text-[20px]">search</span>
                {isSearchingSuppliers && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  </div>
                )}
                {supplierSearchQuery && supplierSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {supplierSearchResults.map((supplier) => (
                      <button
                        key={supplier.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, supplier: supplier.name, supplierId: supplier.id }));
                          setSuppliers(prev => {
                            const exists = prev.some(s => s.id === supplier.id);
                            return exists ? prev : [...prev, supplier];
                          });
                          setSupplierSearchQuery('');
                          setSupplierSearchResults([]);
                          setErrors(prev => ({...prev, supplier: ''}));
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{supplier.name}</div>
                        {supplier.email && <div className="text-xs text-gray-500">{supplier.email}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {formData.supplier && !supplierSearchQuery && (() => {
                const supplier = supplierSearchResults.find(s => s.name === formData.supplier) || suppliers.find(s => s.name === formData.supplier);
                return supplier ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-900 dark:text-white">Supplier Name</label>
                      <input 
                        className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-sm outline-none"
                        type="text" 
                        value={supplier.name} 
                        readOnly
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-900 dark:text-white">GSTIN / UIN</label>
                      <input 
                        className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-sm outline-none uppercase font-mono tracking-wide"
                        type="text" 
                        value={supplier.gstNumber || 'N/A'} 
                        readOnly
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-gray-900 dark:text-white">Address</label>
                      <input 
                        className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-sm outline-none"
                        type="text" 
                        value={`${supplier.shippingAddress || ''}${supplier.shippingCity ? ', ' + supplier.shippingCity : ''}${supplier.shippingState ? ', ' + supplier.shippingState : ''}${supplier.shippingPostalCode ? ' - ' + supplier.shippingPostalCode : ''}`} 
                        readOnly
                      />
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>

        {/* PO Details */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 h-full">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
              <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">description</span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">PO Details</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900 dark:text-white">
                  PO Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={formData.number}
                    onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                    className={`w-full h-10 px-3 pr-8 rounded-md border ${errors.number ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono`}
                    placeholder="PO-2025-001"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs">#</span>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900 dark:text-white">
                  PO Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    max="9999-12-31"
                    className={`w-full h-10 px-3 pl-9 rounded-md border ${errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none`}
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 dark:text-gray-400 text-[18px] pointer-events-none">calendar_today</span>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900 dark:text-white">PO Valid Until</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={formData.validUntil}
                    onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                    max="9999-12-31"
                    className="w-full h-10 px-3 pl-9 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 dark:text-gray-400 text-[18px] pointer-events-none">event_upcoming</span>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900 dark:text-white">Destination Warehouse</label>
                <select 
                  value={formData.destinationWarehouse}
                  onChange={(e) => setFormData(prev => ({ ...prev, destinationWarehouse: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center] hover:border-gray-400 dark:hover:border-gray-600"
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.name}>{wh.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <ItemsManager
        items={items}
        config={{
          mode: 'purchase-order',
          showHSN: true,
          showGSTRates: true,
          showCESSRates: true,
          layoutStyle: 'cards'
        }}
        products={products}
        warehouses={warehouses}
        gstRates={gstRates}
        cessRates={cessRates}
        onItemsChange={setItems}
        onAddProducts={() => setIsProductSelectionModalOpen(true)}
        isProductSelectionModalOpen={isProductSelectionModalOpen}
        onCloseProductModal={() => setIsProductSelectionModalOpen(false)}
        onSelectProducts={handleSelectProducts}
        onItemChange={handleItemChange}
        onDeleteItem={handleRemoveItem}
      />

      {/* Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-10">
        <div className="space-y-4">
          {/* Notes */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5"
              placeholder="Add any additional notes..."
            />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 w-full lg:max-w-md ml-auto">
          <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">
            <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-[20px]">summarize</span>
            <h3 className="font-bold text-sm uppercase tracking-wide">PO Summary</h3>
          </div>
          
          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Subtotal</span>
              <span className="font-bold text-gray-900 dark:text-white font-mono">₹ {subtotal.toFixed(2)}</span>
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
              onClick={() => navigate('/purchase-orders')} 
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
              onClick={handleGeneratePO}
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
                  Generate PO
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
