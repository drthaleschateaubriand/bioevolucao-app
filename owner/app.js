import { PLATFORM_CONFIG, firebaseConfigured } from "../shared/platform-config.js";
import { FirebaseClient } from "../shared/firebase-client.js";

const root = document.querySelector("#ownerApp");
const state = {
  user: null,
  membership: null,
  tab: "apps",
  members: [],
  apps: PLATFORM_CONFIG.apps,
  demo: !firebaseConfigured()
};

function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function roleLabel(r){return ({owner:"OWNER",admin:"Administrador",physician:"Médico",nutritionist:"Nutricionista",assistant:"Assistente",member:"Usuário"})[r]||r}
function canAdmin(){return state.demo || ["owner","admin"].includes(state.membership?.globalRole)}

function render(){
  if(!state.user && !state.demo) return renderLogin();
  if(state.user && !state.membership && !state.demo) return renderNoAccess();
  return renderPortal();
}

function renderLogin(){
  root.innerHTML=`<main class="shell"><section class="card login"><div class="brand"><div class="mark">P</div><div><h1>Portal do Proprietário</h1><p>Administração dos seus aplicativos</p></div></div><form id="ownerLogin" style="display:grid;gap:14px;margin-top:22px"><div class="field"><label>E-mail</label><input id="email" type="email" required></div><div class="field"><label>Senha</label><input id="password" type="password" required></div><button class="btn primary">Entrar</button><button class="btn" type="button" id="reset">Recuperar senha</button><div id="loginStatus" class="small muted"></div></form></section></main>`;
  document.querySelector("#ownerLogin").addEventListener("submit",async e=>{
    e.preventDefault(); const status=document.querySelector("#loginStatus"); status.textContent="Entrando...";
    try{await FirebaseClient.signIn(email.value,password.value)}catch(err){status.textContent=err.message}
  });
  document.querySelector("#reset").addEventListener("click",async ()=>{
    const email=document.querySelector("#email").value.trim(); if(!email)return;
    try{await FirebaseClient.resetPassword(email);document.querySelector("#loginStatus").textContent="E-mail de recuperação enviado."}catch(err){document.querySelector("#loginStatus").textContent=err.message}
  });
}

function renderNoAccess(){
  root.innerHTML=`<main class="shell"><section class="card login"><h1>Acesso não autorizado</h1><p class="muted">Sua conta existe no Firebase, mas ainda não possui uma autorização ativa no Portal do Proprietário.</p><button class="btn" id="logout">Sair</button></section></main>`;
  document.querySelector("#logout").addEventListener("click",()=>FirebaseClient.signOut());
}

function shell(content){
  return `<main class="shell"><header class="top"><div class="brand"><div class="mark">P</div><div><h1>Portal do Proprietário</h1><p>Aplicativos, usuários, convites e acessos</p></div></div><div class="actions"><span class="status">${state.demo?"DEMO":roleLabel(state.membership?.globalRole)}</span><button class="btn" id="logout">${state.demo?"Voltar":"Sair"}</button></div></header>${state.demo?'<div class="notice">Modo demonstrativo. Nenhuma ação aqui altera contas reais até conectarmos o projeto Firebase.</div>':""}<nav class="tabs">${[["apps","Aplicativos"],["users","Usuários"],["invites","Convidar usuário"],["audit","Atividade"]].map(([id,label])=>`<button class="tab ${state.tab===id?"active":""}" data-tab="${id}">${label}</button>`).join("")}</nav>${content}</main>`;
}

function appsView(){
  return `<section><div class="grid">${state.apps.map(app=>`<article class="card app-card"><div class="small muted">APLICATIVO</div><h3>${esc(app.name)}</h3><p class="muted">${esc(app.description||"")}</p><div class="actions"><a class="btn primary" href="${esc(app.path||"#")}">Abrir</a><button class="btn" data-manage-app="${esc(app.id)}">Gerenciar acessos</button></div></article>`).join("")}</div></section>`;
}

