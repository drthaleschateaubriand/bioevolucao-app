import { CONFIG } from "../config.js";
import { PreviewStore } from "./store.js";
import { parseNumber, bmi, compositionFromFatPercent, jacksonPollock7, ageFromBirthDate, formatNumber } from "./calculations.js";

const store = new PreviewStore();
const app = document.querySelector("#app");
const state = { auth:false, patientId:null, tab:"resumo", patientMode:false, selected:new Set() };

function esc(s){ return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]}); }
function datePt(s){ if(!s)return "—"; var a=s.split("-"); return a.length===3?a[2]+"/"+a[1]+"/"+a[0]:s; }
function ordered(p){ return (p.assessments||[]).slice().sort(function(a,b){return a.date.localeCompare(b.date)}); }
function last(p){ var x=ordered(p); return x[x.length-1]||null; }
function kpi(label,value,unit){ return '<div class="kpi"><span>'+label+'</span><b>'+value+(unit?' <small style="font-size:12px">'+unit+'</small>':'')+'</b></div>'; }
function header(){ return '<div class="topbar no-print"><div class="brand"><div class="logo">AA</div><div><h1>'+CONFIG.appName+'</h1><p>Composição corporal, bioimpedância e adipometria</p></div></div><button class="btn" data-action="logout">Sair</button></div>'; }

function render(){
  if(!state.auth){ renderLogin(); return; }
  if(!state.patientId){ renderSearch(""); return; }
  renderPatient();
}

function renderLogin(){
  app.innerHTML='<main class="shell"><section class="card login"><div class="brand" style="margin-bottom:20px"><div class="logo">AA</div><div><h1 style="font-size:30px">'+CONFIG.appName+'</h1><p>Versão profissional em desenvolvimento</p></div></div><form id="loginForm" class="grid" style="grid-template-columns:1fr"><div class="field"><label>E-mail</label><input type="email" required placeholder="seu@email.com"></div><div class="field"><label>Senha</label><input type="password" required placeholder="••••••••"></div><button class="btn primary">Entrar</button><button class="btn" type="button" data-action="forgot">Recuperar senha</button></form><p class="notice" style="margin-top:16px">Prévia técnica. O login real, recuperação de senha e sincronização em nuvem serão conectados ao backend antes do uso com dados identificáveis.</p></section></main>';
  document.querySelector("#loginForm").addEventListener("submit",function(e){e.preventDefault();state.auth=true;render()});
}

function renderSearch(q){
  var ps=store.searchPatients(q||"");
  var rows=ps.map(function(p){return '<button class="patient-row" data-patient="'+p.id+'" style="width:100%;text-align:left"><div><strong>'+esc(p.fullName)+'</strong><div class="small muted">'+(ageFromBirthDate(p.birthDate)||"—")+' anos · '+p.assessments.length+' avaliação(ões)</div></div><span class="btn soft">Abrir</span></button>';}).join("");
  app.innerHTML='<main class="shell">'+header()+'<section class="card"><div class="eval-head"><div><h2 class="section-title">Buscar paciente</h2><p class="muted">Localize pelo nome completo.</p></div><button class="btn primary" data-action="new-patient">+ Novo paciente</button></div><div class="searchbox" style="margin-top:16px"><input id="patientSearch" value="'+esc(q||"")+'" placeholder="Digite o nome do paciente..."></div><div class="patient-list">'+(rows||'<div class="notice">Nenhum paciente encontrado.</div>')+'</div><div id="newPatientArea"></div></section></main>';
  document.querySelector("#patientSearch").addEventListener("input",function(e){renderSearch(e.target.value)});
  bind();
}

function newPatientHtml(){
  return '<section class="card" style="margin-top:16px"><h3 class="section-title">Novo paciente</h3><form id="newPatientForm" class="grid" style="margin-top:16px"><div class="field"><label>Nome completo</label><input id="npName" required></div><div class="field"><label>Data de nascimento</label><input id="npBirth" type="date" required></div><div class="field"><label>Sexo</label><select id="npSex"><option value="male">Masculino</option><option value="female">Feminino</option></select></div><div class="field"><label>E-mail</label><input id="npEmail" type="email"></div><div class="field"><label>Telefone</label><input id="npPhone"></div><div class="field"><label>Altura (cm)</label><input id="npHeight" inputmode="decimal"></div><div class="actions" style="align-self:end"><button class="btn primary">Salvar paciente</button><button class="btn" type="button" data-action="cancel-new-patient">Cancelar</button></div></form></section>';
}

