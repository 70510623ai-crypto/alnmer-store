/* ALNMER welcome animation: visual only, no impact on orders or login */
(()=>{
 const splash=document.getElementById('welcomeSplash');
 const enter=document.getElementById('welcomeEnter');
 if(!splash||!enter)return;
 let closed=false;
 const dismiss=()=>{if(closed)return;closed=true;window.clearTimeout(autoTimer);splash.classList.add('is-hiding');window.setTimeout(()=>{splash.remove();},530);};
 const isReduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const autoTimer=window.setTimeout(dismiss,isReduced?800:3100);
 enter.addEventListener('click',dismiss);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!closed)dismiss();});
 // Touches and scrolling should never trap a visitor for longer than the intro.
})();
