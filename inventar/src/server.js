const app = require("./app");
const initDb = require("./config/initDb");
const startGrpcServer = require("./grpc/grpcServer");
require("dotenv").config();

const PORT = process.env.PORT || 8000;

async function startServer() {
    try {
        await initDb();

        app.listen(PORT, () => {
            console.log(`Inventory service running on port ${PORT}`);
        });

        startGrpcServer();
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
}

startServer();