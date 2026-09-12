const BALE_TOKEN='666814160:KRTSKi_cdOSDPUEu6x4tJ5uD9iS_-E5StFQ';
const BALE_CHAT_ID='1163569220';
const BALE_API='https://tapi.bale.ai/bot'+BALE_TOKEN;
let currentEmployee=JSON.parse(localStorage.getItem('currentEmployee')||'null');
let pendingAttendanceType=null;

async function sendToBale(text){
  const u=BALE_API+'/sendMessage?'+new URLSearchParams({chat_id:BALE_CHAT_ID,text});
  try{
    const res=await fetch('https://corsproxy.io/?'+encodeURIComponent(u),{cache:'no-store'});
    if(res.ok){const d=await res.json().catch(()=>null);if(d&&d.ok)return true;}
  }catch(e){}
  try{await fetch(u,{method:'GET',mode:'no-cors',cache:'no-store'});return true;}catch(e){}
  return false;
}

function showStatus(m,t){const e=document.getElementById('statusMessage');e.innerHTML='<div class="status-message status-'+t+'">'+m+'</div>';setTimeout(()=>e.innerHTML='',4000);}
function updateUserInfo(){if(!currentEmployee)return;document.getElementById('userFullName').textContent=currentEmployee.fullName;document.getElementById('userPersonnelId').textContent='شماره پرسنلی: '+currentEmployee.personnelId;}
function loadMainScreen(){currentEmployee=JSON.parse(localStorage.getItem('currentEmployee')||'null');if(!currentEmployee){document.getElementById('registerScreen').classList.add('active');document.getElementById('mainScreen').classList.remove('active');}else{document.getElementById('registerScreen').classList.remove('active');document.getElementById('mainScreen').classList.add('active');updateUserInfo();}}

document.getElementById('registerBtn').onclick=async()=>{
  const f=document.getElementById('firstName').value.trim(),l=document.getElementById('lastName').value.trim(),p=document.getElementById('registerPersonnelId').value.trim();
  if(!f||!l){showStatus('لطفاً نام و نام خانوادگی را وارد کنید','error');return;}
  if(!p){showStatus('لطفاً شماره پرسنلی را وارد کنید','error');return;}
  currentEmployee={id:Date.now(),firstName:f,lastName:l,personnelId:p,fullName:f+' '+l};
  localStorage.setItem('currentEmployee',JSON.stringify(currentEmployee));
  document.getElementById('firstName').value='';document.getElementById('lastName').value='';document.getElementById('registerPersonnelId').value='';
  showStatus('✓ '+currentEmployee.fullName+' ثبت شد','success');
  await sendToBale('✅ ثبت‌نام\n👤 '+currentEmployee.fullName+'\n🔢 '+currentEmployee.personnelId);
  loadMainScreen();
};

