// ====== Auth utils ======
const API_BASE = "/api";

function saveAuth(token, user){ localStorage.setItem("token", token); localStorage.setItem("user", JSON.stringify(user)); }
function getToken(){ return localStorage.getItem("token"); }
function getUser(){ try{ return JSON.parse(localStorage.getItem("user")||"null"); }catch{ return null; } }
function clearAuth(){ localStorage.removeItem("token"); localStorage.removeItem("user"); }

async function ensureSession(){
  const token = getToken();
  if (!token) return null;
  try{
    const r = await fetch(`${API_BASE}/auth/me`, { headers:{ Authorization:`Bearer ${token}` } });
    if (!r.ok){ clearAuth(); return null; }
    const me = await r.json();
    localStorage.setItem("user", JSON.stringify(me));
    return me;
  }catch{ return getUser(); }
}

// ====== API calls ======
async function doRegister({name,email,password}){
  const r = await fetch(`${API_BASE}/auth/register`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ name, email, password })
  });
  const data = await r.json();
  if(!r.ok) throw new Error(data?.message || "No fue posible registrarse");
  saveAuth(data.token, data.user);
  return data.user;
}
async function doLogin({email,password}){
  const r = await fetch(`${API_BASE}/auth/login`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ email, password })
  });
  const data = await r.json();
  if(!r.ok) throw new Error(data?.message || "Credenciales inválidas");
  saveAuth(data.token, data.user);
  return data.user;
}

// ====== Navbar auth area ======
async function renderAuthArea(){
  const slot = document.getElementById("authArea") || document.querySelector("[data-auth-links]");
  if(!slot) return;
  const me = await ensureSession();

  if(!me){
    slot.innerHTML = `<a href="/Inicio Sesion.html">Iniciar sesión</a> | <a href="/registro.html">Registrarse</a>`;
    return;
  }

  slot.innerHTML = `
    <style>
      .user-menu{position:relative;display:inline-block}
      .user-btn{cursor:pointer}
      .user-dropdown{position:absolute;right:0;top:120%;background:#fff;border:1px solid #ddd;border-radius:8px;min-width:180px;box-shadow:0 6px 20px rgba(0,0,0,.08);display:none;z-index:10}
      .user-dropdown a,.user-dropdown button{display:block;width:100%;padding:10px 12px;text-align:left;background:#fff;border:0;font:inherit;color:#333;cursor:pointer}
      .user-dropdown a:hover,.user-dropdown button:hover{background:#f6f6f6}
      .user-menu.open .user-dropdown{display:block}
    </style>
    <div class="user-menu" id="userMenu">
      <span class="user-btn">Hola, ${me.name?.split(" ")[0] || "Usuario"} ▾</span>
      <div class="user-dropdown">
        <a href="/perfil.html">Mi perfil</a>
        ${me.role === "admin" ? `<a href="/admin.html">Administración</a>` : ""}
        <button id="logoutBtn">Cerrar sesión</button>
      </div>
    </div>
  `;
  const menu = document.getElementById("userMenu");
  menu.querySelector(".user-btn").addEventListener("click", () => menu.classList.toggle("open"));
  document.addEventListener("click", (e)=>{ if(!menu.contains(e.target)) menu.classList.remove("open"); });
  menu.querySelector("#logoutBtn").addEventListener("click", ()=>{ clearAuth(); location.href="/index.html"; });
}

// ====== Page wiring (sin inline scripts) ======
function wireLoginPage(){
  const btn = document.getElementById("btnLogin");
  if(!btn) return;
  btn.addEventListener("click", async ()=>{
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    if(!email || !password) return alert("Ingrese correo y contraseña.");
    try{
      const u = await doLogin({email,password});
      location.href = u.role === "admin" ? "/admin.html" : "/index.html";
    }catch(e){ alert(e.message); }
  });
}
function wireRegisterPage(){
  const btn = document.getElementById("btnRegister");
  if(!btn) return;
  btn.addEventListener("click", async ()=>{
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm-password").value;
    if(!name || !email || !password) return alert("Completa todos los campos.");
    if(password !== confirm) return alert("Las contraseñas no coinciden.");
    try{
      const u = await doRegister({name,email,password});
      location.href = u.role === "admin" ? "/admin.html" : "/index.html";
    }catch(e){ alert(e.message); }
  });
}

// ====== Init for every page ======
document.addEventListener("DOMContentLoaded", ()=>{
  renderAuthArea();     // navbar
  wireLoginPage();      // si la página tiene #btnLogin
  wireRegisterPage();   // si la página tiene #btnRegister
});
