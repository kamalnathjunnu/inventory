
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWarehouse, createWarehouse, updateWarehouse } from '../services/api';

const WarehouseForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    location: '', 
    contactPerson: '', 
    contactNumber: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      const fetchWarehouse = async () => {
        try {
          const response = await getWarehouse(Number(id));
          setFormData({
            name: response.data.data.name,
            location: response.data.data.location || '',
            contactPerson: response.data.data.contactPerson || '',
            contactNumber: response.data.data.contactNumber || ''
          });
        } catch (err) {
          console.error('Error fetching warehouse:', err);
          setError('Failed to load warehouse');
        }
      };
      fetchWarehouse();
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Warehouse name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (isEdit && id) {
        await updateWarehouse(Number(id), formData);
      } else {
        await createWarehouse(formData);
      }
      navigate('/warehouses');
    } catch (err) {
      console.error('Error saving warehouse:', err);
      setError('Failed to save warehouse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-6">
        <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/warehouses')}>Inventory</span>
        <span>/</span>
        <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/warehouses')}>Warehouses</span>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">{isEdit ? 'Edit Warehouse' : 'Add New Warehouse'}</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{isEdit ? 'Edit Warehouse' : 'Add New Warehouse'}</h1>
        <p className="text-gray-500">Enter the details for the warehouse location.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col w-full md:col-span-2">
              <span className="text-gray-900 dark:text-white font-medium mb-2">Warehouse Name <span className="text-red-500">*</span></span>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Main Distribution Center" 
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white placeholder:text-gray-400"
                required
              />
            </label>

            <label className="flex flex-col w-full md:col-span-2">
              <span className="text-gray-900 dark:text-white font-medium mb-2">Location / Address</span>
              <input 
                type="text" 
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. 123 Storage Lane, Industrial Park" 
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white placeholder:text-gray-400"
              />
            </label>

            <label className="flex flex-col w-full">
              <span className="text-gray-900 dark:text-white font-medium mb-2">Contact Person</span>
              <input 
                type="text" 
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. John Doe" 
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white placeholder:text-gray-400"
              />
            </label>

            <label className="flex flex-col w-full">
              <span className="text-gray-900 dark:text-white font-medium mb-2">Contact Number</span>
              <input 
                type="tel" 
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="e.g. (555) 123-4567" 
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white placeholder:text-gray-400"
              />
            </label>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <button 
              type="button"
              onClick={() => navigate('/warehouses')} 
              className="px-6 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <span className="material-symbols-outlined text-sm">save</span>
              {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Warehouse')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarehouseForm;
