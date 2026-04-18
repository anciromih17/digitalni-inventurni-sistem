import os
import asyncio
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Query

app = FastAPI(
    title="Mobile BFF",
    description="Backend for frontend gateway for a mobile client",
    version="1.0.0",
)

INVENTORY_URL = os.getenv("INVENTORY_SERVICE_URL", "http://inventory-service:8000")
RESERVATIONS_URL = os.getenv(
    "RESERVATIONS_SERVICE_URL", "http://reservations-service:8001"
)
USERS_URL = os.getenv("USERS_SERVICE_URL", "http://users-service:8002")


async def request_json(
    client: httpx.AsyncClient, method: str, url: str, **kwargs: Any
) -> Any:
    response = await client.request(method, url, **kwargs)

    if response.status_code == 204:
        return None

    try:
        payload = response.json()
    except ValueError:
        payload = None

    if response.is_error:
        message = "Upstream request failed"
        if isinstance(payload, dict):
            message = payload.get("error") or payload.get("detail") or message
        raise HTTPException(
            status_code=response.status_code,
            detail={"gateway": "mobile-bff", "message": message, "upstream": payload},
        )

    return payload


def sanitize_user(user: dict | None) -> dict | None:
    if not user:
        return None

    return {
        "id": user.get("id"),
        "username": user.get("username"),
        "email": user.get("email"),
        "role": user.get("role"),
    }


def compact_item(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": item["id"],
        "title": item["name"],
        "status": item["status"],
        "availableQuantity": item["available_quantity"],
        "location": item["location"],
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "OK", "gateway": "mobile-bff"}


@app.get("/mobile/home")
async def mobile_home(username: str = Query(...)) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        items, reservations, user = await asyncio.gather(
            request_json(client, "GET", f"{INVENTORY_URL}/api/items"),
            request_json(client, "GET", f"{RESERVATIONS_URL}/api/reservations/"),
            request_json(
                client,
                "POST",
                f"{USERS_URL}/api/users/login",
                params={"username": username},
            ),
        )

    my_reservations = [
        reservation
        for reservation in reservations
        if reservation.get("reserved_by", "").lower() == username.lower()
    ]

    available_items = [
        item for item in items if item.get("available_quantity", 0) > 0
    ]

    return {
        "profile": sanitize_user(user),
        "summary": {
            "availableItems": len(available_items),
            "myReservations": len(my_reservations),
        },
        "quickActions": [
            {"label": "Browse catalog", "path": "/mobile/catalog"},
            {
                "label": "My reservations",
                "path": f"/mobile/my-reservations?username={username}",
            },
        ],
    }


@app.get("/mobile/catalog")
async def mobile_catalog(
    category: str | None = None,
    status: str | None = None,
    location: str | None = None,
) -> dict[str, Any]:
    params = {
        key: value
        for key, value in {
            "category": category,
            "status": status,
            "location": location,
        }.items()
        if value
    }

    path = "/api/items/search" if params else "/api/items"

    async with httpx.AsyncClient(timeout=20.0) as client:
        items = await request_json(client, "GET", f"{INVENTORY_URL}{path}", params=params)

    mobile_items = [compact_item(item) for item in items]

    return {"count": len(mobile_items), "items": mobile_items}


@app.get("/mobile/catalog/search")
async def mobile_catalog_search(
    category: str | None = None,
    status: str | None = None,
    location: str | None = None,
) -> dict[str, Any]:
    return await mobile_catalog(category=category, status=status, location=location)


@app.get("/mobile/catalog/{item_id}/availability")
async def mobile_item_availability(item_id: int) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        availability = await request_json(
            client, "GET", f"{INVENTORY_URL}/api/items/{item_id}/availability"
        )

    return availability


@app.get("/mobile/catalog/{item_id}")
async def mobile_catalog_item(item_id: int) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        item = await request_json(client, "GET", f"{INVENTORY_URL}/api/items/{item_id}")
        availability = await request_json(
            client, "GET", f"{INVENTORY_URL}/api/items/{item_id}/availability"
        )

    return {
        "itemId": item["id"],
        "title": item["name"],
        "description": item.get("description"),
        "availability": availability,
        "reservationHint": {
            "canReserve": availability.get("available_quantity", 0) > 0,
            "status": availability.get("status"),
        },
    }


@app.post("/mobile/catalog")
async def create_catalog_item(payload: dict[str, Any]) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        item = await request_json(
            client, "POST", f"{INVENTORY_URL}/api/items", json=payload
        )

    return compact_item(item)


