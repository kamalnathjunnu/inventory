
import React, { useState, useEffect } from 'react';

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StockHistoryModal: React.FC<StockHistoryModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      try {
        const storedLogs = JSON.parse(localStorage.getItem('stockAdjustmentLogs') || '[]');
        setLogs(storedLogs);
      } catch (e) {
        console.error("Failed to load logs", e);
        setLogs([]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col border border-gray-100 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Stock Adjustment History</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-0 overflow-auto flex-1">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                        <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Date</th>
                        <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Product</th>
                        <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Type</th>
                        <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Change</th>
                        <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">New Stock</th>
                        <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Reason</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {logs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-6 py-3 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="px-6 py-3">
                                <div className="font-medium text-gray-900 dark:text-white">{log.productName}</div>
                                <div className="text-xs text-gray-400">{log.sku}</div>
                            </td>
                            <td className="px-6 py-3 capitalize">
                                <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                                    log.adjustmentType === 'add' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    log.adjustmentType === 'remove' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                    {log.adjustmentType}
                                </span>
                            </td>
                            <td className="px-6 py-3 font-medium">
                                {log.adjustmentType === 'add' ? `+${log.quantity}` : log.adjustmentType === 'remove' ? `-${log.quantity}` : `Set to ${log.quantity}`}
                            </td>
                            <td className="px-6 py-3">{log.newStock}</td>
                            <td className="px-6 py-3 max-w-xs truncate" title={log.reason}>{log.reason}</td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No history found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockHistoryModal;
