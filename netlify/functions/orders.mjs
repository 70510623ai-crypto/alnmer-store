import {getStore} from '@netlify/blobs';
import {randomUUID} from 'node:crypto';
import {json,isAdmin,cleanText} from './shared.mjs';
import {uploadTokenFor} from './order-files.mjs';
const statuses=['جديد','قيد التنفيذ','جاهز','مسلّم','ملغي'];
export default async(request)=>{
 try{
  const store=getStore('alnmer-orders');
  if(request.method==='POST'){
   if(Number(request.headers.get('content-length')||'0')>30000)return json({error:'الطلب كبير'},413);
   const data=await request.json();
   if(data.website) return json({ok:true,id:'submitted'}); // honeypot
   const name=cleanText(data.name,90), phone=cleanText(data.phone,35), note=cleanText(data.note,700), fulfillment=data.fulfillment==='delivery'?'delivery':'pickup',deliveryAddress=cleanText(data.deliveryAddress,250);
   if((fulfillment==='delivery'&&deliveryAddress.length<5)||name.length<2||!/^[+\d\s()-]{7,25}$/.test(phone)||!Array.isArray(data.items)||!data.items.length||data.items.length>25) return json({error:'يرجى إدخال اسم ورقم صحيح وخدمة واحدة على الأقل'},400);
   const items=data.items.map(item=>({
    serviceId:cleanText(item.serviceId,45), title:cleanText(item.title,100),
    width:Number(item.width)||0,height:Number(item.height)||0,quantity:Number(item.quantity),
    material:cleanText(item.material,80),notes:cleanText(item.notes,300)
   }));
   if(items.some(i=>!i.title||i.quantity<1||i.quantity>5000||!Number.isInteger(i.quantity)||i.width<0||i.width>10000||i.height<0||i.height>10000))return json({error:'بيانات القياسات أو الكميات غير صحيحة'},400);
   // Only filenames and sizes are recorded; customer files remain on their own device.
   const whatsappFiles=Array.isArray(data.whatsappFiles)?data.whatsappFiles.slice(0,20).map(f=>({name:cleanText(f.name,120),size:Math.max(0,Number(f.size)||0),serviceId:cleanText(f.serviceId,45)})).filter(f=>f.name&&Number.isFinite(f.size)):[];
   const id='AN-'+Date.now().toString(36).toUpperCase()+'-'+randomUUID().slice(0,5).toUpperCase();
   const order={id,name,phone,note,fulfillment,deliveryAddress,deliveryPrice:'حسب الطلب',items,attachments:[],whatsappFiles,status:'جديد',createdAt:new Date().toISOString()};
   await store.setJSON(id,order);
   return json({ok:true,id,uploadToken:uploadTokenFor(id)});
  }
  if(!isAdmin(request))return json({error:'كلمة المرور غير صحيحة أو لم تُضبط على Netlify'},401);
  if(request.method==='GET'){
   let keys=[];
   for await (const page of store.list({paginate:true})){ keys.push(...page.blobs.map(b=>b.key)); if(keys.length>2000)break; }
   keys.sort().reverse();
   const orders=(await Promise.all(keys.slice(0,500).map(key=>store.get(key,{type:'json'})))).filter(Boolean);
   orders.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
   return json({orders});
  }
  if(request.method==='PATCH'){
   const {id,status}=await request.json();
   if(typeof id!=='string'||!/^AN-[A-Z0-9-]{5,40}$/.test(id)||!statuses.includes(status))return json({error:'البيانات غير صحيحة'},400);
   const order=await store.get(id,{type:'json',consistency:'strong'});
   if(!order)return json({error:'الطلب غير موجود'},404);
   order.status=status;order.updatedAt=new Date().toISOString();
   await store.setJSON(id,order);
   return json({ok:true,order});
  }
  return json({error:'طريقة غير مدعومة'},405);
 }catch(error){console.error('orders',error);return json({error:'تعذر حفظ أو قراءة الطلبات'},503)}
};
