const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");

const store = () => getStore({ name:"huypc-licenses", consistency:"strong" });

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type":"application/json; charset=utf-8",
      "access-control-allow-origin":"*",
      "access-control-allow-methods":"POST, OPTIONS",
      "access-control-allow-headers":"content-type",
      "cache-control":"no-store"
    },
    body:JSON.stringify(body)
  };
}

function secretOk(body) {
  return Boolean(process.env.ADMIN_SECRET) &&
    String(body.secret || "") === String(process.env.ADMIN_SECRET);
}

function makeKey() {
  const b = crypto.randomBytes(9).toString("hex").toUpperCase();
  return `HUYPC-${b.slice(0,4)}-${b.slice(4,8)}-${b.slice(8,12)}-${b.slice(12,18)}`;
}

function expiry(plan) {
  const p=String(plan||"").toUpperCase();
  if (p === "LIFETIME") return null;
  const days = p === "1D" ? 1 : p === "7D" ? 7 : p === "30D" ? 30 : null;
  if (!days) return undefined;
  return new Date(Date.now()+days*86400000).toISOString();
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204,{});
  if (event.httpMethod !== "POST") return json(405,{ok:false,error:"METHOD_NOT_ALLOWED"});

  let body;
  try { body=JSON.parse(event.body||"{}"); }
  catch { return json(400,{ok:false,error:"INVALID_JSON"}); }

  if (!secretOk(body)) return json(401,{ok:false,error:"UNAUTHORIZED"});

  const s=store();
  const action=String(body.action||"").toLowerCase();

  if (action === "create") {
    const plan=String(body.plan||"1D").toUpperCase();
    const expiresAt=expiry(plan);
    if (expiresAt === undefined) return json(400,{ok:false,error:"INVALID_PLAN"});

    const key=makeKey();
    const record={
      key, plan,
      createdAt:new Date().toISOString(),
      expiresAt,
      banned:false,
      maxDevices:Math.max(1,Math.min(10,Number(body.maxDevices||1))),
      devices:[],
      note:String(body.note||"")
    };
    await s.setJSON(key,record);
    return json(200,{ok:true,record});
  }

  if (action === "get") {
    const key=String(body.key||"").trim().toUpperCase();
    if (!key) return json(400,{ok:false,error:"KEY_REQUIRED"});
    const record=await s.get(key,{type:"json"});
    return record ? json(200,{ok:true,record}) : json(404,{ok:false,error:"KEY_NOT_FOUND"});
  }

  if (action === "update") {
    const key=String(body.key||"").trim().toUpperCase();
    const record=await s.get(key,{type:"json"});
    if (!record) return json(404,{ok:false,error:"KEY_NOT_FOUND"});

    if (body.banned !== undefined) record.banned=Boolean(body.banned);
    if (body.maxDevices !== undefined) record.maxDevices=Math.max(1,Math.min(10,Number(body.maxDevices)));
    if (body.note !== undefined) record.note=String(body.note);
    if (body.resetDevices === true) record.devices=[];
    if (body.extendDays !== undefined) {
      const days=Number(body.extendDays);
      if (!Number.isFinite(days) || days <= 0) return json(400,{ok:false,error:"INVALID_EXTEND_DAYS"});
      const base = record.expiresAt && new Date(record.expiresAt)>new Date()
        ? new Date(record.expiresAt) : new Date();
      base.setTime(base.getTime()+days*86400000);
      record.expiresAt=base.toISOString();
      record.plan="CUSTOM";
    }
    record.updatedAt=new Date().toISOString();
    await s.setJSON(key,record);
    return json(200,{ok:true,record});
  }

  if (action === "delete") {
    const key=String(body.key||"").trim().toUpperCase();
    if (!key) return json(400,{ok:false,error:"KEY_REQUIRED"});
    await s.delete(key);
    return json(200,{ok:true,key});
  }

  return json(400,{ok:false,error:"UNKNOWN_ACTION"});
};
