
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import { getWarehouses, deleteWarehouse as deleteWarehouseApi } from '../services/api';

const WarehouseList: React.FC = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const perPage = 10;
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchWarehouses = async () => {
      setLoading(true);
      try {
        const response = await getWarehouses(page, perPage, searchTerm);
        setWarehouses(response.data.items);
        setTotalItems(response.data.totalItems);
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const debounce = setTimeout(() => {
      fetchWarehouses();
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
        await deleteWarehouseApi(deleteId);
        setWarehouses(warehouses.filter(w => w.id !== deleteId));
        setIsModalOpen(false);
        setDeleteId(null);
      } catch (error) {
        console.error('Error deleting warehouse:', error);
      }
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Warehouse Management</h1>
          <p className="text-gray-500">Track and organize your storage locations.</p>
        </div>
        <Link to="/warehouses/new" className="bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90">
          <span className="material-symbols-outlined">add</span> Add New Warehouse
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6 shadow-sm">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input 
            type="text" 
            placeholder="Search warehouses..." 
            className="w-full pl-10 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary/50 text-sm" 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Warehouse Name</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Contact Person</th>
              <th className="px-6 py-4">Contact Number</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {warehouses.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{w.name}</td>
                <td className="px-6 py-4 text-gray-500">{w.location}</td>
                <td className="px-6 py-4 text-gray-500">{w.contactPerson}</td>
                <td className="px-6 py-4 text-gray-500">{w.contactNumber}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={`/warehouses/edit/${w.id}`} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </Link>
                    <button 
                      onClick={() => handleDeleteClick(w.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {warehouses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No warehouses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {warehouses.length > 0 && (
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
        title="Delete Warehouse"
        message="Are you sure you want to delete this warehouse? This action cannot be undone."
      />
    </div>
  );
};

export default WarehouseList;
