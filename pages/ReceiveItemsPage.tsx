import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPurchaseOrder, receivePurchaseOrder, getWarehouses, getProducts } from '../services/api';

const ReceiveItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [po, setPo] = useState<any>(null);
  const [receivedItems, setReceivedItems] = useState<any[]>([]);
  const [useSameWarehouseForAll, setUseSameWarehouseForAll] = useState(false);
  const [globalWarehouse, setGlobalWarehouse] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [productBatches, setProductBatches] = useState<{[key: string]: any[]}>({});
  const [activeForm, setActiveForm] = useState<{ [key: number]: 'new' | 'existing' | null }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Fetch PO and warehouse data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const [poRes, warehousesRes, productsRes] = await Promise.all([
          getPurchaseOrder(Number(id)),
          getWarehouses(1, 1000),
          getProducts(1, 1000)
        ]);

        const poData = poRes.data.data;
        setPo(poData);
        setWarehouses(warehousesRes.data.items || []);

        const allProducts = productsRes.data.items || [];
        const items = poData.items || [];

        // Build batches map for existing batches
        const batchesMap: {[key: string]: any[]} = {};
        items.forEach((item: any) => {
          const productName = item.productName || item.product;
          const product = allProducts.find((p: any) => p.name === productName);
          if (product && product.enableBatching && product.batches) {
            const batches = typeof product.batches === 'string' ? JSON.parse(product.batches) : product.batches;
            batchesMap[productName] = batches || [];
          } else {
            batchesMap[productName] = [];
          }
        });
        setProductBatches(batchesMap);

        // Initialize received items
        const mappedItems = items.map((item: any) => ({
          id: item.id || Date.now() + Math.random(),
          product: item.productName || item.product,
          productId: item.productId,
          qty: item.quantity || item.qty,
          price: item.rate || item.price,
          unit: item.unit || 'pcs',
          hsn: item.hsn || '',
          existingBatches: batchesMap[item.productName || item.product] || [],
          batches: [{
            id: Date.now() + Math.random(),
            batchNumber: '',
            qty: item.quantity || item.qty || 0,
            targetWarehouse: '',
            mfgDate: '',
            expDate: '',
            buyingPrice: item.rate || item.price || 0,
            buyingPriceTax: false,
            sellingPrice: 0,
            sellingPriceTax: false
          }]
        }));
        setReceivedItems(mappedItems);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getTotalReceivedQty = (item: any) => {
    return (item.batches || []).reduce((acc: number, b: any) => acc + (Number(b.qty) || 0), 0);
  };

  const handleBatchChange = (itemId: number, batchId: number | string, field: string, value: any) => {
    setReceivedItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const batches = item.batches.map((b: any) => b.id === batchId ? { ...b, [field]: value } : b);
      return { ...item, batches };
    }));
  };

  const addBatchRow = (itemId: number, batchData?: any) => {
    setReceivedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newBatch = {
          id: Date.now() + Math.random(),
          batchNumber: batchData?.batchNumber || '',
          qty: batchData?.qty || '',
          buyingPrice: batchData?.buyingPrice || item.price || 0,
          buyingPriceTax: batchData?.buyingPriceTax || false,
          sellingPrice: batchData?.sellingPrice || 0,
          sellingPriceTax: batchData?.sellingPriceTax || false,
          mfgDate: batchData?.mfgDate || '',
          expDate: batchData?.expDate || '',
          targetWarehouse: batchData?.targetWarehouse || globalWarehouse || '',
        };
        return { ...item, batches: [...item.batches, newBatch] };
      }
      return item;
    }));
  };

  const removeBatchRow = (itemId: number, batchId: number) => {
    setReceivedItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, batches: item.batches.filter((b: any) => b.id !== batchId) } 
        : item
    ));
  };

  const handleAddNewBatch = (itemId: number, newBatchData: any) => {
    addBatchRow(itemId, newBatchData);
    setActiveForm(prev => ({ ...prev, [itemId]: null }));
  };

  const handleAddExistingBatch = (itemId: number, existingBatchData: any) => {
    addBatchRow(itemId, existingBatchData);
    setActiveForm(prev => ({ ...prev, [itemId]: null }));
  };

  const applyGlobalWarehouse = (warehouseName: string) => {
    setGlobalWarehouse(warehouseName);
    setReceivedItems(prev => prev.map(item => ({
      ...item,
      batches: item.batches.map((b: any) => ({ ...b, targetWarehouse: warehouseName }))
    })));
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    let hasItems = false;
    receivedItems.forEach((item, index) => {
      const totalQty = getTotalReceivedQty(item);
      if (totalQty > item.qty) {
        newErrors[`item_${index}`] = `Cannot receive more than ordered quantity (${item.qty})`;
      }
      if (totalQty > 0) {
        hasItems = true;
        item.batches.forEach((batch: any, bIndex: number) => {
          if (Number(batch.qty) > 0 && !batch.targetWarehouse) {
            newErrors[`item_${index}_batch_${bIndex}`] = 'Warehouse is required';
          }
          if (Number(batch.qty) > 0 && !batch.batchNumber) {
            newErrors[`item_${index}_batch_${bIndex}_bn`] = 'Batch number is required';
          }
        });
      }
    });

    if (!hasItems) {
      newErrors.items = 'Add at least one batch to receive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    try {
      const formattedItems = receivedItems.map(item => ({
        product: item.product,
        productId: item.productId,
        price: item.price || 0,
        batches: item.batches
          .filter((batch: any) => Number(batch.qty) > 0)
          .map((batch: any) => ({
            batchNumber: batch.batchNumber,
            quantity: Number(batch.qty),
            warehouse: batch.targetWarehouse,
            mfgDate: batch.mfgDate,
            expDate: batch.expDate,
            buyingPrice: Number(batch.buyingPrice) || 0,
            buyingPriceTax: batch.buyingPriceTax,
            sellingPrice: Number(batch.sellingPrice) || 0,
            sellingPriceTax: batch.sellingPriceTax
          }))
      })).filter(item => item.batches.length > 0);

      await receivePurchaseOrder(Number(id), {
        receivedItems: formattedItems,
        receivedDate: new Date().toISOString().split('T')[0]
      });

      navigate('/purchase-orders');
    } catch (error: any) {
      console.error('Error receiving PO:', error);
      alert(`Failed to receive purchase order: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals
  const totalItems = receivedItems.length;
  const totalQtyToReceive = receivedItems.reduce((sum, item) => sum + getTotalReceivedQty(item), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Purchase Order not found</div>
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
              <button
                onClick={() => navigate(`/purchase-orders/view/${id}`)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Receive Items</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">PO #{po.number}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/purchase-orders/view/${id}`)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || totalQtyToReceive === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">inventory</span>
                {saving ? 'Receiving...' : 'Confirm Receipt'}
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* PO Info Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supplier</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{po.supplierData?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">PO Date</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {po.date ? new Date(po.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</p>
                <span className="inline-flex mt-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {po.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grand Total</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">₹{Number(po.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Warehouse Setting */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm mb-6">
          <div className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <input 
                id="same-warehouse-checkbox" 
                type="checkbox" 
                checked={useSameWarehouseForAll} 
                onChange={() => setUseSameWarehouseForAll(s => !s)} 
                className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 bg-transparent text-primary focus:ring-primary"
              />
              <label htmlFor="same-warehouse-checkbox" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Use same warehouse for all items
              </label>
            </div>
            {useSameWarehouseForAll && (
              <select 
                value={globalWarehouse}
                onChange={(e) => applyGlobalWarehouse(e.target.value)}
                className="w-48 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm shadow-sm focus:border-primary focus:ring-primary"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Items Section */}
        <div className="space-y-4">
          {receivedItems.map((item, itemIndex) => {
            const totalReceived = getTotalReceivedQty(item);
            const isOverReceived = totalReceived > item.qty;

            return (
              <div 
                key={item.id} 
                className={`bg-white dark:bg-gray-900 rounded-xl border ${isOverReceived ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'} shadow-sm overflow-hidden`}
              >
                {/* Item Header */}
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400">inventory_2</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.product}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          HSN: {item.hsn || 'N/A'} • Unit: {item.unit} • Rate: ₹{Number(item.price || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ordered: {item.qty} {item.unit}</p>
                      <p className={`text-lg font-bold ${isOverReceived ? 'text-red-600' : 'text-green-600'}`}>
                        Receiving: {totalReceived} / {item.qty}
                      </p>
                      {isOverReceived && (
                        <p className="text-xs text-red-500 mt-1">Cannot exceed ordered quantity</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Batches Table */}
                <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/50">
                  {item.batches.length > 0 && (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Batch #</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Quantity</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Warehouse</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Buying Price</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Selling Price</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Mfg Date</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Exp Date</th>
                            <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {item.batches.map((batch: any, batchIndex: number) => (
                            <tr key={batch.id} className="bg-white dark:bg-gray-800">
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={batch.batchNumber}
                                  onChange={(e) => handleBatchChange(item.id, batch.id, 'batchNumber', e.target.value)}
                                  placeholder="Batch #"
                                  className="w-full min-w-[120px] rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={batch.qty}
                                  onChange={(e) => handleBatchChange(item.id, batch.id, 'qty', e.target.value)}
                                  placeholder="0"
                                  className="w-20 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={batch.targetWarehouse}
                                  onChange={(e) => handleBatchChange(item.id, batch.id, 'targetWarehouse', e.target.value)}
                                  className="w-full min-w-[140px] rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary"
                                >
                                  <option value="">Select</option>
                                  {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={batch.buyingPrice}
                                  onChange={(e) => handleBatchChange(item.id, batch.id, 'buyingPrice', e.target.value)}
                                  placeholder="0.00"
                                  className="w-24 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={batch.sellingPrice}
                                  onChange={(e) => handleBatchChange(item.id, batch.id, 'sellingPrice', e.target.value)}
                                  placeholder="0.00"
                                  className="w-24 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="date"
                                  value={batch.mfgDate}
                                  onChange={(e) => handleBatchChange(item.id, batch.id, 'mfgDate', e.target.value)}
                                  className="w-32 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="date"
                                  value={batch.expDate}
                                  onChange={(e) => handleBatchChange(item.id, batch.id, 'expDate', e.target.value)}
                                  className="w-32 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                {item.batches.length > 1 && (
                                  <button 
                                    onClick={() => removeBatchRow(item.id, batch.id)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Remove"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Add Batch Buttons */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => addBatchRow(item.id)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Add Another Batch
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Items</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{totalItems}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Qty to Receive</p>
                <p className="text-lg font-bold text-green-600">{totalQtyToReceive}</p>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={saving || totalQtyToReceive === 0}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">inventory</span>
              {saving ? 'Processing...' : 'Confirm Receipt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiveItemsPage;
