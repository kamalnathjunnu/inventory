const { Warehouse, BatchLocation, InvoiceItem, PurchaseOrder, StockTransaction, PurchaseInvoiceItem } = require('../models');
const { Sequelize } = require('sequelize');

/**
 * Get pagination parameters
 */
const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? (page - 1) * limit : 0;
  return { limit, offset };
};

/**
 * Get all warehouses with pagination and search
 */
exports.getAll = async (req, res) => {
  const { page, size, search } = req.query;
  const { limit, offset } = getPagination(page, size);
  
  const where = {
    accountId: req.user.accountId
  };
  
  // Search filter
  if (search) {
    where[Sequelize.Op.or] = [
      { name: { [Sequelize.Op.like]: `%${search}%` } },
      { location: { [Sequelize.Op.like]: `%${search}%` } },
      { contactPerson: { [Sequelize.Op.like]: `%${search}%` } },
      { contactNumber: { [Sequelize.Op.like]: `%${search}%` } }
    ];
  }
  
  try {
    const data = await Warehouse.findAndCountAll({ 
      where,
      limit, 
      offset,
      order: [['name', 'ASC']]
    });
    
    res.json({
      success: true,
      totalItems: data.count,
      items: data.rows,
      totalPages: Math.ceil(data.count / limit),
      currentPage: page ? +page : 1
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch warehouses' 
    });
  }
};

/**
 * Get warehouse by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const warehouse = await Warehouse.findByPk(id);
    
    if (!warehouse) {
      return res.status(404).json({ 
        success: false,
        error: 'Warehouse not found' 
      });
    }
    
    res.json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch warehouse' 
    });
  }
};

/**
 * Create new warehouse
 */
exports.create = async (req, res) => {
  try {
    const warehouseData = req.body;
    
    // Set accountId from authenticated user
    warehouseData.accountId = req.user.accountId;
    
    // Validate required fields
    if (!warehouseData.name) {
      return res.status(400).json({ 
        success: false,
        error: 'Warehouse name is required' 
      });
    }
    
    // Check if warehouse name is unique within account
    const existingWarehouse = await Warehouse.findOne({ 
      where: { 
        name: warehouseData.name,
        accountId: warehouseData.accountId
      }
    });
    
    if (existingWarehouse) {
      return res.status(409).json({ 
        success: false,
        error: 'Warehouse with this name already exists in your account' 
      });
    }
    
    const warehouse = await Warehouse.create(warehouseData);
    
    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: warehouse
    });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create warehouse' 
    });
  }
};

/**
 * Update warehouse
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouseData = req.body;
    
    const warehouse = await Warehouse.findByPk(id);
    
    if (!warehouse) {
      return res.status(404).json({ 
        success: false,
        error: 'Warehouse not found' 
      });
    }
    
    // Check if warehouse name is unique (if being updated)
    if (warehouseData.name && warehouseData.name !== warehouse.name) {
      const existingWarehouse = await Warehouse.findOne({ 
        where: { 
          name: warehouseData.name,
          accountId: warehouse.accountId
        }
      });
      
      if (existingWarehouse) {
        return res.status(409).json({ 
          success: false,
          error: 'Warehouse with this name already exists in your account' 
        });
      }
    }
    
    await warehouse.update(warehouseData);
    
    res.json({
      success: true,
      message: 'Warehouse updated successfully',
      data: warehouse
    });
  } catch (error) {
    console.error('Error updating warehouse:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update warehouse' 
    });
  }
};

/**
 * Delete warehouse
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    const warehouse = await Warehouse.findOne({
      where: {
        id,
        accountId: req.user.accountId
      }
    });
    
    if (!warehouse) {
      return res.status(404).json({ 
        success: false,
        error: 'Warehouse not found' 
      });
    }

    const [batchLocationCount, invoiceItemCount, purchaseOrderCount, stockTransactionCount, purchaseInvoiceItemCount] = await Promise.all([
      BatchLocation.count({ where: { warehouseId: id } }),
      InvoiceItem.count({ where: { warehouseId: id } }),
      PurchaseOrder.count({ where: { warehouseId: id } }),
      StockTransaction.count({ where: { warehouseId: id } }),
      PurchaseInvoiceItem.count({ where: { warehouseId: id } })
    ]);

    const blockers = [];
    if (batchLocationCount > 0) blockers.push('batch locations');
    if (invoiceItemCount > 0) blockers.push('invoice items');
    if (purchaseOrderCount > 0) blockers.push('purchase orders');
    if (stockTransactionCount > 0) blockers.push('stock transactions');
    if (purchaseInvoiceItemCount > 0) blockers.push('purchase invoice items');

    if (blockers.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete warehouse because it is referenced in ${blockers.join(', ')}. Remove those references first.`
      });
    }
    
    await warehouse.destroy();
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting warehouse:', error);

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete warehouse because it is referenced by other records. Remove those references first.'
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to delete warehouse' 
    });
  }
};
