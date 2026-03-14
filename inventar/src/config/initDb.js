const pool = require("./db");

async function initDb() {
    const query = `
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      subcategory VARCHAR(100),
      item_type VARCHAR(100),
      quantity INTEGER NOT NULL CHECK (quantity >= 0),
      available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0),
      location VARCHAR(100),
      status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    await pool.query(query);
    console.log("Table 'items' is ready.");
}

module.exports = initDb;