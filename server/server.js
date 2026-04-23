const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { authenticate } = require('./middleware/auth');
const authRoutes = require('./routes/auth.routes');
const accountRoutes = require('./routes/account.routes');
const productRoutes = require('./routes/product.routes');
const brandRoutes = require('./routes/brand.routes');
const categoryRoutes = require('./routes/category.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const purchaseOrderRoutes = require('./routes/purchaseorder.routes');
const purchaseInvoiceRoutes = require('./routes/purchaseinvoice.routes');
const stockAdjustmentRoutes = require('./routes/stockadjustment.routes');
const settingsRoutes = require('./routes/settings.routes');
const { seedDefaults } = require('./seed-defaults');
const {
  sequelize,
  Account,
  User,
  Role,
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
  Payment
} = require('./models');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes); // Registration is public

// Protected routes (authentication required)
app.use('/api/products', authenticate, productRoutes);
app.use('/api/brands', authenticate, brandRoutes);
app.use('/api/categories', authenticate, categoryRoutes);
app.use('/api/warehouses', authenticate, warehouseRoutes);
app.use('/api/invoices', authenticate, invoiceRoutes);
app.use('/api/purchase-orders', authenticate, purchaseOrderRoutes);
app.use('/api/purchase-invoices', authenticate, purchaseInvoiceRoutes);
app.use('/api/stock-adjustments', authenticate, stockAdjustmentRoutes);
app.use('/api/settings', authenticate, settingsRoutes);

// Legacy CRUD routes (Units, GST Rates, CESS Rates, Parties)
// Note: These are also protected
const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? (page - 1) * limit : 0;
  return { limit, offset };
};

