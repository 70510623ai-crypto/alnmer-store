import { timingSafeEqual } from 'node:crypto';

export const DEFAULT_PRODUCTS = [
 {id:'flex',title:'قـارمات فليكس بانر',subtitle:'واجهات المحلات والإعلانات الخارجية',category:'signs',unit:'m2',price:null,enabled:true,art:'flex',tags:['خارجي','قياسات خاصة']},
 {id:'acp',title:'قارمات أليكوبوند',subtitle:'واجهات حديثة ومظهر فاخر',category:'signs',unit:'m2',price:null,enabled:true,art:'acp',tags:['واجهات','تركيب']},
 {id:'engraved',title:'أليكوبوند محفور',subtitle:'حفر دقيق للشعارات واللوحات',category:'signs',unit:'m2',price:null,enabled:true,art:'engraved',tags:['حفر','تصميم']},
 {id:'vinyl',title:'طباعة فينيل',subtitle:'لاصق للجدران والواجهات والزجاج',category:'printing',unit:'m2',price:null,enabled:true,art:'vinyl',tags:['لاصق','زجاج']},
 {id:'cars',title:'فينيل سيارات',subtitle:'براندينغ وتغليف السيارات',category:'printing',unit:'quote',price:null,enabled:true,art:'cars',tags:['سيارات','تغليف']},
 {id:'mesh',title:'طباعة ميش للزجاج',subtitle:'ملصقات مثقبة للواجهات الزجاجية',category:'printing',unit:'m2',price:null,enabled:true,art:'mesh',tags:['زجاج','واجهات']},
 {id:'laser',title:'قص وحفر ليزر',subtitle:'خشب وأكريليك وهدايا مخصصة',category:'laser',unit:'quote',price:null,enabled:true,art:'laser',tags:['ليزر','حسب الطلب']},
 {id:'cards',title:'كروت شخصية',subtitle:'بطاقات أعمال بهويتك الخاصة',category:'printing',unit:'piece',price:null,enabled:true,art:'cards',tags:['هوية','شركات']},
 {id:'canvas',title:'طباعة كانفاس',subtitle:'صور ولوحات فنية للديكور',category:'printing',unit:'m2',price:null,enabled:true,art:'canvas',tags:['ديكور','صور']},
 {id:'photos',title:'طباعة صور ومستندات',subtitle:'خدمات سريعة وواضحة للطباعة',category:'printing',unit:'quote',price:null,enabled:true,art:'photos',tags:['صور','مستندات']}
];
export const json = (data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export function isAdmin(req){
 const password=process.env.ADMIN_PASSWORD;
 if(!password || password.length<12) return false;
 const auth=req.headers.get('authorization')||'';
 if(!auth.startsWith('Bearer '))return false;
 const provided=Buffer.from(auth.slice(7));
 const expected=Buffer.from(password);
 return provided.length===expected.length && timingSafeEqual(provided,expected);
}
export function cleanText(value,max=150){return String(value??'').trim().slice(0,max)}
export function validProduct(raw){
 if(!raw || typeof raw!=='object') return null;
 const id=cleanText(raw.id,45).replace(/[^a-z0-9_-]/gi,'');
 const title=cleanText(raw.title,100);
 if(!id||!title) return null;
 const unit=['m2','meter','piece','quote'].includes(raw.unit)?raw.unit:'quote';
 const category=['signs','printing','laser'].includes(raw.category)?raw.category:'printing';
 const price=raw.price===null || raw.price==='' || raw.price===undefined ? null : Number(raw.price);
 if(price!==null&&(!Number.isFinite(price)||price<0||price>1000000)) return null;
 return {id,title,subtitle:cleanText(raw.subtitle,200),category,unit,price,enabled:raw.enabled!==false,art:cleanText(raw.art,40),tags:Array.isArray(raw.tags)?raw.tags.slice(0,4).map(s=>cleanText(s,35)):[]};
}
