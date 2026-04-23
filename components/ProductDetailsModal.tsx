
import React, { useState, useEffect } from 'react';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

// Mock history to display if no real logs exist (for demonstration)
const MOCK_HISTORY = [
  { id: 'demo1', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), adjustmentType: 'add', quantity: 100, newStock: 100, reason: 'Initial Inventory Received' },
  { id: 'demo2', timestamp: new Date(Date.now() - 86400000).toISOString(), adjustmentType: 'remove', quantity: 5, newStock: 95, reason: 'Damaged in transit' },
  { id: 'demo3', timestamp: new Date().toISOString(), adjustmentType: 'set', quantity: 1200, newStock: 1200, reason: 'Stock count correction' },
];

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ isOpen, onClose, product }) => {
  const [stockHistory, setStockHistory] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && product) {
      try {
        const allLogs = JSON.parse(localStorage.getItem('stockAdjustmentLogs') || '[]');
        // Filter logs for the current product (ensure ID comparison matches types)
        const productLogs = allLogs.filter((log: any) => String(log.productId) === String(product.id));
        
        // If we have real logs, use them. Otherwise, use mock data for visualization.
        setStockHistory(productLogs.length > 0 ? productLogs : MOCK_HISTORY);
      } catch (e) {
        console.error("Failed to load stock history", e);
        setStockHistory(MOCK_HISTORY);
      }
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-800 transform transition-all scale-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">inventory_2</span>
            Product Details
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Basic Info Section */}
          <div className="flex gap-6 mb-8">
            <div className="w-32 h-32 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700 overflow-hidden">
               {product.image ? (
                 <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
               ) : (
                 <span className="material-symbols-outlined text-4xl text-gray-400">image</span>
               )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{product.name}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {product.cat}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  {product.brand}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {product.description || "No description available for this product."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Identification */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Identification</h4>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">SKU</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{product.sku}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">HSN Code</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{product.hsn || '-'}</p>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Inventory</h4>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Stock</p>
                  <p className={`text-sm font-bold ${product.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {product.stock} Units
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Warehouse</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{product.wh}</p>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pricing</h4>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Selling Price</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{product.price}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Buying Price</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{product.buyingPrice || '-'}</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Settings</h4>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
                 <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Batch Tracking</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${product.enableBatching ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{product.enableBatching ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock History Table */}
          <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Stock Adjustment History</h4>
            </div>
            
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/80 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Change</th>
                      <th className="px-4 py-3 text-right">New Stock</th>
                      <th className="px-4 py-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {stockHistory.map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-2.5 whitespace-nowrap text-gray-600 dark:text-gray-300 text-xs">
                            {new Date(log.timestamp).toLocaleDateString()} <span className="text-gray-400 ml-1">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </td>
                        <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide
                                ${log.adjustmentType === 'add' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                  log.adjustmentType === 'remove' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                {log.adjustmentType}
                            </span>
                        </td>
                        <td className={`px-4 py-2.5 text-right font-medium text-xs ${
                            log.adjustmentType === 'add' ? 'text-green-600 dark:text-green-400' : 
                            log.adjustmentType === 'remove' ? 'text-red-600 dark:text-red-400' : 
                            'text-blue-600 dark:text-blue-400'
                        }`}>
                           {log.adjustmentType === 'add' ? `+${log.quantity}` : log.adjustmentType === 'remove' ? `-${log.quantity}` : `=${log.quantity}`}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-white text-xs">{log.newStock}</td>
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-xs max-w-[200px] truncate" title={log.reason}>{log.reason || '-'}</td>
                      </tr>
                    ))}
                    {stockHistory.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                No stock history available.
                            </td>
                        </tr>
                    )}
                  </tbody>
                </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;
