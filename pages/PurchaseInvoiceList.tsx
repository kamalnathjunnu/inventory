import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import { getPurchaseInvoices, deletePurchaseInvoice } from '../services/api';

const PurchaseInvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const perPage = 10;

  useEffect(() => {
    fetchInvoices();
  }, [page, searchTerm]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await getPurchaseInvoices(page, perPage, searchTerm);
      setInvoices(response.data.items || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching purchase invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await deletePurchaseInvoice(deleteId);
        setInvoices(invoices.filter(i => i.id !== deleteId));
        setIsModalOpen(false);
        setDeleteId(null);
      } catch (error) {
        console.error('Error deleting purchase invoice:', error);
        alert('Failed to delete purchase invoice');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paid':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'draft':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'paid':
        return 'bg-blue-500';
      case 'draft':
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">Purchase Invoices</h1>
          <p className="text-gray-500 mt-2">Manage your supplier invoices and stock entries.</p>
        </div>
        <Link to="/purchase-invoices/new" className="bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">add_circle</span>
          Create Purchase Invoice
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-4">
          <div className="flex-1 relative min-w-[200px]">
             <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
             <input 
               type="text" 
               placeholder="Search Invoice #..." 
               value={searchTerm}
               onChange={(e) => {
                 setSearchTerm(e.target.value);
                 setPage(1);
               }}
               className="w-full pl-10 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border-none text-sm focus:ring-2 focus:ring-primary/50" 
             />
          </div>
          <div className="flex gap-2">
             <button className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700">
               Status <span className="material-symbols-outlined text-sm">expand_more</span>
             </button>
             <button className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700">
               Date Range <span className="material-symbols-outlined text-sm">expand_more</span>
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="p-4 w-12"><input type="checkbox" className="rounded text-primary focus:ring-primary" /></th>
                <th className="p-4 font-semibold text-gray-500 dark:text-gray-400">INVOICE #</th>
                <th className="p-4 font-semibold text-gray-500 dark:text-gray-400">SUPPLIER INV #</th>
                <th className="p-4 font-semibold text-gray-500 dark:text-gray-400">SUPPLIER</th>
                <th className="p-4 font-semibold text-gray-500 dark:text-gray-400">DATE</th>
                <th className="p-4 font-semibold text-gray-500 dark:text-gray-400">TOTAL</th>
                <th className="p-4 font-semibold text-gray-500 dark:text-gray-400">STATUS</th>
                <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-3 text-gray-500">Loading purchase invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No purchase invoices found. Create your first purchase invoice to get started.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-primary/5 transition-colors">
                    <td className="p-4"><input type="checkbox" className="rounded text-primary focus:ring-primary" /></td>
                    <td className="p-4 font-medium text-primary cursor-pointer hover:underline">
                      <Link to={`/purchase-invoices/view/${inv.id}`}>{inv.invoiceNumber}</Link>
                    </td>
                    <td className="p-4 text-gray-500">{inv.supplierInvoiceNumber || '-'}</td>
                    <td className="p-4 font-medium">{inv.supplier || inv.supplierData?.name}</td>
                    <td className="p-4 text-gray-500">{inv.date}</td>
                    <td className="p-4 font-medium">₹{Number(inv.grandTotal || 0).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(inv.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDot(inv.status)}`}></span>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Link to={`/purchase-invoices/view/${inv.id}`} className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/10" title="View Invoice">
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </Link>
                        <Link to={`/purchase-invoices/edit/${inv.id}`} className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/10" title="Edit Invoice">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </Link>
                        <button 
                          onClick={() => handleDeleteClick(inv.id)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-500/10"
                          title="Delete Invoice"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && invoices.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button disabled={page===1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p+1)} className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Purchase Invoice"
        message="Are you sure you want to delete this purchase invoice? This will also reverse the stock adjustments. This action cannot be undone."
      />
    </div>
  );
};

export default PurchaseInvoiceList;
