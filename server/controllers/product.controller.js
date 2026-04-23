const { Product, Brand, Category, Unit, GSTRate, CESSRate, Batch, BatchLocation, Warehouse, StockTransaction, Account, sequelize } = require('../models');
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
 * Get all products with pagination, search, and filters
 */
exports.getAll = async (req, res) => {
  const { page, size, search, categoryId, brandId } = req.query;
  const { limit, offset } = getPagination(page, size);
  
  const where = {
    accountId: req.user.accountId // Filter by user's account
  };
  
  // Search filter
  if (search) {
    where[Sequelize.Op.or] = [
      { name: { [Sequelize.Op.like]: `%${search}%` } },
      { sku: { [Sequelize.Op.like]: `%${search}%` } },
      { barcode: { [Sequelize.Op.like]: `%${search}%` } },
      { hsn: { [Sequelize.Op.like]: `%${search}%` } }
    ];
  }
  
  // Category filter
  if (categoryId) {
    where.categoryId = categoryId;
  }
  
  // Brand filter
  if (brandId) {
    where.brandId = brandId;
  }
  
  try {
    const data = await Product.findAndCountAll({ 
      where,
      include: [
        { model: Brand, as: 'brandData', attributes: ['id', 'name'] },
        { model: Category, as: 'categoryData', attributes: ['id', 'name'] },
        { model: Unit, as: 'measuringUnitData', attributes: ['id', 'name', 'abbreviation'] },
        { model: Unit, as: 'altMeasuringUnitData', attributes: ['id', 'name', 'abbreviation'] },
        { model: GSTRate, as: 'gstRateData', attributes: ['id', 'rate', 'label'] },
        { model: CESSRate, as: 'cessRateData', attributes: ['id', 'value', 'label'] },
        { 
          model: Batch, 
          as: 'batchRecords',
          include: [
            { 
              model: BatchLocation, 
              as: 'locations',
              include: [
                { model: Warehouse, as: 'warehouseData', attributes: ['id', 'name'] }
              ]
            }
          ]
        }
      ],
      distinct: true,
      col: 'id',
      limit, 
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      totalItems: data.count,
      items: data.rows,
      totalPages: Math.ceil(data.count / limit),
      currentPage: page ? +page : 1
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch products' 
    });
  }
};

/**
 * Get product by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id, {
      include: [
        { model: Brand, as: 'brandData', attributes: ['id', 'name'] },
        { model: Category, as: 'categoryData', attributes: ['id', 'name'] },
        { model: Unit, as: 'measuringUnitData', attributes: ['id', 'name', 'abbreviation'] },
        { model: Unit, as: 'altMeasuringUnitData', attributes: ['id', 'name', 'abbreviation'] },
        { model: GSTRate, as: 'gstRateData', attributes: ['id', 'rate', 'label', 'taxability'] },
        { model: CESSRate, as: 'cessRateData', attributes: ['id', 'value', 'label'] },
        { 
          model: Batch, 
          as: 'batchRecords',
          include: [
            { 
              model: BatchLocation, 
              as: 'locations',
              include: [
                { model: Warehouse, as: 'warehouseData', attributes: ['id', 'name'] }
              ]
            }
          ]
        }
      ]
    });
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch product' 
    });
  }
};

/**
 * Create new product
 */
