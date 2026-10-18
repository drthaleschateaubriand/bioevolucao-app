import { CONFIG } from "../config.js?v=savefix4";
import { AppDataStore } from "./data-store.js?v=savefix4";
import { parseNumber, bmi, compositionFromFatPercent, jacksonPollock7, ageFromBirthDate, formatNumber } from "./calculations.js";
import { FirebaseClient } from "../../shared/firebase-client.js?v=savefix4";
import { firebaseConfigured } from "../../shared/platform-config.js?v=savefix4";

const store = new AppDataStore();
const app = document.querySelector("#app");
const state = { auth:false, patientId:null, tab:"resumo", patientMode:false, selected:new Set(), selectionInitialized:false, chartMode:"grouped", user:null, membership:null, authReady:false };

function esc(s){ return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]}); }
function datePt(s){ if(!s)return "—"; var a=s.split("-"); return a.length===3?a[2]+"/"+a[1]+"/"+a[0]:s; }
function ordered(p){ return (p.assessments||[]).slice().sort(function(a,b){return a.date.localeCompare(b.date)}); }
function last(p){ var x=ordered(p); return x[x.length-1]||null; }
function kpi(label,value,unit){ return '<div class="kpi"><span>'+label+'</span><b>'+value+(unit?' <small style="font-size:12px">'+unit+'</small>':'')+'</b></div>'; }
function header(){
  var adminAllowed=!firebaseConfigured() || ["owner","admin"].includes(state.membership&&state.membership.globalRole);
  return '<div class="topbar no-print"><div class="brand"><div class="logo">AA</div><div><h1>'+CONFIG.appName+'</h1><p>Composição corporal, bioimpedância e adipometria</p></div></div><div class="actions">'+(adminAllowed?'<a class="btn" href="'+CONFIG.platform.ownerPortalPath+'">Administração</a>':'')+'<button class="btn" data-action="logout">Sair</button></div></div>';
}

function render(){
  if(!state.auth){ renderLogin(); return; }
  if(!state.patientId){ renderSearch(""); return; }
  renderPatient();
}

function renderLogin(){
  var params=new URLSearchParams(location.search);
  var invite=params.get("invite");
  var ownerToken=params.get("owner");
  var real=firebaseConfigured();
  var pendingBootstrap=Boolean(ownerToken&&real);
  var currentUser=state.user;

  if(pendingBootstrap&&currentUser){
    app.innerHTML='<main class="shell"><section class="card login"><div class="brand" style="margin-bottom:20px"><div class="logo">AA</div><div><h1 style="font-size:30px">'+CONFIG.appName+'</h1><p>Ativação do proprietário</p></div></div>'+
      '<div class="notice"><strong>Conta criada.</strong><br>Enviamos uma confirmação para <strong>'+esc(currentUser.email||"seu e-mail")+'</strong>. Abra o e-mail, confirme o endereço e depois volte aqui.</div>'+
      '<div class="actions" style="margin-top:16px"><button class="btn primary" id="ownerVerified" type="button">Já confirmei meu e-mail</button><button class="btn" id="resendVerification" type="button">Reenviar verificação</button><button class="btn" data-action="logout" type="button">Trocar conta</button></div><div id="loginStatus" class="small muted" style="margin-top:12px"></div></section></main>';

    document.querySelector("#ownerVerified").addEventListener("click",async function(){
      var status=document.querySelector("#loginStatus");
      status.textContent="Verificando...";
      try{
        var refreshed=await FirebaseClient.refreshUser();
        if(!refreshed||!refreshed.emailVerified){status.textContent="O e-mail ainda não aparece como verificado. Confirme pelo link recebido e tente novamente.";return;}
        var membership=await FirebaseClient.bootstrapOwner(ownerToken);
        state.membership=membership;
        state.auth=true;
        history.replaceState(null,"",location.pathname);
        await store.load();
        render();
      }catch(err){status.textContent=humanAuthError(err)}
    });

    document.querySelector("#resendVerification").addEventListener("click",async function(){
      try{await FirebaseClient.sendVerification();document.querySelector("#loginStatus").textContent="Novo e-mail de verificação enviado."}
      catch(err){document.querySelector("#loginStatus").textContent=humanAuthError(err)}
    });
    return;
  }

  app.innerHTML='<main class="shell"><section class="card login"><div class="brand" style="margin-bottom:20px"><div class="logo">AA</div><div><h1 style="font-size:30px">'+CONFIG.appName+'</h1><p>'+(pendingBootstrap?"Criar conta do proprietário":real?"Acesso seguro":"Versão profissional em demonstração")+'</p></div></div>'+
  (pendingBootstrap?'<div class="notice" style="margin-bottom:14px"><strong>Primeiro acesso do proprietário.</strong> Crie sua própria senha. Ela não será compartilhada comigo nem armazenada no código.</div>':invite&&real?'<div class="notice" style="margin-bottom:14px"><strong>Convite recebido.</strong> Use o mesmo e-mail que foi autorizado. Se esta for sua primeira entrada, escolha uma senha e clique em “Criar conta e ativar convite”.</div>':'')+
  '<form id="loginForm" class="grid" style="grid-template-columns:1fr"><div class="field"><label>E-mail</label><input id="loginEmail" type="email" required placeholder="seu@email.com"></div><div class="field"><label>Senha</label><input id="loginPassword" type="password" required minlength="6" placeholder="••••••••"></div>'+((invite||pendingBootstrap)&&real?'<div class="field"><label>Nome</label><input id="loginName" placeholder="Nome completo"></div>':'')+
  (pendingBootstrap?'<button class="btn primary" id="ownerSignup" type="button">Criar minha conta OWNER</button>':'<button class="btn primary">Entrar</button>')+
  (invite&&real?'<button class="btn soft" id="inviteSignup" type="button">Criar conta e ativar convite</button>':'')+
  (!pendingBootstrap?'<button class="btn" type="button" data-action="forgot">Recuperar senha</button>':'')+
  '<div id="loginStatus" class="small muted"></div></form>'+
  '<p class="notice" style="margin-top:16px">'+(real?'Somente usuários autorizados podem acessar dados. Cada profissional usa seu próprio login.':'Modo de demonstração local. O Firebase ainda não foi conectado a este ambiente.')+'</p></section></main>';

  document.querySelector("#loginForm").addEventListener("submit",async function(e){
    e.preventDefault();
    if(pendingBootstrap)return;
    var status=document.querySelector("#loginStatus");
    if(!real){state.auth=true;state.membership={globalRole:"owner",status:"active"};render();return;}
    status.textContent="Entrando...";
    try{await FirebaseClient.signIn(document.querySelector("#loginEmail").value.trim(),document.querySelector("#loginPassword").value)}
    catch(err){status.textContent=humanAuthError(err)}
  });

  var ownerSignup=document.querySelector("#ownerSignup");
  if(ownerSignup)ownerSignup.addEventListener("click",async function(){
    var status=document.querySelector("#loginStatus");
    status.textContent="Criando sua conta...";
    try{
      await FirebaseClient.signUp(document.querySelector("#loginEmail").value.trim(),document.querySelector("#loginPassword").value,document.querySelector("#loginName").value.trim());
      await FirebaseClient.sendVerification();
      status.textContent="Conta criada. Verifique seu e-mail para concluir.";
    }catch(err){status.textContent=humanAuthError(err)}
  });

  var signup=document.querySelector("#inviteSignup");
  if(signup)signup.addEventListener("click",async function(){
    var status=document.querySelector("#loginStatus");
    status.textContent="Criando acesso...";
    try{
      await FirebaseClient.signUp(document.querySelector("#loginEmail").value.trim(),document.querySelector("#loginPassword").value,document.querySelector("#loginName").value.trim());
      await FirebaseClient.activateInvite(invite);
      status.textContent="Convite ativado.";
    }catch(err){status.textContent=humanAuthError(err)}
  });
}