@app.put("/mobile/catalog/{item_id}")
async def update_catalog_item(item_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        item = await request_json(
            client, "PUT", f"{INVENTORY_URL}/api/items/{item_id}", json=payload
        )

    return compact_item(item)


@app.delete("/mobile/catalog/{item_id}")
async def delete_catalog_item(item_id: int) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        await request_json(client, "DELETE", f"{INVENTORY_URL}/api/items/{item_id}")

    return {"message": "Item deleted from mobile gateway", "itemId": item_id}


@app.get("/mobile/my-reservations")
async def my_reservations(username: str = Query(...)) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        reservations = await request_json(
            client, "GET", f"{RESERVATIONS_URL}/api/reservations/"
        )

    mine = [
        {
            "reservationId": reservation["id"],
            "itemId": reservation["item_id"],
            "from": reservation["start_date"],
            "to": reservation["end_date"],
            "quantity": reservation["quantity"],
            "status": reservation["status"],
        }
        for reservation in reservations
        if reservation.get("reserved_by", "").lower() == username.lower()
    ]

    return {"username": username, "reservations": mine}


@app.get("/mobile/reservations/search")
async def mobile_reservation_search(
    status: str | None = None,
    reserved_by: str | None = None,
) -> dict[str, Any]:
    params = {
        key: value
        for key, value in {"status": status, "reserved_by": reserved_by}.items()
        if value
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        reservations = await request_json(
            client,
            "GET",
            f"{RESERVATIONS_URL}/api/reservations/search/",
            params=params,
        )

    return {"count": len(reservations), "reservations": reservations}


@app.get("/mobile/reservations/{reservation_id}")
async def mobile_reservation_detail(reservation_id: int) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        reservation = await request_json(
            client, "GET", f"{RESERVATIONS_URL}/api/reservations/{reservation_id}"
        )

    return reservation


@app.post("/mobile/reserve")
async def reserve_item(payload: dict[str, Any]) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        reservation = await request_json(
            client,
            "POST",
            f"{RESERVATIONS_URL}/api/reservations/",
            json=payload,
        )

    return {
        "message": "Reservation created from mobile gateway",
        "reservationId": reservation["id"],
        "status": reservation["status"],
    }


@app.put("/mobile/reservations/{reservation_id}")
async def update_mobile_reservation(
    reservation_id: int, payload: dict[str, Any]
) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        reservation = await request_json(
            client,
            "PUT",
            f"{RESERVATIONS_URL}/api/reservations/{reservation_id}",
            json=payload,
        )

    return reservation


@app.delete("/mobile/reservations/{reservation_id}")
async def delete_mobile_reservation(reservation_id: int) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        result = await request_json(
            client,
            "DELETE",
            f"{RESERVATIONS_URL}/api/reservations/{reservation_id}",
        )

    return result


@app.post("/mobile/reservations/{reservation_id}/return")
async def return_mobile_reservation(
    reservation_id: int, payload: dict[str, Any] | None = None
) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        result = await request_json(
            client,
            "POST",
            f"{RESERVATIONS_URL}/api/reservations/{reservation_id}/return",
            json=payload or {},
        )

    return result


@app.post("/mobile/session/login")
async def mobile_login(payload: dict[str, Any]) -> dict[str, Any]:
    username = payload.get("username")
    if not username:
        raise HTTPException(status_code=400, detail="username is required")

    async with httpx.AsyncClient(timeout=20.0) as client:
        user = await request_json(
            client,
            "POST",
            f"{USERS_URL}/api/users/login",
            params={"username": username},
        )

    return {
        "session": {
            "username": username,
            "role": user.get("role"),
        },
        "profile": sanitize_user(user),
    }


@app.post("/mobile/session/register")
async def mobile_register(payload: dict[str, Any]) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        user = await request_json(
            client,
            "POST",
            f"{USERS_URL}/api/users/register",
            json=payload,
        )

    return {"message": "User registered from mobile gateway", "profile": sanitize_user(user)}


@app.get("/mobile/users/{user_id}")
async def mobile_user_detail(user_id: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        user = await request_json(client, "GET", f"{USERS_URL}/api/users/{user_id}")

    return sanitize_user(user)


@app.put("/mobile/users/{user_id}/role")
async def mobile_update_user_role(user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    role = payload.get("role")
    if not role:
        raise HTTPException(status_code=400, detail="role is required")

    async with httpx.AsyncClient(timeout=20.0) as client:
        user = await request_json(
            client,
            "PUT",
            f"{USERS_URL}/api/users/{user_id}/role",
            params={"role": role},
        )

    return sanitize_user(user)


@app.delete("/mobile/users/{user_id}")
async def mobile_delete_user(user_id: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        await request_json(client, "DELETE", f"{USERS_URL}/api/users/{user_id}")

    return {"message": "User deleted from mobile gateway", "userId": user_id}
