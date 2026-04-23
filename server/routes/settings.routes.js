const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');

/**
 * @swagger
 * /api/settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get all settings
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 */
router.get('/', settingsController.getAll);

/**
 * @swagger
 * /api/settings/invoice:
 *   get:
 *     tags: [Settings]
 *     summary: Get invoice settings
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invoice settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoice_prefix:
 *                   type: string
 *                   example: INV
 *                 invoice_starting_number:
 *                   type: integer
 *                   example: 1
 */
router.get('/invoice', settingsController.getInvoiceSettings);

/**
 * @swagger
 * /api/settings/invoice:
 *   put:
 *     tags: [Settings]
 *     summary: Update invoice settings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoice_prefix:
 *                 type: string
 *                 example: INV
 *               invoice_starting_number:
 *                 type: integer
 *                 example: 1
 *               accountId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Invoice settings updated successfully
 */
router.put('/invoice', settingsController.updateInvoiceSettings);

/**
 * @swagger
 * /api/settings/{key}:
 *   get:
 *     tags: [Settings]
 *     summary: Get setting by key
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Setting retrieved successfully
 */
router.get('/:key', settingsController.getByKey);

/**
 * @swagger
 * /api/settings:
 *   post:
 *     tags: [Settings]
 *     summary: Create or update a setting
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: object
 *               accountId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Setting created successfully
 *       200:
 *         description: Setting updated successfully
 */
router.post('/', settingsController.upsert);

/**
 * @swagger
 * /api/settings/bulk:
 *   put:
 *     tags: [Settings]
 *     summary: Bulk update settings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.put('/bulk', settingsController.bulkUpdate);

/**
 * @swagger
 * /api/settings/{key}:
 *   delete:
 *     tags: [Settings]
 *     summary: Delete setting
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Setting deleted successfully
 */
router.delete('/:key', settingsController.deleteSetting);

module.exports = router;
