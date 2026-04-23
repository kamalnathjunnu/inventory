const { PurchaseOrder, Party, Product, Batch, BatchLocation, Warehouse, StockTransaction, Unit, sequelize } = require('../models');
const { Sequelize } = require('sequelize');

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

const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? (page - 1) * limit : 0;
  return { limit, offset };
};

exports.getAll = async (req, res) => {
  const { page, size, search, supplierId } = req.query;
  const { limit, offset } = getPagination(page, size);
  const where = {};
  
  if (search) where.number = { [Sequelize.Op.like]: `%${search}%` };
  if (supplierId) where.supplierId = supplierId;
  
  try {
    const data = await PurchaseOrder.findAndCountAll({ 
      where,
      include: [{ model: Party, as: 'supplierData', attributes: ['id', 'name', 'email', 'phone'] }],
      limit, offset,
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
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch purchase orders' });
  }
};

exports.getById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [
        { model: Party, as: 'supplierData' },
        { 
          model: sequelize.models.PurchaseOrderItem, 
          as: 'purchaseOrderItems',
          include: [{ 
            model: Product, 
            as: 'productData',
            include: [{ model: Unit, as: 'measuringUnitData' }]
          }]
        }
      ]
    });
    
    if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });
    
    // Transform purchaseOrderItems to items for API consistency
    const result = po.toJSON();
    result.items = result.purchaseOrderItems;
    delete result.purchaseOrderItems;
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch purchase order' });
  }
};

exports.getNextNumber = async (req, res) => {
  try {
    const prefix = await sequelize.models.Settings.findOne({ where: { key: 'po_prefix' } });
    const startingNumber = await sequelize.models.Settings.findOne({ where: { key: 'po_starting_number' } });
    
    const poPrefix = prefix?.value || 'PO';
    const poStartingNumber = parseInt(startingNumber?.value || '1');
    
    const lastPO = await PurchaseOrder.findOne({
      where: { number: { [Sequelize.Op.like]: `${poPrefix}-%` } },
      order: [['id', 'DESC']]
    });
    
    let nextNumber = poStartingNumber;
    if (lastPO?.number) {
      const parts = lastPO.number.split('-');
      const lastNumber = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNumber)) nextNumber = Math.max(lastNumber + 1, poStartingNumber);
    }
    
    res.json({ 
      success: true,
      data: {
        nextPONumber: `${poPrefix}-${String(nextNumber).padStart(4, '0')}`,
        prefix: poPrefix,
        startingNumber: poStartingNumber
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get next PO number' });
  }
};

exports.create = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { items, ...poData } = req.body;
    
    // Set accountId from authenticated user
    poData.accountId = req.user.accountId;
    
    if (!poData.number) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'PO number is required' });
    }
    
    const existing = await PurchaseOrder.findOne({ where: { number: poData.number, accountId: poData.accountId }, transaction });
    if (existing) {
      await transaction.rollback();
      return res.status(409).json({ success: false, error: 'PO number already exists' });
    }
    
    const po = await PurchaseOrder.create(poData, { transaction });
    
    if (items?.length) {
      const poItems = items.map(item => ({ ...item, purchaseOrderId: po.id }));
      await sequelize.models.PurchaseOrderItem.bulkCreate(poItems, { transaction });
    }
    
    await transaction.commit();
    
    const created = await PurchaseOrder.findByPk(po.id, {
      include: [{ model: Party, as: 'supplierData' }]
    });
    
    res.status(201).json({ success: true, message: 'Purchase order created successfully', data: created });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating purchase order:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create purchase order', 
      message: error.message,
      details: error.errors?.map(e => e.message) 
    });
  }
};

exports.update = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { items, ...poData } = req.body;
    
    const po = await PurchaseOrder.findByPk(id, { transaction });
    if (!po) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Purchase order not found' });
    }
    
    if (poData.number && poData.number !== po.number) {
      const existing = await PurchaseOrder.findOne({ 
        where: { number: poData.number, id: { [Sequelize.Op.ne]: id } },
        transaction
      });
      if (existing) {
        await transaction.rollback();
        return res.status(409).json({ success: false, error: 'PO number already exists' });
      }
    }
    
    await po.update(poData, { transaction });
    await sequelize.models.PurchaseOrderItem.destroy({ where: { purchaseOrderId: id }, transaction });
    
    if (items?.length) {
      const poItems = items.map(item => ({ ...item, purchaseOrderId: po.id }));
      await sequelize.models.PurchaseOrderItem.bulkCreate(poItems, { transaction });
    }
    
    await transaction.commit();
    
    const updated = await PurchaseOrder.findByPk(id, {
      include: [{ model: Party, as: 'supplierData' }]
    });
    
    res.json({ success: true, message: 'Purchase order updated successfully', data: updated });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating purchase order:', error);
    res.status(500).json({ success: false, error: 'Failed to update purchase order' });
  }
};

exports.delete = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const po = await PurchaseOrder.findByPk(req.params.id, { transaction });
    if (!po) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Purchase order not found' });
    }
    
    await sequelize.models.PurchaseOrderItem.destroy({ where: { purchaseOrderId: req.params.id }, transaction });
    await po.destroy({ transaction });
    await transaction.commit();
    
    res.status(204).send();
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ success: false, error: 'Failed to delete purchase order' });
  }
};

