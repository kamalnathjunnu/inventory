import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import { getCustomers, deleteCustomer as deleteCustomerApi } from '../services/api';

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [totalItems, setTotalItems] = useState<number>(0);
  const perPage = 10;

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const response = await getCustomers(page, perPage, searchTerm);
        setCustomers(response.data.items || response.data.rows || []);
        setTotalItems(response.data.totalItems || response.data.count || 0);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(timer);
  }, [page, searchTerm]);

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await deleteCustomerApi(deleteId);
        setCustomers(customers.filter(c => c.id !== deleteId));
        setTotalItems(prev => prev - 1);
      } catch (error) {
        console.error('Error deleting customer:', error);
      } finally {
        setIsModalOpen(false);
        setDeleteId(null);
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Parties</h1>
          <p className="text-gray-500">Manage and view your suppliers and customers.</p>
        </div>
        <Link to="/customers/new" className="bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90">
          <span className="material-symbols-outlined">add</span>
          Add New Party
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-grow relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input 
              type="text" 
              placeholder="Search by name, email, phone, or address..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary/50" 
            />
          </div>
          <button className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg font-medium flex items-center gap-2">Status: All <span className="material-symbols-outlined">expand_more</span></button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 text-gray-500">
            <tr>
              <th className="px-6 py-4 font-medium uppercase">Party Name</th>
              <th className="px-6 py-4 font-medium uppercase">Type</th>
              <th className="px-6 py-4 font-medium uppercase">Email</th>
              <th className="px-6 py-4 font-medium uppercase">Phone Number</th>
              <th className="px-6 py-4 font-medium uppercase">Address</th>
              <th className="px-6 py-4 font-medium uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{c.name}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    c.type === 'supplier' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                    c.type === 'both' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {c.type === 'supplier' ? 'Supplier' : c.type === 'both' ? 'Both' : 'Customer'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{c.email}</td>
                <td className="px-6 py-4 text-gray-500">{c.phone}</td>
                <td className="px-6 py-4 text-gray-500">{c.address}</td>
                <td className="px-6 py-4 flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full"><span className="material-symbols-outlined text-[20px]">visibility</span></button>
                  <Link to={`/customers/edit/${c.id}`} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full"><span className="material-symbols-outlined text-[20px]">edit</span></Link>
                  <button 
                    onClick={() => handleDeleteClick(c.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No parties found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {totalItems > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing {(page-1)*perPage+1}-{Math.min(page*perPage, totalItems)} of {totalItems}</p>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800">Previous</button>
              <button disabled={page*perPage >= totalItems} onClick={() => setPage(p => p+1)} className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800">Next</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Party"
        message="Are you sure you want to delete this party? This action cannot be undone."
      />
    </div>
  );
};

export default CustomerList;