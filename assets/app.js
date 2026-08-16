const API="api/keys.php";
let data=[];
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function localInput(iso){if(!iso)return ""; const d=new Date(iso); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,16)}
function fmt(iso){if(!iso)return "—";return new Date(iso).toLocaleString("vi-VN")}
async function api(method,body){let r=await fetch(API,{method,headers:{"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});let j=await r.json();if(!r.ok||j.error)throw Error(j.error||"API error");return j}
async function load(){try{let j=await api("GET");data=j.keys||[];render()}catch(e){alert("Không tải được dữ liệu: "+e.message)}}
function render(){
 let q=$("#search").value.toLowerCase();
 let now=Date.now();
 let filtered=data.filter(x=>(x.key+" "+(x.user||"")+" "+(x.device||"")).toLowerCase().includes(q));
 $("#total").textContent=data.length;
 $("#active").textContent=data.filter(x=>x.status==="active"&&new Date(x.expires_at).getTime()>now).length;
 $("#expired").textContent=data.filter(x=>new Date(x.expires_at).getTime()<=now).length;
 $("#revoked").textContent=data.filter(x=>x.status==="revoked").length;
 $("#rows").innerHTML=filtered.map(x=>{
   let exp=new Date(x.expires_at).getTime(), expired=exp<=now;
   let st=x.status==="revoked"?["ĐÃ KHÓA","bad"]:expired?["HẾT HẠN","bad"]:["HOẠT ĐỘNG","ok"];
   return `<tr><td><code>${esc(x.key)}</code></td><td>${esc(x.user||"—")}</td><td>${esc(x.device||"—")}</td><td>${esc(fmt(x.expires_at))}</td><td><span class="badge ${st[1]}">${st[0]}</span></td><td><div class="actions"><button class="btn small" onclick="editKey('${x.id}')">SỬA</button></div></td></tr>`
 }).join("")||`<tr><td colspan="6" style="text-align:center;color:#77809b;padding:35px">Chưa có Key</td></tr>`;
}
async function create(){
 try{
   let days=Math.max(1,Number($("#days").value)||30);
   let exp=$("#expiresAt").value?new Date($("#expiresAt").value).toISOString():new Date(Date.now()+days*86400000).toISOString();
   await api("POST",{action:"create",expires_at:exp});
   $("#expiresAt").value=""; await load();
 }catch(e){alert(e.message)}
}
window.editKey=function(id){
 let x=data.find(v=>v.id===id);if(!x)return;
 $("#mkey").value=x.key;$("#mkey").dataset.id=id;$("#muser").value=x.user||"";$("#mdevice").value=x.device||"";$("#mexpiry").value=localInput(x.expires_at);$("#mstatus").value=x.status||"active";$("#modal").classList.add("show");
}
$("#close").onclick=()=>$("#modal").classList.remove("show");
$("#create").onclick=create;$("#refresh").onclick=load;$("#search").oninput=render;
$("#save").onclick=async()=>{try{await api("POST",{action:"update",id:$("#mkey").dataset.id,user:$("#muser").value,device:$("#mdevice").value,expires_at:new Date($("#mexpiry").value).toISOString(),status:$("#mstatus").value});$("#modal").classList.remove("show");load()}catch(e){alert(e.message)}};
$("#delete").onclick=async()=>{if(!confirm("Xóa Key này?"))return;try{await api("POST",{action:"delete",id:$("#mkey").dataset.id});$("#modal").classList.remove("show");load()}catch(e){alert(e.message)}};
$("#deleteAll").onclick=async()=>{if(!confirm("XÓA TOÀN BỘ KEY? Không thể hoàn tác."))return;try{await api("POST",{action:"delete_all"});load()}catch(e){alert(e.message)}};
$("#export").onclick=()=>{let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download="huypc-keys.json";a.click()};
$("#importFile").onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let arr=JSON.parse(await f.text());await api("POST",{action:"import",keys:arr});load()}catch(err){alert("Import lỗi: "+err.message)}e.target.value=""};
load();
