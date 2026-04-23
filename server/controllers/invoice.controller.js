const { Invoice, InvoiceItem, Party, Product, Batch, BatchLocation, Warehouse, StockTransaction, Unit, sequelize } = require('../models');
const { Sequelize } = require('sequelize');

// Helper function to recalculate and update product total quantity
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

const updateProductStock = async (items, operation, transaction) => {
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

    // Debug logging
    console.log(`Stock Update - Item: ${item.productId}, Unit: ${item.unit}, Qty: ${itemQty}`);
    if (product.altMeasuringUnitData) {
      console.log(`Alt Unit: ${product.altMeasuringUnitData.name}, Ratio: ${product.conversionRatio}`);
    }

    // Check if the item unit matches the alternate unit and apply conversion
    // Case-insensitive comparison and trim whitespace
    const itemUnit = (item.unit || '').trim().toLowerCase();
    const altUnitName = (product.altMeasuringUnitData?.name || '').trim().toLowerCase();
    
    if (itemUnit && altUnitName && itemUnit === altUnitName) {
      const conversionRatio = parseFloat(product.conversionRatio) || 1;
      console.log(`Applying conversion. Ratio: ${conversionRatio}, Original Qty: ${itemQty}, New Qty: ${itemQty / conversionRatio}`);
      itemQty = itemQty / conversionRatio;
    }
    
    if (product.enableBatching && item.batchId) {
      const batch = await Batch.findByPk(item.batchId, {
        include: [{ model: BatchLocation, as: 'locations' }],
        transaction
      });
      
      if (batch && item.warehouseId) {
        const location = batch.locations.find(loc => loc.warehouseId === item.warehouseId);
        
        if (location) {
          const currentQty = parseFloat(location.quantity) || 0;
          let newQty = operation === 'subtract' ? currentQty - itemQty : currentQty + itemQty;
          
          await location.update({ quantity: Math.max(0, newQty) }, { transaction });
          
          await StockTransaction.create({
            productId: product.id,
            batchId: batch.id,
            warehouseId: item.warehouseId,
            type: operation === 'subtract' ? 'sale' : 'return',
            quantity: operation === 'subtract' ? -itemQty : itemQty,
            quantityBefore: currentQty,
            quantityAfter: Math.max(0, newQty),
            referenceType: 'Invoice',
            referenceId: item.invoiceId,
            notes: `Invoice ${operation === 'subtract' ? 'created' : 'reversed'}`
          }, { transaction });
        }
      }
    }
    
    // Recalculate and update product total quantity
    await updateProductQuantityFromBatches(product.id, transaction);
  }
};

const buildInvoiceItems = async (items, invoiceId, transaction) => {
  return Promise.all(items.map(async (item) => {
    let effectiveRate = parseFloat(item.price) || 0;

    // if (item.batchId && item.productId) {
    //   const batch = await Batch.findOne({
    //     where: {
    //       id: item.batchId,
    //       productId: item.productId
    //     },
    //     transaction
    //   });

    //   if (batch && batch.sellingPrice != null) {
    //     effectiveRate = parseFloat(batch.sellingPrice) || 0;
    //   }
    // }

    return {
      invoiceId,
      productId: item.productId,
      productName: item.product,
      quantity: item.qty,
      unit: item.unit,
      rate: effectiveRate,
      taxRate: item.gstRate,
      cgstRate: item.cgstRate,
      cgstAmount: item.cgstAmount,
      sgstRate: item.sgstRate,
      sgstAmount: item.sgstAmount,
      igstRate: item.igstRate,
      igstAmount: item.igstAmount,
      cessRate: item.cessRate,
      cessAmount: item.cessAmount,
      discount: item.discount,
      amount: item.total,
      taxAmount: (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0) + (item.cessAmount || 0),
      batchId: item.batchId,
      warehouseId: item.warehouseId
    };
  }));
};

