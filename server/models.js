const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

const Product = sequelize.define('Product', {
  name: DataTypes.STRING,
  sku: {
    type: DataTypes.STRING,
    unique: true
  },
  // accountId will be added by foreign key relationship
  barcode: {
    type: DataTypes.STRING,
    unique: true
  },
  hsn: DataTypes.STRING,
  description: DataTypes.TEXT,
  
  // Inventory
  enableBatching: DataTypes.BOOLEAN,
  minStockLevel: DataTypes.INTEGER,
  quantity: {
    type: DataTypes.DECIMAL(15, 4),
    defaultValue: 0
  },
  
  // Units
  conversionRatio: DataTypes.DECIMAL,
  
  // Pricing
  buyingPrice: DataTypes.DECIMAL,
  buyingPriceTax: DataTypes.BOOLEAN,
  sellingPrice: DataTypes.DECIMAL,
  sellingPriceTax: DataTypes.BOOLEAN,
  
  // Images
  images: DataTypes.JSON,
});

const Brand = sequelize.define('Brand', {
  name: DataTypes.STRING,
  desc: DataTypes.STRING
  // accountId will be added by foreign key relationship
}, {
  indexes: [
    {
      unique: true,
      fields: ['name', 'accountId']
    }
  ]
});

const Category = sequelize.define('Category', {
  name: DataTypes.STRING,
  desc: DataTypes.STRING
  // accountId will be added by foreign key relationship
}, {
  indexes: [
    {
      unique: true,
      fields: ['name', 'accountId']
    }
  ]
});

const Warehouse = sequelize.define('Warehouse', {
  name: DataTypes.STRING,
  location: DataTypes.STRING,
  contactPerson: DataTypes.STRING,
  contactNumber: DataTypes.STRING
  // accountId will be added by foreign key relationship
}, {
  indexes: [
    {
      unique: true,
      fields: ['name', 'accountId']
    }
  ]
});

const Party = sequelize.define('Party', {
  name: DataTypes.STRING,
  type: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['customer', 'supplier', 'both']]
    }
  },
  gstNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  shippingAddress: DataTypes.STRING,
  shippingCity: DataTypes.STRING,
  shippingState: DataTypes.STRING,
  shippingPostalCode: DataTypes.STRING,
  shippingCountry: DataTypes.STRING,
  billingAddress: DataTypes.STRING,
  billingCity: DataTypes.STRING,
  billingState: DataTypes.STRING,
  billingPostalCode: DataTypes.STRING,
  billingCountry: DataTypes.STRING
  // accountId will be added by foreign key relationship
});

const Address = sequelize.define('Address', {
  label: {
    type: DataTypes.STRING,
    defaultValue: 'Default'
  },
  address: DataTypes.STRING,
  city: DataTypes.STRING,
  state: DataTypes.STRING,
  postalCode: DataTypes.STRING,
  country: DataTypes.STRING,
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
  // partyId will be added by foreign key relationship
});

const Invoice = sequelize.define('Invoice', {
  invoiceNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  date: DataTypes.DATEONLY,
  dueDate: DataTypes.DATEONLY,
  subtotal: DataTypes.DECIMAL,
  totalTax: DataTypes.DECIMAL,
  totalCGST: DataTypes.DECIMAL,
  totalSGST: DataTypes.DECIMAL,
  totalIGST: DataTypes.DECIMAL,
  totalCESS: DataTypes.DECIMAL,
  grandTotal: DataTypes.DECIMAL,
  status: DataTypes.STRING,
  customer: DataTypes.STRING,
  customerDetails: DataTypes.JSON
  // accountId will be added by foreign key relationship
});