function humanAuthError(err){
  var code=err&&err.code?err.code:"";
  if(code.includes("invalid-credential")||code.includes("wrong-password"))return "E-mail ou senha inválidos.";
  if(code.includes("user-not-found"))return "Usuário não encontrado.";
  if(code.includes("email-already-in-use"))return "Este e-mail já possui uma conta. Use Entrar.";
  if(code.includes("weak-password"))return "Escolha uma senha mais forte.";
  if(code.includes("too-many-requests"))return "Muitas tentativas. Aguarde e tente novamente.";
  return (err&&err.message)||"Não foi possível concluir o acesso.";
}

function renderUnauthorized(){
  app.innerHTML='<main class="shell"><section class="card login"><h2 class="section-title">Acesso não autorizado</h2><p class="muted">Sua conta está autenticada, mas não possui autorização ativa para este aplicativo.</p><div class="actions"><button class="btn" data-action="logout">Sair</button></div></section></main>';
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
  var recent=ordered(p).slice(-6);
  return '<section class="patient-mode"><div class="eval-head"><div><div class="small" style="color:#bdd6c9">AVALIAÇÃO ANTROPOMÉTRICA</div><h2 class="section-title" style="color:white">'+esc(p.fullName)+'</h2><p>'+datePt(a.date)+'</p></div><button class="btn" data-action="patient-mode">Voltar ao modo médico</button></div><div class="kpis">'+kpi("Peso",formatNumber(a.bio&&a.bio.weight),"kg")+kpi("Gordura por bioimpedância",formatNumber(a.bio&&a.bio.fatPct),"%")+kpi("Massa muscular",formatNumber(a.bio&&a.bio.muscleMass),"kg")+kpi("Adipômetro",formatNumber(a.skinfold&&a.skinfold.fatPct),"%")+kpi("Cintura",formatNumber(a.anthropometry&&a.anthropometry.waist),"cm")+'</div><div class="patient-chart">'+compositionBars(recent,"bio","Evolução da composição corporal")+'</div><p style="color:#bdd6c9">Resultados apresentados sem interpretação diagnóstica automática.</p></section>';
}

function summary(p){
  var a=last(p);
  if(!a)return '<section class="card eval-block"><h3 class="section-title">Resumo</h3><p class="notice">Nenhuma avaliação registrada.</p></section>';
  var recent=ordered(p).slice(-6);
  return '<section class="card eval-block"><div class="eval-head"><div><h3 class="section-title">Última avaliação</h3><p class="muted">'+datePt(a.date)+'</p></div><button class="btn primary" data-tab="nova">Nova avaliação</button></div><div class="kpis">'+kpi("Peso",formatNumber(a.bio&&a.bio.weight),"kg")+kpi("IMC",formatNumber(a.bio&&a.bio.bmi),"kg/m²")+kpi("Gordura",formatNumber(a.bio&&a.bio.fatPct),"%")+kpi("Massa muscular",formatNumber(a.bio&&a.bio.muscleMass),"kg")+kpi("Cintura",formatNumber(a.anthropometry&&a.anthropometry.waist),"cm")+'</div><div class="graph-panel">'+compositionBars(recent,"bio","Composição corporal")+'</div></section>';
}

