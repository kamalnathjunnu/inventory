const { PurchaseInvoice, PurchaseInvoiceItem, Party, Product, Batch, BatchLocation, Warehouse, StockTransaction, Unit, sequelize } = require('../models');
const { Sequelize } = require('sequelize');

// Helper function to recalculate and update product total quantity from all batches
async function updateProductQuantityFromBatches(productId, transaction) {
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

// Add stock when purchase invoice is created
// Subtract stock when purchase invoice is deleted (reverse)
const updateProductStock = async (items, operation, invoiceId, transaction) => {
  for (const item of items) {
    const product = await Product.findByPk(item.productId, { 
      include: [
        { model: Unit, as: 'measuringUnitData' },
        { model: Unit, as: 'altMeasuringUnitData' }
      ],
      transaction 
    });
    if (!product) continue;
    
    let itemQty = parseFloat(item.quantity) || 0;

    // Check if the item unit matches the alternate unit and apply conversion
    const itemUnit = (item.unit || '').trim().toLowerCase();
    const altUnitName = (product.altMeasuringUnitData?.name || '').trim().toLowerCase();
    
    if (itemUnit && altUnitName && itemUnit === altUnitName) {
      const conversionRatio = parseFloat(product.conversionRatio) || 1;
      itemQty = itemQty / conversionRatio;
    }
    
    if (!item.warehouseId) continue;
    
    // For purchase invoices, we need to handle batch creation/update
    if (operation === 'add') {
      // Adding stock - similar to PO receive logic
      let batch = null;
      
      if (item.batchId) {
        // Use existing batch
        batch = await Batch.findByPk(item.batchId, {
          include: [{ model: BatchLocation, as: 'locations' }],
          transaction
        });
      } else if (item.batchNumber) {
        // Find or create batch by batch number
        batch = await Batch.findOne({
          where: { productId: product.id, batchNumber: item.batchNumber },
          include: [{ model: BatchLocation, as: 'locations' }],
          transaction
        });
        
        if (!batch) {
          // Create new batch
          batch = await Batch.create({
            productId: product.id,
            batchNumber: item.batchNumber,
            mfgDate: item.mfgDate,
            expDate: item.expDate,
            buyingPrice: item.rate,
            buyingPriceTax: false,
            sellingPrice: item.sellingPrice || item.rate,
            sellingPriceTax: false
          }, { transaction });
          batch.locations = [];
        }
      } else if (product.enableBatching) {
        // Auto-generate batch number for batched products
        const batchNumber = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        batch = await Batch.create({
          productId: product.id,
          batchNumber: batchNumber,
          mfgDate: item.mfgDate,
          expDate: item.expDate,
          buyingPrice: item.rate,
          buyingPriceTax: false,
          sellingPrice: item.sellingPrice || item.rate,
          sellingPriceTax: false
        }, { transaction });
        batch.locations = [];
      } else {
        // Non-batched product - use default batch
        batch = await Batch.findOne({
          where: { productId: product.id, batchNumber: 'DEFAULT' },
          include: [{ model: BatchLocation, as: 'locations' }],
          transaction
        });
        
        if (!batch) {
          batch = await Batch.create({
            productId: product.id,
            batchNumber: 'DEFAULT',
            buyingPrice: item.rate,
            sellingPrice: item.sellingPrice || item.rate
          }, { transaction });
          batch.locations = [];
        }
      }
      
      // Update or create BatchLocation
      const existingLocation = batch.locations?.find(loc => loc.warehouseId === item.warehouseId);
      
      if (existingLocation) {
        const currentQty = parseFloat(existingLocation.quantity) || 0;
        const newQty = currentQty + itemQty;
        await existingLocation.update({ quantity: newQty }, { transaction });
        
        await StockTransaction.create({
          productId: product.id,
          batchId: batch.id,
          warehouseId: item.warehouseId,
          type: 'purchase',
          quantity: itemQty,
          quantityBefore: currentQty,
          quantityAfter: newQty,
          referenceType: 'PurchaseInvoice',
          referenceId: invoiceId,
          notes: 'Purchase invoice created'
        }, { transaction });
      } else {
        await BatchLocation.create({
          batchId: batch.id,
          warehouseId: item.warehouseId,
          quantity: itemQty
        }, { transaction });
        
        await StockTransaction.create({
          productId: product.id,
          batchId: batch.id,
          warehouseId: item.warehouseId,
          type: 'purchase',
          quantity: itemQty,
          quantityBefore: 0,
          quantityAfter: itemQty,
          referenceType: 'PurchaseInvoice',
          referenceId: invoiceId,
          notes: 'Purchase invoice created'
        }, { transaction });
      }
      
      // Update item with batchId for reference
      if (item.id && !item.batchId) {
        await PurchaseInvoiceItem.update({ batchId: batch.id }, { where: { id: item.id }, transaction });
      }
      
    } else if (operation === 'subtract') {
      // Subtracting stock (reversing a purchase invoice)
      if (item.batchId) {
        const batch = await Batch.findByPk(item.batchId, {
          include: [{ model: BatchLocation, as: 'locations' }],
          transaction
        });
        
        if (batch) {
          const location = batch.locations.find(loc => loc.warehouseId === item.warehouseId);
          
          if (location) {
            const currentQty = parseFloat(location.quantity) || 0;
            const newQty = Math.max(0, currentQty - itemQty);
            
            await location.update({ quantity: newQty }, { transaction });
            
            await StockTransaction.create({
              productId: product.id,
              batchId: batch.id,
              warehouseId: item.warehouseId,
              type: 'return',
              quantity: -itemQty,
              quantityBefore: currentQty,
              quantityAfter: newQty,
              referenceType: 'PurchaseInvoice',
              referenceId: invoiceId,
              notes: 'Purchase invoice reversed/deleted'
            }, { transaction });
          }
        }
      }
    }
    
    // Recalculate and update product total quantity
    await updateProductQuantityFromBatches(product.id, transaction);
  }
};

exports.getAll = async (req, res) => {
  const { page, size, search, supplierId } = req.query;
  const { limit, offset } = getPagination(page, size);
  const where = { accountId: req.user.accountId };
  
  if (search) where.invoiceNumber = { [Sequelize.Op.like]: `%${search}%` };
  if (supplierId) where.supplierId = supplierId;
  
  try {
    const data = await PurchaseInvoice.findAndCountAll({ 
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
    console.error('Error fetching purchase invoices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch purchase invoices' });
  }
};

exports.getById = async (req, res) => {
  try {
    const invoice = await PurchaseInvoice.findByPk(req.params.id, {
      include: [
        { model: Party, as: 'supplierData' },
        { 
          model: PurchaseInvoiceItem, 
          as: 'purchaseInvoiceItems',
          include: [
            { 
              model: Product, 
              as: 'productData',
              include: [
                { model: Unit, as: 'measuringUnitData' },
                { model: Unit, as: 'altMeasuringUnitData' }
              ]
            },
            { model: Batch, as: 'batchData' },
            { model: Warehouse, as: 'warehouseData' }
          ]
        }
      ]
    });
    
    if (!invoice) return res.status(404).json({ success: false, error: 'Purchase invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error fetching purchase invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch purchase invoice' });
  }
};

exports.getNextNumber = async (req, res) => {
  try {
    const accountId = req.user.accountId;
    
    const prefix = await sequelize.models.Settings.findOne({ 
      where: { key: 'purchase_invoice_prefix', accountId } 
    });
    const startingNumber = await sequelize.models.Settings.findOne({ 
      where: { key: 'purchase_invoice_starting_number', accountId } 
    });
    
    const piPrefix = prefix?.value || 'PI';
    const piStartingNumber = parseInt(startingNumber?.value || '1');
    
    const result = await sequelize.query(
      `SELECT MAX(CAST(SUBSTR(invoiceNumber, LENGTH(:prefix) + 2) AS INTEGER)) as maxNumber
       FROM PurchaseInvoices 
       WHERE invoiceNumber LIKE :pattern 
       AND accountId = :accountId
       AND SUBSTR(invoiceNumber, LENGTH(:prefix) + 2) NOT LIKE '%-%'
       AND LENGTH(SUBSTR(invoiceNumber, LENGTH(:prefix) + 2)) > 0`,
      {
        replacements: {
          prefix: piPrefix,
          pattern: `${piPrefix}-%`,
          accountId: accountId
        },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    const maxNumber = result[0]?.maxNumber;
    
    let nextNumber = piStartingNumber;
    if (maxNumber !== null && !isNaN(maxNumber)) {
      nextNumber = Math.max(maxNumber + 1, piStartingNumber);
    }
    
    const nextInvoiceNumber = piPrefix 
      ? `${piPrefix}-${nextNumber}` 
      : String(nextNumber);
    
    res.json({ 
      success: true,
      data: {
        nextInvoiceNumber,
        prefix: piPrefix,
        startingNumber: piStartingNumber
      }
    });
  } catch (error) {
    console.error('Error getting next purchase invoice number:', error);
    res.status(500).json({ success: false, error: 'Failed to get next purchase invoice number' });
  }
};

exports.create = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { items, ...invoiceData } = req.body;
    
    // Set accountId from authenticated user
    invoiceData.accountId = req.user.accountId;
    
    if (!invoiceData.invoiceNumber) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'Invoice number is required' });
    }
    
    const existing = await PurchaseInvoice.findOne({ 
      where: { invoiceNumber: invoiceData.invoiceNumber, accountId: invoiceData.accountId }, 
      transaction 
    });
    if (existing) {
      await transaction.rollback();
      return res.status(409).json({ success: false, error: 'Purchase invoice number already exists' });
    }
    
    const invoice = await PurchaseInvoice.create(invoiceData, { transaction });
    
    if (items?.length) {
      const invoiceItems = items.map(item => ({
        purchaseInvoiceId: invoice.id,
        productId: item.productId,
        productName: item.product || item.productName,
        quantity: item.qty || item.quantity,
        unit: item.unit,
        rate: item.price || item.rate,
        taxRate: item.gstRate || item.taxRate,
        cgstRate: item.cgstRate,
        cgstAmount: item.cgstAmount,
        sgstRate: item.sgstRate,
        sgstAmount: item.sgstAmount,
        igstRate: item.igstRate,
        igstAmount: item.igstAmount,
        cessRate: item.cessRate,
        cessAmount: item.cessAmount,
        batchNumber: item.batchNumber,
        mfgDate: item.mfgDate,
        expDate: item.expDate,
        discount: item.discount,
        amount: item.total || item.amount,
        taxAmount: (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0) + (item.cessAmount || 0),
        batchId: item.batchId,
        warehouseId: item.warehouseId
      }));
      
      const createdItems = await PurchaseInvoiceItem.bulkCreate(invoiceItems, { transaction });
      
      // Add stock for each item
      const itemsWithIds = createdItems.map((createdItem, index) => ({
        ...invoiceItems[index],
        id: createdItem.id
      }));
      await updateProductStock(itemsWithIds, 'add', invoice.id, transaction);
    }
    
    await transaction.commit();
    
    const created = await PurchaseInvoice.findByPk(invoice.id, {
      include: [
        { model: Party, as: 'supplierData' },
        { model: PurchaseInvoiceItem, as: 'purchaseInvoiceItems' }
      ]
    });
    
    res.status(201).json({ success: true, message: 'Purchase invoice created successfully', data: created });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating purchase invoice:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create purchase invoice',
      message: error.message,
      details: error.errors?.map(e => e.message)
    });
  }
};

