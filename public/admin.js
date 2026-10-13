const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const units={quote:'حسب الطلب',m2:'للمتر المربع',meter:'للمتر الطولي',piece:'للقطعة'};
const arts=['flex','acp','engraved','vinyl','cars','mesh','laser','cards','canvas','photos','passport','pdf','photoprint','installation'];
const statuses=['جديد','قيد التنفيذ','جاهز','مسلّم','ملغي'];
const state={password:'',products:[],orders:[],tab:'overview',editId:null,chosenArt:'flex',chosenImageKey:'',uploadingImage:false,previewURL:'',openOrder:null};
const money=n=>'$'+Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
function message(msg){const e=$('#toast');e.textContent=msg;e.classList.add('show');clearTimeout(window._toast);window._toast=setTimeout(()=>e.classList.remove('show'),3000)}
function alertError(msg){const el=$('#alert');el.hidden=!msg;el.textContent=msg;}
async function api(path,opts={}){const resp=await fetch('/api/'+path,{...opts,headers:{...opts.headers,'Authorization':'Bearer '+state.password,'Content-Type':'application/json'},signal:AbortSignal.timeout(12000)});let result={};try{result=await resp.json()}catch{}if(!resp.ok)throw Error(result.error||'تعذر الاتصال بالخادم');return result;}
async function login(ev){ev.preventDefault();const pwd=$('#password').value;$('#loginError').textContent='عم نتحقق من الدخول...';state.password=pwd;try{const [catalog,orders]=await Promise.all([api('catalog'),api('orders')]);state.products=catalog.products||[];state.orders=orders.orders||[];$('#loginScreen').hidden=true;$('#dashboard').hidden=false;$('#loginError').textContent='';render();}catch(err){$('#loginError').textContent=err.message;state.password='';}}
function showTab(tab){state.tab=tab;document.querySelectorAll('.view').forEach(e=>e.hidden=e.id!==`view-${tab}`);document.querySelectorAll('[data-tab]').forEach(e=>e.classList.toggle('active',e.dataset.tab===tab));$('#pageTitle').textContent={overview:'نظرة عامة',orders:'طلبات الزبائن',products:'الخدمات والأسعار'}[tab];render()}
function render(){const o=state.orders;$('#ordersBadge').textContent=o.filter(x=>x.status==='جديد').length;$('#statTotal').textContent=o.length;$('#statNew').textContent=o.filter(x=>x.status==='جديد').length;$('#statDoing').textContent=o.filter(x=>x.status==='قيد التنفيذ').length;$('#statProducts').textContent=state.products.filter(x=>x.enabled!==false).length;$('#recentOrders').innerHTML=state.orders.length?state.orders.slice(0,5).map(orderRow).join(''):'<div class="empty">لا توجد طلبات محفوظة بعد.</div>';renderOrders();renderProducts();}
function orderRow(o){const time=new Date(o.createdAt).toLocaleString('ar-LB',{dateStyle:'medium',timeStyle:'short'});return `<div class="order-row"><div class="order-row-main"><b>${esc(o.name)} • ${esc(o.id)}</b><small>${esc(o.phone)} · ${esc(time)} · ${o.items?.length||0} خدمة</small></div><div class="order-meta"><span class="status" data-state="${esc(o.status)}">${esc(o.status)}</span><button data-toggle-order="${esc(o.id)}">${state.openOrder===o.id?'إغلاق':'تفاصيل'}</button></div></div>${state.openOrder===o.id?orderDetails(o):''}`}
function orderDetails(o){return `<div class="order-details"><p><b>اسم الزبون:</b> ${esc(o.name)} | <b>رقم الهاتف:</b> <span dir="ltr">${esc(o.phone)}</span></p>${(o.items||[]).map((i,k)=>`<p>${k+1}. <b>${esc(i.title)}</b> — الكمية ${i.quantity}${i.width?` | العرض ${i.width} سم`:''}${i.height?` | الارتفاع ${i.height} سم`:''}${i.material?` | ${esc(i.material)}`:''}${i.notes?` | ${esc(i.notes)}`:''}</p>`).join('')}<p><b>طريقة الاستلام:</b> ${o.fulfillment==='delivery'?'دليفري — سعر الدليفري حسب الطلب':'من المطبعة'}${o.fulfillment==='delivery'&&o.deliveryAddress?' | <b>عنوان الدليفري:</b> '+esc(o.deliveryAddress):''}</p>${o.note?`<p><b>ملاحظات:</b> ${esc(o.note)}</p>`:''}<label>حالة الطلب<select data-set-status="${esc(o.id)}">${statuses.map(s=>`<option value="${s}" ${s===o.status?'selected':''}>${s}</option>`).join('')}</select></label><a href="https://wa.me/${esc(o.phone.replace(/[^\d]/g,'').replace(/^0/,'961'))}?text=${encodeURIComponent('مرحباً، من مطبعة النمر بخصوص الطلب '+o.id)}" target="_blank" rel="noopener">التواصل مع الزبون واتساب ↗</a></div>`}
function renderOrders(){const filter=$('#statusFilter').value;const items=state.orders.filter(o=>filter==='all'||o.status===filter);$('#orderList').innerHTML=items.length?items.map(orderRow).join(''):'<div class="empty">ما في طلبات ضمن هالفئة.</div>'}
function renderProducts(){$('#productsList').innerHTML=state.products.length?state.products.map(p=>`<div class="prod-row"><div class="prod-main">${p.imageKey?`<img class="prod-thumb prod-img" src="/api/media?key=${encodeURIComponent(p.imageKey)}" alt="${esc(p.title)}" loading="lazy">`:'<span class="prod-thumb"></span>'}<div><b>${esc(p.title)} ${p.enabled===false?'(مخفي)':''}</b><small>${p.price==null||p.unit==='quote'?'تسعير حسب الطلب':money(p.price)+' '+units[p.unit]}</small></div></div><div class="prod-actions"><button data-edit="${esc(p.id)}">تعديل</button><button class="delete" data-delete="${esc(p.id)}">حذف</button></div></div>`).join(''):'<div class="empty">لم تضف خدمات بعد.</div>'}
async function reload(){try{alertError('');const [catalog,orders]=await Promise.all([api('catalog'),api('orders')]);state.products=catalog.products||[];state.orders=orders.orders||[];render();message('تحدّثت البيانات بنجاح')}catch(err){alertError(err.message)}}
function openProduct(id){const p=state.products.find(p=>p.id===id);state.editId=p?p.id:null;state.chosenArt=p?.art||'flex';state.chosenImageKey=p?.imageKey||'';state.uploadingImage=false;$('#productImage').value='';$('#imageStatus').textContent='';if(state.previewURL){URL.revokeObjectURL(state.previewURL);state.previewURL='';}updateImagePreview();$('#productModalTitle').textContent=p?'تعديل الخدمة':'إضافة خدمة جديدة';const f=$('#productForm');f.reset();f.elements.title.value=p?.title||'';f.elements.category.value=p?.category||'printing';f.elements.subtitle.value=p?.subtitle||'';f.elements.unit.value=p?.unit||'quote';f.elements.price.value=p?.price??'';f.elements.tags.value=(p?.tags||[]).join(', ');f.elements.enabled.checked=p?.enabled!==false;renderArtChoices();$('#productModal').showModal()}
function updateImagePreview(){
 const img=$('#imagePreview');const placeholder=$('#imagePlaceholder');
 const src=state.previewURL || (state.chosenImageKey?'/api/media?key='+encodeURIComponent(state.chosenImageKey):'');
 img.hidden=!src;placeholder.hidden=!!src;
 if(src)img.src=src;else img.removeAttribute('src');
 $('#removeProductImage').disabled=!src;
}
async function optimizeImage(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('اختار صورة JPG أو PNG أو WebP');
 if(file.size>15*1024*1024)throw Error('الصورة الأصلية كبيرة جداً (أكثر من 15MB)');
 const bitmap=await createImageBitmap(file);
 try{
  const scale=Math.min(1,1600/bitmap.width,1200/bitmap.height);
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('تعذر تجهيز الصورة');
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  let quality=.82;
  let blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
  while(blob && blob.size>2_700_000 && quality>.42){quality-=.15;blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));}
  if(!blob||blob.size>2_700_000)throw Error('الصورة كبيرة، جرّب صورة أصغر');
  return blob;
 }finally{bitmap.close?.()}
}
async function uploadProductImage(file){
 if(!file)return;
 const status=$('#imageStatus');const button=$('#productSaveButton');const oldImageKey=state.chosenImageKey;
 state.uploadingImage=true;button.disabled=true;status.textContent='جاري تجهيز ورفع الصورة...';
 if(state.previewURL)URL.revokeObjectURL(state.previewURL);
 state.previewURL=URL.createObjectURL(file);updateImagePreview();
 try{
  const image=await optimizeImage(file);
  const response=await fetch('/api/media',{method:'POST',headers:{'Authorization':'Bearer '+state.password,'Content-Type':image.type},body:image,signal:AbortSignal.timeout(30000)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok || !data.imageKey)throw Error(data.error||'تعذر رفع الصورة');
  state.chosenImageKey=data.imageKey;
  status.textContent='✓ الصورة جاهزة. اضغط حفظ الخدمة لتظهر بالمتجر.';
  message('انرفعت الصورة بنجاح');
 }catch(err){state.chosenImageKey=oldImageKey;status.textContent='✕ '+err.message+' (الصورة السابقة محفوظة)';alertError(err.message);}
 finally{state.uploadingImage=false;button.disabled=false;}
}
function renderArtChoices(){$('#artChoices').innerHTML=arts.map(a=>`<button type="button" data-art="${a}" class="${state.chosenArt===a?'selected':''}">${a}</button>`).join('')}
async function persist(products){const response=await api('catalog',{method:'PUT',body:JSON.stringify({products})});state.products=response.products;render();message('انحفظت التغييرات على المتجر')}
function slug(s){return s.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').slice(0,35)||'service'}
async function saveProduct(e){e.preventDefault();if(state.uploadingImage){message('انتظر حتى يكتمل رفع الصورة');return;}const f=e.currentTarget;const title=f.elements.title.value.trim();const pOld=state.products.find(p=>p.id===state.editId);const id=pOld?.id||'service-'+Date.now().toString(36)+'-'+slug(title).replace(/[^a-z0-9-]/g,'').slice(0,9);const price=f.elements.price.value.trim();const product={id,title,subtitle:f.elements.subtitle.value.trim(),category:f.elements.category.value,unit:f.elements.unit.value,price:price===''?null:Number(price),enabled:f.elements.enabled.checked,art:state.chosenArt,imageKey:state.chosenImageKey,tags:f.elements.tags.value.split(',').map(s=>s.trim()).filter(Boolean).slice(0,4)};
try{const updated=pOld?state.products.map(p=>p.id===state.editId?product:p):[...state.products,product];await persist(updated);$('#productModal').close();if(state.previewURL){URL.revokeObjectURL(state.previewURL);state.previewURL='';}}catch(err){alertError(err.message);message('تعذر حفظ الخدمة')}}
async function deleteProduct(id){const p=state.products.find(p=>p.id===id);if(!p||!confirm('بدك تحذف خدمة «'+p.title+'» من المتجر؟'))return;try{await persist(state.products.filter(x=>x.id!==id))}catch(err){alertError(err.message)}}
async function setStatus(id,status){try{const result=await api('orders',{method:'PATCH',body:JSON.stringify({id,status})});state.orders=state.orders.map(x=>x.id===id?result.order:x);render();message('تغيّرت حالة الطلب')}catch(err){alertError(err.message);render()}}
$('#loginForm').addEventListener('submit',login);$('#refresh').addEventListener('click',reload);$('#logout').addEventListener('click',()=>{state.password='';state.orders=[];state.products=[];$('#password').value='';$('#dashboard').hidden=true;$('#loginScreen').hidden=false});$('#seeOrders').addEventListener('click',()=>showTab('orders'));document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));$('#statusFilter').addEventListener('change',renderOrders);$('#addProduct').addEventListener('click',()=>openProduct(null));$('#productForm').addEventListener('submit',saveProduct);$('#productImage').addEventListener('change',e=>{if(e.target.files?.[0])uploadProductImage(e.target.files[0]);});$('#removeProductImage').addEventListener('click',()=>{if(state.uploadingImage)return;state.chosenImageKey='';$('#productImage').value='';if(state.previewURL){URL.revokeObjectURL(state.previewURL);state.previewURL='';}$('#imageStatus').textContent='ستنحذف الصورة عند حفظ الخدمة.';updateImagePreview();});$('#cancelModal').addEventListener('click',()=>$('#productModal').close());$('#closeModal').addEventListener('click',()=>$('#productModal').close());
document.addEventListener('click',e=>{const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]'),toggle=e.target.closest('[data-toggle-order]'),art=e.target.closest('[data-art]');if(edit)openProduct(edit.dataset.edit);if(del)deleteProduct(del.dataset.delete);if(toggle){state.openOrder=state.openOrder===toggle.dataset.toggleOrder?null:toggle.dataset.toggleOrder;render()}if(art){state.chosenArt=art.dataset.art;renderArtChoices()}});
document.addEventListener('change',e=>{const el=e.target.closest('[data-set-status]');if(el)setStatus(el.dataset.setStatus,el.value)});
