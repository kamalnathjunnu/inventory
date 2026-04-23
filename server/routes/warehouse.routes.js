const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');

/**
 * @swagger
 * /api/warehouses:
 *   get:
 *     tags: [Warehouses]
 *     summary: Get all warehouses
 *     description: Get all warehouses with pagination and search
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
 *         description: Search by name, location, contact person or contact number
 *     responses:
 *       200:
 *         description: Warehouses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
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
router.get('/', warehouseController.getAll);

/**
 * @swagger
 * /api/warehouses/{id}:
 *   get:
 *     tags: [Warehouses]
 *     summary: Get warehouse by ID
 *     description: Get detailed information about a specific warehouse
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse retrieved successfully
 *       404:
 *         description: Warehouse not found
 *       500:
 *         description: Server error
 */
router.get('/:id', warehouseController.getById);

/**
 * @swagger
 * /api/warehouses:
 *   post:
 *     tags: [Warehouses]
 *     summary: Create new warehouse
 *     description: Create a new warehouse
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
 *                 example: "Main Warehouse"
 *               location:
 *                 type: string
 *                 example: "123 Industrial Park, Mumbai"
 *               contactPerson:
 *                 type: string
 *                 example: "John Doe"
 *               contactNumber:
 *                 type: string
 *                 example: "+919876543210"
 *               accountId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Warehouse created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Warehouse name already exists
 *       500:
 *         description: Server error
 */
router.post('/', warehouseController.create);

/**
 * @swagger
 * /api/warehouses/{id}:
 *   put:
 *     tags: [Warehouses]
 *     summary: Update warehouse
 *     description: Update an existing warehouse
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Warehouse ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Main Warehouse"
 *               location:
 *                 type: string
 *                 example: "123 Industrial Park, Mumbai"
 *               contactPerson:
 *                 type: string
 *                 example: "John Doe"
 *               contactNumber:
 *                 type: string
 *                 example: "+919876543210"
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 *       404:
 *         description: Warehouse not found
 *       409:
 *         description: Warehouse name already exists
 *       500:
 *         description: Server error
 */
router.put('/:id', warehouseController.update);

/**
 * @swagger
 * /api/warehouses/{id}:
 *   delete:
 *     tags: [Warehouses]
 *     summary: Delete warehouse
 *     description: Delete a warehouse
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Warehouse ID
 *     responses:
 *       204:
 *         description: Warehouse deleted successfully
 *       404:
 *         description: Warehouse not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', warehouseController.delete);

module.exports = router;
