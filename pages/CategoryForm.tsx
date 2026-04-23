import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCategory, createCategory, updateCategory } from '../services/api';

const CategoryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({ name: '', desc: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      const fetchCategory = async () => {
        try {
          const response = await getCategory(Number(id));
          setFormData({ name: response.data.data.name, desc: response.data.data.desc || '' });
        } catch (err) {
          console.error('Error fetching category:', err);
          setError('Failed to load category');
        }
      };
      fetchCategory();
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (isEdit && id) {
        await updateCategory(Number(id), formData);
      } else {
        await createCategory(formData);
      }
      navigate('/categories');
    } catch (err) {
      console.error('Error saving category:', err);
      setError('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-6">
        <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/categories')}>Inventory</span>
        <span>/</span>
        <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/categories')}>Categories</span>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">{isEdit ? 'Edit Category' : 'Add New Category'}</span>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{isEdit ? 'Edit Category' : 'Add New Category'}</h1>
          <p className="text-gray-500">Fill in the details below to {isEdit ? 'update the' : 'create a new'} product category.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <label className="flex flex-col w-full">
              <span className="text-gray-900 dark:text-white font-medium mb-2">Category Name <span className="text-red-500">*</span></span>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Electronics, Apparel, Groceries" 
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white placeholder:text-gray-400"
                required
              />
            </label>

            <label className="flex flex-col w-full">
              <span className="text-gray-900 dark:text-white font-medium mb-2">Description (Optional)</span>
              <textarea 
                value={formData.desc}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                placeholder="A brief summary of the category" 
                rows={4}
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white placeholder:text-gray-400"
              ></textarea>
            </label>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <button 
              type="button"
              onClick={() => navigate('/categories')} 
              className="px-6 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Save Category')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;