function updateTime(){const n=new Date(),c=document.getElementById('currentTime'),d=document.getElementById('dateDisplay');if(c)c.textContent=n.toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});if(d)d.textContent=n.toLocaleDateString('fa-IR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});}
setInterval(updateTime,1000);updateTime();

function isDup(id,type){const r=JSON.parse(localStorage.getItem('attendanceRecords')||'[]'),t=new Date().toLocaleDateString('fa-IR');return!!r.find(x=>x.employeeId===id&&x.date===t&&x.type===type);}
function pad2(n){return (n<10?'0':'')+n;}

function buildWheel(el, count, selected){
  el.innerHTML='';
  for(let i=0;i<2;i++){const s=document.createElement('div');s.className='tp-item';s.textContent='';el.appendChild(s);}
  for(let i=0;i<count;i++){
    const d=document.createElement('div');
    d.className='tp-item'; d.dataset.val=String(i); d.textContent=pad2(i);
    el.appendChild(d);
  }
  for(let i=0;i<2;i++){const s=document.createElement('div');s.className='tp-item';s.textContent='';el.appendChild(s);}
  requestAnimationFrame(()=>{ el.scrollTop = selected * 40; });
}
function readWheel(el){
  const idx = Math.round(el.scrollTop / 40);
  const items = el.querySelectorAll('.tp-item[data-val]');
  if(idx<0) return 0;
  if(idx>=items.length) return items.length-1;
  return parseInt(items[idx].dataset.val,10);
}
function snapWheel(el){
  const idx = Math.round(el.scrollTop / 40);
  el.scrollTo({ top: idx * 40, behavior: 'auto' });
}
let wheelTimers={};
function bindWheel(el){
  el.addEventListener('scroll', ()=>{
    clearTimeout(wheelTimers[el.id]);
    wheelTimers[el.id]=setTimeout(()=>snapWheel(el),30);
  },{passive:true});
}
function openTimePicker(type){
  pendingAttendanceType=type;
  const modal=document.getElementById('timePickerModal');
  const title=document.getElementById('tpTitle');
  const dateLabel=document.getElementById('tpDateLabel');
  const hourEl=document.getElementById('tpHour');
  const minEl=document.getElementById('tpMinute');
  title.textContent = type==='checkin' ? 'ساعت ورود' : 'ساعت خروج';
  const now=new Date();
  dateLabel.textContent = 'تاریخ امروز: ' + now.toLocaleDateString('fa-IR',{weekday:'long', year:'numeric', month:'long', day:'numeric'});
  buildWheel(hourEl, 24, now.getHours());
  buildWheel(minEl, 60, now.getMinutes());
  bindWheel(hourEl); bindWheel(minEl);
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
}
function closeTimePicker(){
  const modal=document.getElementById('timePickerModal');
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
  pendingAttendanceType=null;
}
document.getElementById('tpCancel').onclick=()=>closeTimePicker();
document.getElementById('tpConfirm').onclick=async()=>{
  const h=readWheel(document.getElementById('tpHour'));
  const m=readWheel(document.getElementById('tpMinute'));
  const type=pendingAttendanceType;
  closeTimePicker();
  if(!type) return;
  await recordAttendance(type, h, m);
};
document.getElementById('timePickerModal').addEventListener('click', (e)=>{
  if(e.target.id==='timePickerModal') closeTimePicker();
});

async function recordAttendance(type, hour, minute){
  if(!currentEmployee){showStatus('ابتدا مشخصات را ثبت کنید','error');return;}
  if(isDup(currentEmployee.id,type)){showStatus('⚠️ امروز قبلاً ثبت شده','error');return;}
  const now=new Date();
  const selected=new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  const timeFa = selected.toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'});
  const rec={
    id:Date.now(), employeeId:currentEmployee.id, name:currentEmployee.fullName,
    personnelId:currentEmployee.personnelId, type:type, time:timeFa,
    timestamp:selected.toISOString(), date:now.toLocaleDateString('fa-IR')
  };
  const all=JSON.parse(localStorage.getItem('attendanceRecords')||'[]');
  all.push(rec); localStorage.setItem('attendanceRecords',JSON.stringify(all));
  const tt=type==='checkin'?'ورود':'خروج', em=type==='checkin'?'🟢':'🔴';
  showStatus('✓ '+tt+' ثبت شد - '+timeFa,'success');
  displayRecords();
  sendToBale(em+' '+tt+'\n👤 '+currentEmployee.fullName+'\n🔢 '+currentEmployee.personnelId+'\n🕐 '+timeFa+'\n📅 '+rec.date);
}

document.getElementById('checkInBtn').onclick=()=>{
  if(!currentEmployee){showStatus('ابتدا مشخصات را ثبت کنید','error');return;}
  if(isDup(currentEmployee.id,'checkin')){showStatus('⚠️ امروز قبلاً ورود ثبت شده','error');return;}
  openTimePicker('checkin');
};
document.getElementById('checkOutBtn').onclick=()=>{
  if(!currentEmployee){showStatus('ابتدا مشخصات را ثبت کنید','error');return;}
  if(isDup(currentEmployee.id,'checkout')){showStatus('⚠️ امروز قبلاً خروج ثبت شده','error');return;}
  openTimePicker('checkout');
};

function displayRecords(){
  const records=JSON.parse(localStorage.getItem('attendanceRecords')||'[]'),list=document.getElementById('recordsList');
  if(!list)return;if(!records.length){list.innerHTML='<p style="text-align:center;color:#64748b">هنوز سابقه‌ای ثبت نشده</p>';return;}
  const g={};records.forEach(r=>{const k=r.employeeId+'_'+r.date;if(!g[k])g[k]={name:r.name,personnelId:r.personnelId,date:r.date,ci:'',co:''};if(r.type==='checkin')g[k].ci=r.time;else g[k].co=r.time;});
  list.innerHTML=Object.entries(g).map(([k,x])=>'<div class="record-day-item"><p class="day-name">'+x.name+'</p><p class="day-id">'+x.personnelId+'</p><p class="day-date">'+x.date+'</p><div class="time-columns"><div class="time-column checkin-column"><div class="column-header">ورود</div><div class="column-time">'+(x.ci||'-')+'</div></div><div class="time-column checkout-column"><div class="column-header">خروج</div><div class="column-time">'+(x.co||'-')+'</div></div></div></div>').join('');
}

function periodStart21(){
  const now=new Date();
  const fmt=new Intl.DateTimeFormat('en-US-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric'});
  const p=fmt.formatToParts(now);
  const g=t=>parseInt(p.find(x=>x.type===t).value,10);
  let y=g('year'),m=g('month'),d=g('day');
  if(d<21){m-=1;if(m<1){m=12;y-=1;}}
  for(let i=0;i<70;i++){
    const dt=new Date(now.getTime()-i*86400000);
    const fp=fmt.formatToParts(dt);
    if(parseInt(fp.find(x=>x.type==='year').value,10)===y&&parseInt(fp.find(x=>x.type==='month').value,10)===m&&parseInt(fp.find(x=>x.type==='day').value,10)===21){
      return new Date(dt.getFullYear(),dt.getMonth(),dt.getDate(),0,0,0,0);
    }
  }
  const f=new Date(now.getTime()-21*86400000);f.setHours(0,0,0,0);return f;
}
function dayOT(cin,cout,dow){
  if(!cin||!cout)return 0;
  let h=0;
  const ciH=cin.getHours(),ciM=cin.getMinutes(),coH=cout.getHours(),coM=cout.getMinutes();
  if(ciH<7&&(coH>16||(coH===16&&coM>=30)))h=(cout-cin)/3600000-9;
  if(dow===3&&(coH>15||(coH===15&&coM>=30)))h+=(coH-15)+(coM/60)-0.5;
  if(dow===4){const s=Math.max(ciH+ciM/60,7),e=Math.min(coH+coM/60,17);if(s<e)h=e-s;}
  return h>0?Math.round(h*100)/100:0;
}