const createCrudRoutes = (model, pathName, searchFields = ['name', 'desc']) => {
  app.get(`/api/${pathName}`, authenticate, async (req, res) => {
    const { page, size, search } = req.query;
    const { limit, offset } = getPagination(page, size);
    const where = {};
    if (search) {
      where[Sequelize.Op.or] = searchFields.map(field => ({
        [field]: { [Sequelize.Op.like]: `%${search}%` }
      }));
    }
    try {
      const data = await model.findAndCountAll({ where, limit, offset });
      res.json({
        totalItems: data.count,
        items: data.rows,
        totalPages: Math.ceil(data.count / limit),
        currentPage: page ? +page : 1
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get(`/api/${pathName}/:id`, authenticate, async (req, res) => {
    try {
      const item = await model.findByPk(req.params.id);
      if (item) res.json(item);
      else res.status(404).json({ message: 'Not found' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post(`/api/${pathName}`, authenticate, async (req, res) => {
    try {
      const item = await model.create(req.body);
      res.status(201).json(item);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put(`/api/${pathName}/:id`, authenticate, async (req, res) => {
    try {
      const [updated] = await model.update(req.body, { where: { id: req.params.id } });
      if (updated) {
        const updatedItem = await model.findByPk(req.params.id);
        res.json(updatedItem);
      } else {
        res.status(404).json({ message: 'Not found' });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete(`/api/${pathName}/:id`, authenticate, async (req, res) => {
    try {
      const deleted = await model.destroy({ where: { id: req.params.id } });
      if (deleted) res.status(204).send();
      else res.status(404).json({ message: 'Not found' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
};

app.get('/api/parties/search', authenticate, async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;
    const where = {};
    if (q) {
      where[Sequelize.Op.or] = [
        { name: { [Sequelize.Op.like]: `%${q}%` } },
        { email: { [Sequelize.Op.like]: `%${q}%` } },
        { phone: { [Sequelize.Op.like]: `%${q}%` } }
      ];
    }
    const parties = await Party.findAll({
      where,
      limit: parseInt(limit),
      order: [['name', 'ASC']],
      include: [{ model: Address, as: 'addresses' }]
    });
    res.json({
      items: parties,
      totalItems: parties.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Customers search (alias for parties search filtered by type)
app.get('/api/customers/search', async (req, res) => {
  try {
    const { q = '', limit = 10, type = '' } = req.query;
    let typeFilter;
    
    // If type is specified, filter by that type or 'both'
    if (type === 'supplier') {
      typeFilter = {
        [Sequelize.Op.or]: [
          { type: 'supplier' },
          { type: 'both' }
        ]
      };
    } else if (type === 'customer') {
      typeFilter = {
        [Sequelize.Op.or]: [
          { type: 'customer' },
          { type: 'both' }
        ]
      };
    } else {
      // Default: customer or both (backward compatible)
      typeFilter = {
        [Sequelize.Op.or]: [
          { type: 'customer' },
          { type: 'both' }
        ]
      };
    }
    
    const where = { ...typeFilter };
    if (q) {
      where[Sequelize.Op.and] = [
        {
          [Sequelize.Op.or]: [
            { name: { [Sequelize.Op.like]: `%${q}%` } },
            { email: { [Sequelize.Op.like]: `%${q}%` } },
            { phone: { [Sequelize.Op.like]: `%${q}%` } }
          ]
        }
      ];
    }
    const customers = await Party.findAll({
      where,
      limit: parseInt(limit),
      order: [['name', 'ASC']],
      include: [{ model: Address, as: 'addresses' }]
    });
    res.json({
      items: customers,
      totalItems: customers.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

createCrudRoutes(Unit, 'units', ['name', 'abbreviation']);
createCrudRoutes(GSTRate, 'gst-rates', ['label', 'rate']);
createCrudRoutes(CESSRate, 'cess-rates', ['label', 'value']);
createCrudRoutes(Party, 'parties', ['name', 'email', 'phone', 'shippingAddress', 'shippingCity']);

// Party Address routes
app.get('/api/parties/:partyId/addresses', authenticate, async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { partyId: req.params.partyId },
      order: [['isDefault', 'DESC'], ['createdAt', 'ASC']]
    });
    res.json({ items: addresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/parties/:partyId/addresses', authenticate, async (req, res) => {
  try {
    const party = await Party.findByPk(req.params.partyId);
    if (!party) return res.status(404).json({ message: 'Party not found' });

    if (req.body.isDefault) {
      await Address.update({ isDefault: false }, { where: { partyId: req.params.partyId } });
    }

    const existingCount = await Address.count({ where: { partyId: req.params.partyId } });
    const address = await Address.create({
      ...req.body,
      partyId: req.params.partyId,
      isDefault: req.body.isDefault || existingCount === 0
    });
    res.status(201).json(address);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/parties/:partyId/addresses/:addressId', authenticate, async (req, res) => {
  try {
    if (req.body.isDefault) {
      await Address.update({ isDefault: false }, { where: { partyId: req.params.partyId } });
    }
    const [updated] = await Address.update(req.body, {
      where: { id: req.params.addressId, partyId: req.params.partyId }
    });
    if (updated) {
      const address = await Address.findByPk(req.params.addressId);
      res.json(address);
    } else {
      res.status(404).json({ message: 'Address not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/parties/:partyId/addresses/:addressId', authenticate, async (req, res) => {
  try {
    const deleted = await Address.destroy({
      where: { id: req.params.addressId, partyId: req.params.partyId }
    });
    if (deleted) res.status(204).send();
    else res.status(404).json({ message: 'Address not found' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Customer/Party routes (returns all parties - customers, suppliers, and both)
app.get('/api/customers', authenticate, async (req, res) => {
  const { page, size, search, type } = req.query;
  const { limit, offset } = getPagination(page, size);
  const where = {};
  
  // Optional type filter - if provided, filter by specific type(s)
  if (type && type !== 'all') {
    if (type === 'customer') {
      where[Sequelize.Op.or] = [{ type: 'customer' }, { type: 'both' }];
    } else if (type === 'supplier') {
      where[Sequelize.Op.or] = [{ type: 'supplier' }, { type: 'both' }];
    } else {
      where.type = type;
    }
  }
  // No type filter means return all parties
  
  if (search) {
    where[Sequelize.Op.and] = [
      {
        [Sequelize.Op.or]: [
          { name: { [Sequelize.Op.like]: `%${search}%` } },
          { email: { [Sequelize.Op.like]: `%${search}%` } },
          { phone: { [Sequelize.Op.like]: `%${search}%` } }
        ]
      }
    ];
  }
  try {
    const data = await Party.findAndCountAll({ where, limit, offset, include: [{ model: Address, as: 'addresses' }] });
    res.json({
      totalItems: data.count,
      items: data.rows,
      totalPages: Math.ceil(data.count / limit),
      currentPage: page ? +page : 1
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/customers/:id', authenticate, async (req, res) => {
  try {
    const item = await Party.findByPk(req.params.id, { include: [{ model: Address, as: 'addresses' }] });
    if (item) res.json(item);
    else res.status(404).json({ message: 'Not found' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/customers', authenticate, async (req, res) => {
  try {
    const data = { ...req.body, type: req.body.type || 'customer', accountId: req.user.accountId };
    // Treat empty gstNumber as null to avoid unique constraint on blank values
    if (!data.gstNumber || data.gstNumber.trim() === '') {
      data.gstNumber = null;
    }
    const item = await Party.create(data);
    res.status(201).json(item);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors?.[0]?.path || 'field';
      return res.status(400).json({ message: `A customer with this ${field} already exists.` });
    }
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/customers/:id', authenticate, async (req, res) => {
  try {
    const [updated] = await Party.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const updatedItem = await Party.findByPk(req.params.id, { include: [{ model: Address, as: 'addresses' }] });
      res.json(updatedItem);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/customers/:id', authenticate, async (req, res) => {
  try {
    const deleted = await Party.destroy({ where: { id: req.params.id } });
    if (deleted) res.status(204).send();
    else res.status(404).json({ message: 'Not found' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sync DB and Start Server
sequelize.sync().then(async () => {
  console.log('Database synced successfully');
  
  // Seed default data (Units, GST Rates, CESS Rates)
  try {
    await seedDefaults();
  } catch (error) {
    console.error('Warning: Error seeding defaults:', error.message);
  }
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
  });
}).catch(err => {
  console.error('Error syncing database:', err);
});
