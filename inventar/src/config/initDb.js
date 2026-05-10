const pool = require("./db");

async function initDb() {
    const itemsQuery = `
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

    const auditQuery = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      service_name VARCHAR(100) NOT NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id INTEGER,
      action VARCHAR(100) NOT NULL,
      actor VARCHAR(255) NOT NULL DEFAULT 'system',
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    await pool.query(itemsQuery);
    await pool.query(auditQuery);
    console.log("Table 'items' is ready.");
    console.log("Table 'audit_logs' is ready.");
}

module.exports = initDb;
