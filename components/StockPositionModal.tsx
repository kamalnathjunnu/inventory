import React, { useState, useEffect } from 'react';
import { getProductStockPosition } from '../services/api';

interface StockPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
}

interface StockPosition {
  batchNumber: string | null;
  warehouse: string;
  quantity: number;
  mfgDate: string | null;
  expDate: string | null;
  buyingPrice: number | null;
  sellingPrice: number | null;
}

interface StockPositionData {
  productName: string;
  sku: string;
  totalQuantity: number;
  enableBatching: boolean;
  measuringUnit: string;
  positions: StockPosition[];
}

const StockPositionModal: React.FC<StockPositionModalProps> = ({ isOpen, onClose, productId }) => {
  const [stockData, setStockData] = useState<StockPositionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && productId) {
      fetchStockPosition();
      fetchWarehouses();
    }
  }, [isOpen, productId]);

  const fetchWarehouses = async () => {
    try {
      const { getWarehouses } = await import('../services/api');
      const response = await getWarehouses(1, 1000);
      setWarehouses(response.data.items || []);
    } catch (err: any) {
      console.error('Failed to fetch warehouses:', err);
    }
  };

  const fetchStockPosition = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getProductStockPosition(productId);
      setStockData(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch stock position');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Helper function to resolve warehouse name from ID or return as-is
  const getWarehouseName = (warehouseValue: string): string => {
    if (!warehouseValue) return 'Unknown';
    
    // Check if it's a numeric ID or index (stored as string)
    const warehouseIndex = parseInt(warehouseValue);
    if (!isNaN(warehouseIndex) && warehouses.length > 0) {
      // First try to find by ID
      let warehouse = warehouses.find(w => w.id === warehouseIndex);
      
      // If not found by ID, try to find by array index (for legacy data)
      if (!warehouse && warehouseIndex >= 0 && warehouseIndex < warehouses.length) {
        warehouse = warehouses[warehouseIndex];
      }
      
      return warehouse ? warehouse.name : `Warehouse #${warehouseValue}`;
    }
    
    // It's already a name
    return warehouseValue;
  };

  const filteredPositions = stockData?.positions.filter(pos => {
    const warehouseName = getWarehouseName(pos.warehouse);
    const matchesSearch = !searchTerm || 
      warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pos.batchNumber && pos.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesWarehouse = !filterWarehouse || warehouseName === filterWarehouse;
    const matchesBatch = !filterBatch || pos.batchNumber === filterBatch;
    
    return matchesSearch && matchesWarehouse && matchesBatch;
  }) || [];

  const uniqueWarehouses = [...new Set(stockData?.positions.map(pos => getWarehouseName(pos.warehouse)) || [])];
  const uniqueBatches = [...new Set(stockData?.positions.filter(pos => pos.batchNumber).map(pos => pos.batchNumber) || [])];

  const totalFilteredQuantity = filteredPositions.reduce((sum, pos) => sum + pos.quantity, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-800 transform transition-all scale-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Stock Position</h3>
            {stockData && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {stockData.productName} {stockData.sku && `(${stockData.sku})`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading stock position...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {stockData && !loading && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Stock</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                    {stockData.totalQuantity} {stockData.measuringUnit}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">Locations</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                    {stockData.positions.length}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Mode</div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                    {stockData.enableBatching ? 'Batch Tracking' : 'Simple Inventory'}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Search
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search batch or warehouse..."
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Filter by Warehouse
                    </label>
                    <select
                      value={filterWarehouse}
                      onChange={(e) => setFilterWarehouse(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="">All Warehouses</option>
                      {uniqueWarehouses.map(wh => (
                        <option key={wh} value={wh}>{wh}</option>
                      ))}
                    </select>
                  </div>
                  {stockData.enableBatching && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Filter by Batch
                      </label>
                      <select
                        value={filterBatch}
                        onChange={(e) => setFilterBatch(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="">All Batches</option>
                        {uniqueBatches.map(batch => (
                          <option key={batch || ''} value={batch || ''}>{batch}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                {(searchTerm || filterWarehouse || filterBatch) && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {filteredPositions.length} of {stockData.positions.length} positions
                      (Total: {totalFilteredQuantity} {stockData.measuringUnit})
                    </span>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterWarehouse('');
                        setFilterBatch('');
                      }}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Stock Position Table */}
              {filteredPositions.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  {stockData.positions.length === 0 
                    ? 'No stock positions recorded' 
                    : 'No positions match your filters'}
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        {stockData.enableBatching && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Batch Number
                          </th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Warehouse
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        {stockData.enableBatching && (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Mfg Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Exp Date
                            </th>
                          </>
                        )}
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Buying Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Selling Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {filteredPositions.map((position, index) => {
                        const isExpired = position.expDate && new Date(position.expDate) < new Date();
                        const isExpiringSoon = position.expDate && 
                          new Date(position.expDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
                          !isExpired;
                        
                        return (
                          <tr 
                            key={index}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                          >
                            {stockData.enableBatching && (
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {position.batchNumber || '-'}
                              </td>
                            )}
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {getWarehouseName(position.warehouse)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">
                              {position.quantity} {stockData.measuringUnit}
                            </td>
                            {stockData.enableBatching && (
                              <>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {position.mfgDate || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {position.expDate ? (
                                    <span className={
                                      isExpired ? 'text-red-600 font-semibold' :
                                      isExpiringSoon ? 'text-yellow-600 font-semibold' :
                                      'text-gray-600'
                                    }>
                                      {position.expDate}
                                      {isExpired && ' (Expired)'}
                                      {isExpiringSoon && ' (Expiring Soon)'}
                                    </span>
                                  ) : '-'}
                                </td>
                              </>
                            )}
                            <td className="px-4 py-3 text-sm text-right text-gray-600">
                              {position.buyingPrice ? `₹${Number(position.buyingPrice).toFixed(2)}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">
                              {position.sellingPrice ? `₹${Number(position.sellingPrice).toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex justify-end border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockPositionModal;
