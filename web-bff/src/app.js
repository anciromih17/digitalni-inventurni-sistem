const express = require("express");
const cors = require("cors");
const config = require("./config");
const { requestJson } = require("./http");
const { authenticate, authorize, authorizeSelfOrAdmin, signToken } = require("./auth");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { password, ...safeUser } = user;
  return safeUser;
}

function mapItemForWeb(item) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    subcategory: item.subcategory,
    item_type: item.item_type,
    location: item.location,
    status: item.status,
    quantity: item.quantity,
    availableQuantity: item.available_quantity,
    available_quantity: item.available_quantity,
  };
}

function buildInventoryUrl(path, query) {
  const url = new URL(`${config.services.inventory}${path}`);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

function buildReservationsUrl(path, query) {
  const url = new URL(`${config.services.reservations}${path}`);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

app.get("/health", (req, res) => {
  res.json({ status: "OK", gateway: "web-bff" });
});

app.get("/api/dashboard", authenticate, async (req, res, next) => {
  try {
    const [items, reservations, users] = await Promise.all([
      requestJson(`${config.services.inventory}/api/items`),
      requestJson(`${config.services.reservations}/api/reservations/`),
      requestJson(`${config.services.users}/api/users`),
    ]);

    const availableItems = items.filter((item) => item.available_quantity > 0).length;
    const pendingReservations = reservations.filter(
      (reservation) => reservation.status === "PENDING"
    ).length;

    res.json({
      stats: {
        totalItems: items.length,
        availableItems,
        totalReservations: reservations.length,
        pendingReservations,
        totalUsers: users.length,
      },
      latestReservations: reservations.slice(0, 5),
      highlightedItems: items.slice(0, 5).map(mapItemForWeb),
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/items", authenticate, async (req, res, next) => {
  try {
    const hasFilters = ["category", "status", "location"].some((key) => req.query[key]);
    const path = hasFilters ? "/api/items/search" : "/api/items";
    const items = await requestJson(buildInventoryUrl(path, req.query));

    res.json(items.map(mapItemForWeb));
  } catch (error) {
    next(error);
  }
});

app.get("/api/items/search", authenticate, async (req, res, next) => {
  try {
    const items = await requestJson(buildInventoryUrl("/api/items/search", req.query));
    res.json(items.map(mapItemForWeb));
  } catch (error) {
    next(error);
  }
});

app.get("/api/items/:id", authenticate, async (req, res, next) => {
  try {
    const [item, availability] = await Promise.all([
      requestJson(`${config.services.inventory}/api/items/${req.params.id}`),
      requestJson(`${config.services.inventory}/api/items/${req.params.id}/availability`),
    ]);

    res.json({
      ...mapItemForWeb(item),
      availability,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/items/:id/availability", authenticate, async (req, res, next) => {
  try {
    const availability = await requestJson(
      `${config.services.inventory}/api/items/${req.params.id}/availability`
    );

    res.json(availability);
  } catch (error) {
    next(error);
  }
});

app.post("/api/items", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const createdItem = await requestJson(`${config.services.inventory}/api/items`, {
      method: "POST",
      body: JSON.stringify(req.body),
    });

    res.status(201).json(mapItemForWeb(createdItem));
  } catch (error) {
    next(error);
  }
});

app.put("/api/items/:id", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const updatedItem = await requestJson(
      `${config.services.inventory}/api/items/${req.params.id}`,
      {
        method: "PUT",
        body: JSON.stringify(req.body),
      }
    );

    res.json(mapItemForWeb(updatedItem));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/items/:id", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    await requestJson(`${config.services.inventory}/api/items/${req.params.id}`, {
      method: "DELETE",
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get("/api/reservations", authenticate, async (req, res, next) => {
  try {
    const reservations = await requestJson(
      `${config.services.reservations}/api/reservations/`
    );

    const filteredReservations = reservations.filter((reservation) => {
      if (
        req.user.role === "USER" &&
        reservation.reserved_by?.toLowerCase() !== req.user.username?.toLowerCase()
      ) {
        return false;
      }

      if (req.query.status && reservation.status !== req.query.status) {
        return false;
      }

      if (
        req.query.reserved_by &&
        reservation.reserved_by?.toLowerCase() !== req.query.reserved_by.toLowerCase()
      ) {
        return false;
      }

      return true;
    });

    res.json(filteredReservations);
  } catch (error) {
    next(error);
  }
});

app.get("/api/reservations/search", authenticate, async (req, res, next) => {
  try {
    const query = { ...req.query };
    if (req.user.role === "USER") {
      query.reserved_by = req.user.username;
    }

    const reservations = await requestJson(
      buildReservationsUrl("/api/reservations/search/", query)
    );

    res.json(reservations);
  } catch (error) {
    next(error);
  }
});

app.get("/api/reservations/:id", authenticate, async (req, res, next) => {
  try {
    const reservation = await requestJson(
      `${config.services.reservations}/api/reservations/${req.params.id}`
    );

    if (
      req.user.role === "USER" &&
      reservation.reserved_by?.toLowerCase() !== req.user.username?.toLowerCase()
    ) {
      return res.status(403).json({ gateway: "web-bff", error: "Access denied" });
    }

    res.json(reservation);
  } catch (error) {
    next(error);
  }
});

app.post("/api/reservations", authenticate, async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      reserved_by: req.user.role === "USER" ? req.user.username : req.body.reserved_by,
    };

    const reservation = await requestJson(
      `${config.services.reservations}/api/reservations/`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    res.status(201).json(reservation);
  } catch (error) {
    next(error);
  }
});

app.put("/api/reservations/:id", authenticate, async (req, res, next) => {
  try {
    const currentReservation = await requestJson(
      `${config.services.reservations}/api/reservations/${req.params.id}`
    );

    if (
      req.user.role === "USER" &&
      currentReservation.reserved_by?.toLowerCase() !== req.user.username?.toLowerCase()
    ) {
      return res.status(403).json({ gateway: "web-bff", error: "Access denied" });
    }

    const payload = {
      ...req.body,
      reserved_by: req.user.role === "USER" ? req.user.username : req.body.reserved_by,
    };

    const updatedReservation = await requestJson(
      `${config.services.reservations}/api/reservations/${req.params.id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );

    res.json(updatedReservation);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/reservations/:id", authenticate, async (req, res, next) => {
  try {
    const currentReservation = await requestJson(
      `${config.services.reservations}/api/reservations/${req.params.id}`
    );

    if (
      req.user.role === "USER" &&
      currentReservation.reserved_by?.toLowerCase() !== req.user.username?.toLowerCase()
    ) {
      return res.status(403).json({ gateway: "web-bff", error: "Access denied" });
    }

    const result = await requestJson(
      `${config.services.reservations}/api/reservations/${req.params.id}`,
      {
        method: "DELETE",
      }
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/reservations/:id/return", authenticate, async (req, res, next) => {
  try {
    const currentReservation = await requestJson(
      `${config.services.reservations}/api/reservations/${req.params.id}`
    );

    if (
      req.user.role === "USER" &&
      currentReservation.reserved_by?.toLowerCase() !== req.user.username?.toLowerCase()
    ) {
      return res.status(403).json({ gateway: "web-bff", error: "Access denied" });
    }

    const result = await requestJson(
      `${config.services.reservations}/api/reservations/${req.params.id}/return`,
      {
        method: "POST",
        body: JSON.stringify(req.body || {}),
      }
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/api/audit-logs", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const service = req.query.service;

    if (service === "inventory") {
      const logs = await requestJson(`${config.services.inventory}/api/audit-logs`);
      return res.json({ service: "inventory", logs });
    }

    if (service === "reservations") {
      const logs = await requestJson(`${config.services.reservations}/api/reservations/audit/logs`);
      return res.json({ service: "reservations", logs });
    }

    if (service === "users") {
      const logs = await requestJson(`${config.services.users}/api/users/audit/logs`);
      return res.json({ service: "users", logs });
    }

    const [inventoryLogs, reservationLogs, userLogs] = await Promise.all([
      requestJson(`${config.services.inventory}/api/audit-logs`),
      requestJson(`${config.services.reservations}/api/reservations/audit/logs`),
      requestJson(`${config.services.users}/api/users/audit/logs`),
    ]);

    const logs = [
      ...inventoryLogs.map((log) => ({ ...log, source: "inventory" })),
      ...reservationLogs.map((log) => ({ ...log, source: "reservations" })),
      ...userLogs.map((log) => ({ ...log, source: "users" })),
    ].sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));

    res.json({ service: "all", logs });
  } catch (error) {
    next(error);
  }
});

app.get("/api/users", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const users = await requestJson(`${config.services.users}/api/users`);
    res.json(users.map(sanitizeUser));
  } catch (error) {
    next(error);
  }
});

app.get("/api/users/me", authenticate, async (req, res, next) => {
  try {
    const user = await requestJson(`${config.services.users}/api/users/${req.user.sub}`);
    res.json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
});

app.get("/api/users/:id", authenticate, authorizeSelfOrAdmin((req) => req.params.id), async (req, res, next) => {
  try {
    const user = await requestJson(`${config.services.users}/api/users/${req.params.id}`);
    res.json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const user = await requestJson(`${config.services.users}/api/users/register`, {
      method: "POST",
      body: JSON.stringify(req.body),
    });

    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const user = await requestJson(`${config.services.users}/api/users/login`, {
      method: "POST",
      body: JSON.stringify({
        username: req.body.username,
        password: req.body.password,
      }),
    });

    res.json({
      message: "Login successful",
      user: sanitizeUser(user),
      token: signToken(user),
    });
  } catch (error) {
    next(error);
  }
});

app.put("/api/users/:id/role", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const roleUrl = new URL(`${config.services.users}/api/users/${req.params.id}/role`);
    roleUrl.searchParams.set("role", req.body.role);

    const updatedUser = await requestJson(roleUrl.toString(), {
      method: "PUT",
    });

    res.json(sanitizeUser(updatedUser));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/users/:id", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    await requestJson(`${config.services.users}/api/users/${req.params.id}`, {
      method: "DELETE",
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  const status = error.status || 500;

  res.status(status).json({
    gateway: "web-bff",
    error: error.message || "Unexpected gateway error",
    upstream: error.payload || null,
  });
});

module.exports = app;
