const auditService = require("../services/auditService");

async function getAuditLogs(req, res) {
    try {
        const logs = await auditService.getAuditLogs({
            entity_type: req.query.entity_type,
            action: req.query.action,
            limit: Number(req.query.limit || 50),
        });

        return res.status(200).json(logs);
    } catch (error) {
        console.error("[GET INVENTORY AUDIT LOGS ERROR]", error.message);
        return res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getAuditLogs,
};
