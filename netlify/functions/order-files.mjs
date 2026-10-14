import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { isAdmin, json } from './shared.mjs';

// Uploads are private: a customer can upload only to their just-created order,
// while retrieving any file requires the administrator password.
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_FILES_PER_ORDER = 6;
const MAX_ORDER_BYTES = 18 * 1024 * 1024;
const ORDER_ID = /^AN-[A-Z0-9-]{5,40}$/;
const FILE_ID = /^[a-f0-9-]{36}$/;
const formats = {
 'application/pdf': 'pdf',
 'image/jpeg': 'jpg',
 'image/png': 'png',
 'image/webp': 'webp',
 'image/heic': 'heic',
 'image/heif': 'heif',
};

export function uploadTokenFor(orderId) {
 const secret = process.env.ADMIN_PASSWORD;
 if (!secret || secret.length < 12) throw new Error('ADMIN_PASSWORD is not configured');
 return createHmac('sha256', secret).update('alnmer-customer-files-v1:' + orderId).digest('hex');
}

function hasUploadAccess(request, orderId) {
 const provided = request.headers.get('x-upload-token') || '';
 if (!/^[a-f0-9]{64}$/.test(provided)) return false;
 const expected = uploadTokenFor(orderId);
 return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

function detectedFormat(bytes, mime) {
 if (mime === 'application/pdf') return bytes.length >= 8 && String.fromCharCode(...bytes.subarray(0, 5)) === '%PDF-';
 if (mime === 'image/jpeg') return bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
 if (mime === 'image/png') return bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v);
 if (mime === 'image/webp') return bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0,4)) === 'RIFF' && String.fromCharCode(...bytes.subarray(8,12)) === 'WEBP';
 if (mime === 'image/heic' || mime === 'image/heif') {
  if (bytes.length < 16 || String.fromCharCode(...bytes.subarray(4,8)) !== 'ftyp') return false;
  const brand = String.fromCharCode(...bytes.subarray(8,12));
  return ['heic','heix','hevc','hevx','heim','heis','hevm','hevs','mif1','msf1'].includes(brand);
 }
 return false;
}

function cleanFilename(header, ext) {
 let name = '';
 try { name = decodeURIComponent(header || ''); } catch { name = ''; }
 name = name.replace(/[\\/\x00-\x1f\x7f]/g, '_').trim().slice(0,120);
 return name || `file.${ext}`;
}

export default async function handler(request) {
 try {
  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId') || '';
  if (!ORDER_ID.test(orderId)) return json({error:'رقم الطلب غير صالح'},400);
  const orders = getStore({name:'alnmer-orders',consistency:'strong'});

  if (request.method === 'POST') {
   if (!hasUploadAccess(request, orderId)) return json({error:'لا يوجد تصريح لرفع الملفات لهذا الطلب'},403);
   const declared = Number(request.headers.get('content-length') || 0);
   if (declared > MAX_FILE_BYTES) return json({error:'حجم الملف أكبر من 4 ميغابايت. أرسله على واتساب.'},413);
   const mime = (request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
   const ext = formats[mime];
   if (!ext) return json({error:'يمكن رفع JPG وPNG وWebP وHEIC وPDF فقط'},415);
   const buffer = await request.arrayBuffer();
   if (buffer.byteLength < 8 || buffer.byteLength > MAX_FILE_BYTES) return json({error:'حجم الملف غير مناسب (الحد الأقصى 4 ميغابايت)'},413);
   if (!detectedFormat(new Uint8Array(buffer), mime)) return json({error:'محتوى الملف لا يطابق نوعه أو الملف تالف'},400);
   const order = await orders.get(orderId,{type:'json',consistency:'strong'});
   if (!order) return json({error:'الطلب غير موجود'},404);
   if (!Array.isArray(order.attachments)) order.attachments = [];
   if (order.attachments.length >= MAX_FILES_PER_ORDER || order.attachments.reduce((n,a) => n + (a.size||0),0) + buffer.byteLength > MAX_ORDER_BYTES) return json({error:'وصل الطلب للحد الأقصى للملفات'},413);
   // Only allow attachments shortly after checkout. Customer authorization is not permanent.
   if (Date.now() - Date.parse(order.createdAt) > 2 * 60 * 60 * 1000) return json({error:'انتهت مهلة رفع الملفات لهذا الطلب؛ أرسلها على واتساب'},403);
   const fileId = randomUUID();
   const name = cleanFilename(request.headers.get('x-file-name'), ext);
   const serviceId = (request.headers.get('x-service-id')||'').replace(/[^a-z0-9_-]/gi,'').slice(0,45);
   const file = {id:fileId,name,mime,size:buffer.byteLength,serviceId,createdAt:new Date().toISOString()};
   const storage = getStore({name:'alnmer-private-order-files',consistency:'strong'});
   await storage.set(`${orderId}/${fileId}`,buffer);
   order.attachments.push(file);
   await orders.setJSON(orderId,order);
   return json({ok:true,file},201);
  }

  if (request.method === 'GET') {
   if (!isAdmin(request)) return json({error:'الدخول إلى ملفات الزبائن مخصّص لإدارة المطبعة'},401);
   const fileId = url.searchParams.get('fileId') || '';
   if (!FILE_ID.test(fileId)) return json({error:'الملف غير موجود'},404);
   const order = await orders.get(orderId,{type:'json',consistency:'strong'});
   const meta = order?.attachments?.find(f => f.id === fileId);
   if (!meta) return json({error:'الملف غير موجود بهذا الطلب'},404);
   const storage = getStore({name:'alnmer-private-order-files',consistency:'strong'});
   const bytes = await storage.get(`${orderId}/${fileId}`,{type:'arrayBuffer'});
   if (bytes === null) return json({error:'تعذر العثور على الملف المخزّن'},404);
   const disposition = `attachment; filename="attachment.${formats[meta.mime]||'bin'}"; filename*=UTF-8''${encodeURIComponent(meta.name)}`;
   return new Response(bytes,{status:200,headers:{'Content-Type':meta.mime,'Content-Disposition':disposition,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':'sandbox'}});
  }
  return json({error:'طريقة غير مدعومة'},405);
 } catch (error) {
  console.error('order files',error);
  return json({error:'حصل خطأ بحفظ أو تحميل الملف. جرّب مرة ثانية.'},503);
 }
}
