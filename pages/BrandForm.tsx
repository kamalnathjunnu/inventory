import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBrand, createBrand, updateBrand } from '../services/api';

const BrandForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({ name: '', desc: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      const fetchBrand = async () => {
        try {
          const response = await getBrand(Number(id));
          setFormData({ name: response.data.data.name, desc: response.data.data.desc || '' });
        } catch (err) {
          console.error('Error fetching brand:', err);
          setError('Failed to load brand');
        }
      };
      fetchBrand();
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Brand name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (isEdit && id) {
        await updateBrand(Number(id), formData);
      } else {
        await createBrand(formData);
      }
      navigate('/brands');
    } catch (err) {
      console.error('Error saving brand:', err);
      setError('Failed to save brand');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/brands')}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{isEdit ? 'Edit Brand' : 'Add New Brand'}</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-8">
        {isEdit && (
          <div className="mb-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">Update the details for the brand.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2" htmlFor="brand-name">Brand Name <span className="text-red-500">*</span></label>
            <input 
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white" 
              id="brand-name" 
              type="text" 
              placeholder="Enter brand name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2" htmlFor="description">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
            <textarea 
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white" 
              id="description" 
              rows={4} 
              placeholder="Enter a brief description for the brand"
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
            ></textarea>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 mt-8">
            <button 
              type="button"
              onClick={() => navigate('/brands')}
              className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <span className="material-symbols-outlined text-base">save</span>
              {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Save Brand')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandForm;