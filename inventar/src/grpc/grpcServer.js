const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const itemRepository = require("../repositories/itemRepository");

const PROTO_PATH = path.join(__dirname, "inventory.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const inventoryProto = grpc.loadPackageDefinition(packageDefinition).inventory;

async function getItemAvailability(call, callback) {
    try {
        const itemId = call.request.item_id;

        console.log("[gRPC] GetItemAvailability called for item:", itemId);

        const item = await itemRepository.getItemAvailability(itemId);

        if (!item) {
            return callback(null, {
                item_id: itemId,
                available_quantity: 0,
                status: "NOT_FOUND",
            });
        }

        return callback(null, {
            item_id: item.id,
            available_quantity: item.available_quantity,
            status: item.status,
        });
    } catch (error) {
        console.error("[gRPC GetItemAvailability ERROR]", error.message);
        callback(error);
    }
}

async function reserveItem(call, callback) {
    try {
        const { item_id, quantity } = call.request;

        console.log("[gRPC] ReserveItem called for item:", item_id, "quantity:", quantity);

        const item = await itemRepository.getItemById(item_id);

        if (!item) {
            return callback(null, {
                success: false,
                message: "Item not found",
            });
        }

        if (item.available_quantity < quantity) {
            return callback(null, {
                success: false,
                message: "Not enough available quantity",
            });
        }

        const updatedItem = await itemRepository.reserveItemQuantity(item_id, quantity);

        if (!updatedItem) {
            return callback(null, {
                success: false,
                message: "Reservation failed",
            });
        }

        return callback(null, {
            success: true,
            message: "Item reserved successfully",
        });
    } catch (error) {
        console.error("[gRPC ReserveItem ERROR]", error.message);
        callback(error);
    }
}

function startGrpcServer() {
    const server = new grpc.Server();

    server.addService(inventoryProto.InventoryGrpcService.service, {
        GetItemAvailability: getItemAvailability,
        ReserveItem: reserveItem,
    });

    const address = "0.0.0.0:50051";

    server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, port) => {
        if (error) {
            console.error("[gRPC SERVER ERROR]", error.message);
            return;
        }

        console.log(`[gRPC] Inventory gRPC server running on port ${port}`);
    });
}

module.exports = startGrpcServer;