function usersView(){
  const list=state.members.length?state.members:[
    {id:"demo-owner",displayName:"Proprietário",email:"owner@exemplo.com",globalRole:"owner",status:"active",appRoles:{anthropometry:"owner"}},
    {id:"demo-assistant",displayName:"Assistente Exemplo",email:"assistente@exemplo.com",globalRole:"member",status:"active",appRoles:{anthropometry:"assistant"}}
  ];
  return `<section class="card"><div class="row"><div><h2 style="margin:0">Usuários</h2><div class="small muted">Cada pessoa usa seu próprio login.</div></div><button class="btn primary" data-tab-jump="invites">+ Novo usuário</button></div>${list.map(m=>`<div class="row"><div><strong>${esc(m.displayName||m.email)}</strong><div class="small muted">${esc(m.email||"")} · ${roleLabel(m.globalRole||m.appRoles?.anthropometry)}</div></div><div class="actions"><span class="status ${m.status==="blocked"?"blocked":""}">${m.status==="blocked"?"Bloqueado":"Ativo"}</span>${canAdmin()&&m.globalRole!=="owner"?`<button class="btn" data-toggle-user="${esc(m.id)}" data-status="${m.status||"active"}">${m.status==="blocked"?"Reativar":"Bloquear"}</button>`:""}</div></div>`).join("")}</section>`;
}

function invitesView(){
  return `<section class="card"><h2 style="margin-top:0">Convidar novo usuário</h2><p class="muted">Você autoriza o e-mail e escolhe a função. O usuário cria a própria senha pelo link de convite.</p><form id="inviteForm" class="grid two"><div class="field"><label>Nome</label><input id="inviteName"></div><div class="field"><label>E-mail</label><input id="inviteEmail" type="email" required></div><div class="field"><label>Função na Avaliação Antropométrica</label><select id="inviteRole"><option value="physician">Médico</option><option value="nutritionist">Nutricionista</option><option value="assistant">Assistente</option><option value="admin">Administrador</option></select></div><div class="field" style="justify-content:end"><button class="btn primary" type="submit">Gerar convite</button></div></form><div id="inviteResult" style="margin-top:16px"></div></section>`;
}

function auditView(){
  return `<section class="card"><h2 style="margin-top:0">Atividade</h2><div class="notice">Esta área já está reservada para registrar convites, mudanças de função, bloqueios e acessos. O log forte e imutável será ativado quando decidirmos usar backend administrativo.</div></section>`;
}

function renderPortal(){
  const content=state.tab==="apps"?appsView():state.tab==="users"?usersView():state.tab==="invites"?invitesView():auditView();
  root.innerHTML=shell(content);
  bindPortal();
}

function bindPortal(){
  document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{state.tab=b.dataset.tab;renderPortal()}));
  document.querySelectorAll("[data-tab-jump]").forEach(b=>b.addEventListener("click",()=>{state.tab=b.dataset.tabJump;renderPortal()}));
  const logout=document.querySelector("#logout"); if(logout)logout.addEventListener("click",()=>state.demo?location.href="../professional/":FirebaseClient.signOut());
  const form=document.querySelector("#inviteForm");
  if(form)form.addEventListener("submit",async e=>{
    e.preventDefault();
    const role=inviteRole.value;
    if(state.demo){
      document.querySelector("#inviteResult").innerHTML='<div class="notice">Prévia: o convite seria criado para <strong>'+esc(inviteEmail.value)+'</strong> como <strong>'+roleLabel(role)+'</strong>.</div>';
      return;
    }
    try{
      const globalRole=role==="admin"?"admin":"member";
      const invite=await FirebaseClient.createInvite({
        email:inviteEmail.value,
        displayName:inviteName.value,
        globalRole,
        appRoles:{anthropometry:role}
      });
      document.querySelector("#inviteResult").innerHTML='<div class="notice"><strong>Convite criado.</strong><div class="invite-link" id="inviteLink">'+esc(invite.inviteUrl)+'</div><button class="btn" id="copyInvite" type="button">Copiar link</button></div>';
      document.querySelector("#copyInvite").addEventListener("click",()=>navigator.clipboard.writeText(invite.inviteUrl));
    }catch(err){document.querySelector("#inviteResult").innerHTML='<div class="notice">'+esc(err.message)+'</div>'}
  });
  document.querySelectorAll("[data-toggle-user]").forEach(b=>b.addEventListener("click",async ()=>{
    if(state.demo)return;
    const next=b.dataset.status==="blocked"?"active":"blocked";
    await FirebaseClient.updateMembership(b.dataset.toggleUser,{status:next});
    await loadMembers();renderPortal();
  }));
}

async function loadMembers(){
  if(state.demo)return;
  try{state.members=await FirebaseClient.listMemberships()}catch{state.members=[]}
}

async function bootstrap(){
  if(state.demo){render();return;}
  await FirebaseClient.onAuthChanged(async user=>{
    state.user=user;
    if(user){
      state.membership=await FirebaseClient.getMembership(user.uid);
      if(state.membership&&state.membership.status==="active"){
        await Promise.all([loadMembers(),FirebaseClient.listApps().then(a=>state.apps=a)]);
      }
    }else{
      state.membership=null;state.members=[];
    }
    render();
  });
}

bootstrap();