const InvoiceItem = sequelize.define('InvoiceItem', {
  productName: DataTypes.STRING,
  quantity: DataTypes.DECIMAL,
  unit: DataTypes.STRING,
  rate: DataTypes.DECIMAL,
  taxRate: DataTypes.DECIMAL,
  cgstRate: DataTypes.DECIMAL,
  cgstAmount: DataTypes.DECIMAL,
  sgstRate: DataTypes.DECIMAL,
  sgstAmount: DataTypes.DECIMAL,
  igstRate: DataTypes.DECIMAL,
  igstAmount: DataTypes.DECIMAL,
  cessRate: DataTypes.DECIMAL,
  cessAmount: DataTypes.DECIMAL,
  discount: DataTypes.DECIMAL,
  taxAmount: DataTypes.DECIMAL,
  amount: DataTypes.DECIMAL,
  // productId, batchId, warehouseId, invoiceId will be added by foreign key relationships
});

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  number: {
    type: DataTypes.STRING,
    unique: true
  },
  date: DataTypes.DATEONLY,
  expectedDeliveryDate: DataTypes.DATEONLY,
  receivedDate: DataTypes.DATEONLY,
  subtotal: DataTypes.DECIMAL(10, 2),
  totalTax: DataTypes.DECIMAL(10, 2),
  grandTotal: DataTypes.DECIMAL(10, 2),
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Draft',
    validate: {
      isIn: [['Draft', 'Sent', 'Received', 'Canceled']]
    }
  },
  notes: DataTypes.TEXT
  // accountId will be added by foreign key relationship
});

const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
  productName: DataTypes.STRING,
  hsn: DataTypes.STRING,
  unit: DataTypes.STRING,
  quantity: DataTypes.DECIMAL,
  receivedQuantity: DataTypes.DECIMAL,
  rate: DataTypes.DECIMAL,
  taxRate: DataTypes.DECIMAL,
  cessRate: DataTypes.DECIMAL,
  taxAmount: DataTypes.DECIMAL,
  amount: DataTypes.DECIMAL,
  // productId, purchaseOrderId will be added by foreign key relationships
});

const Batch = sequelize.define('Batch', {
  batchNumber: DataTypes.STRING,
  mfgDate: DataTypes.DATEONLY,
  expDate: DataTypes.DATEONLY,
  buyingPrice: DataTypes.DECIMAL,
  buyingPriceTax: DataTypes.BOOLEAN,
  sellingPrice: DataTypes.DECIMAL,
  sellingPriceTax: DataTypes.BOOLEAN
});

const BatchLocation = sequelize.define('BatchLocation', {
  quantity: DataTypes.DECIMAL
  // warehouseId will be added automatically by the foreign key relationship
});

const Unit = sequelize.define('Unit', {
  name: DataTypes.STRING,
  abbreviation: DataTypes.STRING
});

const GSTRate = sequelize.define('GSTRate', {
  rate: DataTypes.STRING,
  label: DataTypes.STRING,
  taxability: DataTypes.STRING
});

const CESSRate = sequelize.define('CESSRate', {
  value: DataTypes.STRING,
  label: DataTypes.STRING
});

const Settings = sequelize.define('Settings', {
  key: {
    type: DataTypes.STRING,
    allowNull: false
  },
  value: DataTypes.JSON
  // accountId will be added by foreign key relationship
}, {
  indexes: [
    {
      unique: true,
      fields: ['key', 'accountId']
    }
  ]
});

const StockTransaction = sequelize.define('StockTransaction', {
  type: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['purchase', 'sale', 'adjustment', 'transfer', 'return', 'damage']]
    }
  },
  quantity: DataTypes.DECIMAL,
  quantityBefore: DataTypes.DECIMAL,
  quantityAfter: DataTypes.DECIMAL,
  referenceType: DataTypes.STRING,
  referenceId: DataTypes.INTEGER,
  notes: DataTypes.TEXT,
  // productId, batchId, warehouseId will be added by foreign key relationships
});

const Account = sequelize.define('Account', {
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  legalName: {
    type: DataTypes.STRING,
    unique: true
  },  
  gstNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  panNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  // Contact Information
  email: DataTypes.STRING,
  phone: {
    type: DataTypes.STRING, unique: true, allowNull: false
  },
  
  // Address
  addressLine1: DataTypes.STRING,
  addressLine2: DataTypes.STRING,
  city: DataTypes.STRING,
  state: DataTypes.STRING,
  postalCode: DataTypes.STRING,
  country: DataTypes.STRING,
  
  // Branding
  logo: DataTypes.TEXT,
  
  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
});

const User = sequelize.define('User', {
  phone: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  name: DataTypes.STRING,
  
  // OTP fields
  otpCode: DataTypes.STRING,
  otpExpiry: DataTypes.DATE,
  otpAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: DataTypes.DATE,
  // roleId and accountId will be added by foreign key relationships
});

