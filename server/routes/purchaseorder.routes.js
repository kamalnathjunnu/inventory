const express = require('express');
const router = express.Router();
const poController = require('../controllers/purchaseorder.controller');

/**
 * @swagger
 * /api/purchase-orders/next-number:
 *   get:
 *     tags: [Purchase Orders]
 *     summary: Get next PO number
 *     responses:
 *       200:
 *         description: Next PO number retrieved successfully
 */
router.get('/next-number', poController.getNextNumber);

/**
 * @swagger
 * /api/purchase-orders:
 *   get:
 *     tags: [Purchase Orders]
 *     summary: Get all purchase orders
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
 *         description: Purchase orders retrieved successfully
 */
router.get('/', poController.getAll);

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   get:
 *     tags: [Purchase Orders]
 *     summary: Get purchase order by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Purchase order retrieved successfully
 */
router.get('/:id', poController.getById);

/**
 * @swagger
 * /api/purchase-orders:
 *   post:
 *     tags: [Purchase Orders]
 *     summary: Create new purchase order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *               - supplierId
 *             properties:
 *               number:
 *                 type: string
 *               supplierId:
 *                 type: integer
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Purchase order created successfully
 */
router.post('/', poController.create);

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   put:
 *     tags: [Purchase Orders]
 *     summary: Update purchase order
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Purchase order updated successfully
 */
router.put('/:id', poController.update);

/**
 * @swagger
 * /api/purchase-orders/{id}/receive:
 *   post:
 *     tags: [Purchase Orders]
 *     summary: Receive purchase order
 *     description: Mark purchase order as received and update stock
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
 *             properties:
 *               receivedDate:
 *                 type: string
 *                 format: date
 *               receivedItems:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Purchase order received successfully
 */
router.post('/:id/receive', poController.receive);

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   delete:
 *     tags: [Purchase Orders]
 *     summary: Delete purchase order
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Purchase order deleted successfully
 */
router.delete('/:id', poController.delete);

module.exports = router;
