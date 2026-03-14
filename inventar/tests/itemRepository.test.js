const pool = require("../src/config/db");
const itemRepository = require("../src/repositories/itemRepository");

describe("Item Repository", () => {
    let createdItemId;

    beforeAll(async () => {
        await pool.query("DELETE FROM items");
    });

    test("should create a new item", async () => {
        const item = {
            name: "Repository Test Item",
            description: "Repository test description",
            category: "Audio",
            subcategory: "Speakers",
            item_type: "Active",
            quantity: 4,
            available_quantity: 4,
            location: "Shelf Repo",
            status: "AVAILABLE",
        };

        const createdItem = await itemRepository.createItem(item);

        expect(createdItem).toHaveProperty("id");
        expect(createdItem.name).toBe("Repository Test Item");
        expect(createdItem.category).toBe("Audio");

        createdItemId = createdItem.id;
    });

    test("should get all items", async () => {
        const items = await itemRepository.getAllItems();

        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBeGreaterThan(0);
    });

    test("should get item by id", async () => {
        const item = await itemRepository.getItemById(createdItemId);

        expect(item).toBeTruthy();
        expect(item.id).toBe(createdItemId);
        expect(item.name).toBe("Repository Test Item");
    });

    test("should update item", async () => {
        const updatedData = {
            name: "Repository Updated Item",
            description: "Updated description",
            category: "Audio",
            subcategory: "Speakers",
            item_type: "Passive",
            quantity: 6,
            available_quantity: 5,
            location: "Shelf Updated",
            status: "LOW_STOCK",
        };

        const updatedItem = await itemRepository.updateItem(createdItemId, updatedData);

        expect(updatedItem).toBeTruthy();
        expect(updatedItem.name).toBe("Repository Updated Item");
        expect(updatedItem.available_quantity).toBe(5);
        expect(updatedItem.status).toBe("LOW_STOCK");
    });

    test("should search items by category", async () => {
        const items = await itemRepository.searchItems({ category: "Audio" });

        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBeGreaterThan(0);
        expect(items[0].category).toBe("Audio");
    });

    test("should delete item", async () => {
        const deletedItem = await itemRepository.deleteItem(createdItemId);

        expect(deletedItem).toBeTruthy();
        expect(deletedItem.id).toBe(createdItemId);

        const itemAfterDelete = await itemRepository.getItemById(createdItemId);
        expect(itemAfterDelete).toBeUndefined();
    });

    afterAll(async () => {
        await pool.end();
    });
});