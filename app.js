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

function getLocation() {
  return new Promise(function (resolve) {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        localStorage.setItem('locationGranted', '1');
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      function () { resolve(null); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

function formatLocation(loc) {
  if (!loc) return '📍 موقعیت: در دسترس نبود (دسترسی مکان را فعال کنید)';
  const map = 'https://maps.google.com/?q=' + loc.lat + ',' + loc.lng;
  return '📍 موقعیت:\n' + loc.lat.toFixed(6) + ', ' + loc.lng.toFixed(6) + '\n🗺️ ' + map;
}

async function ensureLocationPermission() {
  if (localStorage.getItem('locationGranted') === '1') {
    return getLocation();
  }
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const st = await navigator.permissions.query({ name: 'geolocation' });
      if (st.state === 'granted') {
        localStorage.setItem('locationGranted', '1');
        return getLocation();
      }
    }
  } catch (e) {}
  return getLocation();
}

document.getElementById('registerBtn').onclick=async()=>{
  const f=document.getElementById('firstName').value.trim(),l=document.getElementById('lastName').value.trim(),p=document.getElementById('registerPersonnelId').value.trim();
  if(!f||!l){showStatus('لطفاً نام و نام خانوادگی را وارد کنید','error');return;}
  if(!p){showStatus('لطفاً شماره پرسنلی را وارد کنید','error');return;}
  currentEmployee={id:Date.now(),firstName:f,lastName:l,personnelId:p,fullName:f+' '+l};
  localStorage.setItem('currentEmployee',JSON.stringify(currentEmployee));
  document.getElementById('firstName').value='';document.getElementById('lastName').value='';document.getElementById('registerPersonnelId').value='';
  showStatus('در حال ثبت...','info');
  await ensureLocationPermission();
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
  showStatus('در حال ثبت...', 'info');
  const loc = await ensureLocationPermission();
  const now=new Date();
  const selected=new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  const timeFa = selected.toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'});
  const rec={
    id:Date.now(), employeeId:currentEmployee.id, name:currentEmployee.fullName,
    personnelId:currentEmployee.personnelId, type:type, time:timeFa,
    timestamp:selected.toISOString(), date:now.toLocaleDateString('fa-IR'),
    lat: loc ? loc.lat : null, lng: loc ? loc.lng : null
  };
  const all=JSON.parse(localStorage.getItem('attendanceRecords')||'[]');
  all.push(rec); localStorage.setItem('attendanceRecords',JSON.stringify(all));
  const tt=type==='checkin'?'ورود':'خروج', em=type==='checkin'?'🟢':'🔴';
  showStatus('✓ '+tt+' ثبت شد','success');
  displayRecords();
  const locText = formatLocation(loc);
  sendToBale(em+' '+tt+'\n👤 '+currentEmployee.fullName+'\n🔢 '+currentEmployee.personnelId+'\n🕐 '+timeFa+'\n📅 '+rec.date+'\n'+locText);
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
  // اضافه‌کار: از ۱۶:۳۰؛ چهارشنبه از ۱۵:۳۰ — خروجی به دقیقه
  if(!cin||!cout)return 0;
  const coH=cout.getHours(), coM=cout.getMinutes();
  const endMin = coH*60 + coM;
  const startMin = (dow === 3) ? (15*60 + 30) : (16*60 + 30);
  const ot = endMin - startMin;
  return ot > 0 ? ot : 0;
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
  total=Math.round(total);
  let monthName='';
  try{monthName=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'long'}).format(start);}catch(e){monthName='';}
  const msg='اضافه کار «'+currentEmployee.fullName+'» از تاریخ ۲۱ '+monthName+' تا کنون برابر با '+total+' دقیقه است';
  const box=document.getElementById('overtimeList'),content=document.getElementById('overtimeContent');
  content.innerHTML='<div class="overtime-item"><span class="overtime-name">'+currentEmployee.fullName+'</span><span class="overtime-hours">'+total+' دقیقه</span></div><p style="margin-top:12px;font-size:13px;color:#fecaca;line-height:1.7">'+msg+'</p>';
  box.style.display='block';
  showStatus('اضافه کار: '+total+' دقیقه','success');
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

loadMainScreen();
(function warmLocationOnce(){
  if(!currentEmployee) return;
  if(localStorage.getItem('locationGranted')==='1') return;
  function once(){
    document.removeEventListener('click', once);
    document.removeEventListener('touchstart', once);
    ensureLocationPermission();
  }
  document.addEventListener('click', once);
  document.addEventListener('touchstart', once, {passive:true});
})();

if('serviceWorker' in navigator){
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('./sw.js').then(function(reg){reg.update();}).catch(function(){});
  });
}
