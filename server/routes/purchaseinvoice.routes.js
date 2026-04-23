const express = require('express');
const router = express.Router();
const purchaseInvoiceController = require('../controllers/purchaseinvoice.controller');

/**
 * @swagger
 * /api/purchase-invoices/next-number:
 *   get:
 *     tags: [Purchase Invoices]
 *     summary: Get next purchase invoice number
 *     responses:
 *       200:
 *         description: Next purchase invoice number retrieved successfully
 */
router.get('/next-number', purchaseInvoiceController.getNextNumber);

/**
 * @swagger
 * /api/purchase-invoices:
 *   get:
 *     tags: [Purchase Invoices]
 *     summary: Get all purchase invoices
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Purchase invoices retrieved successfully
 */
router.get('/', purchaseInvoiceController.getAll);

/**
 * @swagger
 * /api/purchase-invoices/{id}:
 *   get:
 *     tags: [Purchase Invoices]
 *     summary: Get purchase invoice by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Purchase invoice retrieved successfully
 *       404:
 *         description: Purchase invoice not found
 */
router.get('/:id', purchaseInvoiceController.getById);

/**
 * @swagger
 * /api/purchase-invoices:
 *   post:
 *     tags: [Purchase Invoices]
 *     summary: Create new purchase invoice
 *     description: Creates a purchase invoice and adds stock to inventory
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceNumber
 *               - supplierId
 *             properties:
 *               invoiceNumber:
 *                 type: string
 *               supplierInvoiceNumber:
 *                 type: string
 *               supplierId:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: number
 *                     rate:
 *                       type: number
 *                     warehouseId:
 *                       type: integer
 *                     batchNumber:
 *                       type: string
 *                     mfgDate:
 *                       type: string
 *                       format: date
 *                     expDate:
 *                       type: string
 *                       format: date
 *     responses:
 *       201:
 *         description: Purchase invoice created successfully
 *       400:
 *         description: Invoice number is required
 *       409:
 *         description: Purchase invoice number already exists
 */
router.post('/', purchaseInvoiceController.create);

/**
 * @swagger
 * /api/purchase-invoices/{id}:
 *   put:
 *     tags: [Purchase Invoices]
 *     summary: Update purchase invoice
 *     description: Updates a purchase invoice. Reverses old stock and applies new stock adjustments.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Purchase invoice updated successfully
 *       404:
 *         description: Purchase invoice not found
 *       409:
 *         description: Purchase invoice number already exists
 */
router.put('/:id', purchaseInvoiceController.update);

/**
 * @swagger
 * /api/purchase-invoices/{id}:
 *   delete:
 *     tags: [Purchase Invoices]
 *     summary: Delete purchase invoice
 *     description: Deletes a purchase invoice and reverses stock adjustments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Purchase invoice deleted successfully
 *       404:
 *         description: Purchase invoice not found
 */
router.delete('/:id', purchaseInvoiceController.delete);

module.exports = router;
