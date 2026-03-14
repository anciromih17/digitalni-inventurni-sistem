const request = require("supertest");
const app = require("../src/app");
const pool = require("../src/config/db");
const initDb = require("../src/config/initDb");

describe("Inventory API endpoints", () => {
    let createdItemId;

    beforeAll(async () => {
        await initDb();
        await pool.query("DELETE FROM items");
    });

    test("GET /health should return service status", async () => {
        const response = await request(app).get("/health");

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("message", "Inventory service is running.");
    });

    test("POST /api/items should create a new item", async () => {
        const newItem = {
            name: "Test Speaker",
            description: "Test description",
            category: "Audio",
            subcategory: "Speakers",
            item_type: "Active",
            quantity: 5,
            available_quantity: 5,
            location: "Shelf Test"
        };

        const response = await request(app)
            .post("/api/items")
            .send(newItem);

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("id");
        expect(response.body.name).toBe("Test Speaker");

        createdItemId = response.body.id;
    });

    test("GET /api/items should return an array", async () => {
        const response = await request(app).get("/api/items");

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
    });

    test("GET /api/items/:id should return one item", async () => {
        const response = await request(app).get(`/api/items/${createdItemId}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("id", createdItemId);
        expect(response.body.name).toBe("Test Speaker");
    });

    test("GET /api/items/:id should return 404 for non-existing item", async () => {
        const response = await request(app).get("/api/items/999999");

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("error", "Item not found");
    });

    test("PUT /api/items/:id should update item", async () => {
        const updatedItem = {
            name: "Updated Test Speaker",
            description: "Updated description",
            category: "Audio",
            subcategory: "Speakers",
            item_type: "Passive",
            quantity: 6,
            available_quantity: 4,
            location: "Shelf Updated"
        };

        const response = await request(app)
            .put(`/api/items/${createdItemId}`)
            .send(updatedItem);

        expect(response.statusCode).toBe(200);
        expect(response.body.name).toBe("Updated Test Speaker");
        expect(response.body.available_quantity).toBe(4);
        expect(response.body.status).toBe("LOW_STOCK");
    });

    test("PUT /api/items/:id should return 404 for non-existing item", async () => {
        const updatedItem = {
            name: "Missing Item",
            description: "Updated description",
            category: "Audio",
            subcategory: "Speakers",
            item_type: "Passive",
            quantity: 6,
            available_quantity: 4,
            location: "Shelf Updated"
        };

        const response = await request(app)
            .put("/api/items/999999")
            .send(updatedItem);

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("error", "Item not found");
    });

    test("GET /api/items/search should return filtered items", async () => {
        const response = await request(app).get("/api/items/search?category=Audio");

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].category).toBe("Audio");
    });

    test("GET /api/items/:id/availability should return item availability", async () => {
        const response = await request(app).get(`/api/items/${createdItemId}/availability`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("id", createdItemId);
        expect(response.body).toHaveProperty("name", "Updated Test Speaker");
        expect(response.body).toHaveProperty("quantity", 6);
        expect(response.body).toHaveProperty("available_quantity", 4);
        expect(response.body).toHaveProperty("status", "LOW_STOCK");
    });

    test("GET /api/items/:id/availability should return 404 for non-existing item", async () => {
        const response = await request(app).get("/api/items/999999/availability");

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("error", "Item not found");
    });

    test("DELETE /api/items/:id should delete item", async () => {
        const response = await request(app).delete(`/api/items/${createdItemId}`);

        expect(response.statusCode).toBe(204);
    });

    test("DELETE /api/items/:id should return 404 for non-existing item", async () => {
        const response = await request(app).delete("/api/items/999999");

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("error", "Item not found");
    });

    afterAll(async () => {
        await pool.end();
    });
});