function patientHeader(p){
  var tabs=[["resumo","Resumo"],["nova","Nova avaliação"],["evolucao","Evolução"],["relatorio","Relatórios"]].map(function(x){return '<button class="tab '+(state.tab===x[0]?"active":"")+'" data-tab="'+x[0]+'">'+x[1]+'</button>';}).join("");
  return '<section class="card no-print"><div class="eval-head"><div><div class="small muted">PACIENTE</div><h2 class="section-title">'+esc(p.fullName)+'</h2><p class="muted">'+(ageFromBirthDate(p.birthDate)||"—")+' anos · '+(p.heightCm?p.heightCm+" cm":"altura não registrada")+' · '+esc(p.email||"sem e-mail")+'</p></div><div class="actions"><button class="btn" data-action="back-search">Buscar outro</button><button class="btn soft" data-action="patient-mode">Mostrar ao paciente</button></div></div><nav class="tabs">'+tabs+'</nav></section>';
}

function patientMode(p){
  var a=last(p);
  if(!a)return '<section class="patient-mode"><h2 class="section-title" style="color:white">Sem avaliação registrada</h2><button class="btn" data-action="patient-mode">Voltar</button></section>';
  return '<section class="patient-mode"><div class="eval-head"><div><div class="small" style="color:#bdd6c9">AVALIAÇÃO ANTROPOMÉTRICA</div><h2 class="section-title" style="color:white">'+esc(p.fullName)+'</h2><p>'+datePt(a.date)+'</p></div><button class="btn" data-action="patient-mode">Voltar ao modo médico</button></div><div class="kpis">'+kpi("Peso",formatNumber(a.bio&&a.bio.weight),"kg")+kpi("Gordura por bioimpedância",formatNumber(a.bio&&a.bio.fatPct),"%")+kpi("Massa muscular",formatNumber(a.bio&&a.bio.muscleMass),"kg")+kpi("Adipômetro",formatNumber(a.skinfold&&a.skinfold.fatPct),"%")+kpi("Cintura",formatNumber(a.anthropometry&&a.anthropometry.waist),"cm")+'</div><p style="color:#bdd6c9">Resultados apresentados sem interpretação diagnóstica automática.</p></section>';
}

function summary(p){
  var a=last(p);
  if(!a)return '<section class="card eval-block"><h3 class="section-title">Resumo</h3><p class="notice">Nenhuma avaliação registrada.</p></section>';
  return '<section class="card eval-block"><div class="eval-head"><div><h3 class="section-title">Última avaliação</h3><p class="muted">'+datePt(a.date)+'</p></div><button class="btn primary" data-tab="nova">Nova avaliação</button></div><div class="kpis">'+kpi("Peso",formatNumber(a.bio&&a.bio.weight),"kg")+kpi("IMC",formatNumber(a.bio&&a.bio.bmi),"kg/m²")+kpi("Gordura",formatNumber(a.bio&&a.bio.fatPct),"%")+kpi("Massa muscular",formatNumber(a.bio&&a.bio.muscleMass),"kg")+kpi("Cintura",formatNumber(a.anthropometry&&a.anthropometry.waist),"cm")+'</div></section>';
}

