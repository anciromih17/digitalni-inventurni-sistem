const auditRepository = require("../repositories/auditRepository");

async function logInventoryAudit(action, item, details = {}, actor = "system") {
    return auditRepository.createAuditLog({
        service_name: "inventory-service",
        entity_type: "item",
        entity_id: item?.id ?? details?.item_id ?? null,
        action,
        actor,
        details,
    });
}

async function getAuditLogs(filters) {
    return auditRepository.getAuditLogs(filters);
}

module.exports = {
    logInventoryAudit,
    getAuditLogs,
};