const Role = sequelize.define('Role', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['admin', 'manager', 'staff', 'viewer']]
    }
  },
  description: DataTypes.STRING
});

const Payment = sequelize.define('Payment', {
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['cash', 'card', 'bank_transfer', 'upi', 'cheque', 'other']]
    }
  },
  referenceNumber: DataTypes.STRING,
  notes: DataTypes.TEXT
  // invoiceId or purchaseOrderId will be added by foreign key relationships
  // accountId will be added by foreign key relationship
});

const PurchaseInvoice = sequelize.define('PurchaseInvoice', {
  invoiceNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  supplierInvoiceNumber: DataTypes.STRING,
  date: DataTypes.DATEONLY,
  dueDate: DataTypes.DATEONLY,
  paymentTerms: DataTypes.STRING,
  subtotal: DataTypes.DECIMAL,
  totalTax: DataTypes.DECIMAL,
  totalCGST: DataTypes.DECIMAL,
  totalSGST: DataTypes.DECIMAL,
  totalIGST: DataTypes.DECIMAL,
  totalCESS: DataTypes.DECIMAL,
  grandTotal: DataTypes.DECIMAL,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'approved', 'paid']]
    }
  },
  supplier: DataTypes.STRING,
  supplierDetails: DataTypes.JSON,
  notes: DataTypes.TEXT
  // supplierId (FK → Party), accountId (FK → Account) will be added by foreign key relationships
});

const PurchaseInvoiceItem = sequelize.define('PurchaseInvoiceItem', {
  productName: DataTypes.STRING,
  quantity: DataTypes.DECIMAL,
  unit: DataTypes.STRING,
  rate: DataTypes.DECIMAL,
  taxRate: DataTypes.DECIMAL,
  cgstRate: DataTypes.DECIMAL,
  cgstAmount: DataTypes.DECIMAL,
  sgstRate: DataTypes.DECIMAL,
  sgstAmount: DataTypes.DECIMAL,
  igstRate: DataTypes.DECIMAL,
  igstAmount: DataTypes.DECIMAL,
  cessRate: DataTypes.DECIMAL,
  cessAmount: DataTypes.DECIMAL,
  batchNumber: DataTypes.STRING,
  mfgDate: DataTypes.DATEONLY,
  expDate: DataTypes.DATEONLY,
  discount: DataTypes.DECIMAL,
  taxAmount: DataTypes.DECIMAL,
  amount: DataTypes.DECIMAL
  // productId, batchId, warehouseId, purchaseInvoiceId will be added by foreign key relationships
});

// Relationships
Product.hasMany(Batch, { foreignKey: 'productId', as: 'batchRecords', onDelete: 'CASCADE' });
Batch.belongsTo(Product, { foreignKey: 'productId', onDelete: 'CASCADE' });

Batch.hasMany(BatchLocation, { foreignKey: 'batchId', as: 'locations', onDelete: 'CASCADE' });
BatchLocation.belongsTo(Batch, { foreignKey: 'batchId', onDelete: 'CASCADE' });

BatchLocation.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouseData', onDelete: 'RESTRICT' });
Warehouse.hasMany(BatchLocation, { foreignKey: 'warehouseId', onDelete: 'RESTRICT' });

// Add foreign key relationships
Product.belongsTo(Brand, { foreignKey: 'brandId', as: 'brandData', onDelete: 'SET NULL' });
Brand.hasMany(Product, { foreignKey: 'brandId', onDelete: 'SET NULL' });

Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'categoryData', onDelete: 'SET NULL' });
Category.hasMany(Product, { foreignKey: 'categoryId', onDelete: 'SET NULL' });

Product.belongsTo(Unit, { foreignKey: 'measuringUnitId', as: 'measuringUnitData', onDelete: 'SET NULL' });
Unit.hasMany(Product, { foreignKey: 'measuringUnitId', as: 'productsWithPrimaryUnit', onDelete: 'SET NULL' });

Product.belongsTo(Unit, { foreignKey: 'altMeasuringUnitId', as: 'altMeasuringUnitData', onDelete: 'SET NULL' });
Unit.hasMany(Product, { foreignKey: 'altMeasuringUnitId', as: 'productsWithAltUnit', onDelete: 'SET NULL' });

