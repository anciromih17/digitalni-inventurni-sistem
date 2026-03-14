const itemService = require("../services/itemService");

async function createItem(req, res) {
    try {
        console.log("[CREATE ITEM] Request received:", req.body.name);

        const item = await itemService.createItem(req.body);

        console.log("[CREATE ITEM] Item created with ID:", item.id);

        return res.status(201).json(item);
    } catch (error) {
        console.error("[CREATE ITEM ERROR]", error.message);

        return res.status(400).json({ error: error.message });
    }
}

async function getAllItems(req, res) {
    try {
        console.log("[GET ALL ITEMS] Request received");

        const items = await itemService.getAllItems();

        console.log("[GET ALL ITEMS] Returned items:", items.length);

        return res.status(200).json(items);
    } catch (error) {
        console.error("[GET ALL ITEMS ERROR]", error.message);

        return res.status(500).json({ error: error.message });
    }
}

async function getItemById(req, res) {
    try {
        console.log("[GET ITEM BY ID] Request received for ID:", req.params.id);

        const item = await itemService.getItemById(req.params.id);

        console.log("[GET ITEM BY ID] Item found:", item.id);

        return res.status(200).json(item);
    } catch (error) {
        console.error("[GET ITEM BY ID ERROR]", error.message);

        return res.status(404).json({ error: error.message });
    }
}

async function updateItem(req, res) {
    try {
        console.log("[UPDATE ITEM] Request received for ID:", req.params.id);

        const item = await itemService.updateItem(req.params.id, req.body);

        console.log("[UPDATE ITEM] Item updated:", item.id);

        return res.status(200).json(item);
    } catch (error) {
        console.error("[UPDATE ITEM ERROR]", error.message);

        const statusCode = error.message === "Item not found" ? 404 : 400;
        return res.status(statusCode).json({ error: error.message });
    }
}

async function deleteItem(req, res) {
    try {
        console.log("[DELETE ITEM] Request received for ID:", req.params.id);

        await itemService.deleteItem(req.params.id);

        console.log("[DELETE ITEM] Item deleted:", req.params.id);

        return res.status(204).send();
    } catch (error) {
        console.error("[DELETE ITEM ERROR]", error.message);

        return res.status(404).json({ error: error.message });
    }
}

async function searchItems(req, res) {
    try {
        console.log("[SEARCH ITEMS] Filters:", req.query);

        const items = await itemService.searchItems(req.query);

        console.log("[SEARCH ITEMS] Results found:", items.length);

        return res.status(200).json(items);
    } catch (error) {
        console.error("[SEARCH ITEMS ERROR]", error.message);

        return res.status(500).json({ error: error.message });
    }
}

async function getAvailability(req, res) {
    try {
        console.log("[ITEM AVAILABILITY] Request received for ID:", req.params.id);

        const availability = await itemService.getAvailability(req.params.id);

        console.log("[ITEM AVAILABILITY] Status:", availability.status);

        return res.status(200).json(availability);
    } catch (error) {
        console.error("[ITEM AVAILABILITY ERROR]", error.message);

        return res.status(404).json({ error: error.message });
    }
}

module.exports = {
    createItem,
    getAllItems,
    getItemById,
    updateItem,
    deleteItem,
    searchItems,
    getAvailability,
};