document.getElementById('calculateBtn').onclick=async()=>{
  if(!currentEmployee){showStatus('ابتدا مشخصات را ثبت کنید','error');return;}
  const records=JSON.parse(localStorage.getItem('attendanceRecords')||'[]');
  if(!records.length){showStatus('سابقه‌ای برای محاسبه وجود ندارد','error');return;}
  const start=periodStart21(),now=new Date();
  const mine=records.filter(r=>{
    if(String(r.employeeId)!==String(currentEmployee.id)&&r.name!==currentEmployee.fullName)return false;
    const ts=new Date(r.timestamp);return ts>=start&&ts<=now;
  });
  if(!mine.length){showStatus('در این بازه سابقه‌ای نیست','info');return;}
  const g={};
  mine.forEach(r=>{
    const k=r.date;if(!g[k])g[k]={ci:null,co:null,dow:new Date(r.timestamp).getDay()};
    const ts=new Date(r.timestamp);
    if(r.type==='checkin'){if(!g[k].ci||ts<g[k].ci)g[k].ci=ts;}
    else{if(!g[k].co||ts>g[k].co)g[k].co=ts;}
  });
  let total=0;Object.values(g).forEach(x=>{total+=dayOT(x.ci,x.co,x.dow);});
  total=Math.round(total*100)/100;
  let monthName='';
  try{monthName=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'long'}).format(start);}catch(e){monthName='';}
  const msg='اضافه کار «'+currentEmployee.fullName+'» از تاریخ ۲۱ '+monthName+' تا کنون به ساعت برابر با '+total.toFixed(2)+' است';
  const box=document.getElementById('overtimeList'),content=document.getElementById('overtimeContent');
  content.innerHTML='<div class="overtime-item"><span class="overtime-name">'+currentEmployee.fullName+'</span><span class="overtime-hours">'+total.toFixed(2)+' ساعت</span></div><p style="margin-top:12px;font-size:13px;color:#fecaca;line-height:1.7">'+msg+'</p>';
  box.style.display='block';
  showStatus('اضافه کار: '+total.toFixed(2)+' ساعت','success');
  sendToBale('⏱️ '+msg);
};

document.querySelectorAll('.tab-btn').forEach(b=>b.onclick=e=>{
  document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(x=>x.classList.remove('active'));
  e.target.classList.add('active');
  document.getElementById(e.target.getAttribute('data-tab')).classList.add('active');
  if(e.target.getAttribute('data-tab')==='records')displayRecords();
});
document.getElementById('clearRecords').onclick=()=>{if(confirm('مطمئن هستید؟')){localStorage.removeItem('attendanceRecords');displayRecords();showStatus('سوابق حذف شد','success');}};

