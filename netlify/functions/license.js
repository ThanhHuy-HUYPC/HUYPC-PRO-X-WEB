const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");

const store = () => getStore({ name: "huypc-licenses", consistency: "strong" });

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "cache-control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

function normalizeKey(v) {
  return String(v || "").trim().toUpperCase();
}

function deviceId(v) {
  return String(v || "").trim().slice(0, 200);
}

function now() {
  return new Date();
}

function iso(d) {
  return d.toISOString();
}

function isExpired(record) {
  if (!record || !record.expiresAt) return false;
  return new Date(record.expiresAt).getTime() <= Date.now();
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, {});
  if (event.httpMethod !== "POST") return json(405, { ok:false, error:"METHOD_NOT_ALLOWED" });

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return json(400, { ok:false, error:"INVALID_JSON" }); }

  const key = normalizeKey(body.key);
  const dev = deviceId(body.deviceId);

  if (!key) return json(400, { ok:false, error:"KEY_REQUIRED" });
  if (!dev) return json(400, { ok:false, error:"DEVICE_ID_REQUIRED" });

  const s = store();
  const record = await s.get(key, { type:"json" });

  if (!record) return json(404, { ok:false, error:"KEY_NOT_FOUND" });
  if (record.banned) return json(403, { ok:false, error:"KEY_BANNED" });
  if (isExpired(record)) return json(403, { ok:false, error:"KEY_EXPIRED", expiresAt:record.expiresAt || null });

  const maxDevices = Math.max(1, Number(record.maxDevices || 1));
  const devices = Array.isArray(record.devices) ? record.devices : [];

  if (!devices.includes(dev)) {
    if (devices.length >= maxDevices) {
      return json(403, { ok:false, error:"DEVICE_LIMIT_REACHED", maxDevices });
    }
    devices.push(dev);
    record.devices = devices;
    record.updatedAt = iso(now());
    await s.setJSON(key, record);
  }

  return json(200, {
    ok:true,
    key,
    expiresAt:record.expiresAt || null,
    lifetime:!record.expiresAt,
    maxDevices,
    devices:devices.length
  });
};
