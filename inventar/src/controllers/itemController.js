const itemService = require("../services/itemService");

async function createItem(req, res) {
    try {
        console.log("Creating item:", req.body.name);
        const item = await itemService.createItem(req.body);
        return res.status(201).json(item);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

async function getAllItems(req, res) {
    try {
        const items = await itemService.getAllItems();
        return res.status(200).json(items);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function getItemById(req, res) {
    try {
        const item = await itemService.getItemById(req.params.id);
        return res.status(200).json(item);
    } catch (error) {
        return res.status(404).json({ error: error.message });
    }
}

async function updateItem(req, res) {
    try {
        console.log("Updating item:", req.params.id);
        const item = await itemService.updateItem(req.params.id, req.body);
        return res.status(200).json(item);
    } catch (error) {
        const statusCode = error.message === "Item not found" ? 404 : 400;
        return res.status(statusCode).json({ error: error.message });
    }
}

async function deleteItem(req, res) {
    try {
        console.log("Deleting item:", req.params.id);
        await itemService.deleteItem(req.params.id);
        return res.status(204).send();
    } catch (error) {
        return res.status(404).json({ error: error.message });
    }
}

async function searchItems(req, res) {
    try {
        const items = await itemService.searchItems(req.query);
        return res.status(200).json(items);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function getAvailability(req, res) {
    try {
        const availability = await itemService.getAvailability(req.params.id);
        return res.status(200).json(availability);
    } catch (error) {
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