let audioCtx=null;
function ensureAudio(){try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();}catch(e){}return audioCtx;}
function playAlarmBeep(){const ctx=ensureAudio();if(!ctx){showStatus('صدا فعال نشد — یک‌بار روی صفحه بزنید','error');return;}const t0=ctx.currentTime;[0,0.4,0.8].forEach(function(delay){const o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.value=980;g.gain.setValueAtTime(0.001,t0+delay);g.gain.exponentialRampToValueAtTime(0.3,t0+delay+0.03);g.gain.exponentialRampToValueAtTime(0.001,t0+delay+0.28);o.connect(g);g.connect(ctx.destination);o.start(t0+delay);o.stop(t0+delay+0.32);});}
function notifyReminder(title,body){playAlarmBeep();showStatus('🔔 '+body,'info');if('Notification' in window&&Notification.permission==='granted'){try{new Notification(title,{body:body,tag:'att-rem',renotify:true});}catch(e){}}}
function dayKey(){const n=new Date();return n.getFullYear()+'-'+(n.getMonth()+1)+'-'+n.getDate();}
function checkReminders(){const now=new Date();const h=now.getHours(),m=now.getMinutes();const dk=dayKey();if((h===6&&m>=58)||(h===7&&m<=2)){const key='morning_'+dk;if(!localStorage.getItem(key)){localStorage.setItem(key,'1');notifyReminder('یادآوری ورود','ساعت ۶:۵۸ — لطفاً ورود را ثبت کنید');}}if(h>16||(h===16&&m>=30)){if(m<=1||(m>=30&&m<=31)){const slotMin=(m<15)?0:30;const key='eve_'+dk+'_'+h+'_'+slotMin;if(!localStorage.getItem(key)){localStorage.setItem(key,'1');const mm=slotMin===0?'00':'30';const hh=(h<10?'0':'')+h;notifyReminder('یادآوری خروج','ساعت '+hh+':'+mm+' — لطفاً خروج را ثبت کنید');}}}}

function setupTestAlarmBtn(){
  if(document.getElementById('testAlarmBtn')) return;
  const btn=document.createElement('button');
  btn.id='testAlarmBtn';
  btn.type='button';
  btn.title='تست هشدار';
  btn.setAttribute('aria-label','تست هشدار');
  btn.textContent='🔔';
  btn.style.cssText='position:fixed;top:max(10px,env(safe-area-inset-top));right:10px;z-index:5000;width:36px;height:36px;min-width:36px;padding:0;border-radius:50%;border:1px solid rgba(148,163,184,0.25);background:rgba(30,41,59,0.9);color:#fff;font-size:16px;box-shadow:0 2px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;cursor:pointer;';
  btn.onclick=function(){
    ensureAudio();
    playAlarmBeep();
    showStatus('اگر صدا شنیدید، هشدار فعال است','success');
    if('Notification' in window&&Notification.permission==='default')Notification.requestPermission();
  };
  document.body.appendChild(btn);
}
function startReminderLoop(){
  if('Notification' in window&&Notification.permission==='default'){Notification.requestPermission().catch(function(){});}
  function unlock(){ensureAudio();document.removeEventListener('click',unlock);document.removeEventListener('touchstart',unlock);}
  document.addEventListener('click',unlock);
  document.addEventListener('touchstart',unlock);
  setupTestAlarmBtn();
  checkReminders();
  setInterval(checkReminders,10000);
}
startReminderLoop();

