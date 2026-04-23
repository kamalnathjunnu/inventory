import React, { useState, useEffect } from 'react';

interface ShippingAddressProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (address: any) => void;
  initialData?: any;
  title?: string;
}

const ShippingAddress: React.FC<ShippingAddressProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  title = 'Add Shipping Address',
}) => {
  const [form, setForm] = useState({ label: '', address: '', city: '', state: '', postalCode: '', country: '', isDefault: false });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          label: initialData.label || '',
          address: initialData.address || '',
          city: initialData.city || '',
          state: initialData.state || '',
          postalCode: initialData.postalCode || '',
          country: initialData.country || '',
          isDefault: initialData.isDefault || false,
        });
      } else {
        setForm({ label: '', address: '', city: '', state: '', postalCode: '', country: '', isDefault: false });
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = () => {
    if (!form.address) return;
    onSave?.(form);
    setForm({ label: '', address: '', city: '', state: '', postalCode: '', country: '', isDefault: false });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-lg mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">{title}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400">Label</label>
          <input
            type="text"
            placeholder="e.g. Warehouse, Office"
            value={form.label}
            onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
            className="w-full h-9 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400">Address *</label>
          <input
            type="text"
            placeholder="Street address"
            value={form.address}
            onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
            className="w-full h-9 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400">City</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
            className="w-full h-9 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400">State</label>
          <input
            type="text"
            value={form.state}
            onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))}
            className="w-full h-9 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400">Postal Code</label>
          <input
            type="text"
            value={form.postalCode}
            onChange={(e) => setForm(prev => ({ ...prev, postalCode: e.target.value }))}
            className="w-full h-9 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400">Country</label>
          <input
            type="text"
            value={form.country}
            onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))}
            className="w-full h-9 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          className="rounded text-primary focus:ring-primary"
          checked={form.isDefault}
          onChange={(e) => setForm(prev => ({ ...prev, isDefault: e.target.checked }))}
        />
        Set as default address
      </label>
      <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!form.address}
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Address
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShippingAddress;
