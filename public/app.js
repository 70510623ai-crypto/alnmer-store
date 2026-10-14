const WA_NUMBER='96170510623';
const DEFAULT_PRODUCTS=[
{id:'flex',title:'قارمات فليكس بانر',subtitle:'واجهات المحلات والإعلانات الخارجية',category:'signs',unit:'m2',price:null,enabled:true,art:'flex',tags:['خارجي','قياسات خاصة']},
{id:'acp',title:'قارمات أليكوبوند',subtitle:'واجهات حديثة ومظهر فاخر',category:'signs',unit:'m2',price:null,enabled:true,art:'acp',tags:['واجهات','تركيب']},
{id:'engraved',title:'أليكوبوند محفور',subtitle:'حفر دقيق للشعارات واللوحات',category:'signs',unit:'m2',price:null,enabled:true,art:'engraved',tags:['حفر','تصميم']},
{id:'vinyl',title:'طباعة فينيل',subtitle:'لاصق للجدران والواجهات والزجاج',category:'printing',unit:'m2',price:null,enabled:true,art:'vinyl',tags:['لاصق','زجاج']},
{id:'cars',title:'فينيل سيارات',subtitle:'براندينغ وتغليف السيارات',category:'printing',unit:'quote',price:null,enabled:true,art:'cars',tags:['سيارات','تغليف']},
{id:'mesh',title:'طباعة ميش للزجاج',subtitle:'ملصقات مثقبة للواجهات الزجاجية',category:'printing',unit:'m2',price:null,enabled:true,art:'mesh',tags:['زجاج','واجهات']},
{id:'laser',title:'قص وحفر ليزر',subtitle:'خشب وأكريليك وهدايا مخصصة',category:'laser',unit:'quote',price:null,enabled:true,art:'laser',tags:['ليزر','حسب الطلب']},
{id:'cards',title:'كروت شخصية',subtitle:'بطاقات أعمال بهويتك الخاصة',category:'printing',unit:'piece',price:null,enabled:true,art:'cards',tags:['هوية','شركات']},
{id:'canvas',title:'طباعة كانفاس',subtitle:'صور ولوحات فنية للديكور',category:'printing',unit:'m2',price:null,enabled:true,art:'canvas',tags:['ديكور','صور']},
{id:'photos',title:'طباعة صور ومستندات',subtitle:'خدمات متنوعة للطباعة حسب طلبك',category:'printing',unit:'quote',price:null,enabled:true,art:'photos',tags:['صور','مستندات']},
 {id:'passport',title:'صور هوية وباسبور',subtitle:'صور رسمية للهوية وجواز السفر حسب المواصفات المطلوبة',category:'photos',unit:'quote',price:null,enabled:true,art:'passport',tags:['صور رسمية','باسبور']},
 {id:'pdf',title:'طباعة ملفات PDF',subtitle:'طباعة مستندات أبيض وأسود أو ملوّن، وجه واحد أو وجهين',category:'printing',unit:'quote',price:null,enabled:true,art:'pdf',tags:['مستندات','PDF']},
 {id:'photoprint',title:'تظهير وطباعة الصور',subtitle:'صور شخصية وعائلية بقياسات متعددة',category:'photos',unit:'quote',price:null,enabled:true,art:'photoprint',tags:['صور','ذكريات']},
 {id:'installation',title:'فك وتركيب القارمات',subtitle:'فك القارمات القديمة وتركيب الجديدة حسب الموقع والقياس',category:'signs',unit:'quote',price:null,enabled:true,art:'installation',tags:['فك','تركيب']}
];
const state={products:DEFAULT_PRODUCTS,cart:readCart(),filter:'all',search:'',selected:null,configFiles:[],cartFiles:new Map(),checkoutFiles:[],uploadSession:null,pendingWhatsapp:null};
const $=s=>document.querySelector(s);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
const unitLabel={m2:'للمتر المربع',meter:'للمتر',piece:'للقطعة',quote:''};
function readCart(){try{const c=JSON.parse(localStorage.getItem('alnmer-cart-v1')||'[]');return Array.isArray(c)?c.slice(0,25):[]}catch{return []}}
function saveCart(){try{localStorage.setItem('alnmer-cart-v1',JSON.stringify(state.cart))}catch{} $('#cartCount').textContent=state.cart.length;}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('visible');clearTimeout(window._toastTime);window._toastTime=setTimeout(()=>el.classList.remove('visible'),3200)}
function priceOf(p,q=1,w=0,h=0){if(p.price==null||p.unit==='quote')return null;const base=Number(p.price);if(p.unit==='piece')return base*q;if(p.unit==='meter')return w>0?base*w/100*q:null;if(p.unit==='m2')return w>0&&h>0?base*w*h/10000*q:null;return null}
const PHOTO_KEY_RE=/^[a-f0-9-]{36}\.(?:webp|png|jpg)$/;
function productPhotos(p){return [...new Set([p.imageKey,...(Array.isArray(p.galleryKeys)?p.galleryKeys:[])].filter(k=>typeof k==='string' && PHOTO_KEY_RE.test(k)))].slice(0,8)}
const galleryState={item:null,images:[],active:0};
function showGallery(id){const p=state.products.find(x=>x.id===id);if(!p)return;const images=productPhotos(p);if(!images.length)return;galleryState.item=p;galleryState.images=images;galleryState.active=0;$('#galleryTitle').textContent=p.title;displayGallery();$('#galleryDialog').showModal()}
function displayGallery(){const {images,active}=galleryState;if(!images.length)return;$('#galleryLargeImage').src='/api/media?key='+encodeURIComponent(images[active]);$('#galleryLargeImage').alt=galleryState.item.title+' — صورة '+(active+1);$('#galleryCounter').textContent=(active+1)+' / '+images.length;$('#galleryThumbnails').innerHTML=images.map((key,i)=>`<button type="button" data-gallery-index="${i}" class="${i===active?'selected':''}" aria-label="الصورة ${i+1}" aria-pressed="${i===active}"><img src="/api/media?key=${encodeURIComponent(key)}" alt="صورة ${i+1}" loading="lazy"></button>`).join('');$('#galleryPrev').disabled=$('#galleryNext').disabled=images.length<2;}
function stepGallery(direction){if(!galleryState.images.length)return;galleryState.active=(galleryState.active+direction+galleryState.images.length)%galleryState.images.length;displayGallery()}
function art(p){const primary=productPhotos(p)[0];if(primary)return `<div class="product-art product-photo"><img src="/api/media?key=${encodeURIComponent(primary)}" alt="${esc(p.title)}" loading="lazy" decoding="async"></div>`;const artId=['flex','acp','engraved','vinyl','cars','mesh','laser','cards','canvas','photos','passport','pdf','photoprint','installation'].includes(p.art)?p.art:'flex';return `<div class="product-art art-${artId}"><span class="art-label">ALNMER / PRINT</span><span class="graphic-shape g1"></span><span class="graphic-shape g2"></span></div>`}
function productCard(p){const label=p.price==null||p.unit==='quote'?'السعر حسب الطلب':`${money(p.price)} <small>${unitLabel[p.unit]}</small>`;
return `<article class="product" data-category="${esc(p.category)}">${art(p)}${productPhotos(p).length?`<button class="gallery-visit" type="button" data-gallery="${esc(p.id)}">⌕ شاهد أعمالنا ${productPhotos(p).length>1?`(${productPhotos(p).length} صور)`:""}</button>`:""}<div class="product-content"><h3>${esc(p.title)}</h3><p>${esc(p.subtitle)}</p><div class="tags">${(p.tags||[]).map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="product-bottom"><div><span class="price-label">${p.price==null||p.unit==='quote'?'التسعير':'يبدأ السعر من'}</span><span class="price-val">${label}</span></div><button type="button" class="add-btn" data-product="${esc(p.id)}">اطلب الآن +</button></div></div></article>`}
function renderProducts(){const items=state.products.filter(p=>p.enabled!==false&&(state.filter==='all'||p.category===state.filter)&&(`${p.title} ${p.subtitle}`).toLowerCase().includes(state.search));$('#catalogGrid').innerHTML=items.length?items.map(productCard).join(''):'<div class="no-results">ما لقينا خدمات بهالبحث. جرّب كلمة تانية أو ابعتلنا على واتساب.</div>'}
function openDrawer(){renderCart();$('#overlay').hidden=false;$('#drawer').classList.add('open');$('#drawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function closeDrawer(){ $('#drawer').classList.remove('open');$('#drawer').setAttribute('aria-hidden','true');$('#overlay').hidden=true;document.body.style.overflow=''}
function config(p){state.selected=p;$('#configTitle').textContent=p.title;$('#configSubtitle').textContent=p.subtitle;$('#configForm').reset();state.configFiles=[];displayFileList('#configFilesList',[]);$('#quantityField').value=1;$('#widthField').required=p.unit==='m2'||p.unit==='meter';$('#heightField').required=p.unit==='m2';const specialized=['passport','pdf','photoprint'].includes(p.id);$('#widthField').closest('label').style.display=specialized?'none':'';$('#heightField').closest('label').style.display=specialized?'none':'';$('#widthField').required=!specialized&&(p.unit==='m2'||p.unit==='meter');$('#heightField').required=!specialized&&p.unit==='m2';$('#materialField').closest('label').style.display=specialized?'none':'';$('#serviceSpecial').innerHTML=specialOptions(p);$('#configPrice').textContent='السعر النهائي بعد مراجعة الطلب';updateConfigPrice();$('#configDialog').showModal()}
function specialOptions(p){
 if(p.id==='passport')return `<div class="special-service"><div class="special-caption">تفاصيل صور الهوية والباسبور</div><div class="special-grid"><label>نوع الصورة<select name="passportType"><option>صور باسبور</option><option>صور هوية</option><option>صور رسمية أخرى</option></select></label><label>طريقة تجهيز الصورة<select name="passportSource"><option>التصوير في المطبعة</option><option>عندي صورة جاهزة وبرفعها مع الطلب</option></select></label></div><p class="attach-tip">فيك ترفق الصورة مباشرة من زر «ارفع الصور أو ملف PDF» الموجود تحت. بتبعتها على واتساب للمطبعة بعد تسجيل الطلب.</p></div>`;
 if(p.id==='pdf')return `<div class="special-service"><div class="special-caption">إعدادات طباعة PDF</div><div class="special-grid"><label>نوع الطباعة<select name="pdfColor"><option>أبيض وأسود</option><option>ملوّن</option></select></label><label>مقاس الورق<select name="pdfPaper"><option>A4</option><option>A3</option><option>A5</option><option>مقاس آخر - بالملاحظات</option></select></label><label>الطباعة<select name="pdfSides"><option>وجه واحد</option><option>وجهين</option></select></label><label>عدد صفحات الملف<input name="pdfPages" type="number" min="1" max="5000" placeholder="عدد الصفحات"></label></div><p class="attach-tip">اختار ملف PDF من المكان المخصص تحت. الكمية بالأعلى = عدد النسخ. بعد تسجيل الطلب، ابعت الملف الأصلي على واتساب.</p></div>`;
 if(p.id==='photoprint')return `<div class="special-service"><div class="special-caption">إعدادات تظهير الصور</div><div class="special-grid"><label>قياس الصورة<select name="photoSize"><option>10 × 15 سم</option><option>13 × 18 سم</option><option>15 × 21 سم</option><option>A4</option><option>قياس آخر بالملاحظات</option></select></label><label>نوع السطح<select name="photoFinish"><option>لامع</option><option>مطفي</option><option>حسب المتوفر</option></select></label></div><p class="attach-tip">اختار الصور الأصلية من الزر تحت لإرسالها لاحقاً بواتساب. ما تضغط الصور إذا كانت دقّتها مهمة.</p></div>`;
 if(p.id==='installation')return `<div class="special-service"><div class="special-caption">تفاصيل الفك والتركيب</div><div class="special-grid"><label>الخدمة المطلوبة<select name="installType"><option>فك وتركيب</option><option>تركيب فقط</option><option>فك فقط</option></select></label><label>موقع العمل<input name="installArea" maxlength="100" placeholder="البلدة أو المنطقة"></label></div><p class="attach-tip">يرجى ذكر مكان التركيب وارتفاع القارمة وظروف الموقع في الملاحظات. السعر حسب المعاينة والطلب.</p></div>`;
 return '';
}
function getSpecialNotes(form,p){const fd=new FormData(form);if(p.id==='passport')return `نوع الصورة: ${fd.get('passportType')||''} | تجهيز الصورة: ${fd.get('passportSource')||''}`;if(p.id==='pdf')return `الطباعة: ${fd.get('pdfColor')||''} | الورق: ${fd.get('pdfPaper')||''} | ${fd.get('pdfSides')||''}${fd.get('pdfPages')?' | صفحات الملف: '+fd.get('pdfPages'):''} | ملف PDF سيُرسل عبر واتساب إذا اختاره الزبون`;if(p.id==='photoprint')return `مقاس الصورة: ${fd.get('photoSize')||''} | سطح الطباعة: ${fd.get('photoFinish')||''} | الصور ستُرسل عبر واتساب إذا اختارها الزبون`;if(p.id==='installation')return `الخدمة: ${fd.get('installType')||''}${fd.get('installArea')?' | منطقة العمل: '+fd.get('installArea'):''}`;return ''}
function updateConfigPrice(){const p=state.selected;if(!p)return;const w=Number($('#widthField').value),h=Number($('#heightField').value),q=Number($('#quantityField').value),n=priceOf(p,q,w,h);$('#configPrice').textContent=n===null?'السعر النهائي بعد مراجعة الطلب':`السعر التقديري ${money(n)}`}
// Files stay only in the customer's browser. WhatsApp links cannot attach them automatically.
const MAX_CUSTOMER_FILES=20;
const allowedExtensions=/\.(pdf|jpe?g|png|webp|heic|heif)$/i;
function listSelectedFiles(){const picked=[];for(const item of state.cart){for(const file of state.cartFiles.get(item.cartId)||[])picked.push({file,serviceId:item.serviceId});}for(const file of state.checkoutFiles)picked.push({file,serviceId:''});return picked;}
function validateNewFiles(files,existingCount){
 const list=Array.from(files||[]);
 if(existingCount+list.length>MAX_CUSTOMER_FILES)throw Error(`مسموح ${MAX_CUSTOMER_FILES} ملف لكل طلب. للملفات الإضافية ابعتها بمحادثة واتساب.`);
 for(const file of list){
  if(!allowedExtensions.test(file.name))throw Error('اختار ملفات صور JPG/PNG/WebP/HEIC أو PDF فقط');
  if(!file.size)throw Error('الملف «'+file.name+'» فارغ');
 }
 return list;
}
function displayFileList(selector,files){const el=$(selector);if(!el)return;el.innerHTML=files.length?files.map(file=>`<div class="file-chip"><span aria-hidden="true">${file.type==='application/pdf'?'▤':'▧'}</span><span class="file-chip-name">${esc(file.name)}</span><small>${(file.size/1024/1024).toFixed(2)}MB</small></div>`).join(''):'<span class="file-empty">ما اخترت ملفات بعد</span>';}
function countCartFiles(){return listSelectedFiles().length;}
function addConfigFiles(input){
 try{const files=Array.from(input.files||[]);state.configFiles=validateNewFiles(files,countCartFiles());displayFileList('#configFilesList',state.configFiles)}catch(err){state.configFiles=[];displayFileList('#configFilesList',[]);toast(err.message);}
}
function addCheckoutFiles(input){
 try{const files=Array.from(input.files||[]);const prior=state.checkoutFiles;state.checkoutFiles=[];try{state.checkoutFiles=validateNewFiles(files,countCartFiles());}catch(err){state.checkoutFiles=prior;throw err;}displayFileList('#checkoutFilesList',state.checkoutFiles);}catch(err){toast(err.message);displayFileList('#checkoutFilesList',state.checkoutFiles);}input.value='';
}
function removeItem(id){state.cart=state.cart.filter(item=>item.cartId!==id);state.cartFiles.delete(id);saveCart();renderCart()}
function renderCart(){const list=$('#cartItems'),bottom=$('#drawerBottom');if(!state.cart.length){list.innerHTML='<div class="drawer-empty"><span>▣</span><b>السلة فاضية حالياً</b><p>بلّش باختيار إحدى خدمات الطباعة.</p></div>';bottom.innerHTML='<button class="btn btn-dark" id="backToShop">تصفّح الخدمات ←</button>';$('#backToShop').onclick=()=>{closeDrawer();location.hash='services'};return;}
list.innerHTML=state.cart.map(i=>`<div class="cart-line"><div><b>${esc(i.title)}</b><small>الكمية: ${i.quantity} ${i.width?` • العرض ${i.width} سم`:''}${i.height?` • الارتفاع ${i.height} سم`:''}</small><small>${esc(i.material||'حسب المتوفر')}${i.notes?` • ${esc(i.notes)}`:''}</small>${(state.cartFiles.get(i.cartId)||[]).length?`<small class="cart-files-attached">📎 ${(state.cartFiles.get(i.cartId)||[]).length} ملف/ملفات للإرسال على واتساب</small>`:''}</div><button type="button" data-remove="${esc(i.cartId)}" title="حذف">حذف</button></div>`).join('');
bottom.innerHTML=`<form id="orderForm" class="order-form"><label>اسمك الكامل <span class="required">*</span><input name="name" autocomplete="name" placeholder="اسم الزبون" maxlength="90" required minlength="2"></label><label>رقم هاتفك <span class="required">*</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="03 123456" maxlength="25" required pattern="[+0-9 ()-]{7,25}"></label><label>ملاحظة للطلب<textarea name="note" rows="2" maxlength="700" placeholder="وقت التسليم، مكان التركيب، أي تفاصيل..."></textarea></label><div class="delivery-choice"><span>طريقة الاستلام</span><label class="fulfillment-option"><input type="radio" name="fulfillment" value="pickup" checked> الاستلام من المطبعة</label><label class="fulfillment-option"><input type="radio" name="fulfillment" value="delivery"> دليفري لعنوان الزبون</label></div><label id="addressLabel" hidden>عنوان الدليفري <span class="required">*</span><textarea name="deliveryAddress" id="deliveryAddress" rows="2" maxlength="250" placeholder="المنطقة، الشارع، نقطة الدلالة"></textarea></label><p class="delivery-price-note">خدمة الدليفري متوفرة • <strong>سعر الدليفري حسب الطلب</strong> ويُحدَّد بعد تأكيد العنوان.</p><section class="customer-file-box checkout-attachment" aria-label="ملفات الطلب"><div class="file-intro"><span class="file-mark">⇧</span><div><strong>صور وملفات PDF للطلب</strong><small>إذا ما اخترت الملفات وقت اختيار الخدمة، اخترها هون</small></div></div><label class="file-select" for="checkoutFiles">＋ اختر صور أو PDF<input id="checkoutFiles" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif" multiple></label><div id="checkoutFilesList" class="selected-files" aria-live="polite"></div><button type="button" class="clear-attachments" id="clearCheckoutFiles">إزالة الملفات المختارة في هذه الخطوة</button><p class="file-limits">الملفات بتضل على جهازك حتى تبعتها بنفسك على واتساب. ما في حد 4MB من الموقع؛ واتساب والجهاز ممكن يفرضوا حدودهم. اختار حتى 20 ملف.</p></section><label style="position:absolute;left:-10000px">Website<input name="website" autocomplete="off" tabindex="-1"></label><p>رح نحفظ تفاصيل الطلب فقط. صورك وملفات PDF ما بتنرفع للموقع، ولا بتوصل تلقائياً: بعد التسجيل بتفتح واتساب وبتبعتهن ضمن المحادثة. السعر النهائي بعد المراجعة.</p><button type="submit" class="btn btn-dark" id="sendOrder">إرسال الطلب على واتساب ↗</button><div class="order-error" id="orderError" aria-live="polite"></div></form>`;
$('#orderForm').addEventListener('submit',submitOrder);$('#checkoutFiles').addEventListener('change',e=>addCheckoutFiles(e.target));$('#clearCheckoutFiles').addEventListener('click',()=>{state.checkoutFiles=[];displayFileList('#checkoutFilesList',[]);});displayFileList('#checkoutFilesList',state.checkoutFiles);$('#orderForm').querySelectorAll('[name=fulfillment]').forEach(r=>r.addEventListener('change',()=>{const isDelivery=$('#orderForm').elements.fulfillment.value==='delivery';$('#addressLabel').hidden=!isDelivery;$('#deliveryAddress').required=isDelivery;}));
}
function makeWhatsAppMessage({id,name,phone,note,fulfillment,deliveryAddress,items,files}){
 const lines=['مرحباً مطبعة النمر 👋',`طلب طباعة جديد — رقم ${id}`,'',`👤 الاسم: ${name}`,`📞 الهاتف: ${phone}`,`🚚 طريقة الاستلام: ${fulfillment==='delivery'?'دليفري':'من المطبعة'}`,fulfillment==='delivery'?`📍 عنوان الدليفري: ${deliveryAddress}`:null,fulfillment==='delivery'?'💵 سعر الدليفري: حسب الطلب':null,'','الخدمات المطلوبة:'];
 items.forEach((i,k)=>{lines.push(`${k+1}. ${i.title}`,`   الكمية: ${i.quantity}`,i.width?`   العرض: ${i.width} سم`:null,i.height?`   الارتفاع: ${i.height} سم`:null,i.material?`   الخيار: ${i.material}`:null,i.notes?`   ملاحظة: ${i.notes}`:null,'')});
 if(note)lines.push(`ملاحظة عامة: ${note}`);
 if(files.length){lines.push('',`📎 رح أبعت ${files.length} صورة/ملف PDF بهالمحادثة (الملفات مش مرفقة بالرسالة تلقائياً):`);for(const {file} of files)lines.push('   • '+file.name);}
 lines.push('الرجاء تأكيد السعر وموعد التنفيذ.');
 return lines.filter(x=>x!==null).join('\n');
}
function showWhatsappHandoff(){
 const pending=state.pendingWhatsapp;if(!pending)return;
 $('#handoffOrderId').textContent=pending.id;
 $('#handoffCount').textContent=pending.files.length?`${pending.files.length} ملف/ملفات بانتظار الإرسال عبر واتساب`:'ما اخترت ملفات إضافية';
 $('#handoffList').innerHTML=pending.files.map(({file})=>`<div class="file-chip"><span>${file.name.toLowerCase().endsWith('.pdf')?'▤':'▧'}</span><span class="file-chip-name">${esc(file.name)}</span><small>${(file.size/1024/1024).toFixed(1)} MB</small></div>`).join('');
 $('#waOrderLink').href=pending.url;
 $('#waAttachLink').href=`https://wa.me/${WA_NUMBER}`;
 const fileOnly=pending.files.map(x=>x.file);
 let nativeShare=false;
 try{nativeShare=!!fileOnly.length&&typeof navigator.share==='function'&&typeof navigator.canShare==='function'&&navigator.canShare({files:fileOnly});}catch{}
 $('#shareFilesNative').hidden=!nativeShare;
 $('#handoffFilesSection').hidden=!fileOnly.length;
 $('#handoffBrowserHelp').textContent=nativeShare?'على الموبايل اضغط «مشاركة الملفات»، واختار واتساب ثم محادثة الرقم 70510623 واضغط إرسال. أو افتح المحادثة وارفق الملفات من 📎.':'افتح محادثة المطبعة بواتساب، واضغط علامة 📎، واختر «مستند» للـPDF أو «صور وفيديو» للصور ثم اضغط إرسال.';
 $('#handoffError').textContent='';
 $('#resumeWhatsapp').hidden=false;
 if(!$('#handoffDialog').open)$('#handoffDialog').showModal();
}
async function shareWhatsappFiles(){
 const files=state.pendingWhatsapp?.files.map(x=>x.file)||[];
 if(!files.length)return;
 // Must run directly on a user click for Web Share transient activation.
 try{
  if(typeof navigator.canShare!=='function'||!navigator.canShare({files}))throw Error('جهازك ما بيدعم مشاركة هالملفات مباشرة. افتح واتساب وارفقها من المحادثة.');
  await navigator.share({files,title:'ملفات طلب ALNMER '+state.pendingWhatsapp.id,text:'ملفات طلب الطباعة رقم '+state.pendingWhatsapp.id+' لمطبعة النمر، واتساب 70510623'});
  $('#handoffError').textContent='إذا أرسلت الملفات، تأكد أنها وصلت إلى محادثة مطبعة النمر على 70510623. مشاركة الملفات لا تعني أنها أُرسلت قبل ضغط «إرسال» بواتساب.';
 }catch(err){if(err?.name==='AbortError')return;$('#handoffError').textContent='تعذّرت المشاركة المباشرة: '+(err.message||'افتح واتساب وارفق الملفات يدوياً')+'. افتح محادثة المطبعة وارفق صورك وPDF من علامة 📎.';}
}
async function submitOrder(e){
 e.preventDefault();
 const form=e.currentTarget,button=$('#sendOrder'),error=$('#orderError');
 if(!form.reportValidity())return;
 const name=form.elements.name.value.trim(),phone=form.elements.phone.value.trim(),note=form.elements.note.value.trim(),website=form.elements.website.value,fulfillment=form.elements.fulfillment.value,deliveryAddress=form.elements.deliveryAddress.value.trim();
 const items=state.cart.map(({serviceId,title,width,height,quantity,material,notes})=>({serviceId,title,width,height,quantity,material,notes}));
 const files=listSelectedFiles();
 if(!items.length)return;
 if(files.length>MAX_CUSTOMER_FILES){error.textContent='وصلت للحد الأقصى من الملفات.';return;}
 const data={name,phone,note,website,fulfillment,deliveryAddress,items,whatsappFiles:files.map(({file,serviceId})=>({name:file.name.slice(0,120),size:file.size,serviceId}))};
 const originalLabel=button.textContent;
 button.disabled=true;button.textContent='عم نحفظ تفاصيل الطلب...';error.textContent='';
 let result;
 try{
  const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(16000)});
  result=await response.json().catch(()=>({}));
  if(!response.ok||!result.ok||!result.id||result.id==='submitted')throw Error(result.error||'ما قدرنا نحفظ الطلب. جرّب مرة ثانية.');
 }catch(err){error.textContent=(err?.message||'تعذّر حفظ الطلب')+' — ما أرسلنا ملفاتك ولا فتحنا واتساب. حاول مرة تانية أو تواصل معنا مباشرة.';button.disabled=false;button.textContent=originalLabel;return;}
 const message=makeWhatsAppMessage({id:result.id,name,phone,note,fulfillment,deliveryAddress,items,files});
 state.pendingWhatsapp={id:result.id,files,url:`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`};
 state.cart=[];state.cartFiles.clear();state.checkoutFiles=[];saveCart();
 button.disabled=false;button.textContent=originalLabel;
 closeDrawer();showWhatsappHandoff();toast('انحفظت تفاصيل طلبك. باقي ترسل الرسالة والملفات بواتساب.');
}

