import { getStore } from "@netlify/blobs";
const store=getStore("huypc-licenses");
const reply=(s,b)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
export default async req=>{
 try{
  if(req.method!=="POST")return reply(405,{ok:false,error:"METHOD_NOT_ALLOWED"});
  let b;try{b=await req.json()}catch{return reply(400,{ok:false,error:"BAD_JSON"})}
  const key=String(b.key||"").trim().toUpperCase().replace(/\s+/g,""),deviceId=String(b.deviceId||"").trim();
  if(!key||!deviceId)return reply(400,{ok:false,error:"KEY_AND_DEVICE_REQUIRED"});
  const l=await store.get(key,{type:"json"});if(!l)return reply(404,{ok:false,error:"INVALID_KEY"});
  if(l.status!=="active")return reply(403,{ok:false,error:"LICENSE_DISABLED"});
  if(l.expiresAt!==null&&l.expiresAt<Date.now())return reply(403,{ok:false,error:"LICENSE_EXPIRED"});
  l.devices=Array.isArray(l.devices)?l.devices:[];
  if(!l.devices.includes(deviceId)&&l.devices.length>=l.maxDevices)return reply(403,{ok:false,error:"DEVICE_LIMIT_REACHED"});
  if(!l.devices.includes(deviceId))l.devices.push(deviceId);
  l.lastActivatedAt=new Date().toISOString();await store.setJSON(key,l);
  return reply(200,{ok:true,license:{plan:l.plan,expiresAt:l.expiresAt,devices:l.devices.length,maxDevices:l.maxDevices}});
 }catch(e){console.error(e);return reply(500,{ok:false,error:"SERVER_ERROR"})}
};
