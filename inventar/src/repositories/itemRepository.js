const pool = require("../config/db");

async function createItem(item) {
    const query = `
    INSERT INTO items
    (name, description, category, subcategory, item_type, quantity, available_quantity, location, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

    const values = [
        item.name,
        item.description,
        item.category,
        item.subcategory,
        item.item_type,
        item.quantity,
        item.available_quantity,
        item.location,
        item.status,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
}

async function getAllItems() {
    const result = await pool.query(
        "SELECT * FROM items ORDER BY id ASC"
    );

    return result.rows;
}

async function getItemById(id) {
    const result = await pool.query(
        "SELECT * FROM items WHERE id = $1",
        [id]
    );

    return result.rows[0];
}

async function updateItem(id, item) {
    const query = `
    UPDATE items
    SET name = $1,
        description = $2,
        category = $3,
        subcategory = $4,
        item_type = $5,
        quantity = $6,
        available_quantity = $7,
        location = $8,
        status = $9,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $10
    RETURNING *;
  `;

    const values = [
        item.name,
        item.description,
        item.category,
        item.subcategory,
        item.item_type,
        item.quantity,
        item.available_quantity,
        item.location,
        item.status,
        id,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
}

async function deleteItem(id) {
    const result = await pool.query(
        "DELETE FROM items WHERE id = $1 RETURNING *",
        [id]
    );

    return result.rows[0];
}

async function searchItems({ category, status, location }) {
    let query = "SELECT * FROM items WHERE 1=1";
    const values = [];

    if (category) {
        values.push(category);
        query += ` AND category = $${values.length}`;
    }

    if (status) {
        values.push(status);
        query += ` AND status = $${values.length}`;
    }

    if (location) {
        values.push(location);
        query += ` AND location = $${values.length}`;
    }

    query += " ORDER BY id ASC";

    const result = await pool.query(query, values);
    return result.rows;
}

async function reserveItemQuantity(id, quantity) {
    const query = `
    UPDATE items
    SET available_quantity = available_quantity - $1,
        status = CASE
          WHEN (available_quantity - $1) <= 0 THEN 'OUT_OF_STOCK'
          WHEN (available_quantity - $1) < quantity THEN 'LOW_STOCK'
          ELSE 'AVAILABLE'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND available_quantity >= $1
    RETURNING *;
  `;

    const result = await pool.query(query, [quantity, id]);
    return result.rows[0];
}

async function getItemAvailability(id) {
    const result = await pool.query(
        "SELECT id, available_quantity, status FROM items WHERE id = $1",
        [id]
    );
    return result.rows[0];
}

module.exports = {
    createItem,
    getAllItems,
    getItemById,
    updateItem,
    deleteItem,
    searchItems,
    reserveItemQuantity,
    getItemAvailability,
};