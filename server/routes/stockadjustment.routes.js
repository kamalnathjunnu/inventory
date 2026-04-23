const express = require('express');
const router = express.Router();
const stockAdjustmentController = require('../controllers/stockadjustment.controller');

/**
 * @swagger
 * /api/stock-adjustments:
 *   get:
 *     tags: [Stock Adjustments]
 *     summary: Get all stock adjustments
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
 *         name: productId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Stock adjustments retrieved successfully
 */
router.get('/', stockAdjustmentController.getAll);

/**
 * @swagger
 * /api/stock-adjustments/{id}:
 *   get:
 *     tags: [Stock Adjustments]
 *     summary: Get stock adjustment by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Stock adjustment retrieved successfully
 */
router.get('/:id', stockAdjustmentController.getById);

/**
 * @swagger
 * /api/stock-adjustments:
 *   post:
 *     tags: [Stock Adjustments]
 *     summary: Create stock adjustment
 *     description: Adjust stock quantity for a product in a warehouse
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - warehouseId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: integer
 *               warehouseId:
 *                 type: integer
 *               batchId:
 *                 type: integer
 *                 description: Required for batched products
 *               quantity:
 *                 type: number
 *                 description: Positive for increase, negative for decrease
 *               reason:
 *                 type: string
 *                 description: Reason for adjustment
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Stock adjustment created successfully
 */
router.post('/', stockAdjustmentController.create);

/**
 * @swagger
 * /api/stock-adjustments/stock-position/{productId}:
 *   get:
 *     tags: [Stock Adjustments]
 *     summary: Get current stock position for a product
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Stock position retrieved successfully
 */
router.get('/stock-position/:productId', stockAdjustmentController.getStockPosition);

/**
 * @swagger
 * /api/stock-adjustments/stock-history/{productId}:
 *   get:
 *     tags: [Stock Adjustments]
 *     summary: Get stock transaction history for a product
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: batchId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Stock history retrieved successfully
 */
router.get('/stock-history/:productId', stockAdjustmentController.getStockHistory);

module.exports = router;