function newAssessment(p){
  var today=new Date().toISOString().slice(0,10);
  return '<form id="assessmentForm"><section class="card eval-block"><div class="eval-head"><div><h3 class="section-title">Nova avaliação</h3><p class="muted">Preencha apenas o que foi medido.</p></div><div class="field"><label>Data</label><input id="assessmentDate" type="date" value="'+today+'" required></div></div></section><section class="card eval-block"><h3>Bioimpedância</h3><div class="grid"><div class="field"><label>Peso (kg)</label><input id="bioWeight"></div><div class="field"><label>Altura (cm)</label><input id="bioHeight" value="'+(p.heightCm||"")+'"></div><div class="field"><label>IMC</label><input id="bioBmi" readonly></div><div class="field"><label>Gordura corporal (%)</label><input id="bioFatPct"></div><div class="field"><label>Massa gorda (kg)</label><input id="bioFatMass"></div><div class="field"><label>Massa muscular (kg)</label><input id="bioMuscle"></div><div class="field"><label>Massa livre de gordura (kg)</label><input id="bioLean"></div><div class="field"><label>Gordura visceral</label><input id="bioVisceral"></div><div class="field"><label>Metabolismo basal (kcal)</label><input id="bioBmr"></div></div><div class="hr"></div><div class="field"><label>Fotos da bioimpedância</label><input id="bioPhotos" type="file" accept="image/*" multiple><div id="photoQueue" class="small muted">Nenhuma imagem selecionada.</div></div><p class="notice">Múltiplas imagens serão processadas por OCR com tela de conferência. Nesta prévia elas não são enviadas nem armazenadas.</p></section><section class="card eval-block"><h3>Adipômetro · Jackson-Pollock 7 dobras</h3><div class="grid"><div class="field"><label>Peitoral</label><input class="fold" data-fold="chest"></div><div class="field"><label>Axilar média</label><input class="fold" data-fold="axillary"></div><div class="field"><label>Tríceps</label><input class="fold" data-fold="triceps"></div><div class="field"><label>Subescapular</label><input class="fold" data-fold="subscapular"></div><div class="field"><label>Abdominal</label><input class="fold" data-fold="abdomen"></div><div class="field"><label>Supra-ilíaca</label><input class="fold" data-fold="suprailiac"></div><div class="field"><label>Coxa</label><input class="fold" data-fold="thigh"></div></div><div class="kpis" id="skinResults">'+kpi("Somatório","—","mm")+kpi("Densidade","—","kg/L")+kpi("Gordura","—","%")+'</div></section><section class="card eval-block"><h3>Antropometria</h3><div class="grid"><div class="field"><label>Cintura (cm)</label><input id="antWaist"></div><div class="field"><label>Quadril (cm)</label><input id="antHip"></div><div class="field"><label>Panturrilha (cm)</label><input id="antCalf"></div></div></section><section class="card eval-block"><button class="btn primary">Finalizar avaliação</button></section></form>';
}

function chosen(p){
  var all=ordered(p);
  if(!state.selected.size)all.forEach(function(a){state.selected.add(a.date)});
  return all.filter(function(a){return state.selected.has(a.date)});
}

function tableFor(arr,rows,source){
  return '<div class="tablewrap"><table><thead><tr><th>Parâmetro</th>'+arr.map(function(a){return '<th>'+datePt(a.date)+'</th>';}).join("")+'</tr></thead><tbody>'+rows.map(function(r){return '<tr><td>'+r[0]+'</td>'+arr.map(function(a){var obj=a[source]||{};var v=obj[r[1]];return '<td>'+formatNumber(v,r[1]==="bmr"||r[1]==="visceral"||r[1]==="sum"?0:1)+(v!=null&&r[2]?' '+r[2]:'')+'</td>';}).join("")+'</tr>';}).join("")+'</tbody></table></div>';
}

function evolution(p){
  var all=ordered(p), arr=chosen(p);
  var checks=all.map(function(a){return '<label class="btn"><input type="checkbox" data-date-filter="'+a.date+'" '+(state.selected.has(a.date)?"checked":"")+'> '+datePt(a.date)+'</label>';}).join("");
  return '<section class="card eval-block"><div class="eval-head"><div><h3 class="section-title">Evolução completa</h3><p class="muted">'+arr.length+' de '+all.length+' datas selecionadas.</p></div><div class="actions"><button class="btn" data-action="all-dates">Todas</button><button class="btn" data-action="clear-dates">Limpar</button></div></div><div class="actions" style="margin:14px 0">'+checks+'</div><h3>Bioimpedância</h3>'+tableFor(arr,[["Peso","weight","kg"],["IMC","bmi",""],["Gordura corporal","fatPct","%"],["Massa gorda","fatMass","kg"],["Massa muscular","muscleMass","kg"],["Massa livre de gordura","leanMass","kg"],["Gordura visceral","visceral",""],["Metabolismo basal","bmr","kcal"]],"bio")+'<h3>Adipômetro</h3>'+tableFor(arr,[["Gordura corporal","fatPct","%"],["Densidade","density","kg/L"],["Somatório","sum","mm"]],"skinfold")+'<h3>Antropometria</h3>'+tableFor(arr,[["Cintura","waist","cm"],["Quadril","hip","cm"],["Panturrilha","calf","cm"]],"anthropometry")+'</section>';
}

