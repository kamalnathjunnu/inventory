import React, { useState, useEffect } from 'react';
import { getSetting, saveSetting } from '../services/api';

const Settings: React.FC = () => {
  const [invoicePrefix, setInvoicePrefix] = useState('');
  const [startingNumber, setStartingNumber] = useState('1');
  const [poPrefix, setPOPrefix] = useState('');
  const [poStartingNumber, setPOStartingNumber] = useState('1');
  const [companyName, setCompanyName] = useState('');
  const [companyGST, setCompanyGST] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const [prefixRes, startingNumRes, poPrefixRes, poStartingNumRes, companyNameRes, companyGSTRes, companyAddressRes, companyEmailRes, companyPhoneRes] = await Promise.all([
          getSetting('invoice_prefix'),
          getSetting('invoice_starting_number'),
          getSetting('po_prefix'),
          getSetting('po_starting_number'),
          getSetting('company_name'),
          getSetting('company_gst'),
          getSetting('company_address'),
          getSetting('company_email'),
          getSetting('company_phone')
        ]);
        setInvoicePrefix(prefixRes.data.value || '');
        setStartingNumber(startingNumRes.data.value || '1');
        setPOPrefix(poPrefixRes.data.value || 'PO');
        setPOStartingNumber(poStartingNumRes.data.value || '1');
        setCompanyName(companyNameRes.data.value || '');
        setCompanyGST(companyGSTRes.data.value || '');
        setCompanyAddress(companyAddressRes.data.value || '');
        setCompanyEmail(companyEmailRes.data.value || '');
        setCompanyPhone(companyPhoneRes.data.value || '');
      } catch (error) {
        console.error('Error fetching settings:', error);
        // If settings don't exist, use default values
        setInvoicePrefix('');
        setStartingNumber('1');
        setPOPrefix('PO');
        setPOStartingNumber('1');
        setCompanyName('');
        setCompanyGST('');
        setCompanyAddress('');
        setCompanyEmail('');
        setCompanyPhone('');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    // Validate starting number
    const startNum = parseInt(startingNumber);
    if (isNaN(startNum) || startNum < 1) {
      setMessage({ type: 'error', text: 'Starting number must be a positive integer' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await Promise.all([
        saveSetting('invoice_prefix', invoicePrefix),
        saveSetting('invoice_starting_number', startingNumber),
        saveSetting('po_prefix', poPrefix),
        saveSetting('po_starting_number', poStartingNumber),
        saveSetting('company_name', companyName),
        saveSetting('company_gst', companyGST),
        saveSetting('company_address', companyAddress),
        saveSetting('company_email', companyEmail),
        saveSetting('company_phone', companyPhone)
      ]);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: `Failed to save settings: ${error.response?.data?.message || error.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <span className="material-symbols-outlined text-4xl">settings</span>
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Configure application settings and preferences.</p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        } animate-in fade-in slide-in-from-top-2`}>
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined ${
              message.type === 'success' ? 'text-green-500' : 'text-red-500'
            }`}>
              {message.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <p className={message.type === 'success' 
              ? 'text-green-800 dark:text-green-300' 
              : 'text-red-800 dark:text-red-300'
            }>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Company Information */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined">business</span>
            Company Information
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your business details that appear on invoices</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Company Name */}
          <div>
            <label className="block mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg">apartment</span>
                Company Name <span className="text-red-500">*</span>
              </span>
              <input 
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company Name"
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
              />
            </label>
          </div>

          {/* GST Number */}
          <div>
            <label className="block mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg">badge</span>
                GST Number
              </span>
              <input 
                type="text"
                value={companyGST}
                onChange={(e) => setCompanyGST(e.target.value)}
                placeholder="e.g., 29ABCDE1234F1Z5"
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
              />
            </label>
          </div>

          {/* Address */}
          <div>
            <label className="block mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg">location_on</span>
                Address <span className="text-red-500">*</span>
              </span>
              <textarea 
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Complete business address"
                rows={3}
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <label className="block mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-lg">mail</span>
                  Email <span className="text-red-500">*</span>
                </span>
                <input 
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="contact@company.com"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                />
              </label>
            </div>

            {/* Phone */}
            <div>
              <label className="block mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-lg">phone</span>
                  Phone <span className="text-red-500">*</span>
                </span>
                <input 
                  type="tel"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="+91 1234567890"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined">receipt_long</span>
            Invoice Settings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure invoice numbering and formatting</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Invoice Prefix */}
          <div>
            <label className="block mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg">tag</span>
                Invoice Number Prefix
              </span>
              <input 
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                placeholder="e.g., INV, BILL, ORDER"
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
              />
            </label>
          </div>

          {/* Starting Serial Number */}
          <div>
            <label className="block mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg">counter_1</span>
                Starting Serial Number
              </span>
              <input 
                type="number"
                min="1"
                value={startingNumber}
                onChange={(e) => setStartingNumber(e.target.value)}
                placeholder="1"
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
              />
            </label>
            <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg">info</span>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-300 mb-1">How it works:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-400">
                    <li>This is the starting number for your invoice sequence</li>
                    <li>Format: <code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-xs">{invoicePrefix || 'PREFIX'}-NUMBER</code></li>
                    <li>The number will auto-increment for each new invoice</li>
                    <li>Example: <code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-xs">{invoicePrefix || 'INV'}-{String(parseInt(startingNumber) || 1).padStart(4, '0')}</code></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">preview</span>
              Preview
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next invoice number will be:</p>
              <p className="text-2xl font-bold text-primary">
                {invoicePrefix ? `${invoicePrefix}-` : ''}{String(parseInt(startingNumber) || 1).padStart(4, '0')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Order Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden mt-6">
        <div className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 dark:from-purple-500/20 dark:to-purple-500/10 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined">shopping_cart</span>
            Purchase Order Settings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure purchase order numbering</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* PO Prefix */}
          <div>
            <label className="block mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg">tag</span>
                PO Number Prefix
              </span>
              <input 
                type="text"
                value={poPrefix}
                onChange={(e) => setPOPrefix(e.target.value)}
                placeholder="e.g., PO, PUR, ORD"
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50"
              />
            </label>
          </div>

          {/* PO Starting Serial Number */}
          <div>
            <label className="block mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg">counter_1</span>
                Starting Serial Number
              </span>
              <input 
                type="number"
                min="1"
                value={poStartingNumber}
                onChange={(e) => setPOStartingNumber(e.target.value)}
                placeholder="1"
                className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50"
              />
            </label>
          </div>

          {/* PO Preview */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">preview</span>
              Preview
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next PO number will be:</p>
              <p className="text-2xl font-bold text-purple-600">
                {poPrefix ? `${poPrefix}-` : ''}{String(parseInt(poStartingNumber) || 1).padStart(4, '0')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">save</span>
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;