function newAssessment(p){
  var today=new Date().toISOString().slice(0,10);
  return '<form id="assessmentForm">'+
  '<section class="card eval-block"><div class="eval-head"><div><h3 class="section-title">Nova avaliação</h3><p class="muted">Preencha apenas o que foi medido.</p></div><div class="field"><label>Data</label><input id="assessmentDate" type="date" value="'+today+'" required></div></div></section>'+
  '<section class="card eval-block"><h3>Bioimpedância</h3><div class="grid">'+
  '<div class="field"><label>Peso (kg)</label><input id="bioWeight"></div><div class="field"><label>Altura (cm)</label><input id="bioHeight" value="'+(p.heightCm||"")+'"></div><div class="field"><label>IMC</label><input id="bioBmi" readonly></div><div class="field"><label>Gordura corporal (%)</label><input id="bioFatPct"></div><div class="field"><label>Massa gorda (kg)</label><input id="bioFatMass"></div><div class="field"><label>Massa muscular (kg)</label><input id="bioMuscle"></div><div class="field"><label>Massa livre de gordura (kg)</label><input id="bioLean"></div><div class="field"><label>Gordura visceral</label><input id="bioVisceral"></div><div class="field"><label>Metabolismo basal (kcal)</label><input id="bioBmr"></div></div>'+
  '<div class="hr"></div><div class="field"><label>Fotos ou PDFs da bioimpedância</label><input id="bioPhotos" type="file" accept="image/*,application/pdf,.pdf" multiple><div id="photoQueue" class="small muted">Nenhum arquivo selecionado.</div></div>'+
  '<div class="ocr-toolbar"><button class="btn soft" id="ocrStart" type="button" disabled>Ler arquivos</button><div class="ocr-progress"><div class="ocr-progress-bar" id="ocrProgressBar"></div></div><span id="ocrStatus" class="small muted">Selecione fotos e/ou PDFs.</span></div>'+
  '<div id="ocrReview" class="ocr-review hidden"><div class="eval-head"><div><h4>Conferir dados reconhecidos</h4><p class="small muted">Revise e corrija antes de aplicar ao formulário.</p></div><button class="btn primary" id="ocrApply" type="button">Aplicar ao formulário</button></div><div class="grid" id="ocrReviewGrid"></div><details class="optional-block"><summary>Ver texto reconhecido</summary><pre id="ocrRawText" class="ocr-raw"></pre></details></div>'+
  '<p class="notice">Fotos e PDFs são processados no navegador e não são armazenados após a conferência. PDFs são lidos página por página; quando houver texto digital, ele é extraído diretamente e, quando necessário, a página passa por OCR. Revise sempre os números antes de salvar.</p></section>'+
  '<section class="card eval-block"><h3>Adipômetro · Jackson-Pollock 7 dobras</h3><div class="grid">'+
  '<div class="field"><label>Peitoral (mm)</label><input class="fold" data-fold="chest"></div><div class="field"><label>Axilar média (mm)</label><input class="fold" data-fold="axillary"></div><div class="field"><label>Tríceps (mm)</label><input class="fold" data-fold="triceps"></div><div class="field"><label>Subescapular (mm)</label><input class="fold" data-fold="subscapular"></div><div class="field"><label>Abdominal (mm)</label><input class="fold" data-fold="abdomen"></div><div class="field"><label>Supra-ilíaca (mm)</label><input class="fold" data-fold="suprailiac"></div><div class="field"><label>Coxa (mm)</label><input class="fold" data-fold="thigh"></div></div>'+
  '<div class="kpis" id="skinResults">'+kpi("Somatório","—","mm")+kpi("Densidade","—","kg/L")+kpi("Gordura","—","%")+'</div>'+
  '<details class="optional-block"><summary>Pregas adicionais opcionais</summary><p class="small muted">Não entram no cálculo Jackson-Pollock de 7 dobras; ficam apenas registradas para acompanhamento.</p><div class="grid"><div class="field"><label>Bíceps (mm)</label><input id="skinBiceps"></div><div class="field"><label>Panturrilha medial (mm)</label><input id="skinMedialCalf"></div></div></details></section>'+
  '<section class="card eval-block"><h3>Antropometria</h3><p class="small muted">Os campos não preenchidos não aparecem no relatório.</p><div class="grid">'+
  '<div class="field"><label>Cintura (cm)</label><input id="antWaist"></div><div class="field"><label>Quadril (cm)</label><input id="antHip"></div><div class="field"><label>Panturrilha (cm)</label><input id="antCalf"></div><div class="field"><label>Braço / CB (cm)</label><input id="antArm"></div><div class="field"><label>Pescoço (cm)</label><input id="antNeck"></div><div class="field"><label>Abdome (cm)</label><input id="antAbdomen"></div><div class="field"><label>Coxa (cm)</label><input id="antThigh"></div></div></section>'+
  '<section class="card eval-block"><div class="actions"><button class="btn primary">Finalizar avaliação</button><button class="btn soft" type="button" data-action="patient-mode">Mostrar ao paciente</button></div></section></form>';
}

function chosen(p){
  var all=ordered(p);
  if(!state.selectionInitialized){
    state.selected=new Set(all.map(function(a){return a.date}));
    state.selectionInitialized=true;
  }
  return all.filter(function(a){return state.selected.has(a.date)});
}

function tableFor(arr,rows,source){
  var visible=rows.filter(function(r){return arr.some(function(a){var obj=a[source]||{};return obj[r[1]]!=null})});
  if(!visible.length)return '<div class="notice">Sem dados registrados neste bloco para as datas selecionadas.</div>';
  return '<div class="tablewrap"><table><thead><tr><th>Parâmetro</th>'+arr.map(function(a){return '<th>'+datePt(a.date)+'</th>';}).join("")+'</tr></thead><tbody>'+visible.map(function(r){return '<tr><td>'+r[0]+'</td>'+arr.map(function(a){var obj=a[source]||{};var v=obj[r[1]];return '<td>'+formatNumber(v,r[1]==="bmr"||r[1]==="visceral"||r[1]==="sum"?0:1)+(v!=null&&r[2]?' '+r[2]:'')+'</td>';}).join("")+'</tr>';}).join("")+'</tbody></table></div>';
}

function compositionBars(arr,mode,title,forceMode){
  var renderMode=forceMode||state.chartMode;
  var data=arr.map(function(a){
    var weight=a.bio&&a.bio.weight;
    var fat=null,lean=null,fatPct=null;
    if(mode==="bio"){
      fat=a.bio&&a.bio.fatMass;
      lean=a.bio&&a.bio.leanMass;
      fatPct=a.bio&&a.bio.fatPct;
      if(fat==null&&weight!=null&&fatPct!=null)fat=weight*fatPct/100;
      if(lean==null&&weight!=null&&fat!=null)lean=weight-fat;
    }else{
      fatPct=a.skinfold&&a.skinfold.fatPct;
      if(weight!=null&&fatPct!=null){fat=weight*fatPct/100;lean=weight-fat;}
    }
    return {date:a.date,weight:weight,fat:fat,lean:lean,fatPct:fatPct};
  }).filter(function(x){return x.weight!=null&&x.fat!=null&&x.lean!=null});
  if(!data.length)return '<div class="notice">Sem dados suficientes para o gráfico de composição corporal.</div>';
  var max=Math.max.apply(null,data.map(function(x){return x.weight}));
  if(renderMode==="grouped"){
    return '<div class="bar-chart grouped-chart"><div class="bar-chart-head"><div><strong>'+title+'</strong><div class="small muted">Peso corporal, massa livre de gordura e massa gorda</div></div><div class="bar-legend"><span><i class="legend-dot weight"></i>Peso corporal</span><span><i class="legend-dot lean"></i>Massa livre de gordura</span><span><i class="legend-dot fat"></i>Massa gorda</span></div></div><div class="grouped-plot">'+data.map(function(x){var hW=Math.max(18,Math.round(190*x.weight/max));var hL=Math.max(18,Math.round(190*x.lean/max));var hF=Math.max(18,Math.round(190*x.fat/max));return '<div class="group-date"><div class="group-bars"><div class="single-bar weight" style="height:'+hW+'px"><span>'+formatNumber(x.weight)+' kg</span></div><div class="single-bar lean" style="height:'+hL+'px"><span>'+formatNumber(x.lean)+' kg</span></div><div class="single-bar fat" style="height:'+hF+'px"><span>'+formatNumber(x.fat)+' kg</span></div></div><div class="bar-date">'+datePt(x.date)+'</div><div class="bar-caption">'+formatNumber(x.fatPct)+'% gordura</div></div>';}).join("")+'</div></div>';
  }
  return '<div class="bar-chart"><div class="bar-chart-head"><div><strong>'+title+'</strong><div class="small muted">Composição empilhada</div></div><div class="bar-legend"><span><i class="legend-dot lean"></i>Massa livre de gordura</span><span><i class="legend-dot fat"></i>Massa gorda</span></div></div><div class="bar-plot">'+data.map(function(x){var total=Math.max(72,Math.round(190*x.weight/max));var leanPct=100*x.lean/x.weight;var fatPct=100*x.fat/x.weight;return '<div class="bar-col"><div class="bar-value">'+formatNumber(x.weight)+' kg</div><div class="bar-stack" style="height:'+total+'px"><div class="bar-seg lean" style="height:'+leanPct+'%" title="Massa livre: '+formatNumber(x.lean)+' kg"></div><div class="bar-seg fat" style="height:'+fatPct+'%" title="Massa gorda: '+formatNumber(x.fat)+' kg"></div></div><div class="bar-date">'+datePt(x.date).slice(0,5)+'</div><div class="bar-caption">'+formatNumber(x.fatPct)+'%</div></div>';}).join("")+'</div></div>';
}

