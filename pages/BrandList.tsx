import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import { getBrands, deleteBrand as deleteBrandApi } from '../services/api';

const BrandList: React.FC = () => {
  const [brands, setBrands] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const perPage = 10;
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      try {
        const response = await getBrands(page, perPage, searchTerm);
        setBrands(response.data.items);
        setTotalItems(response.data.totalItems);
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const debounce = setTimeout(() => {
      fetchBrands();
    }, 300);
    
    return () => clearTimeout(debounce);
  }, [page, searchTerm]);

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await deleteBrandApi(deleteId);
        setBrands(brands.filter(b => b.id !== deleteId));
        setIsModalOpen(false);
        setDeleteId(null);
      } catch (error) {
        console.error('Error deleting brand:', error);
      }
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Brand Management</h1>
        <Link to="/brands/new" className="bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90">
          <span className="material-symbols-outlined">add</span> Add New Brand
        </Link>
      </div>

      <div className="relative mb-6">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
        <input 
          type="text" 
          placeholder="Search by brand name..." 
          className="w-full max-w-md pl-10 py-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary/50" 
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Name</th>
              <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {brands.map((b) => (
              <tr key={b.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{b.name}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{b.desc}</td>
                <td className="px-6 py-4 flex gap-4">
                  <Link to={`/brands/edit/${b.id}`} className="text-primary hover:text-primary/80"><span className="material-symbols-outlined">edit</span></Link>
                  <button 
                    onClick={() => handleDeleteClick(b.id)}
                    className="text-red-600 hover:text-red-500"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </td>
              </tr>
            ))}
            {brands.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  No brands found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {brands.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing {(page-1)*perPage+1}-{Math.min(page*perPage, totalItems)} of {totalItems}</p>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
              <button disabled={page*perPage >= totalItems} onClick={() => setPage(p => p+1)} className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Brand"
        message="Are you sure you want to delete this brand? This action cannot be undone."
      />
    </div>
  );
};

export default BrandList;