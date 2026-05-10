const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const itemRepository = require("../repositories/itemRepository");
const auditService = require("../services/auditService");

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

        await auditService.logInventoryAudit("ITEM_RESERVED", updatedItem, {
            item_id,
            reserved_quantity: quantity,
            available_quantity_after: updatedItem.available_quantity,
            status: updatedItem.status,
        }, "reservations-service");

        return callback(null, {
            success: true,
            message: "Item reserved successfully",
        });
    } catch (error) {
        console.error("[gRPC ReserveItem ERROR]", error.message);
        callback(error);
    }
}

async function returnItem(call, callback) {
    try {
        const { item_id, quantity } = call.request;

        console.log("[gRPC] ReturnItem called for item:", item_id, "quantity:", quantity);

        const item = await itemRepository.getItemById(item_id);

        if (!item) {
            return callback(null, {
                success: false,
                message: "Item not found",
            });
        }

        if (quantity <= 0) {
            return callback(null, {
                success: false,
                message: "Return quantity must be greater than 0",
            });
        }

        if ((item.available_quantity + quantity) > item.quantity) {
            return callback(null, {
                success: false,
                message: "Return quantity exceeds total inventory quantity",
            });
        }

        const updatedItem = await itemRepository.returnItemQuantity(item_id, quantity);

        if (!updatedItem) {
            return callback(null, {
                success: false,
                message: "Return failed",
            });
        }

        await auditService.logInventoryAudit("ITEM_RETURNED", updatedItem, {
            item_id,
            returned_quantity: quantity,
            available_quantity_after: updatedItem.available_quantity,
            status: updatedItem.status,
        }, "reservations-service");

        return callback(null, {
            success: true,
            message: "Item returned successfully",
        });
    } catch (error) {
        console.error("[gRPC ReturnItem ERROR]", error.message);
        callback(error);
    }
}

function startGrpcServer() {
    const server = new grpc.Server();

    server.addService(inventoryProto.InventoryGrpcService.service, {
        GetItemAvailability: getItemAvailability,
        ReserveItem: reserveItem,
        ReturnItem: returnItem,
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
