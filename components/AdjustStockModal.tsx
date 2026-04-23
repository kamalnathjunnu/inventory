import React, { useState, useEffect } from 'react';
import { getWarehouses } from '../services/api';
import QuickCreateBatchModal from './QuickCreateBatchModal';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number, newStock: number, reason: string, warehouse?: string, batchId?: string | number, newBatch?: any) => void;
  product: {
    id: number;
    name: string;
    sku: string;
    stock: number;
    enableBatching?: boolean;
    batches?: any[];
    warehouseInventory?: Record<string, number>;
    wh?: string; // Legacy/List view single warehouse
  } | null;
  onProductUpdated?: (product: any) => void; // Callback to update product with new batch
}

const AdjustStockModal: React.FC<AdjustStockModalProps> = ({ isOpen, onClose, onConfirm, product, onProductUpdated }) => {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  
  // New State for Selection
  const [selectedBatchId, setSelectedBatchId] = useState<string | number>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  
  // Batch Creation Modal State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [productBatches, setProductBatches] = useState<any[]>([]);

  // Fetch warehouses from database
  useEffect(() => {
    const fetchWarehouses = async () => {
      setLoadingWarehouses(true);
      try {
        const response = await getWarehouses(1, 1000);
        setWarehouses(response.data.items || []);
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      } finally {
        setLoadingWarehouses(false);
      }
    };
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (isOpen && product) {
      setAdjustmentType('add');
      setQuantity('');
      setReason('');
      setShowBatchModal(false);
      
      // Initialize batches from product
      setProductBatches(product.batches || []);
      
      // Default Batch Selection
      if (product.enableBatching && product.batches && product.batches.length > 0) {
        setSelectedBatchId(product.batches[0].id);
      } else {
        setSelectedBatchId('');
      }

      // Default Warehouse Selection
      if (product.wh) {
        setSelectedWarehouse(product.wh);
      } else if (product.warehouseInventory && Object.keys(product.warehouseInventory).length > 0) {
        setSelectedWarehouse(Object.keys(product.warehouseInventory)[0]);
      } else if (warehouses.length > 0) {
        setSelectedWarehouse(warehouses[0].name);
      }
    }
  }, [isOpen, product, warehouses]);

  // Handler for when a new batch is created
  const handleBatchCreated = (newBatch: any) => {
    // Add new batch to local list
    setProductBatches(prev => [...prev, newBatch]);
    // Select the newly created batch
    setSelectedBatchId(newBatch.id);
    // Notify parent to update product data if callback provided
    if (onProductUpdated && product) {
      onProductUpdated({
        ...product,
        batches: [...productBatches, newBatch]
      });
    }
  };

  if (!isOpen || !product) return null;

  // Helper to get current stock for the selected context
  const getCurrentContextStock = () => {
    if (product.enableBatching && selectedBatchId) {
        // Check both product.batches and local productBatches for newly created batches
        const batch = productBatches.find(b => String(b.id) === String(selectedBatchId)) 
          || product.batches?.find(b => String(b.id) === String(selectedBatchId));
        if (batch) {
            // Check if batch has specific location data
            if (batch.locations && Array.isArray(batch.locations)) {
                const loc = batch.locations.find((l: any) => l.warehouse === selectedWarehouse);
                return Number(loc?.quantity) || 0;
            }
            return 0; 
        }
    } else {
        // Simple inventory
        if (product.warehouseInventory && product.warehouseInventory[selectedWarehouse] !== undefined) {
            return product.warehouseInventory[selectedWarehouse];
        }
        if (product.wh === selectedWarehouse) {
            return product.stock;
        }
    }
    return 0; // Default if nothing matches (e.g. adding to new warehouse)
  };

  const currentContextStock = getCurrentContextStock();

  const calculateNewStock = () => {
    const qty = Number(quantity) || 0;
    if (adjustmentType === 'add') return currentContextStock + qty;
    if (adjustmentType === 'remove') return Math.max(0, currentContextStock - qty);
    return qty;
  };

  const handleSave = () => {
    if (quantity === '' || Number(quantity) < 0) return;
    
    // Validate batch selection
    if (product.enableBatching && !selectedBatchId) {
      alert('Please select a batch or create a new one');
      return;
    }
    
    const newStock = calculateNewStock();
    
    // Create log entry
    const logEntry = {
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      adjustmentType,
      quantity: Number(quantity),
      oldStock: currentContextStock,
      newStock: newStock,
      reason: reason || 'N/A',
      warehouse: selectedWarehouse,
      batchId: selectedBatchId,
      timestamp: new Date().toISOString()
    };

    // Save to localStorage
    try {
      const existingLogs = JSON.parse(localStorage.getItem('stockAdjustmentLogs') || '[]');
      localStorage.setItem('stockAdjustmentLogs', JSON.stringify([logEntry, ...existingLogs]));
    } catch (e) {
      console.error("Failed to save stock log", e);
    }

    onConfirm(
      product.id, 
      newStock, 
      reason, 
      selectedWarehouse, 
      selectedBatchId
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-800 transform transition-all scale-100 my-8">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Adjust Stock</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-6 space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{product.sku}</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
             {/* Batch Selection */}
             {product.enableBatching && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Select Batch <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowBatchModal(true)}
                      className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      New Batch
                    </button>
                  </div>
                  
                  {productBatches.length > 0 ? (
                    <select 
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-primary focus:border-primary py-2"
                    >
                      {productBatches.map((b: any) => {
                        const batchTotal = b.locations?.reduce((sum: number, loc: any) => sum + (Number(loc.quantity) || 0), 0) || 0;
                        return (
                          <option key={b.id} value={b.id}>
                            {b.batchNumber} - Exp: {b.expDate || 'N/A'} - Total: {batchTotal} units
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
                      No batches available. Click "New Batch" to create one.
                    </div>
                  )}
                </div>
             )}

             {/* Warehouse Selection */}
             <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Select Warehouse</label>
                <select 
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-primary focus:border-primary py-2"
                  disabled={loadingWarehouses}
                >
                   {loadingWarehouses ? (
                     <option>Loading warehouses...</option>
                   ) : warehouses.length === 0 ? (
                     <option>No warehouses available</option>
                   ) : (
                     warehouses.map(wh => (
                       <option key={wh.id} value={wh.name}>{wh.name}</option>
                     ))
                   )}
                </select>
             </div>
          </div>

          <div className="flex justify-between items-center px-1">
             <span className="text-xs font-medium text-gray-500 uppercase">Current Context Stock</span>
             <span className="text-sm font-bold text-gray-900 dark:text-white">{currentContextStock}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
              <select 
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as any)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-primary focus:border-primary py-2"
              >
                <option value="add">Add (+)</option>
                <option value="remove">Deduct (-)</option>
                <option value="set">Set To</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
              <input 
                type="number" 
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  setQuantity(value === '' ? '' : Number(value));
                }}
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-primary focus:border-primary py-2"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/10">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Context Stock:</span>
            <span className="font-bold text-primary text-lg">{calculateNewStock()}</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (Optional)</label>
            <textarea 
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-primary focus:border-primary p-2"
              placeholder="e.g., Stock take correction, Damaged goods..."
            ></textarea>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={quantity === ''}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>

      {/* Quick Create Batch Modal */}
      <QuickCreateBatchModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onCreated={handleBatchCreated}
        productId={product?.id || null}
        productName={product?.name}
      />
    </div>
  );
};

export default AdjustStockModal;