exports.update = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { items, ...invoiceData } = req.body;
    
    const invoice = await PurchaseInvoice.findByPk(id, { transaction });
    if (!invoice) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Purchase invoice not found' });
    }
    
    if (invoiceData.invoiceNumber && invoiceData.invoiceNumber !== invoice.invoiceNumber) {
      const existing = await PurchaseInvoice.findOne({ 
        where: { 
          invoiceNumber: invoiceData.invoiceNumber, 
          id: { [Sequelize.Op.ne]: id },
          accountId: invoice.accountId
        },
        transaction
      });
      if (existing) {
        await transaction.rollback();
        return res.status(409).json({ success: false, error: 'Purchase invoice number already exists' });
      }
    }
    
    // Reverse old stock (subtract)
    const oldItems = await PurchaseInvoiceItem.findAll({ where: { purchaseInvoiceId: id }, transaction });
    if (oldItems.length) {
      await updateProductStock(oldItems.map(i => i.toJSON()), 'subtract', id, transaction);
    }
    
    await invoice.update(invoiceData, { transaction });
    await PurchaseInvoiceItem.destroy({ where: { purchaseInvoiceId: id }, transaction });
    
    if (items?.length) {
      const invoiceItems = items.map(item => ({
        purchaseInvoiceId: invoice.id,
        productId: item.productId,
        productName: item.product || item.productName,
        quantity: item.qty || item.quantity,
        unit: item.unit,
        rate: item.price || item.rate,
        taxRate: item.gstRate || item.taxRate,
        cgstRate: item.cgstRate,
        cgstAmount: item.cgstAmount,
        sgstRate: item.sgstRate,
        sgstAmount: item.sgstAmount,
        igstRate: item.igstRate,
        igstAmount: item.igstAmount,
        cessRate: item.cessRate,
        cessAmount: item.cessAmount,
        batchNumber: item.batchNumber,
        mfgDate: item.mfgDate,
        expDate: item.expDate,
        discount: item.discount,
        amount: item.total || item.amount,
        taxAmount: (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0) + (item.cessAmount || 0),
        batchId: item.batchId,
        warehouseId: item.warehouseId
      }));
      
      const createdItems = await PurchaseInvoiceItem.bulkCreate(invoiceItems, { transaction });
      
      // Add new stock
      const itemsWithIds = createdItems.map((createdItem, index) => ({
        ...invoiceItems[index],
        id: createdItem.id
      }));
      await updateProductStock(itemsWithIds, 'add', invoice.id, transaction);
    }
    
    await transaction.commit();
    
    const updated = await PurchaseInvoice.findByPk(id, {
      include: [
        { model: Party, as: 'supplierData' },
        { model: PurchaseInvoiceItem, as: 'purchaseInvoiceItems' }
      ]
    });
    
    res.json({ success: true, message: 'Purchase invoice updated successfully', data: updated });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating purchase invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to update purchase invoice' });
  }
};

exports.delete = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const invoice = await PurchaseInvoice.findByPk(req.params.id, { transaction });
    if (!invoice) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Purchase invoice not found' });
    }
    
    // Reverse stock (subtract)
    const items = await PurchaseInvoiceItem.findAll({ where: { purchaseInvoiceId: req.params.id }, transaction });
    if (items.length) {
      await updateProductStock(items.map(i => i.toJSON()), 'subtract', req.params.id, transaction);
    }
    
    await PurchaseInvoiceItem.destroy({ where: { purchaseInvoiceId: req.params.id }, transaction });
    await invoice.destroy({ transaction });
    await transaction.commit();
    
    res.status(204).send();
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting purchase invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to delete purchase invoice' });
  }
};
