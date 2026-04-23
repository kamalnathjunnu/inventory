import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import { getInvoices, deleteInvoice } from '../services/api';

const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(window.innerWidth < 768);
  const [isMobileFilterPinned, setIsMobileFilterPinned] = useState(false);
  const mobileFilterRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const perPage = 10;

  useEffect(() => {
    fetchInvoices();
  }, [page, isMobileView]);

  useEffect(() => {
    const updateViewportState = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', updateViewportState);

    return () => {
      window.removeEventListener('resize', updateViewportState);
    };
  }, []);

  useEffect(() => {
    setInvoices([]);
    setPage(1);
  }, [isMobileView]);

  useEffect(() => {
    const updateMobileFilterPinned = () => {
      if (window.innerWidth >= 768) {
        setIsMobileFilterPinned(false);
        return;
      }

      const filterElement = mobileFilterRef.current;

      if (!filterElement) {
        return;
      }

      setIsMobileFilterPinned(filterElement.getBoundingClientRect().top <= 12);
    };

    updateMobileFilterPinned();
    window.addEventListener('scroll', updateMobileFilterPinned, { passive: true });
    window.addEventListener('resize', updateMobileFilterPinned);

    return () => {
      window.removeEventListener('scroll', updateMobileFilterPinned);
      window.removeEventListener('resize', updateMobileFilterPinned);
    };
  }, []);

  useEffect(() => {
    if (!isMobileView || !loadMoreRef.current || loading || page >= totalPages) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPage((prevPage) => {
            if (prevPage >= totalPages) {
              return prevPage;
            }

            return prevPage + 1;
          });
        }
      },
      {
        root: null,
        rootMargin: '120px',
        threshold: 0.1
      }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isMobileView, loading, page, totalPages]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await getInvoices(page, perPage);
      const fetchedInvoices = response.data.items || [];

      setInvoices((prevInvoices) => {
        if (isMobileView && page > 1) {
          return [...prevInvoices, ...fetchedInvoices];
        }

        return fetchedInvoices;
      });

      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching invoices:', error);
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
        await deleteInvoice(deleteId);
        setInvoices(invoices.filter(i => i.id !== deleteId));
        setIsModalOpen(false);
        setDeleteId(null);
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice');
      }
    }
  };

  const getStatusClasses = (status: string) => {
    if (status === 'generated') {
      return {
        badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        dot: 'bg-green-500'
      };
    }

    if (status === 'draft') {
      return {
        badge: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        dot: 'bg-gray-500'
      };
    }

    return {
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      dot: 'bg-blue-500'
    };
  };

  return (
    <div className="px-4 pt-6 pb-24 md:p-8 max-w-7xl mx-auto">
      <div className={isMobileFilterPinned ? 'hidden md:flex md:justify-between md:items-center mb-8' : 'flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8'}>
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-gray-500 mt-2">Manage all your customer invoices.</p>
        </div>
        <Link to="/invoices/new" className="hidden md:inline-flex bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg text-sm font-bold items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
          <span className="material-symbols-outlined">add_circle</span>
          Create New Invoice
        </Link>
      </div>

      <div ref={mobileFilterRef} className="md:hidden sticky top-3 z-20 mb-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 p-4 shadow-sm backdrop-blur space-y-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input type="text" placeholder="Search Invoice #..." className="w-full pl-10 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border-none text-sm focus:ring-2 focus:ring-primary/50" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700">
            Status <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
          <button className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700">
            Date Range <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
        </div>
      </div>

      <div className="md:bg-white md:dark:bg-gray-900 md:rounded-xl md:border md:border-gray-200 md:dark:border-gray-800 md:shadow-sm">
        <div className="hidden md:flex pb-4 md:p-4 md:border-b md:border-gray-200 md:dark:border-gray-800 flex-wrap gap-4">
          <div className="flex-1 relative min-w-[200px]">
             <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
             <input type="text" placeholder="Search Invoice #..." className="w-full pl-10 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border-none text-sm focus:ring-2 focus:ring-primary/50" />
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

        <div className="md:hidden space-y-3">
          {loading && invoices.length === 0 ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-gray-500">Loading invoices...</span>
              </div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
              No invoices found. Create your first invoice to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {invoices.map((inv) => {
                const statusClasses = getStatusClasses(inv.status);

                return (
                  <div key={inv.id} className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{inv.customer}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Invoice #{inv.invoiceNumber}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusClasses.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusClasses.dot}`}></span>
                        {inv.status}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3 text-sm">
                      <div className="space-y-1 text-left min-w-0">
                        <p className="text-gray-500 dark:text-gray-400">{inv.date}</p>
                      </div>
                      <p className="font-semibold text-right whitespace-nowrap">${Number(inv.grandTotal || 0).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}

              {loading && invoices.length > 0 && (
                <div className="p-4 text-center text-sm text-gray-500">Loading more invoices...</div>
              )}

              {!loading && page < totalPages && <div ref={loadMoreRef} className="h-8" />}

              {!loading && page >= totalPages && invoices.length > 0 && (
                <div className="p-2 text-center text-xs text-gray-400">You have reached the end</div>
              )}
            </div>
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="p-4 w-12"><input type="checkbox" className="rounded text-primary focus:ring-primary" /></th>
                <th className="p-4 font-semibold text-gray-500 dark:text-gray-400">INVOICE #</th>
                <th className="p-4 font-semibold text-gray-500 dark:text-gray-400">CUSTOMER</th>
                <th className="p-4 font-semibold text-gray-500 dark:text-gray-400">DATE</th>
                <th className="p-4 font-semibold text-gray-500 dark:text-gray-400">TOTAL</th>
                <th className="p-4 font-semibold text-gray-500 dark:text-gray-400">STATUS</th>
                <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-3 text-gray-500">Loading invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No invoices found. Create your first invoice to get started.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const statusClasses = getStatusClasses(inv.status);

                  return (
                  <tr key={inv.id} className="hover:bg-primary/5 transition-colors">
                    <td className="p-4"><input type="checkbox" className="rounded text-primary focus:ring-primary" /></td>
                    <td className="p-4 font-medium text-primary cursor-pointer hover:underline">{inv.invoiceNumber}</td>
                    <td className="p-4 font-medium">{inv.customer}</td>
                    <td className="p-4 text-gray-500">{inv.date}</td>
                    <td className="p-4 font-medium">${Number(inv.grandTotal || 0).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusClasses.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusClasses.dot}`}></span>
                        {inv.status}
                      </span>
                    </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Link to={`/invoices/view/${inv.id}`} className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/10" title="View Invoice">
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </Link>
                      <Link to={`/invoices/edit/${inv.id}`} className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/10" title="Edit Invoice">
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
                );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && invoices.length > 0 && (
          <div className="hidden md:flex pt-4 md:p-4 md:border-t md:border-gray-200 md:dark:border-gray-800 items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p+1)} className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        )}
        </div>

      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
      />

      <div className="md:hidden fixed bottom-4 left-4 right-4 z-20">
        <Link to="/invoices/new" className="bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg">
          <span className="material-symbols-outlined">add_circle</span>
          Create New Invoice
        </Link>
      </div>
    </div>
  );
};

export default InvoiceList;