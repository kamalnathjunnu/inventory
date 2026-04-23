const { Product, Batch, BatchLocation, Warehouse, StockTransaction, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper function to recalculate and update product total quantity
async function updateProductQuantity(productId, transaction) {
  const batchLocations = await BatchLocation.findAll({
    include: [{
      model: Batch,
      where: { productId },
      required: true
    }],
    transaction
  });
  
  const totalQuantity = batchLocations.reduce((sum, bl) => sum + parseFloat(bl.quantity || 0), 0);
  
  await Product.update(
    { quantity: totalQuantity },
    { where: { id: productId }, transaction }
  );
  
  return totalQuantity;
}

// Get all stock adjustments
const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const search = req.query.search || '';
    const productId = req.query.productId;
    const warehouseId = req.query.warehouseId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const offset = (page - 1) * size;

    const where = {
      type: 'adjustment'
    };

    if (productId) {
      where.productId = productId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const { count, rows } = await StockTransaction.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'productData',
          attributes: ['id', 'name', 'sku'],
          where: search ? {
            [Op.or]: [
              { name: { [Op.like]: `%${search}%` } },
              { sku: { [Op.like]: `%${search}%` } }
            ]
          } : undefined
        },
        {
          model: Batch,
          as: 'batchData',
          attributes: ['id', 'batchNumber', 'expiryDate']
        },
        {
          model: Warehouse,
          as: 'warehouseData',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: size,
      offset
    });

    res.json({
      items: rows,
      total: count,
      page,
      size,
      totalPages: Math.ceil(count / size)
    });
  } catch (error) {
    console.error('Error fetching stock adjustments:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get stock adjustment by ID
const getById = async (req, res) => {
  try {
    const adjustment = await StockTransaction.findOne({
      where: {
        id: req.params.id,
        type: 'adjustment'
      },
      include: [
        {
          model: Product,
          as: 'productData'
        },
        {
          model: Batch,
          as: 'batchData'
        },
        {
          model: Warehouse,
          as: 'warehouseData'
        }
      ]
    });

    if (!adjustment) {
      return res.status(404).json({ error: 'Stock adjustment not found' });
    }

    res.json(adjustment);
  } catch (error) {
    console.error('Error fetching stock adjustment:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create stock adjustment
const create = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { productId, warehouseId, batchId, quantity, reason, notes, newBatch } = req.body;

    if (!productId || !warehouseId || quantity === undefined) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Product, warehouse, and quantity are required' });
    }

    // Validate product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    // Validate warehouse exists
    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Batch is required (or newBatch data must be provided)
    // enableBatching is for UI purposes only - all products use batches internally
    if (!batchId && !newBatch) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Batch is required' });
    }

    let actualBatchId = batchId;
    
    // Create new batch if newBatch data is provided
    if (newBatch) {
      const createdBatch = await Batch.create({
        productId,
        batchNumber: newBatch.batchNumber || `BATCH-${Date.now()}`,
        mfgDate: newBatch.mfgDate || null,
        expDate: newBatch.expDate || null,
        buyingPrice: newBatch.buyingPrice ? parseFloat(newBatch.buyingPrice) : null,
        sellingPrice: newBatch.sellingPrice ? parseFloat(newBatch.sellingPrice) : null,
        buyingPriceTax: false,
        sellingPriceTax: false
      }, { transaction });
      
      actualBatchId = createdBatch.id;
    }

    let batchLocation = null;
    let quantityBefore = 0;

    if (product.enableBatching) {
      // Validate batch exists (if not newly created)
      if (!newBatch) {
        const batch = await Batch.findByPk(actualBatchId);
        if (!batch) {
          await transaction.rollback();
          return res.status(404).json({ error: 'Batch not found' });
        }
      }

      // Find or create batch location
      batchLocation = await BatchLocation.findOne({
        where: { batchId: actualBatchId, warehouseId }
      });

      if (!batchLocation) {
        batchLocation = await BatchLocation.create({
          batchId: actualBatchId,
          warehouseId,
          quantity: 0
        }, { transaction });
      }

      quantityBefore = parseFloat(batchLocation.quantity) || 0;
      const quantityAfter = quantityBefore + parseFloat(quantity);

      // Update batch location quantity
      await batchLocation.update({
        quantity: quantityAfter
      }, { transaction });

      // Create stock transaction record
      const adjustment = await StockTransaction.create({
        type: 'adjustment',
        productId,
        batchId: actualBatchId,
        warehouseId,
        quantity: parseFloat(quantity),
        quantityBefore,
        quantityAfter,
        referenceType: reason || 'manual_adjustment',
        notes
      }, { transaction });

      // Recalculate and update product total quantity
      await updateProductQuantity(productId, transaction);

      await transaction.commit();

      // Fetch complete adjustment data
      const result = await StockTransaction.findByPk(adjustment.id, {
        include: [
          { model: Product, as: 'productData' },
          { model: Batch, as: 'batchData' },
          { model: Warehouse, as: 'warehouseData' }
        ]
      });

      res.status(201).json(result);
    } else {
      // Non-batched product - find or create batch location with null batchId
      batchLocation = await BatchLocation.findOne({
        where: { 
          batchId: null,
          warehouseId,
          productId
        }
      });

      if (!batchLocation) {
        batchLocation = await BatchLocation.create({
          batchId: null,
          warehouseId,
          productId,
          quantity: 0
        }, { transaction });
      }

      quantityBefore = parseFloat(batchLocation.quantity) || 0;
      const quantityAfter = quantityBefore + parseFloat(quantity);

      // Update batch location quantity
      await batchLocation.update({
        quantity: quantityAfter
      }, { transaction });

      // Create stock transaction record
      const adjustment = await StockTransaction.create({
        type: 'adjustment',
        productId,
        batchId: null,
        warehouseId,
        quantity: parseFloat(quantity),
        quantityBefore,
        quantityAfter,
        referenceType: reason || 'manual_adjustment',
        notes
      }, { transaction });

      // Recalculate and update product total quantity
      await updateProductQuantity(productId, transaction);

      await transaction.commit();

      // Fetch complete adjustment data
      const result = await StockTransaction.findByPk(adjustment.id, {
        include: [
          { model: Product, as: 'productData' },
          { model: Warehouse, as: 'warehouseData' }
        ]
      });

      res.status(201).json(result);
    }
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating stock adjustment:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get current stock position for a product
const getStockPosition = async (req, res) => {
  try {
    const { productId } = req.params;
    const warehouseId = req.query.warehouseId;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const where = {};
    if (product.enableBatching) {
      where.batchId = { [Op.ne]: null };
    } else {
      where.batchId = null;
      where.productId = productId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const batchLocations = await BatchLocation.findAll({
      where,
      include: [
        {
          model: Batch,
          as: 'batch',
          where: product.enableBatching ? { productId } : undefined,
          required: product.enableBatching,
          attributes: ['id', 'batchNumber', 'expiryDate', 'mrp']
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name']
        }
      ],
      order: [[{ model: Batch, as: 'batch' }, 'expiryDate', 'ASC']]
    });

    const stockPosition = batchLocations.map(bl => ({
      warehouseId: bl.warehouseId,
      warehouseName: bl.warehouse?.name,
      batchId: bl.batchId,
      batchNumber: bl.batch?.batchNumber,
      expiryDate: bl.batch?.expiryDate,
      mrp: bl.batch?.mrp,
      quantity: bl.quantity
    }));

    const totalQuantity = batchLocations.reduce((sum, bl) => sum + parseFloat(bl.quantity || 0), 0);

    res.json({
      productId,
      productName: product.name,
      totalQuantity,
      stockPosition
    });
  } catch (error) {
    console.error('Error fetching stock position:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get stock history for a product
const getStockHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 20;
    const warehouseId = req.query.warehouseId;
    const batchId = req.query.batchId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const offset = (page - 1) * size;

    const where = { productId };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (batchId) {
      where.batchId = batchId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const { count, rows } = await StockTransaction.findAndCountAll({
      where,
      include: [
        {
          model: Batch,
          as: 'batchData',
          attributes: ['id', 'batchNumber']
        },
        {
          model: Warehouse,
          as: 'warehouseData',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: size,
      offset
    });

    res.json({
      items: rows,
      total: count,
      page,
      size,
      totalPages: Math.ceil(count / size)
    });
  } catch (error) {
    console.error('Error fetching stock history:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  getStockPosition,
  getStockHistory
};
