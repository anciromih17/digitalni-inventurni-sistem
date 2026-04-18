module.exports = {
  port: Number(process.env.PORT || 8010),
  services: {
    inventory: process.env.INVENTORY_SERVICE_URL || "http://inventory-service:8000",
    reservations:
      process.env.RESERVATIONS_SERVICE_URL || "http://reservations-service:8001",
    users: process.env.USERS_SERVICE_URL || "http://users-service:8002",
  },
};
