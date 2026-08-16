<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if($_SERVER['REQUEST_METHOD']==='OPTIONS') exit;

$db=new SQLite3(__DIR__.'/../data/keys.sqlite');
$db->exec("CREATE TABLE IF NOT EXISTS keys (id TEXT PRIMARY KEY,key_code TEXT UNIQUE NOT NULL,user_name TEXT DEFAULT '',device TEXT DEFAULT '',expires_at TEXT NOT NULL,status TEXT DEFAULT 'active',created_at TEXT NOT NULL)");
$in=json_decode(file_get_contents('php://input'),true) ?: $_POST;
$key=trim((string)($in['key']??''));
if($key===''){http_response_code(400);echo json_encode(['valid'=>false,'error'=>'KEY_REQUIRED']);exit;}
$st=$db->prepare("SELECT id,key_code,user_name,device,expires_at,status FROM keys WHERE key_code=:k LIMIT 1");$st->bindValue(':k',$key);
$r=$st->execute()->fetchArray(SQLITE3_ASSOC);
if(!$r){echo json_encode(['valid'=>false,'error'=>'KEY_NOT_FOUND']);exit;}
if($r['status']!=='active'){echo json_encode(['valid'=>false,'error'=>'KEY_REVOKED']);exit;}
if(strtotime($r['expires_at'])<=time()){echo json_encode(['valid'=>false,'error'=>'KEY_EXPIRED','expires_at'=>$r['expires_at']]);exit;}
echo json_encode(['valid'=>true,'key'=>$r['key_code'],'user'=>$r['user_name'],'device'=>$r['device'],'expires_at'=>$r['expires_at']]);
?>