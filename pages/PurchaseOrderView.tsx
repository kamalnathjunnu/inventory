import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPurchaseOrder } from '../services/api';

const PurchaseOrderView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPO] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPO();
    }
  }, [id]);

  const fetchPO = async () => {
    try {
      setLoading(true);
      const response = await getPurchaseOrder(Number(id));
      setPO(response.data);
    } catch (error) {
      console.error('Error fetching PO:', error);
      alert('Failed to load purchase order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Purchase order not found</div>
      </div>
    );
  }

  const items = typeof po.items === 'string' ? JSON.parse(po.items) : po.items || [];
  const getStatusBadge = (status: string) => {
    const styles: any = {
      'Draft': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      'Sent': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'Received': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'Canceled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Action Buttons */}
      <div className="print:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/purchase-orders')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Purchase Orders
          </button>
          <div className="flex gap-3">
            {(po.status === 'Sent' || po.status === 'Draft' || po.status === 'Received') && (
              <button
                onClick={() => navigate(`/purchase-invoices/new?poId=${po.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                Create Invoice
              </button>
            )}
            {(po.status === 'Sent' || po.status === 'Draft') && (
              <button
                onClick={() => navigate(`/purchase-invoices/new?poId=${po.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <span className="material-symbols-outlined text-[20px]">inventory</span>
                Receive Items
              </button>
            )}
            {(po.status === 'Draft' || po.status === 'Sent') && (
              <button
                onClick={() => navigate(`/purchase-orders/edit/${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
                Edit
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
              Print
            </button>
          </div>
        </div>
      </div>

      {/* PO Content */}
      <div className="max-w-[210mm] mx-auto p-6">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-8 py-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold mb-1">PURCHASE ORDER</h1>
                <p className="text-purple-200 opacity-90">Order Details</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold mb-2">{po.number}</div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(po.status)}`}>
                  {po.status}
                </span>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Supplier</h3>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{po.supplier}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Order Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {po.date ? new Date(po.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                  {po.expectedDeliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Expected Delivery:</span>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {po.receivedDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Received Date:</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {new Date(po.receivedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {po.destinationWarehouse && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Warehouse:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{po.destinationWarehouse}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-8 py-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">#</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Product</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Warehouse</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Qty</th>
                  <th className="px-2 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Unit Price</th>
                  <th className="px-2 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-2 py-4 text-sm text-gray-600 dark:text-gray-400">{index + 1}</td>
                    <td className="px-2 py-4">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.product}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.qty} {item.unit} × ₹{Number(item.price).toFixed(2)}</div>
                    </td>
                    <td className="px-2 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{item.warehouse || '-'}</td>
                    <td className="px-2 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">{item.qty} {item.unit}</td>
                    <td className="px-2 py-4 text-right text-sm text-gray-900 dark:text-white font-medium">₹{Number(item.price).toFixed(2)}</td>
                    <td className="px-2 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">₹{(Number(item.qty) * Number(item.price)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-8 pb-8">
            <div className="flex justify-end">
              <div className="w-80 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-semibold text-gray-900 dark:text-white">₹{Number(po.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tax</span>
                    <span className="font-semibold text-gray-900 dark:text-white">₹{Number(po.totalTax || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Total Amount</span>
                    <span className="text-2xl font-bold text-purple-600">₹{Number(po.grandTotal || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {po.notes && (
            <div className="px-8 pb-6">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Notes</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{po.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center space-y-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Purchase Order Document</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">This is a computer-generated document.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PurchaseOrderView;
