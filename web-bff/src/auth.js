const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "digitalni-inventurni-sistem-secret";
const TOKEN_TTL_SECONDS = Number(process.env.JWT_TTL_SECONDS || 60 * 60 * 8);

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function signToken(user) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    })
  );
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  const [header, payload, signature] = (token || "").split(".");

  if (!header || !payload || !signature) {
    throw new Error("Invalid token");
  }

  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (signature !== expectedSignature) {
    throw new Error("Invalid token");
  }

  const decodedPayload = JSON.parse(base64UrlDecode(payload));

  if (!decodedPayload.exp || decodedPayload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return decodedPayload;
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function authenticate(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ gateway: "web-bff", error: "Authentication token is required" });
    }

    req.user = verifyToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({ gateway: "web-bff", error: error.message || "Invalid token" });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ gateway: "web-bff", error: "Authentication token is required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ gateway: "web-bff", error: "Access denied" });
    }

    return next();
  };
}

function authorizeSelfOrAdmin(getTargetId) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ gateway: "web-bff", error: "Authentication token is required" });
    }

    const targetId = String(getTargetId(req));
    if (req.user.role === "ADMIN" || String(req.user.sub) === targetId) {
      return next();
    }

    return res.status(403).json({ gateway: "web-bff", error: "Access denied" });
  };
}

module.exports = {
  authenticate,
  authorize,
  authorizeSelfOrAdmin,
  signToken,
};
