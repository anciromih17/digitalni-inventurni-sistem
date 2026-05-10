const itemRepository = require("../repositories/itemRepository");
const auditService = require("./auditService");

function determineStatus(quantity, availableQuantity) {
    if (quantity === 0 || availableQuantity === 0) {
        return "OUT_OF_STOCK";
    }

    if (availableQuantity < quantity) {
        return "LOW_STOCK";
    }

    return "AVAILABLE";
}

async function createItem(data) {
    if (!data.name) {
        throw new Error("Name is required");
    }

    if (data.quantity == null || data.available_quantity == null) {
        throw new Error("quantity and available_quantity are required");
    }

    if (data.quantity < 0 || data.available_quantity < 0) {
        throw new Error("quantity and available_quantity must be non-negative");
    }

    if (data.available_quantity > data.quantity) {
        throw new Error("available_quantity cannot be greater than quantity");
    }

    const item = {
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        subcategory: data.subcategory || null,
        item_type: data.item_type || null,
        quantity: data.quantity,
        available_quantity: data.available_quantity,
        location: data.location || null,
        status: data.status || determineStatus(data.quantity, data.available_quantity),
    };

    const createdItem = await itemRepository.createItem(item);

    await auditService.logInventoryAudit("ITEM_CREATED", createdItem, {
        name: createdItem.name,
        category: createdItem.category,
        quantity: createdItem.quantity,
        available_quantity: createdItem.available_quantity,
    });

    return createdItem;
}

async function getAllItems() {
    return await itemRepository.getAllItems();
}

async function getItemById(id) {
    const item = await itemRepository.getItemById(id);

    if (!item) {
        throw new Error("Item not found");
    }

    return item;
}

async function updateItem(id, data) {
    const existing = await itemRepository.getItemById(id);

    if (!existing) {
        throw new Error("Item not found");
    }

    if (!data.name) {
        throw new Error("Name is required");
    }

    if (data.quantity == null || data.available_quantity == null) {
        throw new Error("quantity and available_quantity are required");
    }

    if (data.quantity < 0 || data.available_quantity < 0) {
        throw new Error("quantity and available_quantity must be non-negative");
    }

    if (data.available_quantity > data.quantity) {
        throw new Error("available_quantity cannot be greater than quantity");
    }

    const updatedData = {
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        subcategory: data.subcategory || null,
        item_type: data.item_type || null,
        quantity: data.quantity,
        available_quantity: data.available_quantity,
        location: data.location || null,
        status: data.status || determineStatus(data.quantity, data.available_quantity),
    };

    const updatedItem = await itemRepository.updateItem(id, updatedData);

    await auditService.logInventoryAudit("ITEM_UPDATED", updatedItem, {
        previous: {
            name: existing.name,
            quantity: existing.quantity,
            available_quantity: existing.available_quantity,
            status: existing.status,
        },
        current: {
            name: updatedItem.name,
            quantity: updatedItem.quantity,
            available_quantity: updatedItem.available_quantity,
            status: updatedItem.status,
        },
    });

    return updatedItem;
}

async function deleteItem(id) {
    const deleted = await itemRepository.deleteItem(id);

    if (!deleted) {
        throw new Error("Item not found");
    }

    await auditService.logInventoryAudit("ITEM_DELETED", deleted, {
        name: deleted.name,
        quantity: deleted.quantity,
        available_quantity: deleted.available_quantity,
        location: deleted.location,
    });

    return deleted;
}

async function searchItems(filters) {
    return await itemRepository.searchItems(filters);
}

async function getAvailability(id) {
    const item = await itemRepository.getItemById(id);

    if (!item) {
        throw new Error("Item not found");
    }

    return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        available_quantity: item.available_quantity,
        status: item.status,
    };
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
