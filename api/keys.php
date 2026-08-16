<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD']==='OPTIONS') exit;

$dbDir=__DIR__.'/../data';
if(!is_dir($dbDir)) mkdir($dbDir,0755,true);
$db=new SQLite3($dbDir.'/keys.sqlite');
$db->exec("CREATE TABLE IF NOT EXISTS keys (
 id TEXT PRIMARY KEY,
 key_code TEXT UNIQUE NOT NULL,
 user_name TEXT DEFAULT '',
 device TEXT DEFAULT '',
 expires_at TEXT NOT NULL,
 status TEXT DEFAULT 'active',
 created_at TEXT NOT NULL
)");

function out($x,int $code=200): never { http_response_code($code); echo json_encode($x,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT); exit; }
function keygen(): string {
  $p=[]; for($i=0;$i<4;$i++) $p[]=strtoupper(bin2hex(random_bytes(2)));
  return 'HUYPC-'.implode('-',$p);
}
$method=$_SERVER['REQUEST_METHOD'];

if($method==='GET'){
  $res=$db->query("SELECT id,key_code AS key,user_name AS user,device,expires_at,status,created_at FROM keys ORDER BY created_at DESC");
  $keys=[]; while($r=$res->fetchArray(SQLITE3_ASSOC)) $keys[]=$r;
  out(['ok'=>true,'keys'=>$keys]);
}

$input=json_decode(file_get_contents('php://input'),true) ?: [];
$action=$input['action'] ?? '';

if($action==='create'){
  $id=bin2hex(random_bytes(12));
  $key=keygen();
  $exp=$input['expires_at'] ?? '';
  if(!$exp) out(['error'=>'Thiếu hạn sử dụng'],400);
  $st=$db->prepare("INSERT INTO keys(id,key_code,expires_at,created_at) VALUES(:id,:key,:exp,:created)");
  $st->bindValue(':id',$id);$st->bindValue(':key',$key);$st->bindValue(':exp',$exp);$st->bindValue(':created',gmdate('c'));
  if(!$st->execute()) out(['error'=>'Không thể tạo Key'],500);
  out(['ok'=>true,'key'=>$key,'id'=>$id]);
}
if($action==='update'){
  $st=$db->prepare("UPDATE keys SET user_name=:u,device=:d,expires_at=:e,status=:s WHERE id=:id");
  foreach([[':u',$input['user']??''],[':d',$input['device']??''],[':e',$input['expires_at']??''],[':s',$input['status']??'active'],[':id',$input['id']??'']] as $v)$st->bindValue($v[0],$v[1]);
  $st->execute(); out(['ok'=>true]);
}
if($action==='delete'){
  $st=$db->prepare("DELETE FROM keys WHERE id=:id");$st->bindValue(':id',$input['id']??'');$st->execute();out(['ok'=>true]);
}
if($action==='delete_all'){
  $db->exec("DELETE FROM keys");out(['ok'=>true]);
}
if($action==='import'){
  $db->exec("DELETE FROM keys");
  foreach(($input['keys']??[]) as $x){
    $st=$db->prepare("INSERT OR REPLACE INTO keys(id,key_code,user_name,device,expires_at,status,created_at) VALUES(:id,:k,:u,:d,:e,:s,:c)");
    $st->bindValue(':id',$x['id']??bin2hex(random_bytes(12)));
    $st->bindValue(':k',$x['key']??'');$st->bindValue(':u',$x['user']??'');$st->bindValue(':d',$x['device']??'');
    $st->bindValue(':e',$x['expires_at']??gmdate('c'));$st->bindValue(':s',$x['status']??'active');$st->bindValue(':c',$x['created_at']??gmdate('c'));$st->execute();
  }
  out(['ok'=>true]);
}
out(['error'=>'Action không hợp lệ'],400);
?>