function circumferenceBars(arr,key,label){
  var data=arr.map(function(a){return {date:a.date,value:a.anthropometry&&a.anthropometry[key]}}).filter(function(x){return x.value!=null});
  if(data.length<2)return "";
  var max=Math.max.apply(null,data.map(function(x){return x.value}));
  return '<div class="mini-trend"><strong>'+label+'</strong>'+data.map(function(x){return '<div class="mini-row"><span>'+datePt(x.date)+'</span><div class="mini-track"><div class="mini-fill" style="width:'+Math.max(8,100*x.value/max)+'%"></div></div><b>'+formatNumber(x.value)+' cm</b></div>';}).join("")+'</div>';
}

function evolution(p){
  var all=ordered(p), arr=chosen(p);
  var checks=all.map(function(a){return '<label class="btn"><input type="checkbox" data-date-filter="'+a.date+'" '+(state.selected.has(a.date)?"checked":"")+'> '+datePt(a.date)+'</label>';}).join("");
  var bioRows=[["Peso","weight","kg"],["IMC","bmi",""],["Gordura corporal","fatPct","%"],["Massa gorda","fatMass","kg"],["Massa muscular","muscleMass","kg"],["Massa livre de gordura","leanMass","kg"],["Gordura visceral","visceral",""],["Metabolismo basal","bmr","kcal"]];
  var skinRows=[["Gordura corporal","fatPct","%"],["Densidade","density","kg/L"],["Somatório","sum","mm"]];
  var antRows=[["Cintura","waist","cm"],["Quadril","hip","cm"],["Panturrilha","calf","cm"],["Braço / CB","arm","cm"],["Pescoço","neck","cm"],["Abdome","abdomen","cm"],["Coxa","thigh","cm"]];
  return '<section class="card eval-block"><div class="eval-head"><div><h3 class="section-title">Evolução completa</h3><p class="muted">'+arr.length+' de '+all.length+' datas selecionadas.</p></div><div class="actions"><button class="btn" data-action="all-dates">Todas</button><button class="btn" data-action="clear-dates">Limpar</button></div></div><div class="chart-mode-switch"><span class="small muted">Modo do gráfico</span><div class="actions"><button class="btn '+(state.chartMode==="grouped"?"primary":"")+'" data-chart-mode="grouped">Barras lado a lado</button><button class="btn '+(state.chartMode==="stacked"?"primary":"")+'" data-chart-mode="stacked">Empilhado</button></div></div><div class="actions" style="margin:14px 0">'+checks+'</div>'+
  '<div class="graph-grid">'+compositionBars(arr,"bio","Composição corporal · Bioimpedância")+compositionBars(arr,"skinfold","Composição corporal · Adipômetro")+'</div>'+
  '<h3>Bioimpedância</h3>'+tableFor(arr,bioRows,"bio")+
  '<h3>Adipômetro</h3>'+tableFor(arr,skinRows,"skinfold")+
  '<h3>Antropometria</h3>'+tableFor(arr,antRows,"anthropometry")+
  '<div class="graph-grid">'+circumferenceBars(arr,"waist","Evolução da cintura")+circumferenceBars(arr,"calf","Evolução da panturrilha")+'</div></section>';
}

function reportText(p){
  var arr=chosen(p); if(!arr.length)return "Nenhuma avaliação selecionada.";
  var a=arr[arr.length-1],first=arr[0],parts=[];
  function push(label,v,unit,d){if(v!=null)parts.push(label+" "+formatNumber(v,d==null?1:d)+(unit||""));}
  push("peso",a.bio&&a.bio.weight," kg"); push("IMC",a.bio&&a.bio.bmi," kg/m²"); push("gordura corporal por bioimpedância",a.bio&&a.bio.fatPct,"%"); push("massa gorda",a.bio&&a.bio.fatMass," kg"); push("massa muscular",a.bio&&a.bio.muscleMass," kg"); push("massa livre de gordura",a.bio&&a.bio.leanMass," kg"); push("gordura visceral nível",a.bio&&a.bio.visceral,"",0); push("gordura corporal por adipômetro",a.skinfold&&a.skinfold.fatPct,"%"); push("cintura",a.anthropometry&&a.anthropometry.waist," cm"); push("quadril",a.anthropometry&&a.anthropometry.hip," cm"); push("panturrilha",a.anthropometry&&a.anthropometry.calf," cm"); push("braço/CB",a.anthropometry&&a.anthropometry.arm," cm"); push("pescoço",a.anthropometry&&a.anthropometry.neck," cm"); push("abdome",a.anthropometry&&a.anthropometry.abdomen," cm"); push("coxa",a.anthropometry&&a.anthropometry.thigh," cm");
  var text="AVALIAÇÃO ANTROPOMÉTRICA ("+datePt(a.date)+"): "+parts.join("; ")+".";
  if(first&&first.date!==a.date){
    var diffs=[];
    function delta(label,v1,v2,unit,d){if(v1==null||v2==null)return;var x=v2-v1;diffs.push(label+" "+(x>=0?"+":"")+formatNumber(x,d==null?1:d)+" "+unit);}
    delta("peso",first.bio&&first.bio.weight,a.bio&&a.bio.weight,"kg");
    delta("gordura corporal",first.bio&&first.bio.fatPct,a.bio&&a.bio.fatPct,"p.p.");
    delta("massa muscular",first.bio&&first.bio.muscleMass,a.bio&&a.bio.muscleMass,"kg");
    delta("adipômetro",first.skinfold&&first.skinfold.fatPct,a.skinfold&&a.skinfold.fatPct,"p.p.");
    delta("cintura",first.anthropometry&&first.anthropometry.waist,a.anthropometry&&a.anthropometry.waist,"cm");
    delta("panturrilha",first.anthropometry&&first.anthropometry.calf,a.anthropometry&&a.anthropometry.calf,"cm");
    if(diffs.length)text+=" EVOLUÇÃO ("+datePt(first.date)+" a "+datePt(a.date)+"): "+diffs.join("; ")+".";
  }
  return text;
}

