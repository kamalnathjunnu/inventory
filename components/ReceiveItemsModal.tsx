import React, { useState, useEffect } from 'react';
import { getWarehouses, getProducts } from '../services/api';

interface ReceiveItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (receivedItems: any[]) => void;
  items: any[];
  poNumber?: string;
}

const ReceiveItemsModal: React.FC<ReceiveItemsModalProps> = ({ isOpen, onClose, onConfirm, items, poNumber }) => {
  const [receivedItems, setReceivedItems] = useState<any[]>([]);
  const [useSameWarehouseForAll, setUseSameWarehouseForAll] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [productBatches, setProductBatches] = useState<{[key: string]: any[]}>({});
  const [activeForm, setActiveForm] = useState<{ [key: number]: 'new' | 'existing' | null }>({});

  // Load warehouses and product batches
  useEffect(() => {
    const fetchData = async () => {
      try {
        const warehousesRes = await getWarehouses(1, 1000);
        setWarehouses(warehousesRes.data.items || []);

        // Fetch product details to get existing batches
        if (items && items.length > 0) {
          const productsRes = await getProducts(1, 1000);
          const allProducts = productsRes.data.items || [];
          
          const batchesMap: {[key: string]: any[]} = {};
          items.forEach(item => {
            const product = allProducts.find((p: any) => p.name === item.product);
            if (product && product.enableBatching && product.batches) {
              const batches = typeof product.batches === 'string' ? JSON.parse(product.batches) : product.batches;
              batchesMap[item.product] = batches || [];
            } else {
              batchesMap[item.product] = [];
            }
          });
          setProductBatches(batchesMap);
        }
      } catch (error) {
        console.error('Error fetching warehouses/batches:', error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, items]);

  // Initialize state when modal opens with items from the PO
  useEffect(() => {
    if (isOpen && items) {
      setReceivedItems(items.map(item => ({
          ...item,
          selected: true,
          existingBatches: productBatches[item.product] || [],
          // batches: array so user can split qty across batches
          batches: [{ id: Date.now() + Math.random(), batchNumber: '', qty: item.qty || 0, targetWarehouse: '', mfgDate: '', expDate: '', isExisting: false, buyingPrice: item.price || 0, sellingPrice: item.sellingPrice || 0 }],
        })));
      setUseSameWarehouseForAll(false);
    }
  }, [isOpen, items, productBatches]);

  const handleItemChange = (id: number, field: string, value: string) => {
    setReceivedItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleBatchChange = (itemId: number, batchId: number | string, field: string, value: any) => {
    setReceivedItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const batches = item.batches.map((b: any) => b.id === batchId ? { ...b, [field]: value } : b);
      return { ...item, batches };
    }));
  };

  const addBatchRow = (itemId: number, isExisting: boolean, batchNumber?: string, batchData?: any) => {
    setReceivedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newBatch = {
          id: Date.now(),
          isNew: !isExisting,
          batchNumber: isExisting ? batchNumber : (batchData?.batchNumber || `NEW-${Date.now()}`),
          qty: batchData?.qty || '',
          buyingPrice: batchData?.buyingPrice,
          sellingPrice: batchData?.sellingPrice,
          mfgDate: batchData?.mfgDate,
          expDate: batchData?.expDate,
          targetWarehouse: batchData?.targetWarehouse || '',
        };
        return { ...item, batches: [...item.batches, newBatch] };
      }
      return item;
    }));
  };

  const removeBatchRow = (itemId: number, batchId: number) => {
    setReceivedItems(prev => prev.map(item => item.id === itemId ? { ...item, batches: item.batches.filter((b: any) => b.id !== batchId) } : item));
  };

  const toggleSelect = (id: number) => {
    setReceivedItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const handleConfirm = () => {
    const selected = receivedItems.map(i => ({
      ...i,
      batches: i.batches.map((b: any) => ({
        ...b,
        qty: Number(b.qty) || 0,
        buyingPrice: Number(b.buyingPrice) || 0,
        sellingPrice: Number(b.sellingPrice) || 0,
      }))
    }));
    onConfirm(selected);
  };

  const getTotalReceivedQty = (item: any) => {
    return (item.batches || []).reduce((acc: number, b: any) => acc + (Number(b.qty) || 0), 0);
  };

  const handleAddNewBatch = (itemId: number, newBatchData: any) => {
    addBatchRow(itemId, false, undefined, newBatchData);
    setActiveForm(prev => ({ ...prev, [itemId]: null }));
  };

  const handleAddExistingBatch = (itemId: number, existingBatchData: any) => {
    addBatchRow(itemId, true, existingBatchData.batchNumber, existingBatchData);
    setActiveForm(prev => ({ ...prev, [itemId]: null }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm font-display">
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root">
        <div className="layout-container flex h-full grow flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-b-gray-200 dark:border-b-gray-800 bg-white dark:bg-background-dark px-6">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Receive Items for Purchase Order #{poNumber}</h1>
            <button onClick={onClose} className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </header>
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mx-auto max-w-5xl space-y-6">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4">
                <div className="flex items-center gap-4">
                  <input 
                    id="same-warehouse-checkbox" 
                    type="checkbox" 
                    checked={useSameWarehouseForAll} 
                    onChange={() => setUseSameWarehouseForAll(s => !s)} 
                    className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 bg-transparent text-primary focus:ring-primary dark:text-primary dark:focus:ring-primary"
                  />
                  <label htmlFor="same-warehouse-checkbox" className="text-sm font-medium text-gray-700 dark:text-gray-300">Use same warehouse for all items</label>
                </div>
                {useSameWarehouseForAll && (
                  <div className="shrink-0">
                    <select 
                      onChange={(e) => {
                        const val = e.target.value;
                        setReceivedItems(prev => prev.map(item => ({ ...item, batches: item.batches.map((b: any) => ({ ...b, targetWarehouse: val })) })));
                      }}
                      className="w-48 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm shadow-sm focus:border-primary focus:ring-primary"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {receivedItems.map((item) => {
                const totalReceived = getTotalReceivedQty(item);
                const isOverReceived = totalReceived > item.qty;

                return (
                  <div key={item.id} className={`flex flex-col rounded-xl border ${isOverReceived ? 'border-danger' : 'border-gray-200 dark:border-gray-800'} bg-white dark:bg-gray-900/50 shadow-sm overflow-hidden`}>
                    <div className="p-4 sm:p-6 @container">
                      <div className="flex flex-col items-stretch justify-start @lg:flex-row @lg:items-start gap-4">
                        <div className="w-full @lg:w-1/3 flex items-start gap-4">
                          <img className="h-20 w-20 rounded-lg object-cover bg-gray-100 dark:bg-gray-800" src={item.images?.[0] || 'https://via.placeholder.com/80'} alt={item.product} />
                          <div className="flex flex-col items-stretch justify-center gap-1">
                            <p className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">{item.product}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {item.sku}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Ordered: {item.qty} units</p>
                          </div>
                        </div>
                        <div className="flex w-full @lg:w-2/3 grow flex-col items-stretch justify-center gap-2">
                          <div className="text-right">
                            <p className={`text-xl font-bold ${isOverReceived ? 'text-danger' : 'text-gray-800 dark:text-gray-100'}`}>Received: {totalReceived} / {item.qty}</p>
                            {isOverReceived && <p className="text-xs text-danger mt-1">Quantity received cannot exceed quantity ordered.</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/70 px-4 sm:px-6 py-4">
                      <div className="space-y-4">
                        {item.batches.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                  <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Batch #</th>
                                  <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Quantity</th>
                                  <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Warehouse</th>
                                  <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800">
                                {item.batches.map((b: any) => (
                                  <tr key={b.id} className="border-t border-t-gray-200 dark:border-t-gray-700">
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{b.batchNumber}</td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{b.qty}</td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{b.targetWarehouse}</td>
                                    <td className="px-4 py-3">
                                      <button onClick={() => removeBatchRow(item.id, b.id)} className="text-danger hover:underline text-sm font-semibold">Remove</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        <div className="pt-2 space-y-4">
                          {activeForm[item.id] === 'new' ? (
                            <NewBatchForm 
                              item={item}
                              warehouses={warehouses}
                              onAddBatch={handleAddNewBatch}
                              onCancel={() => setActiveForm(prev => ({ ...prev, [item.id]: null }))}
                            />
                          ) : activeForm[item.id] === 'existing' ? (
                            <ExistingBatchForm
                              item={item}
                              warehouses={warehouses}
                              onAddBatch={handleAddExistingBatch}
                              onCancel={() => setActiveForm(prev => ({ ...prev, [item.id]: null }))}
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <button onClick={() => setActiveForm(prev => ({ ...prev, [item.id]: 'new' }))} className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-9 px-3 bg-transparent text-primary gap-2 text-sm font-semibold hover:bg-primary/10">
                                <span className="material-symbols-outlined text-lg">add</span>
                                <span className="truncate">Add New Batch</span>
                              </button>
                              {item.existingBatches && item.existingBatches.length > 0 && (
                                <button onClick={() => setActiveForm(prev => ({ ...prev, [item.id]: 'existing' }))} className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-9 px-3 bg-transparent text-primary gap-2 text-sm font-semibold hover:bg-primary/10">
                                  <span className="material-symbols-outlined text-lg">add</span>
                                  <span className="truncate">Use Existing Batch</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </main>
          <footer className="sticky bottom-0 flex h-16 shrink-0 items-center justify-end gap-4 border-t border-t-gray-200 dark:border-t-gray-800 bg-white dark:bg-background-dark px-6">
            <button onClick={onClose} className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium">
              <span className="truncate">Cancel</span>
            </button>
            <button 
              onClick={handleConfirm} 
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                receivedItems.some(item => getTotalReceivedQty(item) > item.qty) ||
                receivedItems.reduce((total, item) => total + getTotalReceivedQty(item), 0) === 0
              }
            >
              <span className="truncate">Confirm Receipt</span>
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

const NewBatchForm = ({ item, warehouses, onAddBatch, onCancel }: any) => {
  const [batch, setBatch] = useState({
    batchNumber: '',
    qty: '',
    buyingPrice: item.price || 0,
    buyingPriceTax: false,
    sellingPrice: item.sellingPrice || 0,
    sellingPriceTax: false,
    mfgDate: '',
    expDate: '',
    targetWarehouse: ''
  });

  const handleChange = (field: string, value: any) => {
    setBatch(b => ({ ...b, [field]: value }));
  };

  const handleAdd = () => {
    onAddBatch(item.id, batch);
  };

  return (
    <div className="space-y-4 rounded-lg bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">Add New Batch</h3>
        <button onClick={onCancel} className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div>
          <label className="block mb-1 font-medium text-gray-600 dark:text-gray-400">Batch Number</label>
          <input type="text" value={batch.batchNumber} onChange={e => handleChange('batchNumber', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-primary focus:ring-primary" placeholder="e.g., B-CH-001" />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-600 dark:text-gray-400">Quantity</label>
          <input type="number" value={batch.qty} onChange={e => handleChange('qty', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-primary focus:ring-primary" placeholder="0" />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-600 dark:text-gray-400">Buying Price</label>
          <input type="number" value={batch.buyingPrice} onChange={e => handleChange('buyingPrice', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-primary focus:ring-primary" placeholder="0.00" />
          <div className="flex items-center gap-2 mt-1">
            <input type="checkbox" id="buyingPriceTax" checked={batch.buyingPriceTax} onChange={e => handleChange('buyingPriceTax', e.target.checked)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary" />
            <label htmlFor="buyingPriceTax" className="text-xs text-gray-600 dark:text-gray-400">Tax Inclusive</label>
          </div>
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-600 dark:text-gray-400">Selling Price</label>
          <input type="number" value={batch.sellingPrice} onChange={e => handleChange('sellingPrice', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-primary focus:ring-primary" placeholder="0.00" />
          <div className="flex items-center gap-2 mt-1">
            <input type="checkbox" id="sellingPriceTax" checked={batch.sellingPriceTax} onChange={e => handleChange('sellingPriceTax', e.target.checked)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary" />
            <label htmlFor="sellingPriceTax" className="text-xs text-gray-600 dark:text-gray-400">Tax Inclusive</label>
          </div>
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-600 dark:text-gray-400">Mfg Date</label>
          <input type="date" value={batch.mfgDate} onChange={e => handleChange('mfgDate', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-primary focus:ring-primary" />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-600 dark:text-gray-400">Exp Date</label>
          <input type="date" value={batch.expDate} onChange={e => handleChange('expDate', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-primary focus:ring-primary" />
        </div>
        <div className="sm:col-span-2">
          <label className="block mb-1 font-medium text-gray-600 dark:text-gray-400">Warehouse</label>
          <select value={batch.targetWarehouse} onChange={e => handleChange('targetWarehouse', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-primary focus:ring-primary">
            <option value="">Select Warehouse</option>
            {warehouses.map((w: any) => <option key={w.id} value={w.name}>{w.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={handleAdd} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-primary text-white text-sm font-medium hover:bg-primary/90">
          <span className="truncate">Add Batch</span>
        </button>
      </div>
    </div>
  );
};

const ExistingBatchForm = ({ item, warehouses, onAddBatch, onCancel }: any) => {
  const [batch, setBatch] = useState({
    batchNumber: '',
    qty: '',
    targetWarehouse: ''
  });

  const handleChange = (field: string, value: any) => {
    setBatch(b => ({ ...b, [field]: value }));
  };

  const handleAdd = () => {
    onAddBatch(item.id, batch);
  };

  return (
    <div className="space-y-4 rounded-lg bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">Use Existing Batch</h3>
        <button onClick={onCancel} className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="sm:col-span-1">
          <label className="block mb-1 font-medium text-gray-600 dark:text-gray-400">Batch</label>
          <select value={batch.batchNumber} onChange={e => handleChange('batchNumber', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-primary focus:ring-primary">
            <option value="">Select a batch</option>
            {item.existingBatches.map((b: any) => <option key={b.id} value={b.batchNumber}>{b.batchNumber} (Exp: {b.expDate})</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-600 dark:text-gray-400">Quantity</label>
          <input type="number" value={batch.qty} onChange={e => handleChange('qty', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-primary focus:ring-primary" placeholder="0" />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-600 dark:text-gray-400">Warehouse</label>
          <select value={batch.targetWarehouse} onChange={e => handleChange('targetWarehouse', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-primary focus:ring-primary">
            <option value="">Select Warehouse</option>
            {warehouses.map((w: any) => <option key={w.id} value={w.name}>{w.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={handleAdd} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-primary text-white text-sm font-medium hover:bg-primary/90">
          <span className="truncate">Add to Batch</span>
        </button>
      </div>
    </div>
  );
};

export default ReceiveItemsModal;
