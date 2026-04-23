const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');

/**
 * @swagger
 * /api/brands:
 *   get:
 *     tags: [Brands]
 *     summary: Get all brands
 *     description: Get all brands with pagination and search
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
 *         description: Search by brand name
 *     responses:
 *       200:
 *         description: Brands retrieved successfully
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
router.get('/', brandController.getAll);

/**
 * @swagger
 * /api/brands/{id}:
 *   get:
 *     tags: [Brands]
 *     summary: Get brand by ID
 *     description: Get detailed information about a specific brand
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Brand ID
 *     responses:
 *       200:
 *         description: Brand retrieved successfully
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Server error
 */
router.get('/:id', brandController.getById);

/**
 * @swagger
 * /api/brands:
 *   post:
 *     tags: [Brands]
 *     summary: Create new brand
 *     description: Create a new brand
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
 *                 example: "Nike"
 *               desc:
 *                 type: string
 *                 example: "Sports and lifestyle brand"
 *               accountId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Brand created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Brand name already exists
 *       500:
 *         description: Server error
 */
router.post('/', brandController.create);

/**
 * @swagger
 * /api/brands/{id}:
 *   put:
 *     tags: [Brands]
 *     summary: Update brand
 *     description: Update an existing brand
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Brand ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nike"
 *               desc:
 *                 type: string
 *                 example: "Updated description"
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *       404:
 *         description: Brand not found
 *       409:
 *         description: Brand name already exists
 *       500:
 *         description: Server error
 */
router.put('/:id', brandController.update);

/**
 * @swagger
 * /api/brands/{id}:
 *   delete:
 *     tags: [Brands]
 *     summary: Delete brand
 *     description: Delete a brand
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Brand ID
 *     responses:
 *       204:
 *         description: Brand deleted successfully
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', brandController.delete);

module.exports = router;
