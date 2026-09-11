const BALE_TOKEN='666814160:KRTSKi_cdOSDPUEu6x4tJ5uD9iS_-E5StFQ';
const BALE_CHAT_ID='1163569220';
const BALE_API='https://tapi.bale.ai/bot'+BALE_TOKEN;
let currentEmployee=JSON.parse(localStorage.getItem('currentEmployee')||'null');
async function sendToBale(text){
const u=BALE_API+'/sendMessage?'+new URLSearchParams({chat_id:BALE_CHAT_ID,text});
try{await fetch(u,{method:'GET',mode:'no-cors',cache:'no-store'});}catch(e){}
try{new Image().src=u+'&_t='+Date.now();}catch(e){}
try{await fetch('https://corsproxy.io/?'+encodeURIComponent(u));}catch(e){}
return true;
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
document.getElementById('calculateBtn').onclick=()=>showStatus('محاسبه اضافه کار به‌زودی','info');
document.querySelectorAll('.tab-btn').forEach(b=>b.onclick=e=>{document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tab-content').forEach(x=>x.classList.remove('active'));e.target.classList.add('active');document.getElementById(e.target.getAttribute('data-tab')).classList.add('active');if(e.target.getAttribute('data-tab')==='records')displayRecords();});
document.getElementById('clearRecords').onclick=()=>{if(confirm('مطمئن هستید؟')){localStorage.removeItem('attendanceRecords');displayRecords();showStatus('سوابق حذف شد','success');}};
loadMainScreen();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
