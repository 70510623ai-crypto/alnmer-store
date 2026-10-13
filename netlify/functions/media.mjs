import {randomUUID} from 'node:crypto';
import {getStore} from '@netlify/blobs';
import {json,isAdmin} from './shared.mjs';

const MAX_BYTES = 2_800_000; // Under typical Netlify Function request size limits.
const keyPattern=/^[a-f0-9-]{36}\.(?:webp|png|jpg)$/;
const types={'image/webp':'webp','image/png':'png','image/jpeg':'jpg'};
const mimeForExt={webp:'image/webp',png:'image/png',jpg:'image/jpeg'};
function validSignature(bytes,mime){
 if(mime==='image/jpeg')return bytes.length>4 && bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
 if(mime==='image/png')return bytes.length>8 && [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 if(mime==='image/webp')return bytes.length>12 && String.fromCharCode(...bytes.subarray(0,4))==='RIFF' && String.fromCharCode(...bytes.subarray(8,12))==='WEBP';
 return false;
}
export default async (request)=>{
 try{
  if(request.method==='GET'){
   const key=new URL(request.url).searchParams.get('key')||'';
   if(!keyPattern.test(key))return new Response('Not found',{status:404});
   const store=getStore({name:'alnmer-product-images',consistency:'strong'});
   const content=await store.get(key,{type:'arrayBuffer'});
   if(content===null)return new Response('Not found',{status:404});
   const ext=key.split('.').at(-1);
   return new Response(content,{status:200,headers:{'Content-Type':mimeForExt[ext],'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
  }
  if(request.method==='POST'){
   if(!isAdmin(request))return json({error:'غير مسموح برفع الصور. سجل دخولك كمدير.'},401);
   const mime=(request.headers.get('content-type')||'').split(';')[0].toLowerCase().trim();
   if(!types[mime])return json({error:'الصيغ المتاحة JPG أو PNG أو WebP فقط'},415);
   const declared=Number(request.headers.get('content-length')||0);
   if(declared>MAX_BYTES)return json({error:'حجم الصورة كبير جداً، اختر صورة أصغر'},413);
   const content=await request.arrayBuffer();
   if(content.byteLength<50||content.byteLength>MAX_BYTES)return json({error:'حجم الصورة غير مناسب (الحد 2.8 ميغابايت)'},413);
   if(!validSignature(new Uint8Array(content),mime))return json({error:'ملف الصورة غير صالح'},400);
   const key=randomUUID()+'.'+types[mime];
   const store=getStore({name:'alnmer-product-images',consistency:'strong'});
   await store.set(key,content);
   return json({ok:true,imageKey:key,imageUrl:'/api/media?key='+encodeURIComponent(key)},201);
  }
  return json({error:'طريقة غير مدعومة'},405);
 }catch(error){console.error('media upload',error);return json({error:'تعذر رفع الصورة، جرّب مرة ثانية'},503)}
};