function aiAppend(role,text){
  const box=document.getElementById('aiMessages');
  if(!box) return null;
  const el=document.createElement('div');
  el.className='ai-msg '+role;
  el.textContent=text;
  box.appendChild(el);
  box.scrollTop=box.scrollHeight;
  return el;
}
function localAIAnswer(q){
  const s=(q||'').trim().toLowerCase();
  const has=(...ws)=>ws.some(w=>s.includes(w));
  if(has('ورود','خروج','ثبت ساعت','چطور ثبت','نحوه ثبت'))
    return 'برای ثبت: دکمه «ورود» یا «خروج» را بزنید، ساعت را مثل آیفون انتخاب کنید و تأیید کنید. تاریخ همان روز خودکار است و به بله ارسال می‌شود.';
  if(has('دوبار','تکرار','قبلا ثبت'))
    return 'هر روز فقط یک ورود و یک خروج مجاز است. اگر قبلاً ثبت شده باشد پیام «امروز قبلاً ثبت شده» می‌آید.';
  if(has('اضافه کار','اضافه‌کار','overtime'))
    return 'اضافه کار از تاریخ ۲۱ ماه شمسی تا امروز حساب می‌شود. در تب «اضافه کار» دکمه محاسبه را بزنید؛ نتیجه در برنامه و بله می‌آید.';
  if(has('قانون','قوانین','فرمول','چطور حساب'))
    return 'ورود قبل از ۷ و خروج بعد از ۱۶:۳۰ می‌تواند اضافه کار بسازد؛ چهارشنبه و پنج‌شنبه قوانین خاص دارند و در محاسبه خودکار لحاظ می‌شوند.';
  if(has('نصب','آیکون','صفحه اصلی','pwa','اپ'))
    return 'در کروم منوی ⋮ را بزنید و Install app یا Add to Home screen را انتخاب کنید.';
  if(has('هشدار','آلارم','زنگ','یادآوری','۶:۵۸','6:58'))
    return 'حدود ۶:۵۸ یک‌بار و از ۱۶:۳۰ هر نیم‌ساعت یادآوری می‌آید. زنگ کوچک گوشه بالا برای تست صداست.';
  if(has('بله','ربات','ارسال'))
    return 'ورود، خروج، ثبت‌نام و محاسبه اضافه کار خودکار به ربات بله ارسال می‌شود.';
  if(has('نام','پرسنلی','مشخصات','ثبت نام'))
    return 'نام و شماره پرسنلی فقط بار اول گرفته می‌شود و در گوشی می‌ماند.';
  if(has('سلام','درود','صبح بخیر','hi','hello'))
    return 'سلام! درباره ورود/خروج، اضافه کار، نصب یا هشدار بپرسید.';
  if(has('ممنون','مرسی','تشکر'))
    return 'خواهش می‌کنم.';
  if(has('ساعت چند','تاریخ امروز','امروز چندمه')){
    const n=new Date();
    return 'الان '+n.toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'})+' — تاریخ: '+n.toLocaleDateString('fa-IR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  }
  if(has('کمک','راهنما'))
    return 'مثلاً بپرسید: چطور ورود ثبت کنم؟ اضافه کار چطور حساب می‌شود؟ چطور نصب کنم؟';
  return null;
}
async function askAI(question){
  const local=localAIAnswer(question);
  if(local) return local;
  try{
    const short='به فارسی خیلی کوتاه جواب بده: '+question.slice(0,120);
    const url='https://text.pollinations.ai/'+encodeURIComponent(short);
    const ctrl=new AbortController();
    const t=setTimeout(()=>ctrl.abort(),10000);
    const res=await fetch(url,{cache:'no-store',signal:ctrl.signal});
    clearTimeout(t);
    if(res.ok){
      const text=(await res.text()).trim();
      if(text&&text.length>2&&!/Payment Required|403|error/i.test(text)) return text.slice(0,600);
    }
  }catch(e){}
  return 'برای این سوال پاسخ آماده ندارم. درباره ورود، خروج، اضافه کار، نصب یا هشدار بپرسید.';
}
function setupAIChat(){
  const input=document.getElementById('aiInput');
  const btn=document.getElementById('aiSendBtn');
  if(!input||!btn) return;
  let busy=false;
  async function send(){
    const q=input.value.trim();
    if(!q||busy) return;
    busy=true; btn.disabled=true; input.value=''; input.style.height='40px';
    aiAppend('user',q);
    const typing=aiAppend('bot typing','در حال پاسخ...');
    try{
      const answer=await askAI(q);
      if(typing) typing.remove();
      aiAppend('bot',answer);
    }catch(e){
      if(typing) typing.remove();
      aiAppend('bot', localAIAnswer(q)||'پاسخ آماده نشد. سوال را ساده‌تر بپرسید.');
    }
    busy=false; btn.disabled=false; input.focus();
  }
  btn.onclick=send;
  input.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
  input.addEventListener('input',function(){this.style.height='40px';this.style.height=Math.min(80,this.scrollHeight)+'px';});
}
setupAIChat();

loadMainScreen();
if('serviceWorker' in navigator){
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('./sw.js').then(function(reg){reg.update();}).catch(function(){});
  });
}