exports.getAll = async (req, res) => {
  const { page, size, search, customerId } = req.query;
  const { limit, offset } = getPagination(page, size);
  const where = {};
  
  if (search) where.invoiceNumber = { [Sequelize.Op.like]: `%${search}%` };
  if (customerId) where.customerId = customerId;
  
  try {
    const data = await Invoice.findAndCountAll({ 
      where,
      include: [{ model: Party, as: 'partyData', attributes: ['id', 'name', 'email', 'phone'] }],
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
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
};

exports.getById = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Party, as: 'partyData' },
        { 
          model: InvoiceItem, 
          as: 'invoiceItems',
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
    
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoice' });
  }
};

exports.getNextNumber = async (req, res) => {
  try {
    const accountId = req.user.accountId;
    
    const prefix = await sequelize.models.Settings.findOne({ 
      where: { key: 'invoice_prefix', accountId } 
    });
    const startingNumber = await sequelize.models.Settings.findOne({ 
      where: { key: 'invoice_starting_number', accountId } 
    });
    
    const invoicePrefix = (prefix?.value || '').replace(/-+$/, '');
    const invoiceStartingNumber = parseInt(startingNumber?.value || '1');
    
    console.log(`Getting next invoice number for account ${accountId}, prefix: ${invoicePrefix}, starting: ${invoiceStartingNumber}`);
    
    // Use database query to find the maximum numeric value from invoice numbers
    // Extract the numeric suffix after the last dash and find the MAX
    let result;
    if (invoicePrefix) {
      result = await sequelize.query(
        `SELECT MAX(CAST(SUBSTR(invoiceNumber, LENGTH(:prefix) + 2) AS INTEGER)) as maxNumber
         FROM Invoices 
         WHERE invoiceNumber LIKE :pattern 
         AND accountId = :accountId
         AND SUBSTR(invoiceNumber, LENGTH(:prefix) + 2) NOT LIKE '%-%'
         AND LENGTH(SUBSTR(invoiceNumber, LENGTH(:prefix) + 2)) > 0`,
        {
          replacements: {
            prefix: invoicePrefix,
            pattern: `${invoicePrefix}-%`,
            accountId: accountId
          },
          type: Sequelize.QueryTypes.SELECT
        }
      );
    } else {
      result = await sequelize.query(
        `SELECT MAX(CAST(invoiceNumber AS INTEGER)) as maxNumber
         FROM Invoices 
         WHERE accountId = :accountId
         AND invoiceNumber NOT LIKE '%-%'
         AND LENGTH(invoiceNumber) > 0`,
        {
          replacements: { accountId: accountId },
          type: Sequelize.QueryTypes.SELECT
        }
      );
    }
    
    const maxNumber = result[0]?.maxNumber;
    console.log(`Max invoice number found in database: ${maxNumber}`);
    
    // Calculate next number: use the greater of (maxNumber + 1) or startingNumber
    let nextNumber = invoiceStartingNumber;
    if (maxNumber !== null && !isNaN(maxNumber)) {
      nextNumber = Math.max(maxNumber + 1, invoiceStartingNumber);
    }
    
    const nextInvoiceNumber = invoicePrefix 
      ? `${invoicePrefix}-${nextNumber}` 
      : String(nextNumber);
    
    console.log(`Next invoice number: ${nextInvoiceNumber}`);
    
    res.json({ 
      success: true,
      data: {
        nextInvoiceNumber,
        prefix: invoicePrefix,
        startingNumber: invoiceStartingNumber
      }
    });
  } catch (error) {
    console.error('Error getting next invoice number:', error);
    res.status(500).json({ success: false, error: 'Failed to get next invoice number' });
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
    
    const existing = await Invoice.findOne({ where: { invoiceNumber: invoiceData.invoiceNumber }, transaction });
    if (existing) {
      await transaction.rollback();
      return res.status(409).json({ success: false, code: 'DUPLICATE_INVOICE_NUMBER', message: 'Invoice number already exists' });
    }
    
    const invoice = await Invoice.create(invoiceData, { transaction });
    
    if (items?.length) {
      const invoiceItems = await buildInvoiceItems(items, invoice.id, transaction);
      await sequelize.models.InvoiceItem.bulkCreate(invoiceItems, { transaction });
      await updateProductStock(invoiceItems, 'subtract', transaction);
    }
    
    await transaction.commit();
    
    const created = await Invoice.findByPk(invoice.id, {
      include: [{ model: Party, as: 'partyData' }]
    });
    
    res.status(201).json({ success: true, message: 'Invoice created successfully', data: created });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to create invoice' });
  }
};

exports.update = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { items, ...invoiceData } = req.body;
    
    const invoice = await Invoice.findByPk(id, { transaction });
    if (!invoice) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    
    if (invoiceData.invoiceNumber && invoiceData.invoiceNumber !== invoice.invoiceNumber) {
      const existing = await Invoice.findOne({ 
        where: { invoiceNumber: invoiceData.invoiceNumber, id: { [Sequelize.Op.ne]: id } },
        transaction
      });
      if (existing) {
        await transaction.rollback();
        return res.status(409).json({ success: false, code: 'DUPLICATE_INVOICE_NUMBER', message: 'Invoice number already exists' });
      }
    }
    
    const oldItems = await sequelize.models.InvoiceItem.findAll({ where: { invoiceId: id }, transaction });
    if (oldItems.length) await updateProductStock(oldItems, 'add', transaction);
    
    await invoice.update(invoiceData, { transaction });
    await sequelize.models.InvoiceItem.destroy({ where: { invoiceId: id }, transaction });
    
    if (items?.length) {
      const invoiceItems = await buildInvoiceItems(items, invoice.id, transaction);
      await sequelize.models.InvoiceItem.bulkCreate(invoiceItems, { transaction });
      await updateProductStock(invoiceItems, 'subtract', transaction);
    }
    
    await transaction.commit();
    
    const updated = await Invoice.findByPk(id, {
      include: [
        { model: Party, as: 'partyData' },
        { model: InvoiceItem, as: 'invoiceItems' }
      ]
    });
    
    res.json({ success: true, message: 'Invoice updated successfully', data: updated });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to update invoice' });
  }
};

exports.delete = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const invoice = await Invoice.findByPk(req.params.id, { transaction });
    if (!invoice) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    
    const items = await sequelize.models.InvoiceItem.findAll({ where: { invoiceId: req.params.id }, transaction });
    if (items.length) await updateProductStock(items, 'add', transaction);
    
    await sequelize.models.InvoiceItem.destroy({ where: { invoiceId: req.params.id }, transaction });
    await invoice.destroy({ transaction });
    await transaction.commit();
    
    res.status(204).send();
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to delete invoice' });
  }
};
