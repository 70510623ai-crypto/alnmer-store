import {getStore} from '@netlify/blobs';
import {DEFAULT_PRODUCTS,json,isAdmin,validProduct} from './shared.mjs';
export default async (request)=>{
 try{
  const store=getStore('alnmer-catalog');
  if(request.method==='GET'){
   let saved=await store.get('products',{type:'json',consistency:'strong'});
   // One-time migration: preserve all existing custom images, prices, and deleted services.
   if(Array.isArray(saved)){
    const migrated=await store.get('premium-services-v3');
    if(migrated===null){
     const added=DEFAULT_PRODUCTS.filter(x=>['passport','pdf','photoprint','installation'].includes(x.id)&&!saved.some(y=>y.id===x.id));
     if(added.length){saved=[...saved,...added];await store.setJSON('products',saved);}
     await store.set('premium-services-v3','yes');
    }
   }
   return json({products:Array.isArray(saved)?saved:DEFAULT_PRODUCTS});
  }
  if(request.method==='PUT'){
   if(!isAdmin(request)) return json({error:'غير مصرح. تأكد من كلمة مرور لوحة التحكم وإعداد ADMIN_PASSWORD.'},401);
   if(Number(request.headers.get('content-length')||'0')>100000) return json({error:'البيانات كبيرة'},413);
   const data=await request.json();
   if(!Array.isArray(data.products)||data.products.length>60) return json({error:'بيانات الخدمات غير صالحة'},400);
   const products=data.products.map(validProduct);
   if(products.some(x=>!x)||new Set(products.map(x=>x.id)).size!==products.length)return json({error:'أسماء أو أسعار أو معرّفات غير صالحة'},400);
   await store.setJSON('products',products);
   return json({ok:true,products});
  }
  return json({error:'طريقة غير مدعومة'},405);
 }catch(error){console.error('catalog',error);return json({error:'تعذر الاتصال بتخزين المتجر'},503)}
};