exports.create = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { batches, warehouses, ...productData } = req.body;
    
    // Validate required fields
    if (!productData.name) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        error: 'Product name is required' 
      });
    }
    
    // Convert empty strings to null for unique fields
    if (!productData.sku || productData.sku.trim() === '') {
      productData.sku = null;
    }
    if (!productData.barcode || productData.barcode.trim() === '') {
      productData.barcode = null;
    }
    
    // Check if SKU is unique (if provided)
    if (productData.sku) {
      const existingSku = await Product.findOne({ 
        where: { sku: productData.sku }
      });
      
      if (existingSku) {
        await transaction.rollback();
        return res.status(409).json({ 
          success: false,
          error: 'Product with this SKU already exists' 
        });
      }
    }
    
    // Check if barcode is unique (if provided)
    if (productData.barcode) {
      const existingBarcode = await Product.findOne({ 
        where: { barcode: productData.barcode }
      });
      
      if (existingBarcode) {
        await transaction.rollback();
        return res.status(409).json({ 
          success: false,
          error: 'Product with this barcode already exists' 
        });
      }
    }
    
    // Auto-create default warehouse if none exists for the account
    let defaultWarehouse = null;
    const accountId = req.user.accountId; // Use authenticated user's account ID
    
    // Set product's accountId from authenticated user
    productData.accountId = accountId;
    productData.enableBatching = true; // Enforce batching for all products
    // Check if account exists
    const account = await Account.findByPk(accountId);
    
    if (account) {
      const warehouseCount = await Warehouse.count({ 
        where: { accountId } 
      });
      
      if (warehouseCount === 0) {
        // Use findOrCreate to handle race conditions
        const [warehouse, created] = await Warehouse.findOrCreate({
          where: { 
            name: 'Default Warehouse',
            accountId: accountId
          },
          defaults: {
            name: 'Default Warehouse',
            location: '',
            contactPerson: '',
            contactNumber: '',
            accountId: accountId
          },
          transaction
        });
        
        defaultWarehouse = warehouse;
        
        if (created) {
          console.log(`Auto-created default warehouse for account ${accountId}`);
        } else {
          console.log(`Using existing Default Warehouse for account ${accountId}`);
        }
      } else {
        // Get the first available warehouse for this account
        defaultWarehouse = await Warehouse.findOne({
          where: { accountId },
          transaction
        });
        console.log(`Using existing warehouse: ${defaultWarehouse?.name} for account ${accountId}`);
      }
    } else {
      console.warn(`Account ${accountId} not found. Skipping default warehouse creation.`);
    }
    
    // Create the product
    const product = await Product.create(productData, { transaction });
    
    // Handle batch and warehouse information
    // Requirement: Each product must have at least one batch and be assigned to at least one warehouse
    // enableBatching is for UI purposes only - all products use batches internally
    
    // Step 1: Determine batches to create
    let batchesToCreate = [];
    if (batches && Array.isArray(batches) && batches.length > 0) {
      // User provided batch information - use it
      batchesToCreate = batches;
    } else {
      // No batch information provided - create default batch
      batchesToCreate = [{
        batchNumber: 'DEFAULT',
        buyingPrice: productData.buyingPrice || 0,
        buyingPriceTax: productData.buyingPriceTax || false,
        sellingPrice: productData.sellingPrice || 0,
        sellingPriceTax: productData.sellingPriceTax || false
      }];
    }
    
    let totalQuantity = 0;
    
    // Step 2: Create each batch with warehouse locations
    for (const batchData of batchesToCreate) {
      const { locations, ...batchInfo } = batchData;
      
      // Create the batch
      const batch = await Batch.create({
        ...batchInfo,
        productId: product.id
      }, { transaction });
      
      // Step 3: Determine warehouse locations for this batch
      let warehouseLocations = [];
      
      if (locations && Array.isArray(locations) && locations.length > 0) {
        // User provided warehouse locations for this batch - use them
        warehouseLocations = locations;
      } else if (warehouses && Array.isArray(warehouses) && warehouses.length > 0) {
        // User provided warehouse list (for simple products) - use it
        warehouseLocations = warehouses;
      } else if (defaultWarehouse) {
        // No warehouse data provided - use default warehouse with zero stock
        warehouseLocations = [{ warehouseId: defaultWarehouse.id, quantity: 0 }];
      }
      
      // Step 4: Create batch locations and stock transactions
      for (const location of warehouseLocations) {
        const qty = location.quantity || 0;
        totalQuantity += qty;
        
        await BatchLocation.create({
          batchId: batch.id,
          warehouseId: location.warehouseId,
          quantity: qty
        }, { transaction });
        
        // Create stock transaction record
        await StockTransaction.create({
          productId: product.id,
          batchId: batch.id,
          warehouseId: location.warehouseId,
          type: 'adjustment',
          quantity: qty,
          quantityBefore: 0,
          quantityAfter: qty,
          notes: 'Initial stock on product creation'
        }, { transaction });
      }
    }
    
    // Update product with total quantity
    await product.update({ quantity: totalQuantity }, { transaction });
    
    await transaction.commit();
    
    // Fetch the created product with relationships
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        { model: Brand, as: 'brandData', attributes: ['id', 'name'] },
        { model: Category, as: 'categoryData', attributes: ['id', 'name'] },
        { model: Unit, as: 'measuringUnitData', attributes: ['id', 'name', 'abbreviation'] },
        { model: Unit, as: 'altMeasuringUnitData', attributes: ['id', 'name', 'abbreviation'] },
        { model: GSTRate, as: 'gstRateData', attributes: ['id', 'rate', 'label'] },
        { model: CESSRate, as: 'cessRateData', attributes: ['id', 'value', 'label'] },
        { 
          model: Batch, 
          as: 'batchRecords',
          include: [
            { 
              model: BatchLocation, 
              as: 'locations',
              include: [
                { model: Warehouse, as: 'warehouseData', attributes: ['id', 'name', 'location'] }
              ]
            }
          ]
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: createdProduct
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating product:', error);
    
    // Handle unique constraint violations
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path;
      let message = 'A product with this value already exists';
      
      if (field === 'sku') {
        message = 'A product with this SKU already exists';
      } else if (field === 'barcode') {
        message = 'A product with this barcode already exists';
      }
      
      return res.status(409).json({ 
        success: false,
        error: message,
        field: field
      });
    }
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        success: false,
        error: error.errors?.[0]?.message || 'Validation failed'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to create product' 
    });
  }
};

