import os
import grpc
import app.grpc.inventory_pb2 as inventory_pb2
import app.grpc.inventory_pb2_grpc as inventory_pb2_grpc

INVENTORY_GRPC_HOST = os.getenv("INVENTORY_GRPC_HOST", "localhost:50051")

def get_item_availability(item_id: int):
    with grpc.insecure_channel(INVENTORY_GRPC_HOST) as channel:
        stub = inventory_pb2_grpc.InventoryGrpcServiceStub(channel)
        response = stub.GetItemAvailability(
            inventory_pb2.ItemRequest(item_id=item_id)
        )
        return response

def reserve_item(item_id: int, quantity: int):
    with grpc.insecure_channel(INVENTORY_GRPC_HOST) as channel:
        stub = inventory_pb2_grpc.InventoryGrpcServiceStub(channel)
        response = stub.ReserveItem(
            inventory_pb2.ReserveItemRequest(
                item_id=item_id,
                quantity=quantity
            )
        )
        return response