function report(p){
  var arr=chosen(p),t=reportText(p),a=arr[arr.length-1];
  var bioRows=[["Peso","weight","kg"],["IMC","bmi","kg/m²"],["Gordura corporal","fatPct","%"],["Massa gorda","fatMass","kg"],["Massa muscular","muscleMass","kg"],["Massa livre de gordura","leanMass","kg"],["Gordura visceral","visceral",""],["Metabolismo basal","bmr","kcal"]];
  var skinRows=[["Gordura corporal","fatPct","%"],["Densidade corporal","density","kg/L"],["Somatório das dobras","sum","mm"]];
  var antRows=[["Cintura","waist","cm"],["Quadril","hip","cm"],["Panturrilha","calf","cm"],["Braço / CB","arm","cm"],["Pescoço","neck","cm"],["Abdome","abdomen","cm"],["Coxa","thigh","cm"]];
  var foldRows=[["Peitoral","chest","mm"],["Axilar média","axillary","mm"],["Tríceps","triceps","mm"],["Subescapular","subscapular","mm"],["Abdominal","abdomen","mm"],["Supra-ilíaca","suprailiac","mm"],["Coxa","thigh","mm"],["Bíceps adicional","biceps","mm"],["Panturrilha medial adicional","medialCalf","mm"]];
  function foldTable(){
    var visible=foldRows.filter(function(r){return arr.some(function(x){return x.skinfold&&x.skinfold.folds&&x.skinfold.folds[r[1]]!=null})});
    if(!visible.length)return '<div class="notice">Sem pregas registradas.</div>';
    return '<div class="tablewrap"><table><thead><tr><th>Prega</th>'+arr.map(function(x){return '<th>'+datePt(x.date)+'</th>';}).join("")+'</tr></thead><tbody>'+visible.map(function(r){return '<tr><td>'+r[0]+'</td>'+arr.map(function(x){var v=x.skinfold&&x.skinfold.folds&&x.skinfold.folds[r[1]];return '<td>'+formatNumber(v)+' '+(v!=null?"mm":"")+'</td>';}).join("")+'</tr>';}).join("")+'</tbody></table></div>';
  }
  return '<section class="card eval-block no-print"><div class="eval-head"><div><h3 class="section-title">Prontuário e relatório completo</h3><p class="muted">O texto abaixo é para o Cliniv. A impressão inclui gráficos e todas as tabelas preenchidas.</p></div></div><div class="field"><label>Texto para copiar no Cliniv</label><textarea id="reportText" class="report">'+esc(t)+'</textarea></div><div class="actions" style="margin-top:12px"><button class="btn primary" data-action="copy-report">Copiar para prontuário</button><button class="btn" data-action="print-report">Imprimir relatório completo / PDF</button><button class="btn" data-action="email-report">Enviar por e-mail</button></div><div class="field" style="margin-top:12px;max-width:420px"><label>E-mail</label><input id="reportEmail" value="'+esc(p.email||"")+'"></div></section>'+
  '<section class="report-page" style="margin-top:16px"><div class="report-header"><div><div class="small muted">AVALIAÇÃO ANTROPOMÉTRICA</div><h2>'+esc(p.fullName)+'</h2><p>'+(ageFromBirthDate(p.birthDate)||"—")+' anos · '+(p.heightCm?formatNumber(p.heightCm,0)+" cm":"altura não registrada")+' · '+(arr.length?datePt(arr[0].date)+" a "+datePt(arr[arr.length-1].date):"—")+'</p></div><div class="report-sign"><strong>'+CONFIG.clinician.name+'</strong><br><span>'+CONFIG.clinician.crm+'</span></div></div>'+
  '<div class="report-section"><h3>Composição corporal</h3><div class="graph-grid">'+compositionBars(arr,"bio","Bioimpedância","grouped")+compositionBars(arr,"skinfold","Adipômetro","grouped")+'</div></div>'+
  '<div class="report-section"><h3>Bioimpedância</h3>'+tableFor(arr,bioRows,"bio")+'</div>'+
  '<div class="report-section"><h3>Adipômetro · Jackson-Pollock 7 dobras</h3>'+tableFor(arr,skinRows,"skinfold")+foldTable()+'</div>'+
  '<div class="report-section"><h3>Circunferências</h3>'+tableFor(arr,antRows,"anthropometry")+'</div>'+
  '<div class="report-section"><h3>Evolução registrada</h3><p>'+esc(t)+'</p></div>'+
  '<div class="report-footer"><strong>'+CONFIG.clinician.name+'</strong><br><span>'+CONFIG.clinician.crm+'</span><p class="footer-note">Relatório de medidas e estimativas antropométricas. Campos não registrados são omitidos. Sem interpretação diagnóstica automática.</p></div></section>';
}

function renderPatient(){
  var p=store.getPatient(state.patientId); if(!p){state.patientId=null;renderSearch("");return;}
  if(state.patientMode){app.innerHTML='<main class="shell">'+header()+patientMode(p)+'</main>';bind();return;}
  var body=state.tab==="resumo"?summary(p):state.tab==="nova"?newAssessment(p):state.tab==="evolucao"?evolution(p):report(p);
  app.innerHTML='<main class="shell">'+header()+patientHeader(p)+body+'</main>';
  bind(); if(state.tab==="nova")bindAssessment(p);
}