/**
 * Update product
 */
exports.update = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { batches, warehouses, ...productData } = req.body;
    
    const product = await Product.findByPk(id);
    
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    
    // Convert empty strings to null for unique fields
    if (productData.sku !== undefined && (!productData.sku || productData.sku.trim() === '')) {
      productData.sku = null;
    }
    if (productData.barcode !== undefined && (!productData.barcode || productData.barcode.trim() === '')) {
      productData.barcode = null;
    }
    
    // Check if SKU is unique (if being updated)
    if (productData.sku && productData.sku !== product.sku) {
      const existingSku = await Product.findOne({ 
        where: { sku: productData.sku }
      });
      
      if (existingSku) {
        await transaction.rollback();
        return res.status(409).json({ 
          success: false,
          error: 'Product with this SKU already exists' 
        });
      }
    }
    
    // Check if barcode is unique (if being updated)
    if (productData.barcode && productData.barcode !== product.barcode) {
      const existingBarcode = await Product.findOne({ 
        where: { barcode: productData.barcode }
      });
      
      if (existingBarcode) {
        await transaction.rollback();
        return res.status(409).json({ 
          success: false,
          error: 'Product with this barcode already exists' 
        });
      }
    }
    
    // Update the product
    await product.update(productData, { transaction });
    
    // Handle batch updates if enableBatching is true
    if (productData.enableBatching && batches && Array.isArray(batches)) {
      // Delete existing batches and their locations
      const existingBatches = await Batch.findAll({
        where: { productId: product.id }
      });
      
      for (const existingBatch of existingBatches) {
        await BatchLocation.destroy({
          where: { batchId: existingBatch.id },
          transaction
        });
        await existingBatch.destroy({ transaction });
      }
      
      let totalQuantity = 0;
      
      // Create new batches
      for (const batchData of batches) {
        const { locations, id: batchId, ...batchInfo } = batchData;
        
        // Create batch
        const batch = await Batch.create({
          ...batchInfo,
          productId: product.id
        }, { transaction });
        
        // Create batch locations (warehouse stock)
        if (locations && Array.isArray(locations)) {
          for (const location of locations) {
            const qty = location.quantity || 0;
            totalQuantity += qty;
            
            await BatchLocation.create({
              batchId: batch.id,
              warehouseId: location.warehouseId,
              quantity: qty
            }, { transaction });
            
            // Create stock transaction record
            await StockTransaction.create({
              productId: product.id,
              batchId: batch.id,
              warehouseId: location.warehouseId,
              type: 'adjustment',
              quantity: qty,
              quantityBefore: 0,
              quantityAfter: qty,
              notes: 'Stock update on product edit'
            }, { transaction });
          }
        }
      }
      
      // Update product with total quantity
      await product.update({ quantity: totalQuantity }, { transaction });
    } else if (!productData.enableBatching && warehouses && Array.isArray(warehouses)) {
      // For non-batched products, handle warehouse updates
      // Delete existing batches and their locations
      const existingBatches = await Batch.findAll({
        where: { productId: product.id }
      });
      
      for (const existingBatch of existingBatches) {
        await BatchLocation.destroy({
          where: { batchId: existingBatch.id },
          transaction
        });
        await existingBatch.destroy({ transaction });
      }
      
      // Create a default batch
      const defaultBatch = await Batch.create({
        batchNumber: 'DEFAULT',
        productId: product.id,
        buyingPrice: productData.buyingPrice,
        buyingPriceTax: productData.buyingPriceTax,
        sellingPrice: productData.sellingPrice,
        sellingPriceTax: productData.sellingPriceTax
      }, { transaction });
      
      let totalQuantity = 0;
      
      // Create warehouse stock entries
      for (const warehouseData of warehouses) {
        const qty = warehouseData.quantity || 0;
        totalQuantity += qty;
        
        await BatchLocation.create({
          batchId: defaultBatch.id,
          warehouseId: warehouseData.warehouseId,
          quantity: qty
        }, { transaction });
        
        // Create stock transaction record
        await StockTransaction.create({
          productId: product.id,
          batchId: defaultBatch.id,
          warehouseId: warehouseData.warehouseId,
          type: 'adjustment',
          quantity: qty,
          quantityBefore: 0,
          quantityAfter: qty,
          notes: 'Stock update on product edit'
        }, { transaction });
      }
      
      // Update product with total quantity
      await product.update({ quantity: totalQuantity }, { transaction });
    }
    
    await transaction.commit();
    
    // Fetch updated product with relationships
    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: Brand, as: 'brandData', attributes: ['id', 'name'] },
        { model: Category, as: 'categoryData', attributes: ['id', 'name'] },
        { model: Unit, as: 'measuringUnitData', attributes: ['id', 'name', 'abbreviation'] },
        { model: Unit, as: 'altMeasuringUnitData', attributes: ['id', 'name', 'abbreviation'] },
        { model: GSTRate, as: 'gstRateData', attributes: ['id', 'rate', 'label', 'taxability'] },
        { model: CESSRate, as: 'cessRateData', attributes: ['id', 'value', 'label'] },
        { 
          model: Batch, 
          as: 'batchRecords',
          include: [
            { 
              model: BatchLocation, 
              as: 'locations',
              include: [
                { model: Warehouse, as: 'warehouseData', attributes: ['id', 'name'] }
              ]
            }
          ]
        }
      ]
    });
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating product:', error);
    
    // Handle unique constraint violations
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path;
      let message = 'A product with this value already exists';
      
      if (field === 'sku') {
        message = 'A product with this SKU already exists';
      } else if (field === 'barcode') {
        message = 'A product with this barcode already exists';
      }
      
      return res.status(409).json({ 
        success: false,
        error: message,
        field: field
      });
    }
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        success: false,
        error: error.errors?.[0]?.message || 'Validation failed'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to update product' 
    });
  }
};

