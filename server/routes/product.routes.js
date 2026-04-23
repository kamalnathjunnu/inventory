const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     tags: [Products]
 *     summary: Search products
 *     description: Search products by name, SKU, or barcode
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalItems:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/search', productController.search);

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products
 *     description: Get all products with pagination, search, and filters
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, SKU, barcode, or HSN
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: integer
 *         description: Filter by brand ID
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalItems:
 *                   type: integer
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/', productController.getAll);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID
 *     description: Get detailed information about a specific product including batches
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get('/:id', productController.getById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create new product
 *     description: Create a new product in the inventory with batch and warehouse information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Premium Widget"
 *               sku:
 *                 type: string
 *                 example: "WDG-001"
 *               barcode:
 *                 type: string
 *                 example: "1234567890123"
 *               hsn:
 *                 type: string
 *                 example: "84669900"
 *               description:
 *                 type: string
 *                 example: "High quality premium widget"
 *               enableBatching:
 *                 type: boolean
 *                 example: true
 *                 description: Enable batch tracking for this product
 *               minStockLevel:
 *                 type: integer
 *                 example: 10
 *               conversionRatio:
 *                 type: number
 *                 example: 1
 *               buyingPrice:
 *                 type: number
 *                 example: 100.50
 *               buyingPriceTax:
 *                 type: boolean
 *                 example: false
 *               sellingPrice:
 *                 type: number
 *                 example: 150.00
 *               sellingPriceTax:
 *                 type: boolean
 *                 example: true
 *               brandId:
 *                 type: integer
 *                 example: 1
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *               measuringUnitId:
 *                 type: integer
 *                 example: 1
 *               altMeasuringUnitId:
 *                 type: integer
 *                 example: 2
 *               gstRateId:
 *                 type: integer
 *                 example: 1
 *               cessRateId:
 *                 type: integer
 *                 example: 1
 *               accountId:
 *                 type: integer
 *                 example: 1
 *               batches:
 *                 type: array
 *                 description: Batch information (required if enableBatching is true)
 *                 items:
 *                   type: object
 *                   properties:
 *                     batchNumber:
 *                       type: string
 *                       example: "BATCH-2025-001"
 *                     mfgDate:
 *                       type: string
 *                       format: date
 *                       example: "2025-01-01"
 *                     expDate:
 *                       type: string
 *                       format: date
 *                       example: "2026-12-31"
 *                     buyingPrice:
 *                       type: number
 *                       example: 100.50
 *                     sellingPrice:
 *                       type: number
 *                       example: 150.00
 *                     locations:
 *                       type: array
 *                       description: Warehouse locations for this batch
 *                       items:
 *                         type: object
 *                         properties:
 *                           warehouseId:
 *                             type: integer
 *                             example: 1
 *                           quantity:
 *                             type: number
 *                             example: 100
 *               warehouses:
 *                 type: array
 *                 description: Warehouse stock information (for non-batched products)
 *                 items:
 *                   type: object
 *                   properties:
 *                     warehouseId:
 *                       type: integer
 *                       example: 1
 *                     quantity:
 *                       type: number
 *                       example: 50
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *       409:
 *         description: SKU or barcode already exists
 *       500:
 *         description: Server error
 */
router.post('/', productController.create);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update product
 *     description: Update an existing product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *               barcode:
 *                 type: string
 *               hsn:
 *                 type: string
 *               description:
 *                 type: string
 *               enableBatching:
 *                 type: boolean
 *               minStockLevel:
 *                 type: integer
 *               conversionRatio:
 *                 type: number
 *               buyingPrice:
 *                 type: number
 *               buyingPriceTax:
 *                 type: boolean
 *               sellingPrice:
 *                 type: number
 *               sellingPriceTax:
 *                 type: boolean
 *               brandId:
 *                 type: integer
 *               categoryId:
 *                 type: integer
 *               measuringUnitId:
 *                 type: integer
 *               altMeasuringUnitId:
 *                 type: integer
 *               gstRateId:
 *                 type: integer
 *               cessRateId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       404:
 *         description: Product not found
 *       409:
 *         description: SKU or barcode already exists
 *       500:
 *         description: Server error
 */
router.put('/:id', productController.update);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete product
 *     description: Delete a product from the inventory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', productController.delete);

/**
 * @swagger
 * /api/products/{id}/batches:
 *   get:
 *     tags: [Products]
 *     summary: Get product batches
 *     description: Get all batches for a specific product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Batches retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get('/:id/batches', productController.getBatches);

/**
 * @swagger
 * /api/products/{id}/batches:
 *   post:
 *     tags: [Products]
 *     summary: Create a new batch for a product
 *     description: Create a new batch with optional warehouse assignment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - batchNumber
 *             properties:
 *               batchNumber:
 *                 type: string
 *               mfgDate:
 *                 type: string
 *                 format: date
 *               expDate:
 *                 type: string
 *                 format: date
 *               buyingPrice:
 *                 type: number
 *               sellingPrice:
 *                 type: number
 *               warehouseId:
 *                 type: integer
 *               quantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Batch created successfully
 *       400:
 *         description: Batch number already exists
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.post('/:id/batches', productController.createBatch);

/**
 * @swagger
 * /api/products/{id}/warehouses:
 *   get:
 *     tags: [Products]
 *     summary: Get warehouses for a product
 *     description: Get all warehouses that have stock for this product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Warehouses retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/:id/warehouses', productController.getProductWarehouses);

/**
 * @swagger
 * /api/products/{id}/stock-position:
 *   get:
 *     tags: [Products]
 *     summary: Get product stock position
 *     description: Get stock position by batch and warehouse for a product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Stock position retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     productName:
 *                       type: string
 *                     sku:
 *                       type: string
 *                     totalQuantity:
 *                       type: number
 *                     enableBatching:
 *                       type: boolean
 *                     measuringUnit:
 *                       type: string
 *                     positions:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get('/:id/stock-position', productController.getStockPosition);

module.exports = router;