exports.receive = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const po = await PurchaseOrder.findByPk(req.params.id, { transaction });
    if (!po) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Purchase order not found' });
    }
    
    if (po.status === 'Received') {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'Purchase order already received' });
    }
    
    const { receivedItems, receivedDate } = req.body;
    
    for (const receivedItem of receivedItems) {
      const product = await Product.findByPk(receivedItem.productId, { transaction });
      if (!product) continue;
      
      // Handle both batched array format and flat structure
      const batches = receivedItem.batches || [{
        batchNumber: receivedItem.batchNumber || `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        quantity: receivedItem.quantity,
        warehouseId: receivedItem.warehouseId,
        mfgDate: receivedItem.mfgDate,
        expDate: receivedItem.expiryDate || receivedItem.expDate,
        buyingPrice: receivedItem.buyingPrice,
        buyingPriceTax: receivedItem.buyingPriceTax,
        sellingPrice: receivedItem.sellingPrice,
        sellingPriceTax: receivedItem.sellingPriceTax
      }];
      
      for (const batchData of batches) {
        // Convert warehouse name to ID if needed
        if (batchData.warehouse && !batchData.warehouseId) {
          const warehouse = await Warehouse.findOne({ where: { name: batchData.warehouse }, transaction });
          if (warehouse) {
            batchData.warehouseId = warehouse.id;
          }
        }
        
        if (!batchData.warehouseId) continue;
        
        let existingBatch = await Batch.findOne({
          where: { productId: product.id, batchNumber: batchData.batchNumber },
          include: [{ model: BatchLocation, as: 'locations' }],
          transaction
        });
        
        if (existingBatch) {
          const existingLocation = existingBatch.locations.find(loc => loc.warehouseId === batchData.warehouseId);
          
          if (existingLocation) {
            await existingLocation.update({
              quantity: parseFloat(existingLocation.quantity) + parseFloat(batchData.quantity)
            }, { transaction });
          } else {
            await BatchLocation.create({
              batchId: existingBatch.id,
              warehouseId: batchData.warehouseId,
              quantity: batchData.quantity
            }, { transaction });
          }
          
          if (batchData.buyingPrice !== undefined || batchData.sellingPrice !== undefined || 
              batchData.buyingPriceTax !== undefined || batchData.sellingPriceTax !== undefined) {
            await existingBatch.update({
              buyingPrice: batchData.buyingPrice || existingBatch.buyingPrice,
              buyingPriceTax: batchData.buyingPriceTax !== undefined ? (batchData.buyingPriceTax === true || batchData.buyingPriceTax === 'true' || batchData.buyingPriceTax === 1) : existingBatch.buyingPriceTax,
              sellingPrice: batchData.sellingPrice || existingBatch.sellingPrice,
              sellingPriceTax: batchData.sellingPriceTax !== undefined ? (batchData.sellingPriceTax === true || batchData.sellingPriceTax === 'true' || batchData.sellingPriceTax === 1) : existingBatch.sellingPriceTax
            }, { transaction });
          }
        } else {
          const newBatch = await Batch.create({
            productId: product.id,
            batchNumber: batchData.batchNumber,
            mfgDate: batchData.mfgDate,
            expDate: batchData.expDate,
            buyingPrice: batchData.buyingPrice,
            buyingPriceTax: batchData.buyingPriceTax === true || batchData.buyingPriceTax === 'true' || batchData.buyingPriceTax === 1,
            sellingPrice: batchData.sellingPrice,
            sellingPriceTax: batchData.sellingPriceTax === true || batchData.sellingPriceTax === 'true' || batchData.sellingPriceTax === 1
          }, { transaction });
          
          await BatchLocation.create({
            batchId: newBatch.id,
            warehouseId: batchData.warehouseId,
            quantity: batchData.quantity
          }, { transaction });
          
          // Set existingBatch to newBatch so batchId is available for StockTransaction
          existingBatch = newBatch;
        }
        
        await StockTransaction.create({
          productId: product.id,
          batchId: existingBatch.id,
          warehouseId: batchData.warehouseId,
          type: 'purchase',
          quantity: parseFloat(batchData.quantity),
          quantityBefore: 0,
          quantityAfter: parseFloat(batchData.quantity),
          referenceType: 'PurchaseOrder',
          referenceId: po.id,
          notes: 'Purchase order received'
        }, { transaction });
      }
      
      // Recalculate and update product total quantity
      await updateProductQuantity(product.id, transaction);
    }
    
    await po.update({ 
      status: 'Received', 
      receivedDate: receivedDate || new Date().toISOString().split('T')[0]
    }, { transaction });
    
    await transaction.commit();
    
    const updated = await PurchaseOrder.findByPk(po.id, {
      include: [{ model: Party, as: 'supplierData' }]
    });
    
    res.json({ success: true, message: 'Purchase order received successfully', data: updated });
  } catch (error) {
    await transaction.rollback();
    console.error('Error receiving PO:', error);
    res.status(500).json({ success: false, error: 'Failed to receive purchase order' });
  }
};
