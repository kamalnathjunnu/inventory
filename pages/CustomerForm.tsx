import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCustomer, createCustomer, updateCustomer, getPartyAddresses, createPartyAddress, updatePartyAddress, deletePartyAddress } from '../services/api';
import CustomerFields from '../components/CustomerFields';
import ShippingAddress from '../components/ShippingAddress';

interface ShippingAddress {
  id?: number;
  label: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  _isNew?: boolean;
  _isDeleted?: boolean;
}

const emptyAddress: ShippingAddress = { label: '', address: '', city: '', state: '', postalCode: '', country: '', isDefault: false };

const CustomerForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState({
    name: '',
    type: 'customer' as 'customer' | 'supplier' | 'both',
    gstNumber: '',
    email: '',
    phone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingPostalCode: '',
    shippingCountry: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
    billingCountry: ''
  });
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      const fetchCustomer = async () => {
        try {
          const response = await getCustomer(Number(id));
          const customer = response.data;
          setFormData({
            name: customer.name || '',
            type: customer.type || 'customer',
            gstNumber: customer.gstNumber || '',
            email: customer.email || '',
            phone: customer.phone || '',
            shippingAddress: customer.shippingAddress || '',
            shippingCity: customer.shippingCity || '',
            shippingState: customer.shippingState || '',
            shippingPostalCode: customer.shippingPostalCode || '',
            shippingCountry: customer.shippingCountry || '',
            billingAddress: customer.billingAddress || '',
            billingCity: customer.billingCity || '',
            billingState: customer.billingState || '',
            billingPostalCode: customer.billingPostalCode || '',
            billingCountry: customer.billingCountry || ''
          });
          
          // Load shipping addresses
          if (customer.addresses && customer.addresses.length > 0) {
            setShippingAddresses(customer.addresses.map((a: any) => ({
              id: a.id,
              label: a.label || '',
              address: a.address || '',
              city: a.city || '',
              state: a.state || '',
              postalCode: a.postalCode || '',
              country: a.country || '',
              isDefault: a.isDefault || false
            })));
          } else {
            const addrRes = await getPartyAddresses(Number(id));
            const addrs = addrRes.data.items || [];
            setShippingAddresses(addrs.map((a: any) => ({
              id: a.id,
              label: a.label || '',
              address: a.address || '',
              city: a.city || '',
              state: a.state || '',
              postalCode: a.postalCode || '',
              country: a.country || '',
              isDefault: a.isDefault || false
            })));
          }
        } catch (error) {
          console.error('Error fetching customer:', error);
        }
      };
      fetchCustomer();
    }
  }, [isEdit, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Shipping address management
  const handleAddAddress = () => {
    setEditingAddressIndex(null);
    setIsAddressModalOpen(true);
  };

  const handleEditAddress = (index: number) => {
    setEditingAddressIndex(index);
    setIsAddressModalOpen(true);
  };

  const handleAddressSaved = (formData: any) => {
    const updated = [...shippingAddresses];
    // If marking as default, clear others
    if (formData.isDefault) {
      updated.forEach(a => a.isDefault = false);
    }
    if (editingAddressIndex !== null) {
      updated[editingAddressIndex] = { ...updated[editingAddressIndex], ...formData };
    } else {
      // First address is auto-default
      if (updated.length === 0) formData.isDefault = true;
      updated.push({ ...formData, _isNew: true });
    }
    setShippingAddresses(updated);
    setEditingAddressIndex(null);
  };

  const handleDeleteAddress = (index: number) => {
    const updated = [...shippingAddresses];
    updated.splice(index, 1);
    // If we deleted the default and there are still addresses, make first one default
    if (updated.length > 0 && !updated.some(a => a.isDefault)) {
      updated[0].isDefault = true;
    }
    setShippingAddresses(updated);
    if (editingAddressIndex === index) {
      setEditingAddressIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSubmit = formData;
      
      let customerId: number;
      if (isEdit && id) {
        await updateCustomer(Number(id), dataToSubmit);
        customerId = Number(id);

        // Sync addresses: get existing, compare, create/update/delete
        const existingRes = await getPartyAddresses(customerId);
        const existingAddrs = existingRes.data.items || [];
        const existingIds = new Set(existingAddrs.map((a: any) => a.id));
        const currentIds = new Set(shippingAddresses.filter(a => a.id).map(a => a.id));

        // Delete removed addresses
        for (const existing of existingAddrs) {
          if (!currentIds.has(existing.id)) {
            await deletePartyAddress(customerId, existing.id);
          }
        }
        // Create or update
        for (const addr of shippingAddresses) {
          const { _isNew, _isDeleted, ...addrData } = addr;
          if (addr.id && existingIds.has(addr.id)) {
            await updatePartyAddress(customerId, addr.id, addrData);
          } else {
            await createPartyAddress(customerId, addrData);
          }
        }
      } else {
        const res = await createCustomer(dataToSubmit);
        customerId = res.data.id;

        // Create all shipping addresses for the new customer
        for (const addr of shippingAddresses) {
          const { _isNew, _isDeleted, id: _id, ...addrData } = addr;
          await createPartyAddress(customerId, addrData);
        }
      }
      navigate('/customers');
    } catch (error: any) {
      console.error('Error saving customer:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`Failed to save customer: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto pb-24">
      <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-8">{isEdit ? 'Edit Customer' : 'Add New Customer'}</h1>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-8">
        <CustomerFields
          formData={formData}
          onChange={handleChange}
          disabled={loading}
          showAddressFields={true}
          shippingAddresses={shippingAddresses}
          onAddAddress={handleAddAddress}
          onEditAddress={handleEditAddress}
          onDeleteAddress={handleDeleteAddress}
        />

        <ShippingAddress
          isOpen={isAddressModalOpen}
          onClose={() => { setIsAddressModalOpen(false); setEditingAddressIndex(null); }}
          onSave={handleAddressSaved}
          initialData={editingAddressIndex !== null ? shippingAddresses[editingAddressIndex] : undefined}
          title={editingAddressIndex !== null ? 'Edit Shipping Address' : 'Add Shipping Address'}
        />

        {isEdit && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Delete this customer</p>
              <p className="text-sm text-gray-500">Once deleted, there is no going back.</p>
            </div>
            <button className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 px-4 py-2 rounded-lg text-sm font-medium">Delete Customer</button>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={() => navigate('/customers')} className="px-6 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700">Cancel</button>
          <button type="submit" disabled={loading} className="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50">
            {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Save Customer')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;