/**
 * Delete product
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    
    await product.destroy();
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    
    // Handle foreign key constraint errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete product because it is referenced in invoices or purchase orders. Please remove those references first.' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete product' 
    });
  }
};

/**
 * Search products
 */
exports.search = async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;
    
    const where = {
      accountId: req.user.accountId
    };
    if (q) {
      where[Sequelize.Op.or] = [
        { name: { [Sequelize.Op.like]: `%${q}%` } },
        { sku: { [Sequelize.Op.like]: `%${q}%` } },
        { barcode: { [Sequelize.Op.like]: `%${q}%` } }
      ];
    }
    
    const products = await Product.findAll({
      where,
      include: [
        { model: Brand, as: 'brandData', attributes: ['id', 'name'] },
        { model: Category, as: 'categoryData', attributes: ['id', 'name'] }
      ],
      limit: parseInt(limit),
      order: [['name', 'ASC']]
    });
    
    res.json({
      success: true,
      items: products,
      totalItems: products.length
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to search products' 
    });
  }
};

/**
 * Get product batches
 */
exports.getBatches = async (req, res) => {
  try {
    const { id } = req.params;
    const { q = '', limit = 10 } = req.query;
    
    const where = { productId: id };
    if (q) {
      where.batchNumber = { [Sequelize.Op.like]: `%${q}%` };
    }
    
    const batches = await Batch.findAll({ 
      where,
      include: [
        { 
          model: BatchLocation, 
          as: 'locations',
          include: [{ model: Warehouse, as: 'warehouseData' }]
        }
      ],
      limit: parseInt(limit),
      order: [['batchNumber', 'ASC']]
    });
    
    res.json({
      success: true,
      items: batches,
      totalItems: batches.length
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch batches' 
    });
  }
};

/**
 * Get all warehouses for the account
 */
