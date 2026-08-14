import { getStore } from "@netlify/blobs";
const store=getStore("huypc-licenses");
const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const authorized=req=>(process.env.ADMIN_SECRET||"").length>0&&(req.headers.get("x-admin-secret")||"")===process.env.ADMIN_SECRET;
const makeKey=()=>{const r=crypto.randomUUID().replaceAll("-","").toUpperCase();return `HX-${r.slice(0,4)}-${r.slice(4,8)}-${r.slice(8,12)}-${r.slice(12,16)}`};
export default async req=>{
 try{
  if(!authorized(req))return reply(401,{ok:false,error:"UNAUTHORIZED"});
  if(req.method==="GET"){const {blobs}=await store.list();const licenses=[];for(const b of blobs||[]){const v=await store.get(b.key,{type:"json"});if(v)licenses.push(v)}return reply(200,{ok:true,licenses})}
  if(req.method!=="POST")return reply(405,{ok:false,error:"METHOD_NOT_ALLOWED"});
  let body={};try{body=await req.json()}catch{return reply(400,{ok:false,error:"BAD_JSON"})}
  const action=String(body.action||"");
  if(action==="create"){
   const plan=String(body.plan||"30D").toUpperCase(),days=plan==="1D"?1:plan==="7D"?7:plan==="30D"?30:null,t=Date.now();
   const license={key:makeKey(),plan,status:"active",createdAt:new Date(t).toISOString(),expiresAt:days===null?null:t+days*86400000,maxDevices:Math.max(1,Number(body.maxDevices)||1),devices:[],lastActivatedAt:null};
   await store.setJSON(license.key,license);return reply(200,{ok:true,license});
  }
  const key=String(body.key||"").trim().toUpperCase();if(!key)return reply(400,{ok:false,error:"KEY_REQUIRED"});
  const license=await store.get(key,{type:"json"});if(!license)return reply(404,{ok:false,error:"NOT_FOUND"});
  if(action==="delete"){await store.delete(key);return reply(200,{ok:true})}
  if(action==="reset-device")license.devices=[];
  else if(action==="ban")license.status="banned";
  else if(action==="unban")license.status="active";
  else if(action==="extend"){const days=Math.max(1,Number(body.days)||1);license.expiresAt=Math.max(Date.now(),license.expiresAt||Date.now())+days*86400000}
  else return reply(400,{ok:false,error:"UNKNOWN_ACTION"});
  await store.setJSON(key,license);return reply(200,{ok:true,license});
 }catch(e){console.error(e);return reply(500,{ok:false,error:"SERVER_ERROR",detail:String(e?.message||e)})}
};