Product.belongsTo(GSTRate, { foreignKey: 'gstRateId', as: 'gstRateData', onDelete: 'SET NULL' });
GSTRate.hasMany(Product, { foreignKey: 'gstRateId', onDelete: 'SET NULL' });

Product.belongsTo(CESSRate, { foreignKey: 'cessRateId', as: 'cessRateData', onDelete: 'SET NULL' });
CESSRate.hasMany(Product, { foreignKey: 'cessRateId', onDelete: 'SET NULL' });

Invoice.belongsTo(Party, { foreignKey: 'partyId', as: 'partyData', onDelete: 'RESTRICT' });
Party.hasMany(Invoice, { foreignKey: 'partyId', onDelete: 'RESTRICT' });

Invoice.hasMany(InvoiceItem, { foreignKey: 'invoiceId', as: 'invoiceItems', onDelete: 'CASCADE' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId', onDelete: 'CASCADE' });

InvoiceItem.belongsTo(Product, { foreignKey: 'productId', as: 'productData', onDelete: 'RESTRICT' });
Product.hasMany(InvoiceItem, { foreignKey: 'productId', onDelete: 'RESTRICT' });

InvoiceItem.belongsTo(Batch, { foreignKey: 'batchId', as: 'batchData', onDelete: 'SET NULL' });
Batch.hasMany(InvoiceItem, { foreignKey: 'batchId', onDelete: 'SET NULL' });

InvoiceItem.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouseData', onDelete: 'RESTRICT' });
Warehouse.hasMany(InvoiceItem, { foreignKey: 'warehouseId', onDelete: 'RESTRICT' });

PurchaseOrder.belongsTo(Party, { foreignKey: 'supplierId', as: 'supplierData', onDelete: 'RESTRICT' });
Party.hasMany(PurchaseOrder, { foreignKey: 'supplierId', onDelete: 'RESTRICT' });

PurchaseOrder.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouseData', onDelete: 'RESTRICT' });
Warehouse.hasMany(PurchaseOrder, { foreignKey: 'warehouseId', onDelete: 'RESTRICT' });

PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchaseOrderId', as: 'purchaseOrderItems', onDelete: 'CASCADE' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId', onDelete: 'CASCADE' });

PurchaseOrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'productData', onDelete: 'RESTRICT' });
Product.hasMany(PurchaseOrderItem, { foreignKey: 'productId', onDelete: 'RESTRICT' });

StockTransaction.belongsTo(Product, { foreignKey: 'productId', as: 'productData', onDelete: 'CASCADE' });
Product.hasMany(StockTransaction, { foreignKey: 'productId', onDelete: 'CASCADE' });

StockTransaction.belongsTo(Batch, { foreignKey: 'batchId', as: 'batchData', onDelete: 'CASCADE' });
Batch.hasMany(StockTransaction, { foreignKey: 'batchId', onDelete: 'CASCADE' });

StockTransaction.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouseData', onDelete: 'RESTRICT' });
Warehouse.hasMany(StockTransaction, { foreignKey: 'warehouseId', onDelete: 'RESTRICT' });

// Multi-tenant relationships
Product.belongsTo(Account, { foreignKey: 'accountId', as: 'accountData', onDelete: 'CASCADE' });
Account.hasMany(Product, { foreignKey: 'accountId', onDelete: 'CASCADE' });

Brand.belongsTo(Account, { foreignKey: 'accountId', as: 'accountData', onDelete: 'CASCADE' });
Account.hasMany(Brand, { foreignKey: 'accountId', onDelete: 'CASCADE' });

Category.belongsTo(Account, { foreignKey: 'accountId', as: 'accountData', onDelete: 'CASCADE' });
Account.hasMany(Category, { foreignKey: 'accountId', onDelete: 'CASCADE' });

Warehouse.belongsTo(Account, { foreignKey: 'accountId', as: 'accountData', onDelete: 'CASCADE' });
Account.hasMany(Warehouse, { foreignKey: 'accountId', onDelete: 'CASCADE' });

Party.belongsTo(Account, { foreignKey: 'accountId', as: 'accountData', onDelete: 'CASCADE' });
Account.hasMany(Party, { foreignKey: 'accountId', onDelete: 'CASCADE' });

Party.hasMany(Address, { foreignKey: 'partyId', as: 'addresses', onDelete: 'CASCADE' });
Address.belongsTo(Party, { foreignKey: 'partyId', onDelete: 'CASCADE' });

