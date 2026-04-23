import React, { useState, useEffect } from 'react';
import { createProductBatch } from '../services/api';

interface QuickCreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (batch: any) => void;
  productId: number | null;
  productName?: string;
  defaultBuyingPrice?: number;
  defaultSellingPrice?: number;
  warehouseId?: number | null;
}

const QuickCreateBatchModal: React.FC<QuickCreateBatchModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreated,
  productId,
  productName,
  defaultBuyingPrice = 0,
  defaultSellingPrice = 0,
  warehouseId
}) => {
  const [formData, setFormData] = useState({ 
    batchNumber: '', 
    mfgDate: '', 
    expDate: '', 
    buyingPrice: defaultBuyingPrice,
    sellingPrice: defaultSellingPrice,
    buyingPriceTax: false,
    sellingPriceTax: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens with new defaults
  useEffect(() => {
    if (isOpen) {
      setFormData({
        batchNumber: '',
        mfgDate: '',
        expDate: '',
        buyingPrice: defaultBuyingPrice,
        sellingPrice: defaultSellingPrice,
        buyingPriceTax: false,
        sellingPriceTax: false
      });
      setError('');
    }
  }, [isOpen, defaultBuyingPrice, defaultSellingPrice]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batchNumber.trim()) {
      setError('Batch number is required');
      return;
    }
    if (!productId) {
      setError('Product not found');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await createProductBatch(productId, {
        batchNumber: formData.batchNumber,
        mfgDate: formData.mfgDate || null,
        expDate: formData.expDate || null,
        buyingPrice: formData.buyingPrice,
        sellingPrice: formData.sellingPrice,
        buyingPriceTax: formData.buyingPriceTax,
        sellingPriceTax: formData.sellingPriceTax,
        warehouseId: warehouseId || null
      });
      const newBatch = response.data.data;
      onCreated(newBatch);
      onClose();
    } catch (err: any) {
      console.error('Error creating batch:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ batchNumber: '', mfgDate: '', expDate: '', buyingPrice: 0, sellingPrice: 0, buyingPriceTax: false, sellingPriceTax: false });
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary">inventory</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Batch</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {productName ? `For: ${productName}` : 'Add a new batch'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-gray-500">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Batch Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              placeholder="Enter batch number"
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Manufacturing Date
              </label>
              <input
                type="date"
                value={formData.mfgDate}
                onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expDate}
                onChange={(e) => setFormData({ ...formData, expDate: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Buying Price
            </label>
            <div className="flex rounded-lg shadow-sm">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 text-sm">$</span>
                </div>
                <input
                  type="number"
                  value={formData.buyingPrice}
                  onChange={(e) => setFormData({ ...formData, buyingPrice: Number(e.target.value) })}
                  className="w-full rounded-l-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-7 p-2.5 focus:ring-2 focus:ring-primary/50 border-r-0"
                  min="0"
                  step="0.01"
                  disabled={loading}
                  placeholder="0.00"
                />
              </div>
              <select
                value={formData.buyingPriceTax ? 'tax' : 'no_tax'}
                onChange={(e) => setFormData({ ...formData, buyingPriceTax: e.target.value === 'tax' })}
                className="rounded-r-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-sm px-3 focus:ring-2 focus:ring-primary/50"
                disabled={loading}
              >
                <option value="no_tax">Excl. Tax</option>
                <option value="tax">Incl. Tax</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Selling Price
            </label>
            <div className="flex rounded-lg shadow-sm">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 text-sm">$</span>
                </div>
                <input
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                  className="w-full rounded-l-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-7 p-2.5 focus:ring-2 focus:ring-primary/50 border-r-0"
                  min="0"
                  step="0.01"
                  disabled={loading}
                  placeholder="0.00"
                />
              </div>
              <select
                value={formData.sellingPriceTax ? 'tax' : 'no_tax'}
                onChange={(e) => setFormData({ ...formData, sellingPriceTax: e.target.value === 'tax' })}
                className="rounded-r-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-sm px-3 focus:ring-2 focus:ring-primary/50"
                disabled={loading}
              >
                <option value="no_tax">Excl. Tax</option>
                <option value="tax">Incl. Tax</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                  Creating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  Create Batch
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickCreateBatchModal;
