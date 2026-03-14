const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const itemRoutes = require("./routes/itemRoutes");

const app = express();

app.use(express.json());

app.use("/api/items", itemRoutes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", (req, res) => {
    res.status(200).json({ message: "Inventory service is running." });
});

module.exports = app;