const BALE_TOKEN='666814160:KRTSKi_cdOSDPUEu6x4tJ5uD9iS_-E5StFQ';
const BALE_CHAT_ID='1163569220';
const BALE_API='https://tapi.bale.ai/bot'+BALE_TOKEN;
let currentEmployee=JSON.parse(localStorage.getItem('currentEmployee')||'null');

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

async function recordAttendance(type){
  if(!currentEmployee){showStatus('ابتدا مشخصات را ثبت کنید','error');return;}
  if(isDup(currentEmployee.id,type)){showStatus('⚠️ امروز قبلاً ثبت شده','error');return;}
  const rec={id:Date.now(),employeeId:currentEmployee.id,name:currentEmployee.fullName,personnelId:currentEmployee.personnelId,type,time:new Date().toLocaleTimeString('fa-IR'),timestamp:new Date().toISOString(),date:new Date().toLocaleDateString('fa-IR')};
  const all=JSON.parse(localStorage.getItem('attendanceRecords')||'[]');all.push(rec);localStorage.setItem('attendanceRecords',JSON.stringify(all));
  const tt=type==='checkin'?'ورود':'خروج',em=type==='checkin'?'🟢':'🔴';
  showStatus('✓ '+tt+' ثبت شد - '+rec.time,'success');displayRecords();
  await sendToBale(em+' '+tt+'\n👤 '+currentEmployee.fullName+'\n🔢 '+currentEmployee.personnelId+'\n🕐 '+rec.time+'\n📅 '+rec.date);
}
document.getElementById('checkInBtn').onclick=()=>recordAttendance('checkin');
document.getElementById('checkOutBtn').onclick=()=>recordAttendance('checkout');

function displayRecords(){
  const records=JSON.parse(localStorage.getItem('attendanceRecords')||'[]'),list=document.getElementById('recordsList');
  if(!list)return;if(!records.length){list.innerHTML='<p style="text-align:center;color:#999">هنوز سابقه‌ای ثبت نشده</p>';return;}
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
  content.innerHTML='<div class="overtime-item"><span class="overtime-name">'+currentEmployee.fullName+'</span><span class="overtime-hours">'+total.toFixed(2)+' ساعت</span></div><p style="margin-top:12px;font-size:13px;color:#742a2a;line-height:1.7">'+msg+'</p>';
  box.style.display='block';
  showStatus('اضافه کار: '+total.toFixed(2)+' ساعت','success');
  await sendToBale('⏱️ '+msg);
};

document.querySelectorAll('.tab-btn').forEach(b=>b.onclick=e=>{
  document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(x=>x.classList.remove('active'));
  e.target.classList.add('active');
  document.getElementById(e.target.getAttribute('data-tab')).classList.add('active');
  if(e.target.getAttribute('data-tab')==='records')displayRecords();
});
document.getElementById('clearRecords').onclick=()=>{if(confirm('مطمئن هستید؟')){localStorage.removeItem('attendanceRecords');displayRecords();showStatus('سوابق حذف شد','success');}};
loadMainScreen();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
