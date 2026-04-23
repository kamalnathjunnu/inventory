import React, { useState, useEffect, useRef } from 'react';
import QuickCreateCustomerModal from './QuickCreateCustomerModal';
import ShippingAddress from './ShippingAddress';
import { createCustomer, getCustomers, searchCustomers, getPartyAddresses, createPartyAddress } from '../services/api';

interface BillToSectionProps {
  customer?: any;
  selectedAddress?: any;
  placeholderText?: string;
  addButtonLabel?: string;
  sectionLabel?: string;
  showShippingAddress?: boolean;
  onCustomerChange?: (customer: any | null) => void;
  onShippingAddressChange?: (address: any | null) => void;
}

const BillToSection: React.FC<BillToSectionProps> = ({
  customer = null,
  selectedAddress = null,
  placeholderText = 'Search and select a customer...',
  addButtonLabel = '+ New Customer',
  sectionLabel = 'Bill To',
  showShippingAddress = true,
  onCustomerChange,
  onShippingAddressChange,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(customer);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const addressDropdownRef = useRef<HTMLDivElement>(null);

  // Close address dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addressDropdownRef.current && !addressDropdownRef.current.contains(e.target as Node)) {
        setIsAddressDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync when customer prop changes (e.g. edit mode load)
  useEffect(() => {
    setSelectedCustomer(customer);
  }, [customer]);

  // Load addresses when customer is selected
  useEffect(() => {
    if (!showShippingAddress) {
      setAddresses([]);
      setSelectedAddressId(null);
      onShippingAddressChange?.(null);
      return;
    }

    if (selectedCustomer?.id) {
      // Use addresses from customer object if available, otherwise fetch
      if (selectedCustomer.addresses && selectedCustomer.addresses.length > 0) {
        setAddresses(selectedCustomer.addresses);
        const initialAddr = selectedAddress?.id
          ? selectedCustomer.addresses.find((a: any) => a.id === selectedAddress.id)
          : null;
        const addr = initialAddr || selectedCustomer.addresses.find((a: any) => a.isDefault) || selectedCustomer.addresses[0];
        setSelectedAddressId(addr.id);
        onShippingAddressChange?.(addr);
      } else {
        getPartyAddresses(selectedCustomer.id).then(res => {
          const addrs = res.data.items || [];
          setAddresses(addrs);
          if (addrs.length > 0) {
            const initialAddr = selectedAddress?.id
              ? addrs.find((a: any) => a.id === selectedAddress.id)
              : null;
            const addr = initialAddr || addrs.find((a: any) => a.isDefault) || addrs[0];
            setSelectedAddressId(addr.id);
            onShippingAddressChange?.(addr);
          } else {
            setSelectedAddressId(null);
            onShippingAddressChange?.(null);
          }
        }).catch(() => {
          setAddresses([]);
          setSelectedAddressId(null);
        });
      }
    } else {
      setAddresses([]);
      setSelectedAddressId(null);
      onShippingAddressChange?.(null);
    }
  }, [selectedCustomer?.id, showShippingAddress]);

  // Debounced customer search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 0) {
        setIsSearching(true);
        try {
          const response = await searchCustomers(searchQuery, 10);
          setSearchResults(response.data.items || []);
        } catch (error) {
          console.error('Error searching customers:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCustomer = (cust: any) => {
    setSelectedCustomer(cust);
    setSearchQuery('');
    setSearchResults([]);
    setIsAddingAddress(false);
    onCustomerChange?.(cust);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setSearchQuery('');
    setSearchResults([]);
    setAddresses([]);
    setSelectedAddressId(null);
    setIsAddingAddress(false);
    setIsAddressDropdownOpen(false);
    onCustomerChange?.(null);
    onShippingAddressChange?.(null);
  };

  const handleAddressSelect = (addressId: number) => {
    setSelectedAddressId(addressId);
    setIsAddressDropdownOpen(false);
    const addr = addresses.find(a => a.id === addressId);
    onShippingAddressChange?.(addr || null);
  };

  const handleNewAddressSaved = async (formData: any) => {
    try {
      const res = await createPartyAddress(selectedCustomer.id, formData);
      const created = res.data;
      setAddresses(prev => [...prev, created]);
      setSelectedAddressId(created.id);
      onShippingAddressChange?.(created);
      setIsAddingAddress(false);
    } catch (error) {
      console.error('Error creating address:', error);
    }
  };

  const handleCreateCustomer = async (data: any) => {
    const response = await createCustomer(data);
    const newCustomer = response.data;

    try {
      const customersRes = await getCustomers(1, 1000);
      const allCustomers = customersRes.data.items || [];
      const fullCustomer = allCustomers.find((c: any) => c.id === newCustomer.id) || newCustomer;
      handleSelectCustomer(fullCustomer);
    } catch {
      handleSelectCustomer(newCustomer);
    }
  };

  return (
    <div className="lg:col-span-7">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
            {sectionLabel} <span className="text-red-500">*</span>
          </h3>
        </div>
        
        <div className="space-y-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery || (selectedCustomer?.name || '')}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value) {
                  handleClearCustomer();
                }
              }}
              placeholder={placeholderText}
              className="w-full h-11 pl-10 pr-32 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-400 shadow-sm hover:border-gray-400 dark:hover:border-gray-600"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 dark:text-gray-400 text-[20px]">search</span>
            <button 
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary text-xs font-semibold hover:underline bg-white dark:bg-gray-800 px-2 py-1 rounded border border-transparent hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {addButtonLabel}
            </button>
            {isSearching && (
              <div className="absolute right-28 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
            )}
            {searchQuery && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => handleSelectCustomer(cust)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{cust.name}</div>
                    {cust.email && <div className="text-xs text-gray-500">{cust.email}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {selectedCustomer && !searchQuery && showShippingAddress && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-900 dark:text-white">Shipping Address</label>
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(!isAddingAddress)}
                  className="text-primary text-xs font-semibold hover:underline"
                >
                  {isAddingAddress ? 'Cancel' : '+ Add New'}
                </button>
              </div>

              <div className="relative" ref={addressDropdownRef}>
                <div
                  onClick={() => setIsAddressDropdownOpen(!isAddressDropdownOpen)}
                  className="w-full h-10 px-3 pr-8 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-sm cursor-pointer flex items-center hover:border-gray-400 dark:hover:border-gray-600 focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  {addresses.length > 0 && selectedAddressId ? (
                    <span className="truncate">
                      {(() => { const addr = addresses.find(a => a.id === selectedAddressId); return addr ? `${addr.label ? addr.label + ': ' : ''}${addr.address}${addr.city ? ', ' + addr.city : ''}${addr.state ? ', ' + addr.state : ''}${addr.postalCode ? ' - ' + addr.postalCode : ''}` : 'Select shipping address'; })()}
                    </span>
                  ) : (
                    <span className="text-gray-400">No shipping addresses</span>
                  )}
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[18px] transition-transform" style={{ transform: isAddressDropdownOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }}>expand_more</span>
                </div>

                {isAddressDropdownOpen && addresses.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {addresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleAddressSelect(addr.id)}
                        className={`w-full text-left px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors ${
                          addr.id === selectedAddressId
                            ? 'bg-primary/10 dark:bg-primary/20'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {addr.label && <span className="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{addr.label}</span>}
                          {addr.isDefault && <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">Default</span>}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white mt-1">
                          {addr.address}{addr.city ? `, ${addr.city}` : ''}{addr.state ? `, ${addr.state}` : ''}{addr.postalCode ? ` - ${addr.postalCode}` : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isAddingAddress && (
                <ShippingAddress
                  isOpen={isAddingAddress}
                  onClose={() => setIsAddingAddress(false)}
                  onSave={handleNewAddressSaved}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <QuickCreateCustomerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateCustomer}
      />
    </div>
  );
};

export default BillToSection;