function normalizeOcrText(text){
  return String(text||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();
}


let pdfJsPromise=null;
async function getPdfJs(){
  if(!pdfJsPromise){
    pdfJsPromise=import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs").then(function(pdfjs){
      pdfjs.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
      return pdfjs;
    });
  }
  return pdfJsPromise;
}

function isPdfFile(file){
  return Boolean(file&&(file.type==="application/pdf"||/\.pdf$/i.test(file.name||"")));
}

async function pdfPageText(page){
  try{
    var content=await page.getTextContent();
    return (content.items||[]).map(function(item){return item&&item.str?item.str:""}).filter(Boolean).join("\n");
  }catch(err){
    return "";
  }
}

async function renderPdfPage(page){
  var base=page.getViewport({scale:1});
  var scale=Math.min(2.2,Math.max(1.4,1800/Math.max(1,base.width)));
  var viewport=page.getViewport({scale:scale});
  var canvas=document.createElement("canvas");
  var ctx=canvas.getContext("2d",{willReadFrequently:true});
  canvas.width=Math.ceil(viewport.width);
  canvas.height=Math.ceil(viewport.height);
  await page.render({canvasContext:ctx,viewport:viewport}).promise;
  return canvas;
}

function ocrNum(s){
  if(s==null)return null;
  var clean=String(s).replace(/[^\d,.\-]/g,"").replace(/\.(?=\d{3}(?:\D|$))/g,"").replace(",",".");
  var n=Number(clean);
  return Number.isFinite(n)?n:null;
}

function findOcrMetric(text, aliases, min, max, excludes){
  var lines=String(text||"").split(/\r?\n/);
  var normalized=lines.map(function(line){return {raw:line,norm:normalizeOcrText(line).toLowerCase()}});
  for(var i=0;i<normalized.length;i++){
    var row=normalized[i],hasAlias=aliases.some(function(a){return row.norm.indexOf(a)>=0});
    if(!hasAlias)continue;
    if(excludes&&excludes.some(function(x){return row.norm.indexOf(x)>=0}))continue;
    var nums=row.raw.match(/-?\d{1,4}(?:[.,]\d{1,3})?/g)||[];
    for(var j=0;j<nums.length;j++){
      var v=ocrNum(nums[j]);
      if(v!=null&&(min==null||v>=min)&&(max==null||v<=max))return v;
    }
    if(i+1<normalized.length){
      var nextNums=normalized[i+1].raw.match(/-?\d{1,4}(?:[.,]\d{1,3})?/g)||[];
      for(var k=0;k<nextNums.length;k++){
        var nv=ocrNum(nextNums[k]);
        if(nv!=null&&(min==null||nv>=min)&&(max==null||nv<=max))return nv;
      }
    }
  }
  var full=normalizeOcrText(text).toLowerCase();
  for(var a=0;a<aliases.length;a++){
    var idx=full.indexOf(aliases[a]);
    if(idx<0)continue;
    var nearby=full.slice(idx,idx+160);
    if(excludes&&excludes.some(function(x){return nearby.indexOf(x)>=0}))continue;
    var nearNums=nearby.match(/-?\d{1,4}(?:[.,]\d{1,3})?/g)||[];
    for(var n=0;n<nearNums.length;n++){
      var fv=ocrNum(nearNums[n]);
      if(fv!=null&&(min==null||fv>=min)&&(max==null||fv<=max))return fv;
    }
  }
  return null;
}

function parseBioOcr(text){
  return {
    weight:findOcrMetric(text,["peso atual","peso corporal","weight"],20,350,["muscular","gordura","livre","ideal","alvo"]),
    bmi:findOcrMetric(text,["indice de massa corporal","imc","bmi"],10,80),
    fatPct:findOcrMetric(text,["percentual de gordura","gordura corporal","percent body fat","pbf"],1,80,["massa","peso"]),
    fatMass:findOcrMetric(text,["massa gorda","massa de gordura","peso gorduroso","body fat mass"],1,250),
    muscleMass:findOcrMetric(text,["massa muscular","peso muscular","skeletal muscle mass"],1,200),
    leanMass:findOcrMetric(text,["massa livre de gordura","peso livre de gordura","fat free mass"],1,300),
    visceral:findOcrMetric(text,["gordura visceral","visceral fat","visceral level"],0,100),
    bmr:findOcrMetric(text,["metabolismo basal","taxa metabolica basal","basal metabolic rate","bmr"],500,5000)
  };
}

function mergeOcrResults(results){
  var keys=["weight","bmi","fatPct","fatMass","muscleMass","leanMass","visceral","bmr"],out={};
  keys.forEach(function(key){
    var vals=results.map(function(r){return r[key]}).filter(function(v){return v!=null});
    if(!vals.length){out[key]=null;return;}
    var counts={};
    vals.forEach(function(v){var bucket=(Math.round(v*10)/10).toFixed(1);counts[bucket]=(counts[bucket]||0)+1});
    var best=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a]})[0];
    out[key]=Number(best);
  });
  return out;
}

function renderOcrReview(data,rawText){
  var defs=[
    ["weight","Peso","kg"],["bmi","IMC",""],["fatPct","Gordura corporal","%"],["fatMass","Massa gorda","kg"],
    ["muscleMass","Massa muscular","kg"],["leanMass","Massa livre de gordura","kg"],["visceral","Gordura visceral",""],["bmr","Metabolismo basal","kcal"]
  ];
  document.querySelector("#ocrReviewGrid").innerHTML=defs.map(function(d){
    var v=data[d[0]];
    return '<div class="field"><label>'+d[1]+(d[2]?' ('+d[2]+')':'')+'</label><input data-ocr-key="'+d[0]+'" value="'+(v==null?"":String(v).replace(".",","))+'" placeholder="Não reconhecido"></div>';
  }).join("");
  document.querySelector("#ocrRawText").textContent=rawText;
  document.querySelector("#ocrReview").classList.remove("hidden");
}