function reportText(p){
  var arr=chosen(p); if(!arr.length)return "Nenhuma avaliação selecionada.";
  var a=arr[arr.length-1], parts=[];
  function push(label,v,unit,d){if(v!=null)parts.push(label+" "+formatNumber(v,d==null?1:d)+(unit||""));}
  push("peso",a.bio&&a.bio.weight," kg"); push("IMC",a.bio&&a.bio.bmi," kg/m²"); push("gordura corporal por bioimpedância",a.bio&&a.bio.fatPct,"%"); push("massa gorda",a.bio&&a.bio.fatMass," kg"); push("massa muscular",a.bio&&a.bio.muscleMass," kg"); push("massa livre de gordura",a.bio&&a.bio.leanMass," kg"); push("gordura visceral nível",a.bio&&a.bio.visceral,"",0); push("gordura corporal por adipômetro",a.skinfold&&a.skinfold.fatPct,"%"); push("cintura",a.anthropometry&&a.anthropometry.waist," cm"); push("quadril",a.anthropometry&&a.anthropometry.hip," cm"); push("panturrilha",a.anthropometry&&a.anthropometry.calf," cm");
  return "AVALIAÇÃO ANTROPOMÉTRICA ("+datePt(a.date)+"): "+parts.join("; ")+".";
}

function report(p){
  var t=reportText(p),a=chosen(p).slice(-1)[0];
  return '<section class="card eval-block no-print"><h3 class="section-title">Prontuário e relatório</h3><div class="field"><label>Texto para copiar no Cliniv</label><textarea id="reportText" class="report">'+esc(t)+'</textarea></div><div class="actions" style="margin-top:12px"><button class="btn primary" data-action="copy-report">Copiar para prontuário</button><button class="btn" data-action="print-report">Imprimir / baixar PDF</button><button class="btn" data-action="email-report">Enviar por e-mail</button></div><div class="field" style="margin-top:12px;max-width:420px"><label>E-mail</label><input id="reportEmail" value="'+esc(p.email||"")+'"></div></section><section class="report-page" style="margin-top:16px"><div class="small muted">AVALIAÇÃO ANTROPOMÉTRICA</div><h2>'+esc(p.fullName)+'</h2><p>'+(ageFromBirthDate(p.birthDate)||"—")+' anos · '+(a?datePt(a.date):"—")+'</p><p>'+esc(t)+'</p><div class="hr"></div><strong>'+CONFIG.clinician.name+'</strong><br><span>'+CONFIG.clinician.crm+'</span></section>';
}

function renderPatient(){
  var p=store.getPatient(state.patientId); if(!p){state.patientId=null;renderSearch("");return;}
  if(state.patientMode){app.innerHTML='<main class="shell">'+header()+patientMode(p)+'</main>';bind();return;}
  var body=state.tab==="resumo"?summary(p):state.tab==="nova"?newAssessment(p):state.tab==="evolucao"?evolution(p):report(p);
  app.innerHTML='<main class="shell">'+header()+patientHeader(p)+body+'</main>';
  bind(); if(state.tab==="nova")bindAssessment(p);
}

