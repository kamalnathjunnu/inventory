import React from 'react';
import ProductSelectionModal from './ProductSelectionModal';

export type ItemConfig = {
  mode: 'invoice' | 'purchase-order';
  showHSN?: boolean;
  showDiscount?: boolean;
  showGSTRates?: boolean;
  showCESSRates?: boolean;
  showBatch?: boolean;
  showWarehouse?: boolean;
  layoutStyle?: 'cards' | 'table';
};

interface ItemsManagerProps {
  items: any[];
  config: ItemConfig;
  products: any[];
  warehouses: any[];
  gstRates?: any[];
  cessRates?: any[];
  onItemsChange: (items: any[]) => void;
  onAddProducts: () => void;
  isProductSelectionModalOpen: boolean;
  onCloseProductModal: () => void;
  onSelectProducts: (products: any[]) => void;
  onItemChange: (itemId: number, field: string, value: any) => void;
  onDeleteItem: (itemId: number) => void;
}

const ItemsManager: React.FC<ItemsManagerProps> = ({
  items,
  config,
  products,
  warehouses,
  gstRates = [],
  cessRates = [],
  onItemsChange,
  onAddProducts,
  isProductSelectionModalOpen,
  onCloseProductModal,
  onSelectProducts,
  onItemChange,
  onDeleteItem
}) => {
  const getProductBatches = (productName: string) => {
    const product = products.find(p => p.name === productName);
    if (!product || !product.enableBatching) return [];
    const batches = product.batches ? (typeof product.batches === 'string' ? JSON.parse(product.batches) : product.batches) : [];
    return batches;
  };

  const renderTableLayout = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-white">Product</th>
            {config.showWarehouse && (
              <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-white">Warehouse</th>
            )}
            {config.showBatch && (
              <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-white">Batch</th>
            )}
            <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-white">Qty</th>
            <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-white">Unit</th>
            <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-white">Price</th>
            <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-white">Total</th>
            <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-white">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const product = products.find(p => p.name === item.product);
            const batches = getProductBatches(item.product);
            
            return (
              <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3">
                  <select
                    value={item.product}
                    onChange={(e) => onItemChange(item.id, 'product', e.target.value)}
                    className="w-full rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2"
                  >
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </td>
                {config.showWarehouse && (
                  <td className="p-3">
                    <select
                      value={item.warehouse}
                      onChange={(e) => onItemChange(item.id, 'warehouse', e.target.value)}
                      className="w-full rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2"
                    >
                      <option value="">Select warehouse</option>
                      {warehouses.map(wh => (
                        <option key={wh.id} value={wh.name}>{wh.name}</option>
                      ))}
                    </select>
                  </td>
                )}
                {config.showBatch && (
                  <td className="p-3">
                    {product?.enableBatching ? (
                      <select
                        value={item.batch}
                        onChange={(e) => onItemChange(item.id, 'batch', e.target.value)}
                        className="w-full rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2"
                      >
                        <option value="">Will be created on receive</option>
                        {batches.map((batch: any) => (
                          <option key={batch.id} value={batch.batchNumber}>{batch.batchNumber}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-gray-500">N/A</span>
                    )}
                  </td>
                )}
                <td className="p-3">
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => onItemChange(item.id, 'qty', e.target.value)}
                    className="w-20 rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{item.unit}</td>
                <td className="p-3">
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => onItemChange(item.id, 'price', e.target.value)}
                    className="w-24 rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="p-3 text-sm font-semibold text-gray-900 dark:text-white">
                  ₹{item.total.toFixed(2)}
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderCardLayout = () => (
    <div className="flex flex-col p-6 gap-5 bg-gray-50/50 dark:bg-gray-900/50">
      {items.map((item, index) => (
        <div key={item.id} className="relative p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800">
          <button 
            type="button"
            onClick={() => onDeleteItem(item.id)}
            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-md transition-colors"
            title="Remove Item"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-6">
            {/* Product */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</label>
              <div className="w-full h-10 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium truncate">
                {item.product || 'Select a product'}
              </div>
            </div>

            {config.showHSN && (
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">HSN</label>
                <div className="w-full h-10 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                  {item.hsn || '-'}
                </div>
              </div>
            )}
            
            {/* Unit */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit</label>
              <select 
                value={item.unit || ''}
                onChange={(e) => onItemChange(item.id, 'unit', e.target.value)}
                disabled={!item.product}
                className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!item.productData ? (
                  <option value="">Select product first</option>
                ) : (
                  <>
                    <option value="">Select Unit</option>
                    {(item.productData.measuringUnitData?.name || item.productData.measuringUnit) && (
                      <option value={item.productData.measuringUnitData?.name || item.productData.measuringUnit}>
                        {item.productData.measuringUnitData?.name || item.productData.measuringUnit}
                      </option>
                    )}
                    {(item.productData.altMeasuringUnitData?.name || item.productData.altMeasuringUnit) && (
                      <option value={item.productData.altMeasuringUnitData?.name || item.productData.altMeasuringUnit}>
                        {item.productData.altMeasuringUnitData?.name || item.productData.altMeasuringUnit}
                        {item.productData.conversionRatio ? ` (1:${item.productData.conversionRatio})` : ''}
                      </option>
                    )}
                  </>
                )}
              </select>
            </div>
            
            {/* Unit Price */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs">₹</span>
                <input 
                  type="number" 
                  value={item.price}
                  onChange={(e) => onItemChange(item.id, 'price', e.target.value)}
                  className="w-full h-10 px-3 pl-7 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm text-right font-medium shadow-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Quantity */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</label>
              <input 
                type="number" 
                value={item.qty}
                onChange={(e) => onItemChange(item.id, 'qty', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm text-right font-medium shadow-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                min="1"
              />
            </div>

            {config.showDiscount && (
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Discount</label>
                <div className="flex rounded-md shadow-sm relative">
                  {(item.discountType || 'percentage') === 'amount' && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                  )}
                  <input 
                    type="number" 
                    value={item.discount}
                    onChange={(e) => onItemChange(item.id, 'discount', e.target.value)}
                    className={`block w-full rounded-l-lg border border-gray-300 dark:border-gray-700 border-r-0 focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-800 dark:text-white py-2.5 ${
                      (item.discountType || 'percentage') === 'amount' ? 'pl-7' : 'pl-3'
                    }`}
                    min="0"
                    max={(item.discountType || 'percentage') === 'percentage' ? '100' : undefined}
                    step="0.01"
                  />
                  <select
                    value={item.discountType || 'percentage'}
                    onChange={(e) => onItemChange(item.id, 'discountType', e.target.value)}
                    className="-ml-px block w-28 rounded-r-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 sm:text-sm focus:border-primary focus:ring-primary py-2.5 px-3 border-l-0"
                  >
                    <option value="percentage">%</option>
                    <option value="amount">Amount</option>
                  </select>
                </div>
              </div>
            )}
            
            {config.showGSTRates && (
              <div className="md:col-span-1 space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">GST</label>
                <select 
                  value={item.gstRate}
                  onChange={(e) => onItemChange(item.id, 'gstRate', e.target.value)}
                  className="w-full h-10 px-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm text-center shadow-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-no-repeat bg-[right_0.25rem_center]"
                >
                  <option value="0">0%</option>
                  {gstRates.map((rate) => (
                    <option key={rate.id} value={rate.rate}>{rate.label || (rate.rate ? `${rate.rate}%` : '')}</option>
                  ))}
                </select>
              </div>
            )}
            
            {config.showCESSRates && (
              <div className="md:col-span-1 space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cess</label>
                <select 
                  value={item.cessRate}
                  onChange={(e) => onItemChange(item.id, 'cessRate', e.target.value)}
                  className="w-full h-10 px-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm text-center shadow-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-no-repeat bg-[right_0.25rem_center]"
                >
                  <option value="0">0%</option>
                  {cessRates.map((rate) => (
                    <option key={rate.id} value={rate.value}>{rate.label || (rate.value ? `${rate.value}%` : '')}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Total Amount */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs">₹</span>
                <input 
                  type="number" 
                  value={item.total.toFixed(2)}
                  onChange={(e) => onItemChange(item.id, 'total', e.target.value)}
                  className="w-full h-10 px-3 pl-7 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm text-right font-bold shadow-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden mb-6">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 text-primary p-1.5 rounded-md">
            <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {config.mode === 'invoice' ? 'Line Items' : 'Items'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {config.mode === 'invoice' 
                ? 'Manage products and services for this invoice' 
                : 'Select products for this purchase order'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
            {items.filter(item => item.product).length} items added
          </div>
          <button
            type="button"
            onClick={onAddProducts}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Products
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 m-6">
          <p className="text-gray-500 dark:text-gray-400">No items added yet. Click "Add Products" to get started.</p>
        </div>
      ) : config.layoutStyle === 'table' ? (
        renderTableLayout()
      ) : (
        renderCardLayout()
      )}

      {config.layoutStyle === 'cards' && items.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-center sm:justify-start">
          <button 
            type="button"
            onClick={onAddProducts}
            className="text-primary hover:text-blue-700 dark:hover:text-blue-400 border border-primary/20 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-sm font-semibold flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Add Line Item
          </button>
        </div>
      )}

      {/* Product Selection Modal */}
      {isProductSelectionModalOpen && (
        <ProductSelectionModal
          isOpen={isProductSelectionModalOpen}
          onClose={onCloseProductModal}
          existingItems={items}
          onSelectProducts={onSelectProducts}
          skipBatchSelection={config.mode === 'purchase-order'}
        />
      )}
    </div>
  );
};

export default ItemsManager;