function bindAssessment(p){
  var w=document.querySelector("#bioWeight"),h=document.querySelector("#bioHeight"),f=document.querySelector("#bioFatPct"),bi=document.querySelector("#bioBmi"),fm=document.querySelector("#bioFatMass"),lm=document.querySelector("#bioLean");
  function autoBio(){var W=parseNumber(w.value),H=parseNumber(h.value),F=parseNumber(f.value),B=bmi(W,H),C=compositionFromFatPercent(W,F);if(B!=null)bi.value=formatNumber(B);if(C.fatMass!=null){fm.value=formatNumber(C.fatMass);lm.value=formatNumber(C.leanMass);}}
  [w,h,f].forEach(function(x){x.addEventListener("input",autoBio)});
  document.querySelectorAll(".fold").forEach(function(x){x.addEventListener("input",function(){var vals=[].slice.call(document.querySelectorAll(".fold")).map(function(y){return parseNumber(y.value)});if(vals.some(function(v){return v==null}))return;var o=jacksonPollock7({sex:p.sex,age:ageFromBirthDate(p.birthDate),folds:vals});if(o)document.querySelector("#skinResults").innerHTML=kpi("Somatório",formatNumber(o.sum,0),"mm")+kpi("Densidade",formatNumber(o.density,4),"kg/L")+kpi("Gordura",formatNumber(o.fatPct),"%");})});
  var photoInput=document.querySelector("#bioPhotos"),ocrStart=document.querySelector("#ocrStart"),ocrStatus=document.querySelector("#ocrStatus"),ocrBar=document.querySelector("#ocrProgressBar");
  photoInput.addEventListener("change",function(e){
    var files=[].slice.call(e.target.files||[]);
    var n=files.length;
    var pdfs=files.filter(isPdfFile).length;
    var images=n-pdfs;
    document.querySelector("#photoQueue").textContent=n?(n+" arquivo(s) selecionado(s) · "+images+" foto(s) · "+pdfs+" PDF(s)"):"Nenhum arquivo selecionado.";
    ocrStart.disabled=!n;
    ocrStatus.textContent=n?"Pronto para reconhecer.":"Selecione fotos e/ou PDFs.";
    ocrBar.style.width="0%";
    document.querySelector("#ocrReview").classList.add("hidden");
  });
  ocrStart.addEventListener("click",async function(){
    var files=[].slice.call(photoInput.files||[]);
    if(!files.length)return;
    if(!window.Tesseract){ocrStatus.textContent="Mecanismo OCR indisponível. Verifique a conexão.";return;}
    ocrStart.disabled=true;
    var parsed=[],raw=[];
    try{
      for(var i=0;i<files.length;i++){
        var file=files[i];
        var fileBase=(i/files.length)*100;
        if(isPdfFile(file)){
          ocrStatus.textContent="Abrindo PDF "+(i+1)+" de "+files.length+": "+file.name;
          var pdfjs=await getPdfJs();
          var pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
          for(var pageNum=1;pageNum<=pdf.numPages;pageNum++){
            var page=await pdf.getPage(pageNum);
            ocrStatus.textContent="Lendo "+file.name+" · página "+pageNum+" de "+pdf.numPages;
            var directText=await pdfPageText(page);
            var textResult="";
            if(normalizeOcrText(directText).length>=40){
              textResult=directText;
              var directPct=fileBase+((pageNum/pdf.numPages)*100/files.length);
              ocrBar.style.width=Math.min(100,directPct).toFixed(0)+"%";
            }else{
              var canvas=await renderPdfPage(page);
              var currentPage=pageNum;
              var totalPages=pdf.numPages;
              var result=await window.Tesseract.recognize(canvas,"por+eng",{logger:function(m){
                if(m.status==="recognizing text"&&m.progress!=null){
                  var pageProgress=((currentPage-1)+m.progress)/totalPages;
                  var pct=fileBase+(pageProgress*100/files.length);
                  ocrBar.style.width=Math.min(100,pct).toFixed(0)+"%";
                }
              }});
              textResult=result&&result.data?result.data.text:"";
              canvas.width=1;canvas.height=1;
            }
            raw.push("=== "+file.name+" · página "+pageNum+" ===\n"+textResult);
            parsed.push(parseBioOcr(textResult));
          }
        }else{
          ocrStatus.textContent="Lendo "+(i+1)+" de "+files.length+": "+file.name;
          var result=await window.Tesseract.recognize(file,"por+eng",{logger:function(m){
            if(m.status==="recognizing text"&&m.progress!=null){
              var pct=fileBase+(m.progress*100/files.length);
              ocrBar.style.width=Math.min(100,pct).toFixed(0)+"%";
            }
          }});
          var textResult=result&&result.data?result.data.text:"";
          raw.push("=== "+file.name+" ===\n"+textResult);
          parsed.push(parseBioOcr(textResult));
        }
      }
      var merged=mergeOcrResults(parsed);
      renderOcrReview(merged,raw.join("\n\n"));
      ocrBar.style.width="100%";
      ocrStatus.textContent="Leitura concluída. Revise os números antes de aplicar.";
    }catch(err){
      console.error(err);
      ocrStatus.textContent="Não foi possível concluir a leitura deste arquivo. Você pode tentar outro PDF/foto ou preencher manualmente.";
    }finally{
      ocrStart.disabled=false;
    }
  });
  document.querySelector("#ocrApply").addEventListener("click",function(){
    var map={weight:"#bioWeight",bmi:"#bioBmi",fatPct:"#bioFatPct",fatMass:"#bioFatMass",muscleMass:"#bioMuscle",leanMass:"#bioLean",visceral:"#bioVisceral",bmr:"#bioBmr"};
    document.querySelectorAll("[data-ocr-key]").forEach(function(input){
      var val=parseNumber(input.value); if(val==null)return;
      var target=document.querySelector(map[input.dataset.ocrKey]); if(target)target.value=formatNumber(val,input.dataset.ocrKey==="bmr"||input.dataset.ocrKey==="visceral"?0:1);
    });
    autoBio();
    document.querySelector("#ocrReview").classList.add("hidden");
    ocrStatus.textContent="Dados aplicados ao formulário. Confira antes de finalizar a avaliação.";
  });
  document.querySelector("#assessmentForm").addEventListener("submit",async function(e){e.preventDefault();var date=document.querySelector("#assessmentDate").value,W=parseNumber(w.value),H=parseNumber(h.value),F=parseNumber(f.value),C=compositionFromFatPercent(W,F),foldEls=[].slice.call(document.querySelectorAll(".fold")),foldObj={},vals=[];foldEls.forEach(function(x){var v=parseNumber(x.value);foldObj[x.dataset.fold]=v;vals.push(v)});var jp=vals.every(function(v){return v!=null})?jacksonPollock7({sex:p.sex,age:ageFromBirthDate(p.birthDate),folds:vals}):null;try{await store.updatePatient(p.id,{heightCm:H||p.heightCm});foldObj.biceps=parseNumber(document.querySelector("#skinBiceps").value);foldObj.medialCalf=parseNumber(document.querySelector("#skinMedialCalf").value);await store.saveAssessment(p.id,{date:date,bio:{weight:W,bmi:parseNumber(bi.value)||bmi(W,H),fatPct:F,fatMass:parseNumber(fm.value)||C.fatMass,muscleMass:parseNumber(document.querySelector("#bioMuscle").value),leanMass:parseNumber(lm.value)||C.leanMass,visceral:parseNumber(document.querySelector("#bioVisceral").value),bmr:parseNumber(document.querySelector("#bioBmr").value)},skinfold:jp?{fatPct:jp.fatPct,density:jp.density,sum:jp.sum,folds:foldObj}:null,anthropometry:{waist:parseNumber(document.querySelector("#antWaist").value),hip:parseNumber(document.querySelector("#antHip").value),calf:parseNumber(document.querySelector("#antCalf").value),arm:parseNumber(document.querySelector("#antArm").value),neck:parseNumber(document.querySelector("#antNeck").value),abdomen:parseNumber(document.querySelector("#antAbdomen").value),thigh:parseNumber(document.querySelector("#antThigh").value)}});state.selected.add(date);state.selectionInitialized=true;state.tab="resumo";render();}catch(err){alert(err.message||"Não foi possível salvar a avaliação.");}});
}

