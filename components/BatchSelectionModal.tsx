import React, { useState, useEffect } from 'react';
import QuickCreateBatchModal from './QuickCreateBatchModal';

interface BatchSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  onConfirm: (configuredProducts: any[]) => void;
}

const BatchSelectionModal: React.FC<BatchSelectionModalProps> = ({
  isOpen,
  onClose,
  products,
  onConfirm
}) => {
  // State to store selections: productId -> { warehouse: string, warehouseId?: string, batch: string, batchId?: string }
  const [selections, setSelections] = useState<Record<string, { warehouse: string, warehouseId?: string, batch: string, batchId?: string }>>({});
  const [warehousesMap, setWarehousesMap] = useState<Record<string, any[]>>({});
  const [batchesMap, setBatchesMap] = useState<Record<string, any[]>>({});
  const [isQuickBatchModalOpen, setIsQuickBatchModalOpen] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  const getWarehousesFromProduct = (product: any) => {
    const batchRecords = product?.batchRecords || [];
    const warehouseMap = new Map<string, any>();

    batchRecords.forEach((batch: any) => {
      const locations = batch?.locations || [];
      locations.forEach((loc: any) => {
        const warehouse = loc?.warehouseData || (loc?.warehouseId ? { id: loc.warehouseId, name: loc.warehouse } : null);
        if (warehouse?.id && warehouse?.name && !warehouseMap.has(String(warehouse.id))) {
          warehouseMap.set(String(warehouse.id), { id: warehouse.id, name: warehouse.name });
        }
      });
    });

    return Array.from(warehouseMap.values());
  };

  const getBatchesForProductWarehouse = (product: any, warehouseName: string) => {
    const batchRecords = product?.batchRecords || [];
    if (!warehouseName) return batchRecords;

    return batchRecords.filter((batch: any) =>
      (batch?.locations || []).some((loc: any) =>
        (loc?.warehouseData?.name === warehouseName || loc?.warehouse === warehouseName) &&
        Number(loc?.quantity) > 0
      )
    );
  };

  // Initialize selections, warehouses, and batches from product object.
  useEffect(() => {
    if (isOpen && products.length > 0) {
      const initialSelections: Record<string, { warehouse: string, warehouseId?: string, batch: string, batchId?: string }> = {};
      const initialWarehousesMap: Record<string, any[]> = {};
      const initialBatchesMap: Record<string, any[]> = {};

      products.forEach(p => {
        initialSelections[p.id] = { warehouse: '', batch: '' };
        const productWarehouses = getWarehousesFromProduct(p);
        initialWarehousesMap[p.id] = productWarehouses;

        // Keep empty until warehouse is selected for better UX consistency.
        initialBatchesMap[p.id] = [];

        if (productWarehouses.length === 1) {
          const defaultWarehouse = productWarehouses[0];
          const availableBatches = getBatchesForProductWarehouse(p, defaultWarehouse.name);

          initialSelections[p.id] = {
            warehouse: defaultWarehouse.name,
            warehouseId: defaultWarehouse.id,
            batch: availableBatches.length === 1 ? availableBatches[0].batchNumber : '',
            batchId: availableBatches.length === 1 ? availableBatches[0].id : undefined
          };

          initialBatchesMap[p.id] = availableBatches;
        }
      });

      setSelections(initialSelections);
      setWarehousesMap(initialWarehousesMap);
      setBatchesMap(initialBatchesMap);
    }
  }, [isOpen, products]);

  const handleWarehouseChange = (productId: string, warehouseName: string) => {
    const product = products.find(p => p.id === productId);
    const warehouses = warehousesMap[productId] || [];
    const warehouse = warehouses.find((w: any) => w.name === warehouseName);
    const warehouseId = warehouse ? warehouse.id : undefined;

    const availableBatches = product ? getBatchesForProductWarehouse(product, warehouseName) : [];
    setBatchesMap(prev => ({
      ...prev,
      [productId]: availableBatches
    }));

    setSelections(prev => ({
      ...prev,
      [productId]: { 
        ...prev[productId], 
        warehouse: warehouseName, 
        warehouseId: warehouseId,
        batch: availableBatches.length === 1 ? availableBatches[0].batchNumber : '',
        batchId: availableBatches.length === 1 ? availableBatches[0].id : undefined
      }
    }));
  };

  const handleBatchChange = (productId: string, batchNumber: string) => {
    const batch = (batchesMap[productId] || []).find((b: any) => b.batchNumber === batchNumber);
    const batchId = batch ? batch.id : undefined;

    setSelections(prev => ({
      ...prev,
      [productId]: { 
        ...prev[productId], 
        batch: batchNumber,
        batchId: batchId
      }
    }));
  };

  const handleOpenCreateBatch = (productId: string) => {
    setActiveProductId(productId);
    setIsQuickBatchModalOpen(true);
  };

  const handleBatchCreated = (newBatch: any) => {
    if (!activeProductId) return;

    setBatchesMap(prev => ({
      ...prev,
      [activeProductId]: [...(prev[activeProductId] || []), newBatch]
    }));

    setSelections(prev => ({
      ...prev,
      [activeProductId]: {
        ...prev[activeProductId],
        batch: newBatch.batchNumber,
        batchId: newBatch.id
      }
    }));

    setIsQuickBatchModalOpen(false);
  };

  const isFormValid = () => {
    // Check if all products have warehouse and batch (if batching enabled) selected
    return products.every(p => {
      const selection = selections[p.id];
      if (!selection?.warehouse) {
        return false;
      }
      if (p.enableBatching && !selection?.batch) {
        return false;
      }
      return true;
    });
  };

  const handleConfirm = () => {
    if (!isFormValid()) return;
    
    const configuredProducts = products.map(p => {
      const selectedBatchId = selections[p.id]?.batchId;
      const selectedBatch = [...(p.batchRecords || []), ...(batchesMap[p.id] || [])]
        .find((b: any) => String(b.id) === String(selectedBatchId));

      return {
        ...p,
        warehouse: selections[p.id]?.warehouse || '',
        warehouseId: selections[p.id]?.warehouseId,
        batch: selections[p.id]?.batch || '',
        batchId: selectedBatchId,
        batchSellingPrice: selectedBatch?.sellingPrice ?? null,
        batchSellingPriceTax: selectedBatch?.sellingPriceTax
      };
    });
    onConfirm(configuredProducts);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200 dark:border-gray-800 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configure Items</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <span className="material-symbols-outlined text-gray-500">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {products.map(product => (
              <div key={product.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">{product.name}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Warehouse</label>
                    <select
                      value={selections[product.id]?.warehouse || ''}
                      onChange={(e) => handleWarehouseChange(product.id, e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                    >
                      <option value="">Select Warehouse</option>
                      {(warehousesMap[product.id] || []).map((w: any) => (
                        <option key={w.id} value={w.name}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {product.enableBatching && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Batch</label>
                        <button
                          type="button"
                          onClick={() => handleOpenCreateBatch(product.id)}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          + Create New
                        </button>
                      </div>
                      <select
                        value={selections[product.id]?.batch || ''}
                        onChange={(e) => handleBatchChange(product.id, e.target.value)}
                        disabled={!selections[product.id]?.warehouse}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 disabled:opacity-50"
                      >
                        <option value="">Select Batch</option>
                        {(batchesMap[product.id] || []).map((b: any) => (
                          <option key={b.id} value={b.batchNumber}>
                            {b.batchNumber} (Qty: {b.locations?.find((l: any) => l.warehouseData?.name === selections[product.id]?.warehouse || l.warehouse === selections[product.id]?.warehouse)?.quantity || 0})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!isFormValid()}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm & Add
          </button>
        </div>

        <QuickCreateBatchModal
          isOpen={isQuickBatchModalOpen}
          onClose={() => setIsQuickBatchModalOpen(false)}
          onCreated={handleBatchCreated}
          productId={activeProductId ? Number(activeProductId) : null}
          productName={products.find(p => String(p.id) === String(activeProductId))?.name}
          defaultBuyingPrice={Number(products.find(p => String(p.id) === String(activeProductId))?.buyingPrice) || 0}
          defaultSellingPrice={Number(products.find(p => String(p.id) === String(activeProductId))?.sellingPrice) || 0}
          warehouseId={selections[activeProductId || '']?.warehouseId ? Number(selections[activeProductId || '']?.warehouseId) : null}
        />
      </div>
    </div>
  );
};

export default BatchSelectionModal;
