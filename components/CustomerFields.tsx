import React from 'react';

interface CustomerData {
  name: string;
  type?: 'customer' | 'supplier' | 'both';
  email: string;
  phone: string;
  gstNumber: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
}

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

interface CustomerFieldsProps {
  formData: CustomerData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  disabled?: boolean;
  showAddressFields?: boolean;
  // Multi-address props
  shippingAddresses?: ShippingAddress[];
  onAddAddress?: () => void;
  onEditAddress?: (index: number) => void;
  onDeleteAddress?: (index: number) => void;
}

const CustomerFields: React.FC<CustomerFieldsProps> = ({
  formData,
  onChange,
  disabled = false,
  showAddressFields = false,
  shippingAddresses = [],
  onAddAddress,
  onEditAddress,
  onDeleteAddress
}) => {
  const hasMultiAddressSupport = !!onAddAddress;
  return (
    <>
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Party Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            placeholder="Enter party name"
            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50"
            disabled={disabled}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Party Type <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            value={formData.type || 'customer'}
            onChange={onChange}
            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50"
            disabled={disabled}
          >
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
            <option value="both">Both (Customer & Supplier)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            GST Number
          </label>
          <input
            type="text"
            name="gstNumber"
            value={formData.gstNumber}
            onChange={onChange}
            placeholder="22AAAAA0000A1Z5"
            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50"
            disabled={disabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            placeholder="customer@example.com"
            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50"
            disabled={disabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            placeholder="+1 234 567 8900"
            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Address Fields (Optional) */}
      {showAddressFields && (
        <>
          <hr className="border-gray-200 dark:border-gray-800" />

          {/* Shipping Addresses - Multi-address support */}
          {hasMultiAddressSupport ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Shipping Addresses</h3>
                <button
                  type="button"
                  onClick={onAddAddress}
                  className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
                  disabled={disabled}
                >
                  <span className="material-symbols-outlined text-[18px]">add</span> Add Address
                </button>
              </div>

              {/* Address list */}
              {shippingAddresses.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {shippingAddresses.map((addr, index) => (
                    <div
                      key={addr.id || index}
                      className={`border rounded-lg p-4 transition-colors ${
                        addr.isDefault
                          ? 'border-primary/50 bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {addr.label && (
                              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">{addr.label}</span>
                            )}
                            {addr.isDefault && (
                              <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {addr.address}
                            {addr.city ? `, ${addr.city}` : ''}
                            {addr.state ? `, ${addr.state}` : ''}
                            {addr.postalCode ? ` - ${addr.postalCode}` : ''}
                            {addr.country ? `, ${addr.country}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-3">
                          <button
                            type="button"
                            onClick={() => onEditAddress?.(index)}
                            className="p-1.5 text-gray-400 hover:text-primary rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            disabled={disabled}
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteAddress?.(index)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            disabled={disabled}
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-4">No shipping addresses added yet.</p>
              )}
            </div>
          ) : (
            /* Fallback: old single shipping address fields */
            <div>
              <h3 className="text-lg font-bold mb-4">Shipping Address</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  name="shippingAddress"
                  placeholder="Street Address"
                  value={formData.shippingAddress || ''}
                  onChange={onChange}
                  className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 p-3 focus:ring-2 focus:ring-primary/50"
                  disabled={disabled}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" name="shippingCity" placeholder="City" value={formData.shippingCity || ''} onChange={onChange} className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 p-3 focus:ring-2 focus:ring-primary/50" disabled={disabled} />
                  <input type="text" name="shippingState" placeholder="State/Province" value={formData.shippingState || ''} onChange={onChange} className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 p-3 focus:ring-2 focus:ring-primary/50" disabled={disabled} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" name="shippingPostalCode" placeholder="Postal Code" value={formData.shippingPostalCode || ''} onChange={onChange} className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 p-3 focus:ring-2 focus:ring-primary/50" disabled={disabled} />
                  <input type="text" name="shippingCountry" placeholder="Country" value={formData.shippingCountry || ''} onChange={onChange} className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 p-3 focus:ring-2 focus:ring-primary/50" disabled={disabled} />
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold mb-4">Billing Address</h3>
            <div className="space-y-4">
                <input
                  type="text"
                name="billingAddress"
                placeholder="Street Address"
                value={formData.billingAddress || ''}
                onChange={onChange}
                className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 p-3 focus:ring-2 focus:ring-primary/50"
                disabled={disabled}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="billingCity"
                  placeholder="City"
                  value={formData.billingCity || ''}
                  onChange={onChange}
                  className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 p-3 focus:ring-2 focus:ring-primary/50"
                  disabled={disabled}
                />
                <input
                  type="text"
                  name="billingState"
                  placeholder="State/Province"
                  value={formData.billingState || ''}
                  onChange={onChange}
                  className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 p-3 focus:ring-2 focus:ring-primary/50"
                  disabled={disabled}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="billingPostalCode"
                  placeholder="Postal Code"
                  value={formData.billingPostalCode || ''}
                  onChange={onChange}
                  className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 p-3 focus:ring-2 focus:ring-primary/50"
                  disabled={disabled}
                />
                <input
                  type="text"
                  name="billingCountry"
                  placeholder="Country"
                  value={formData.billingCountry || ''}
                  onChange={onChange}
                  className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 p-3 focus:ring-2 focus:ring-primary/50"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CustomerFields;