function bind(){
  document.querySelectorAll("[data-tab]").forEach(function(b){b.addEventListener("click",function(){state.tab=b.dataset.tab;render()})});
  document.querySelectorAll("[data-patient]").forEach(function(b){b.addEventListener("click",function(){state.patientId=b.dataset.patient;state.tab="resumo";state.selected=new Set();state.selectionInitialized=false;render()})});
  document.querySelectorAll("[data-date-filter]").forEach(function(c){c.addEventListener("change",function(){state.selectionInitialized=true;c.checked?state.selected.add(c.dataset.dateFilter):state.selected.delete(c.dataset.dateFilter);render()})});
  document.querySelectorAll("[data-chart-mode]").forEach(function(b){b.addEventListener("click",function(){state.chartMode=b.dataset.chartMode;render()})});
}

document.addEventListener("click",async function(e){
  var el=e.target.closest("[data-action]"); if(!el)return; var a=el.dataset.action;
  if(a==="logout"){if(firebaseConfigured())await FirebaseClient.signOut();else{state.auth=false;state.patientId=null;state.membership=null;render();}}
  if(a==="forgot"){
    if(!firebaseConfigured()){alert("O Firebase ainda não está configurado.");}
    else{
      var field=document.querySelector("#loginEmail"),email=field?field.value.trim():"";
      if(!email){alert("Digite seu e-mail primeiro.");}
      else try{await FirebaseClient.resetPassword(email);alert("E-mail de recuperação enviado.");}catch(err){alert(humanAuthError(err));}
    }
  }
  if(a==="back-search"){state.patientId=null;renderSearch("");}
  if(a==="patient-mode"){state.patientMode=!state.patientMode;render();}
  if(a==="new-patient"){document.querySelector("#newPatientArea").innerHTML=newPatientHtml();bindNewPatient();}
  if(a==="cancel-new-patient")document.querySelector("#newPatientArea").innerHTML="";
  if(a==="all-dates"){var p=store.getPatient(state.patientId);state.selected=new Set(ordered(p).map(function(x){return x.date}));state.selectionInitialized=true;render();}
  if(a==="clear-dates"){state.selected=new Set();state.selectionInitialized=true;render();}
  if(a==="copy-report"){var t=document.querySelector("#reportText").value;try{await navigator.clipboard.writeText(t);alert("Texto copiado para o prontuário.");}catch(err){document.querySelector("#reportText").select();}}
  if(a==="print-report")window.print();
  if(a==="email-report"){var p2=store.getPatient(state.patientId),to=document.querySelector("#reportEmail").value.trim(),body=document.querySelector("#reportText").value,subject="Avaliação Antropométrica - "+p2.fullName;location.href="mailto:"+encodeURIComponent(to)+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);}
});

function bindNewPatient(){
  var form=document.querySelector("#newPatientForm"); if(!form)return;
  form.addEventListener("submit",async function(e){e.preventDefault();try{var p=await store.createPatient({fullName:document.querySelector("#npName").value.trim(),birthDate:document.querySelector("#npBirth").value,sex:document.querySelector("#npSex").value,email:document.querySelector("#npEmail").value.trim(),phone:document.querySelector("#npPhone").value.trim(),heightCm:parseNumber(document.querySelector("#npHeight").value)});state.patientId=p.id;state.tab="resumo";render();}catch(err){alert(err.message||"Não foi possível cadastrar o paciente.");}});
}

async function bootstrapAuth(){
  if(!firebaseConfigured()){
    state.authReady=true;
    render();
    return;
  }
  await FirebaseClient.onAuthChanged(async function(user){
    state.user=user;
    state.patientId=null;
    if(!user){
      state.auth=false;
      state.membership=null;
      state.authReady=true;
      render();
      return;
    }
    var membership=await FirebaseClient.getMembership(user.uid);
    var params=new URLSearchParams(location.search);
    var invite=params.get("invite");
    var ownerToken=params.get("owner");
    if(!membership&&invite){
      try{membership=await FirebaseClient.activateInvite(invite)}catch{}
    }
    state.membership=membership;
    if(!membership&&ownerToken){
      state.auth=false;
      state.authReady=true;
      renderLogin();
      return;
    }
    state.auth=Boolean(membership&&membership.status==="active"&&(membership.globalRole==="owner"||membership.globalRole==="admin"||membership.appRoles&&membership.appRoles.anthropometry));
    state.authReady=true;
    if(state.auth){
      try{await store.load();render();}catch(err){app.innerHTML='<main class="shell"><section class="card login"><h2 class="section-title">Erro ao carregar dados</h2><p class="muted">'+esc(err.message||"Não foi possível acessar o banco.")+'</p><button class="btn" data-action="logout">Sair</button></section></main>';}
    } else renderUnauthorized();
  });
}

bootstrapAuth();