async function initCatalog(){try{const resp=await fetch('/api/catalog',{signal:AbortSignal.timeout(6000)});if(resp.ok){const data=await resp.json();if(Array.isArray(data.products)){state.products=data.products;}}}catch(err){console.info('Using built-in service catalog',err.message)}renderProducts()}
document.addEventListener('click',e=>{const gallery=e.target.closest('[data-gallery]');if(gallery)showGallery(gallery.dataset.gallery);const index=e.target.closest('[data-gallery-index]');if(index){galleryState.active=Number(index.dataset.galleryIndex);displayGallery()}const add=e.target.closest('[data-product]');if(add){const p=state.products.find(p=>p.id===add.dataset.product);if(p)config(p)}const rem=e.target.closest('[data-remove]');if(rem)removeItem(rem.dataset.remove)});
$('#closeGallery').addEventListener('click',()=>$('#galleryDialog').close());$('#galleryPrev').addEventListener('click',()=>stepGallery(-1));$('#galleryNext').addEventListener('click',()=>stepGallery(1));$('#galleryOrder').addEventListener('click',()=>{const p=galleryState.item;$('#galleryDialog').close();if(p)config(p)});$('#galleryDialog').addEventListener('click',e=>{if(e.target===$('#galleryDialog'))$('#galleryDialog').close()});$('#galleryDialog').addEventListener('keydown',e=>{if(e.key==='ArrowLeft')stepGallery(1);if(e.key==='ArrowRight')stepGallery(-1)});
$('#configFiles').addEventListener('change',e=>addConfigFiles(e.target));
$('#configForm').addEventListener('submit',e=>{e.preventDefault();const p=state.selected;if(!p)return;const width=Number($('#widthField').value)||0,height=Number($('#heightField').value)||0,quantity=Number($('#quantityField').value)||1;
if(quantity<1||quantity>5000||!Number.isInteger(quantity)||width<0||width>10000||height<0||height>10000){toast('تأكد من القياسات والكمية');return;}
if(state.cart.length>=25){toast('يمكن إضافة 25 خدمة بالطلب الواحد');return;}const cartId=Date.now().toString(36)+Math.random().toString(36).slice(2,7);state.cart.push({cartId,serviceId:p.id,title:p.title,width,height,quantity,material:$('#materialField').value,notes:[getSpecialNotes($('#configForm'),p),$('#itemNotesField').value.trim()].filter(Boolean).join(' | ').slice(0,300)});if(state.configFiles.length)state.cartFiles.set(cartId,state.configFiles);state.configFiles=[];saveCart();$('#configDialog').close();openDrawer();toast('انضافت الخدمة للسلة');});
for(const el of ['#widthField','#heightField','#quantityField'])$(el).addEventListener('input',updateConfigPrice);
$('#cartTrigger').addEventListener('click',openDrawer);$('#closeDrawer').addEventListener('click',closeDrawer);$('#overlay').addEventListener('click',closeDrawer);$('#closeConfig').addEventListener('click',()=>$('#configDialog').close());$('#configDialog').addEventListener('click',e=>{if(e.target===$('#configDialog'))$('#configDialog').close()});$('#searchInput').addEventListener('input',e=>{state.search=e.target.value.trim().toLowerCase();renderProducts()});$('#filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;state.filter=b.dataset.filter;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));renderProducts()});$('#year').textContent=new Date().getFullYear();saveCart();initCatalog();

// WhatsApp sends files only through the user's WhatsApp app; a web link cannot attach them.
$('#shareFilesNative').addEventListener('click',shareWhatsappFiles);
$('#closeHandoff').addEventListener('click',()=>$('#handoffDialog').close());
$('#resumeWhatsapp').addEventListener('click',showWhatsappHandoff);
