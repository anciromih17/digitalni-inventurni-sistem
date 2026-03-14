const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Inventory item management
 */

/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Create a new item
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - quantity
 *               - available_quantity
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               subcategory:
 *                 type: string
 *               item_type:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               available_quantity:
 *                 type: integer
 *               location:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item created successfully
 *       400:
 *         description: Invalid input
 */
router.post("/", itemController.createItem);

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: Get all items
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: List of items
 */
router.get("/", itemController.getAllItems);

/**
 * @swagger
 * /api/items/search:
 *   get:
 *     summary: Search items by category, status, location
 *     tags: [Items]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filtered list of items
 */
router.get("/search", itemController.searchItems);

/**
 * @swagger
 * /api/items/{id}/availability:
 *   get:
 *     summary: Get availability information for an item
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item availability
 *       404:
 *         description: Item not found
 */
router.get("/:id/availability", itemController.getAvailability);

/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: Get an item by ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item details
 *       404:
 *         description: Item not found
 */
router.get("/:id", itemController.getItemById);

/**
 * @swagger
 * /api/items/{id}:
 *   put:
 *     summary: Update an item by ID
 *     tags: [Items]
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
 *             required:
 *               - name
 *               - quantity
 *               - available_quantity
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               subcategory:
 *                 type: string
 *               item_type:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               available_quantity:
 *                 type: integer
 *               location:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Item not found
 */
router.put("/:id", itemController.updateItem);

/**
 * @swagger
 * /api/items/{id}:
 *   delete:
 *     summary: Delete an item by ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Item deleted
 *       404:
 *         description: Item not found
 */
router.delete("/:id", itemController.deleteItem);

module.exports = router;