Invoice.belongsTo(Account, { foreignKey: 'accountId', as: 'accountData', onDelete: 'CASCADE' });
Account.hasMany(Invoice, { foreignKey: 'accountId', onDelete: 'CASCADE' });

PurchaseOrder.belongsTo(Account, { foreignKey: 'accountId', as: 'accountData', onDelete: 'CASCADE' });
Account.hasMany(PurchaseOrder, { foreignKey: 'accountId', onDelete: 'CASCADE' });

Settings.belongsTo(Account, { foreignKey: 'accountId', as: 'accountData', onDelete: 'CASCADE' });
Account.hasMany(Settings, { foreignKey: 'accountId', onDelete: 'CASCADE' });

// User and Role relationships
User.belongsTo(Role, { foreignKey: 'roleId', as: 'roleData', onDelete: 'SET NULL' });
Role.hasMany(User, { foreignKey: 'roleId', onDelete: 'SET NULL' });

User.belongsTo(Account, { foreignKey: 'accountId', as: 'accountData', onDelete: 'CASCADE' });
Account.hasMany(User, { foreignKey: 'accountId', onDelete: 'CASCADE' });

// Payment relationships
Invoice.hasMany(Payment, { foreignKey: 'invoiceId', as: 'payments', onDelete: 'CASCADE' });
Payment.belongsTo(Invoice, { foreignKey: 'invoiceId', onDelete: 'CASCADE' });

PurchaseOrder.hasMany(Payment, { foreignKey: 'purchaseOrderId', as: 'payments', onDelete: 'CASCADE' });
Payment.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId', onDelete: 'CASCADE' });

Payment.belongsTo(Account, { foreignKey: 'accountId', as: 'accountData', onDelete: 'CASCADE' });
Account.hasMany(Payment, { foreignKey: 'accountId', onDelete: 'CASCADE' });

// PurchaseInvoice relationships
PurchaseInvoice.belongsTo(Party, { foreignKey: 'supplierId', as: 'supplierData', onDelete: 'RESTRICT' });
Party.hasMany(PurchaseInvoice, { foreignKey: 'supplierId', onDelete: 'RESTRICT' });

PurchaseInvoice.hasMany(PurchaseInvoiceItem, { foreignKey: 'purchaseInvoiceId', as: 'purchaseInvoiceItems', onDelete: 'CASCADE' });
PurchaseInvoiceItem.belongsTo(PurchaseInvoice, { foreignKey: 'purchaseInvoiceId', onDelete: 'CASCADE' });

PurchaseInvoiceItem.belongsTo(Product, { foreignKey: 'productId', as: 'productData', onDelete: 'RESTRICT' });
Product.hasMany(PurchaseInvoiceItem, { foreignKey: 'productId', onDelete: 'RESTRICT' });

PurchaseInvoiceItem.belongsTo(Batch, { foreignKey: 'batchId', as: 'batchData', onDelete: 'SET NULL' });
Batch.hasMany(PurchaseInvoiceItem, { foreignKey: 'batchId', onDelete: 'SET NULL' });

PurchaseInvoiceItem.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouseData', onDelete: 'RESTRICT' });
Warehouse.hasMany(PurchaseInvoiceItem, { foreignKey: 'warehouseId', onDelete: 'RESTRICT' });

PurchaseInvoice.belongsTo(Account, { foreignKey: 'accountId', as: 'accountData', onDelete: 'CASCADE' });
Account.hasMany(PurchaseInvoice, { foreignKey: 'accountId', onDelete: 'CASCADE' });

PurchaseInvoice.hasMany(Payment, { foreignKey: 'purchaseInvoiceId', as: 'payments', onDelete: 'CASCADE' });
Payment.belongsTo(PurchaseInvoice, { foreignKey: 'purchaseInvoiceId', onDelete: 'CASCADE' });

module.exports = {
  sequelize,
  Product,
  Brand,
  Category,
  Warehouse,
  Party,
  Address,
  Invoice,
  InvoiceItem,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  Batch,
  BatchLocation,
  Unit,
  GSTRate,
  CESSRate,
  Settings,
  StockTransaction,
  Account,
  User,
  Role,
  Payment
};
