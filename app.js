const KEY="agendae_mvp_v1";
const DAYS=["Seg","Ter","Qua","Qui","Sex","Sáb"];
const TIMES=["09:00","10:30","12:00","13:30","15:00","16:30","18:00"];
const defaultState={
  professional:{name:"Studio da Ana",service:"Unha em gel",price:80,duration:60,days:["Seg","Ter","Qua","Qui","Sex"]},
  bookings:[{day:"Sex",time:"10:30",name:"Juliana",phone:"",service:"Unha em gel"}],
  blocked:[],
  clientBooking:null
};
let state=load();
let selectedClientDay="Sex";
let selectedClientSlot="";
let selectedProDay="Sex";

function load(){try{const x=JSON.parse(localStorage.getItem(KEY));return x||structuredClone(defaultState)}catch{return structuredClone(defaultState)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function money(v){return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function qs(s){return document.querySelector(s)}
function showScreen(id){document.querySelectorAll(".screen").forEach(x=>x.classList.toggle("active",x.id===id));window.scrollTo({top:0,behavior:"smooth"})}

document.querySelectorAll("[data-screen]").forEach(b=>b.addEventListener("click",()=>showScreen(b.dataset.screen)));
qs("#resetBtn").addEventListener("click",()=>{if(confirm("Restaurar os dados de teste?")){state=structuredClone(defaultState);save();renderAll()}});

function renderDayPicker(){
  const c=qs("#dayPicker"); c.innerHTML="";
  DAYS.forEach(d=>{
    const b=document.createElement("button");b.className="chip "+(state.professional.days.includes(d)?"active":"");b.textContent=d;
    b.addEventListener("click",()=>{state.professional.days.includes(d)?state.professional.days=state.professional.days.filter(x=>x!==d):state.professional.days.push(d);save();renderAll()});
    c.appendChild(b);
  });
}
function renderProSlots(){
  const c=qs("#proSlots");c.innerHTML="";
  TIMES.forEach(t=>{
    const busy=state.bookings.some(x=>x.day===selectedProDay&&x.time===t)||state.blocked.some(x=>x.day===selectedProDay&&x.time===t);
    const b=document.createElement("button");b.className="slot "+(busy?"busy":"");b.textContent=busy?t+" • ocupado":t;
    b.addEventListener("click",()=>{
      if(state.bookings.some(x=>x.day===selectedProDay&&x.time===t)) return;
      const i=state.blocked.findIndex(x=>x.day===selectedProDay&&x.time===t);
      if(i>=0) state.blocked.splice(i,1); else state.blocked.push({day:selectedProDay,time:t});
      save();renderAll();
    });
    c.appendChild(b);
  });
}
function renderBookings(){
  const c=qs("#bookingList");c.innerHTML="";
  if(!state.bookings.length){c.innerHTML='<div class="empty">Nenhum agendamento ainda.</div>';return}
  state.bookings.forEach((x,i)=>{
    const d=document.createElement("div");d.className="booking";
    d.innerHTML=`<div><strong>${escapeHtml(x.time)} • ${escapeHtml(x.name)}</strong><small>${escapeHtml(x.service)} · ${escapeHtml(x.day)}${x.phone?" · "+escapeHtml(x.phone):""}</small></div><button class="icon-btn" data-cancel="${i}" title="Cancelar">×</button>`;
    c.appendChild(d);
  });
  c.querySelectorAll("[data-cancel]").forEach(b=>b.addEventListener("click",()=>{state.bookings.splice(Number(b.dataset.cancel),1);save();renderAll()}));
}
function renderClientDays(){
  const c=qs("#clientDays");c.innerHTML="";
  state.professional.days.forEach(d=>{
    const b=document.createElement("button");b.className="chip "+(d===selectedClientDay?"active":"");b.textContent=d;
    b.addEventListener("click",()=>{selectedClientDay=d;selectedClientSlot="";renderClient()});c.appendChild(b);
  });
  if(!state.professional.days.includes(selectedClientDay)){selectedClientDay=state.professional.days[0]||"Seg"}
}
function renderClientSlots(){
  const c=qs("#clientSlots");c.innerHTML="";
  TIMES.forEach(t=>{
    const busy=state.bookings.some(x=>x.day===selectedClientDay&&x.time===t)||state.blocked.some(x=>x.day===selectedClientDay&&x.time===t);
    const b=document.createElement("button");b.className="slot "+(busy?"busy":"")+(selectedClientSlot===t?" selected":"");b.textContent=busy?"Indisponível":t;
    if(!busy)b.addEventListener("click",()=>{selectedClientSlot=t;renderClientSlots()});
    c.appendChild(b);
  });
}
function renderClient(){
  qs("#clientProName").textContent=state.professional.name;
  qs("#proName").value=state.professional.name;
  qs("#serviceName").value=state.professional.service;
  qs("#servicePrice").value=state.professional.price;
  qs("#serviceDuration").value=state.professional.duration;
  qs("#clientService").innerHTML=`<option>${escapeHtml(state.professional.service)} — ${money(state.professional.price)}</option>`;
  renderClientDays();renderClientSlots();
  const cb=qs("#clientConfirmation");
  cb.innerHTML=state.clientBooking?`<strong>${escapeHtml(state.clientBooking.day)} às ${escapeHtml(state.clientBooking.time)}</strong><br><span>${escapeHtml(state.clientBooking.service)} · ${money(state.professional.price)}</span>`:'Nenhum agendamento nesta sessão.';
}
function saveProfile(){
  const name=qs("#proName").value.trim()||"Minha agenda";
  const service=qs("#serviceName").value.trim()||"Serviço";
  const price=Math.max(0,Number(String(qs("#servicePrice").value).replace(",","."))||0);
  state.professional={...state.professional,name,service,price,duration:Number(qs("#serviceDuration").value)};
  save();qs("#profileMsg").textContent="✓ Informações salvas.";renderAll();
}
qs("#saveProfile").addEventListener("click",saveProfile);

qs("#confirmBooking").addEventListener("click",()=>{
  const msg=qs("#bookingMsg"),name=qs("#clientName").value.trim(),phone=qs("#clientPhone").value.trim();
  if(!selectedClientSlot){msg.textContent="Escolha um horário.";return}
  if(!name){msg.textContent="Digite seu nome.";return}
  if(state.bookings.some(x=>x.day===selectedClientDay&&x.time===selectedClientSlot)){msg.textContent="Esse horário acabou de ficar indisponível.";selectedClientSlot="";renderClient();return}
  state.bookings.push({day:selectedClientDay,time:selectedClientSlot,name,phone,service:state.professional.service});
  state.clientBooking={day:selectedClientDay,time:selectedClientSlot,name,phone,service:state.professional.service};
  save();msg.textContent="✓ Agendamento confirmado!";selectedClientSlot="";qs("#clientName").value="";qs("#clientPhone").value="";renderAll();
});
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function renderAll(){renderDayPicker();renderProSlots();renderBookings();renderClient()}
renderAll();
