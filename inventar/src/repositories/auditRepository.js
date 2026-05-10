const pool = require("../config/db");

async function createAuditLog(entry) {
    const query = `
    INSERT INTO audit_logs (service_name, entity_type, entity_id, action, actor, details)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb)
    RETURNING *;
  `;

    const values = [
        entry.service_name,
        entry.entity_type,
        entry.entity_id,
        entry.action,
        entry.actor,
        JSON.stringify(entry.details || {}),
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
}

async function getAuditLogs({ entity_type, action, limit = 50 }) {
    let query = "SELECT * FROM audit_logs WHERE 1=1";
    const values = [];

    if (entity_type) {
        values.push(entity_type);
        query += ` AND entity_type = $${values.length}`;
    }

    if (action) {
        values.push(action);
        query += ` AND action = $${values.length}`;
    }

    values.push(limit);
    query += ` ORDER BY created_at DESC LIMIT $${values.length}`;

    const result = await pool.query(query, values);
    return result.rows;
}

module.exports = {
    createAuditLog,
    getAuditLogs,
};
