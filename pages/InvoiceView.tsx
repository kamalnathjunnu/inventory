import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoice, getSetting } from '../services/api';

const InvoiceView: React.FC = () => {
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
        getInvoice(Number(id)),
        getSetting('company_name'),
        getSetting('company_gst'),
        getSetting('company_address'),
        getSetting('company_email'),
        getSetting('company_phone')
      ]);
      setInvoice(invoiceRes.data);
      setCompanyInfo({
        name: nameRes.data.value || 'Your Company Name',
        gst: gstRes.data.value || '',
        address: addressRes.data.value || '',
        email: emailRes.data.value || '',
        phone: phoneRes.data.value || ''
      });
    } catch (error) {
      console.error('Error fetching invoice:', error);
      alert('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print(); // Browser's print dialog has "Save as PDF" option
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Invoice not found</div>
      </div>
    );
  }

  const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items || [];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Action Buttons - Hidden when printing */}
      <div className="print:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/invoices')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Invoices
          </button>
          <div className="flex gap-3">
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
          {/* Header with Brand Color */}
          <div className="bg-gradient-to-r from-primary to-primary-dark text-white px-8 py-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold mb-1">INVOICE</h1>
                <p className="text-primary-light opacity-90">Tax Invoice</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold mb-2">{companyInfo.name}</h2>
                {companyInfo.gst && (
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full inline-block mb-2">
                    <span className="text-xs font-semibold">GST: {companyInfo.gst}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Company & Invoice Info Section */}
          <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-8">
              {/* Company Details */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">From</h3>
                <div className="space-y-1">
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
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Invoice Date:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Due Date:</span>
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">{new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bill To Section */}
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Bill To</h3>
            <div className="space-y-3">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{invoice.customer}</p>
              {(() => {
                const customerDetails = invoice.customerDetails ? 
                  (typeof invoice.customerDetails === 'string' ? JSON.parse(invoice.customerDetails) : invoice.customerDetails) : null;
                
                if (!customerDetails) return null;
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Contact Information */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Contact</h4>
                      <div className="space-y-1">
                        {customerDetails.gstNumber && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">GST:</span> {customerDetails.gstNumber}
                          </p>
                        )}
                        {customerDetails.email && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">mail</span>
                            {customerDetails.email}
                          </p>
                        )}
                        {customerDetails.phone && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">phone</span>
                            {customerDetails.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Addresses */}
                    <div>
                      {/* Show Billing Address - use shipping if billing is empty */}
                      {(customerDetails.billingAddress || customerDetails.shippingAddress) && (
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Billing Address</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {customerDetails.billingAddress || customerDetails.shippingAddress}
                          </p>
                          {(() => {
                            const city = customerDetails.billingCity || customerDetails.shippingCity;
                            const state = customerDetails.billingState || customerDetails.shippingState;
                            const postal = customerDetails.billingPostalCode || customerDetails.shippingPostalCode;
                            return (city || state || postal) && (
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {[city, state, postal].filter(Boolean).join(', ')}
                              </p>
                            );
                          })()}
                        </div>
                      )}
                      {customerDetails.shippingAddress && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Shipping Address</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{customerDetails.shippingAddress}</p>
                          {(customerDetails.shippingCity || customerDetails.shippingState || customerDetails.shippingPostalCode) && (
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {[customerDetails.shippingCity, customerDetails.shippingState, customerDetails.shippingPostalCode].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Items Table */}
          <div className="px-8 py-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">#</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Description</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Qty</th>
                  <th className="px-2 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Rate</th>
                  {Number(invoice.totalIGST) > 0 ? (
                    <th className="px-2 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">IGST</th>
                  ) : (
                    <>
                      <th className="px-2 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">CGST</th>
                      <th className="px-2 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">SGST</th>
                    </>
                  )}
                  {Number(invoice.totalCESS) > 0 && (
                    <th className="px-2 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">CESS</th>
                  )}
                  <th className="px-2 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Amount</th>
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
                    <td className="px-2 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">{item.qty} {item.unit}</td>
                    <td className="px-2 py-4 text-right text-sm text-gray-900 dark:text-white font-medium">₹{Number(item.price).toFixed(2)}</td>
                    {Number(invoice.totalIGST) > 0 ? (
                      <td className="px-2 py-4 text-right text-sm text-gray-600 dark:text-gray-400">₹{Number(item.igstAmount || 0).toFixed(2)}</td>
                    ) : (
                      <>
                        <td className="px-2 py-4 text-right text-sm text-gray-600 dark:text-gray-400">₹{Number(item.cgstAmount || 0).toFixed(2)}</td>
                        <td className="px-2 py-4 text-right text-sm text-gray-600 dark:text-gray-400">₹{Number(item.sgstAmount || 0).toFixed(2)}</td>
                      </>
                    )}
                    {Number(invoice.totalCESS) > 0 && (
                      <td className="px-2 py-4 text-right text-sm text-gray-600 dark:text-gray-400">₹{Number(item.cessAmount || 0).toFixed(2)}</td>
                    )}
                    <td className="px-2 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">₹{Number(item.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="px-8 pb-8">
            <div className="flex justify-end">
              <div className="w-80 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-semibold text-gray-900 dark:text-white">₹{Number(invoice.subtotal).toFixed(2)}</span>
                  </div>
                  {Number(invoice.totalIGST) > 0 ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">IGST</span>
                      <span className="font-semibold text-gray-900 dark:text-white">₹{Number(invoice.totalIGST).toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">CGST</span>
                        <span className="font-semibold text-gray-900 dark:text-white">₹{Number(invoice.totalCGST || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">SGST</span>
                        <span className="font-semibold text-gray-900 dark:text-white">₹{Number(invoice.totalSGST || 0).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {Number(invoice.totalCESS) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">CESS</span>
                      <span className="font-semibold text-gray-900 dark:text-white">₹{Number(invoice.totalCESS).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Tax</span>
                    <span className="font-semibold text-gray-900 dark:text-white">₹{Number(invoice.totalTax).toFixed(2)}</span>
                  </div>
                  <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Total Amount</span>
                    <span className="text-2xl font-bold text-primary">₹{Number(invoice.grandTotal).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center space-y-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Thank you for your business!</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">This is a computer-generated invoice and does not require a signature.</p>
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
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceView;