function bindAssessment(p){
  var w=document.querySelector("#bioWeight"),h=document.querySelector("#bioHeight"),f=document.querySelector("#bioFatPct"),bi=document.querySelector("#bioBmi"),fm=document.querySelector("#bioFatMass"),lm=document.querySelector("#bioLean");
  function autoBio(){var W=parseNumber(w.value),H=parseNumber(h.value),F=parseNumber(f.value),B=bmi(W,H),C=compositionFromFatPercent(W,F);if(B!=null)bi.value=formatNumber(B);if(C.fatMass!=null){fm.value=formatNumber(C.fatMass);lm.value=formatNumber(C.leanMass);}}
  [w,h,f].forEach(function(x){x.addEventListener("input",autoBio)});
  document.querySelectorAll(".fold").forEach(function(x){x.addEventListener("input",function(){var vals=[].slice.call(document.querySelectorAll(".fold")).map(function(y){return parseNumber(y.value)});if(vals.some(function(v){return v==null}))return;var o=jacksonPollock7({sex:p.sex,age:ageFromBirthDate(p.birthDate),folds:vals});if(o)document.querySelector("#skinResults").innerHTML=kpi("Somatório",formatNumber(o.sum,0),"mm")+kpi("Densidade",formatNumber(o.density,4),"kg/L")+kpi("Gordura",formatNumber(o.fatPct),"%");})});
  document.querySelector("#bioPhotos").addEventListener("change",function(e){document.querySelector("#photoQueue").textContent=e.target.files.length+" imagem(ns) selecionada(s)."});
  document.querySelector("#assessmentForm").addEventListener("submit",function(e){e.preventDefault();var date=document.querySelector("#assessmentDate").value,W=parseNumber(w.value),H=parseNumber(h.value),F=parseNumber(f.value),C=compositionFromFatPercent(W,F),foldEls=[].slice.call(document.querySelectorAll(".fold")),foldObj={},vals=[];foldEls.forEach(function(x){var v=parseNumber(x.value);foldObj[x.dataset.fold]=v;vals.push(v)});var jp=vals.every(function(v){return v!=null})?jacksonPollock7({sex:p.sex,age:ageFromBirthDate(p.birthDate),folds:vals}):null;store.updatePatient(p.id,{heightCm:H||p.heightCm});store.saveAssessment(p.id,{date:date,bio:{weight:W,bmi:parseNumber(bi.value)||bmi(W,H),fatPct:F,fatMass:parseNumber(fm.value)||C.fatMass,muscleMass:parseNumber(document.querySelector("#bioMuscle").value),leanMass:parseNumber(lm.value)||C.leanMass,visceral:parseNumber(document.querySelector("#bioVisceral").value),bmr:parseNumber(document.querySelector("#bioBmr").value)},skinfold:jp?{fatPct:jp.fatPct,density:jp.density,sum:jp.sum,folds:foldObj}:null,anthropometry:{waist:parseNumber(document.querySelector("#antWaist").value),hip:parseNumber(document.querySelector("#antHip").value),calf:parseNumber(document.querySelector("#antCalf").value)}});state.selected.add(date);state.tab="resumo";render();});
}

function bind(){
  document.querySelectorAll("[data-tab]").forEach(function(b){b.addEventListener("click",function(){state.tab=b.dataset.tab;render()})});
  document.querySelectorAll("[data-patient]").forEach(function(b){b.addEventListener("click",function(){state.patientId=b.dataset.patient;state.tab="resumo";state.selected=new Set();render()})});
  document.querySelectorAll("[data-date-filter]").forEach(function(c){c.addEventListener("change",function(){c.checked?state.selected.add(c.dataset.dateFilter):state.selected.delete(c.dataset.dateFilter);render()})});
}

document.addEventListener("click",async function(e){
  var el=e.target.closest("[data-action]"); if(!el)return; var a=el.dataset.action;
  if(a==="logout"){state.auth=false;state.patientId=null;render();}
  if(a==="forgot")alert("Recuperação por e-mail será ativada no backend.");
  if(a==="back-search"){state.patientId=null;renderSearch("");}
  if(a==="patient-mode"){state.patientMode=!state.patientMode;render();}
  if(a==="new-patient"){document.querySelector("#newPatientArea").innerHTML=newPatientHtml();bindNewPatient();}
  if(a==="cancel-new-patient")document.querySelector("#newPatientArea").innerHTML="";
  if(a==="all-dates"){var p=store.getPatient(state.patientId);state.selected=new Set(ordered(p).map(function(x){return x.date}));render();}
  if(a==="clear-dates"){state.selected=new Set();render();}
  if(a==="copy-report"){var t=document.querySelector("#reportText").value;try{await navigator.clipboard.writeText(t);alert("Texto copiado para o prontuário.");}catch(err){document.querySelector("#reportText").select();}}
  if(a==="print-report")window.print();
  if(a==="email-report"){var p2=store.getPatient(state.patientId),to=document.querySelector("#reportEmail").value.trim(),body=document.querySelector("#reportText").value,subject="Avaliação Antropométrica - "+p2.fullName;location.href="mailto:"+encodeURIComponent(to)+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);}
});

function bindNewPatient(){
  var form=document.querySelector("#newPatientForm"); if(!form)return;
  form.addEventListener("submit",function(e){e.preventDefault();var p=store.createPatient({fullName:document.querySelector("#npName").value.trim(),birthDate:document.querySelector("#npBirth").value,sex:document.querySelector("#npSex").value,email:document.querySelector("#npEmail").value.trim(),phone:document.querySelector("#npPhone").value.trim(),heightCm:parseNumber(document.querySelector("#npHeight").value)});state.patientId=p.id;state.tab="resumo";render();});
}

render();