exports.getProductWarehouses = async (req, res) => {
  try {
    const { q = '', limit = 100 } = req.query;
    
    const where = { accountId: req.user.accountId };
    
    if (q) {
      where.name = { [Sequelize.Op.like]: `%${q}%` };
    }
    
    const warehouses = await Warehouse.findAll({
      where,
      attributes: ['id', 'name', 'location'],
      limit: parseInt(limit),
      order: [['name', 'ASC']]
    });
    
    res.json({
      success: true,
      items: warehouses,
      totalItems: warehouses.length
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
 * Get stock position for a product
 */
exports.getStockPosition = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }

    const stockPosition = {
      productName: product.name,
      sku: product.sku,
      totalQuantity: 0,
      enableBatching: product.enableBatching || false,
      measuringUnit: product.measuringUnit || '',
      positions: []
    };

    if (product.enableBatching) {
      // Batch mode: Read from Batch and BatchLocation tables
      const batches = await Batch.findAll({
        where: { productId: product.id },
        include: [{ 
          model: BatchLocation, 
          as: 'locations',
          include: [{ model: Warehouse, as: 'warehouseData' }]
        }]
      });
      
      let calculatedTotal = 0;
      
      batches.forEach(batch => {
        if (batch.locations && batch.locations.length > 0) {
          batch.locations.forEach(location => {
            const qty = parseFloat(location.quantity) || 0;
            const warehouseName = location.warehouseData ? location.warehouseData.name : 'Unknown Warehouse';
            
            calculatedTotal += qty;
            
            stockPosition.positions.push({
              batchNumber: batch.batchNumber,
              warehouse: warehouseName,
              quantity: qty,
              mfgDate: batch.mfgDate,
              expDate: batch.expDate,
              buyingPrice: batch.buyingPrice,
              sellingPrice: batch.sellingPrice
            });
          });
        }
      });
      
      stockPosition.totalQuantity = Math.round(calculatedTotal * 1000000) / 1000000;
    } else {
      // Simple mode: Show stock by warehouse only
      let warehouseInventory = product.warehouseInventory || {};
      
      // Handle double-encoded JSON if present
      if (typeof warehouseInventory === 'string') {
        try {
          warehouseInventory = JSON.parse(warehouseInventory);
        } catch (e) {
          console.error('Error parsing warehouseInventory:', e);
          warehouseInventory = {};
        }
      }
      
      let calculatedTotal = 0;
      
      if (warehouseInventory && typeof warehouseInventory === 'object' && !Array.isArray(warehouseInventory)) {
        Object.keys(warehouseInventory).forEach(warehouseName => {
          const qty = parseFloat(warehouseInventory[warehouseName]) || 0;
          
          if (qty > 0) {
            calculatedTotal += qty;
            
            const displayWarehouse = warehouseName && warehouseName.trim() !== '' 
              ? warehouseName 
              : 'Unknown Warehouse';
            
            stockPosition.positions.push({
              batchNumber: null,
              warehouse: displayWarehouse,
              quantity: qty,
              mfgDate: null,
              expDate: null,
              buyingPrice: null,
              sellingPrice: null
            });
          }
        });
      }
      
      stockPosition.totalQuantity = Math.round(calculatedTotal * 1000000) / 1000000;
    }

    res.json({
      success: true,
      data: stockPosition
    });
  } catch (error) {
    console.error('Error fetching stock position:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch stock position' 
    });
  }
};

/**
 * Create a new batch for a product
 */
exports.createBatch = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { 
      batchNumber, 
      mfgDate, 
      expDate, 
      buyingPrice, 
      sellingPrice,
      buyingPriceTax,
      sellingPriceTax,
      warehouseId,
      quantity = 0
    } = req.body;

    // Verify product exists
    const product = await Product.findByPk(id);
    if (!product) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Check if batch number already exists for this product
    const existingBatch = await Batch.findOne({
      where: { productId: id, batchNumber }
    });
    if (existingBatch) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Batch number already exists for this product' });
    }

    // Create the batch
    const batch = await Batch.create({
      productId: id,
      accountId: product.accountId,
      batchNumber,
      mfgDate: mfgDate || null,
      expDate: expDate || null,
      buyingPrice: buyingPrice || product.buyingPrice || 0,
      sellingPrice: sellingPrice || product.sellingPrice || 0,
      buyingPriceTax: buyingPriceTax === true || buyingPriceTax === 'true' || buyingPriceTax === 1,
      sellingPriceTax: sellingPriceTax === true || sellingPriceTax === 'true' || sellingPriceTax === 1,
      quantity: quantity
    }, { transaction: t });

    // If warehouse is specified, create BatchLocation
    if (warehouseId) {
      await BatchLocation.create({
        batchId: batch.id,
        warehouseId: warehouseId,
        quantity: quantity,
        accountId: product.accountId
      }, { transaction: t });
    }

    await t.commit();

    // Fetch the created batch with associations
    const createdBatch = await Batch.findByPk(batch.id, {
      include: [
        { 
          model: BatchLocation, 
          as: 'locations',
          include: [{ model: Warehouse, as: 'warehouseData' }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdBatch
    });
  } catch (error) {
    await t.rollback();
    console.error('Error creating batch:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create batch' 
    });
  }
};
