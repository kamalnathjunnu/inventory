import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPurchaseInvoice, getSetting } from '../services/api';

const PurchaseInvoiceView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    gst: '',
    address: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const [invoiceRes, nameRes, gstRes, addressRes, emailRes, phoneRes] = await Promise.all([
        getPurchaseInvoice(Number(id)),
        getSetting('company_name'),
        getSetting('company_gst'),
        getSetting('company_address'),
        getSetting('company_email'),
        getSetting('company_phone')
      ]);
      setInvoice(invoiceRes.data.data);
      setCompanyInfo({
        name: nameRes.data.value || 'Your Company Name',
        gst: gstRes.data.value || '',
        address: addressRes.data.value || '',
        email: emailRes.data.value || '',
        phone: phoneRes.data.value || ''
      });
    } catch (error) {
      console.error('Error fetching purchase invoice:', error);
      alert('Failed to load purchase invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading purchase invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Purchase invoice not found</div>
      </div>
    );
  }

  const items = invoice.purchaseInvoiceItems || [];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Action Buttons - Hidden when printing */}
      <div className="print:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/purchase-invoices')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Purchase Invoices
          </button>
          <div className="flex gap-3">
            <Link
              to={`/purchase-invoices/edit/${id}`}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Edit
            </Link>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-[210mm] mx-auto p-6">
        <div ref={printRef} className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-8 py-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold mb-1">PURCHASE INVOICE</h1>
                <p className="opacity-90">Supplier Invoice</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Company & Invoice Info Section */}
          <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-8">
              {/* Company Details */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Bill To (Our Company)</h3>
                <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">{companyInfo.name}</p>
                <div className="space-y-1">
                  {companyInfo.gst && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">GSTIN: {companyInfo.gst}</p>
                  )}
                  {companyInfo.address && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{companyInfo.address}</p>
                  )}
                  {companyInfo.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                      {companyInfo.email}
                    </p>
                  )}
                  {companyInfo.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">phone</span>
                      {companyInfo.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Invoice Details */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Invoice Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Invoice Number:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{invoice.invoiceNumber}</span>
                  </div>
                  {invoice.supplierInvoiceNumber && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Supplier Invoice #:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{invoice.supplierInvoiceNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Invoice Date:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Due Date:</span>
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                        {new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {invoice.paymentTerms && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Payment Terms:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{invoice.paymentTerms}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Section */}
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Supplier</h3>
            <div className="space-y-2">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{invoice.supplier}</p>
              {invoice.supplierData && (
                <div className="space-y-1">
                  {invoice.supplierData.gstNumber && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">GSTIN: {invoice.supplierData.gstNumber}</p>
                  )}
                  {invoice.supplierData.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                      {invoice.supplierData.email}
                    </p>
                  )}
                  {invoice.supplierData.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">phone</span>
                      {invoice.supplierData.phone}
                    </p>
                  )}
                  {invoice.supplierData.shippingAddress && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.supplierData.shippingAddress}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="px-8 py-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="py-3 text-left font-semibold text-gray-600 dark:text-gray-400">#</th>
                  <th className="py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Product</th>
                  <th className="py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Batch</th>
                  <th className="py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Warehouse</th>
                  <th className="py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Qty</th>
                  <th className="py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Rate</th>
                  <th className="py-3 text-right font-semibold text-gray-600 dark:text-gray-400">GST</th>
                  <th className="py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, index: number) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 text-gray-500">{index + 1}</td>
                    <td className="py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{item.productName}</div>
                      {item.productData?.hsn && <div className="text-xs text-gray-500">HSN: {item.productData.hsn}</div>}
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{item.batchNumber || '-'}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{item.warehouseData?.name || '-'}</td>
                    <td className="py-3 text-right text-gray-900 dark:text-white">{item.quantity} {item.unit}</td>
                    <td className="py-3 text-right text-gray-900 dark:text-white">₹{Number(item.rate).toFixed(2)}</td>
                    <td className="py-3 text-right text-gray-500">{item.taxRate || 0}%</td>
                    <td className="py-3 text-right font-medium text-gray-900 dark:text-white">₹{Number(item.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{Number(invoice.subtotal || 0).toFixed(2)}</span>
                </div>
                {Number(invoice.totalCGST) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">CGST</span>
                    <span className="text-gray-900 dark:text-white">₹{Number(invoice.totalCGST).toFixed(2)}</span>
                  </div>
                )}
                {Number(invoice.totalSGST) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">SGST</span>
                    <span className="text-gray-900 dark:text-white">₹{Number(invoice.totalSGST).toFixed(2)}</span>
                  </div>
                )}
                {Number(invoice.totalIGST) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">IGST</span>
                    <span className="text-gray-900 dark:text-white">₹{Number(invoice.totalIGST).toFixed(2)}</span>
                  </div>
                )}
                {Number(invoice.totalCESS) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">CESS</span>
                    <span className="text-gray-900 dark:text-white">₹{Number(invoice.totalCESS).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-gray-300 dark:border-gray-600">
                  <span className="text-gray-900 dark:text-white">Grand Total</span>
                  <span className="text-purple-600">₹{Number(invoice.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Notes</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-100 dark:bg-gray-800 text-center">
            <p className="text-xs text-gray-500">
              This is a computer-generated document. Stock has been added to inventory upon approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseInvoiceView;
