// frontend_tienda/js/admin_users.js
const API_USERS = "/api/users";

let state = {
  page: 1,
  pages: 1,
  q: "",
  role: "",
};

function authHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function requireAdminOrRedirect() {
  // Usamos ensureSession() si lo tienes en auth.js
  // Fallback simple:
  const userRaw = localStorage.getItem("user");
  const token   = localStorage.getItem("token");
  if (!token || !userRaw) {
    location.href = "/Inicio Sesion.html";
    return;
  }
  try {
    const u = JSON.parse(userRaw);
    if (u.role !== "admin") location.href = "/index.html";
  } catch {
    location.href = "/Inicio Sesion.html";
  }
}

/* ----------------- UI helpers ----------------- */
const $ = (sel) => document.querySelector(sel);
const tableBody = () => $("#usersTable");
const modal     = () => $("#modal");

function openModal(editing = false, row = null) {
  $("#modalTitle").textContent = editing ? "Editar Usuario" : "Nuevo Usuario";
  $("#uId").value      = editing ? row._id : "";
  $("#uName").value    = editing ? (row.name || "") : "";
  $("#uEmail").value   = editing ? (row.email || "") : "";
  $("#uRole").value    = editing ? (row.role || "user") : "user";
  $("#uPassword").value = ""; // no mostrar contraseña actual
  modal().style.display = "flex";
}
function closeModal() { modal().style.display = "none"; }

function renderRows(items) {
  const tb = tableBody();
  tb.innerHTML = "";
  items.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.name || ""}</td>
      <td>${u.email || ""}</td>
      <td>${u.role || ""}</td>
      <td>
        <button class="btn-edit" data-edit="${u._id}">Editar</button>
        <button class="btn-delete" data-del="${u._id}">Eliminar</button>
      </td>
    `;
    tr.dataset.row = JSON.stringify(u);
    tb.appendChild(tr);
  });
}

function renderPagination(page, pages, total) {
  $("#pageInfo").textContent = `Página ${page} de ${pages} • ${total} usuarios`;
  $("#prevPage").disabled = page <= 1;
  $("#nextPage").disabled = page >= pages;
}

/* ----------------- API ----------------- */
async function fetchUsers() {
  const params = new URLSearchParams({
    page: state.page,
    limit: 10,
  });
  if (state.q)    params.set("q", state.q);
  if (state.role) params.set("role", state.role);

  const res = await fetch(`${API_USERS}?${params.toString()}`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error cargando usuarios");

  state.pages = data.pages || 1;
  renderRows(data.items || []);
  renderPagination(data.page || 1, data.pages || 1, data.total || 0);
}

async function createUser(payload) {
  const res = await fetch(API_USERS, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error creando usuario");
  return data;
}

async function updateUser(id, payload) {
  const res = await fetch(`${API_USERS}/${id}`, {
    method: "PUT",
    headers: authHeader(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error actualizando usuario");
  return data;
}

async function deleteUser(id) {
  const res = await fetch(`${API_USERS}/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error eliminando usuario");
  return data;
}

/* ----------------- Events ----------------- */
document.addEventListener("DOMContentLoaded", async () => {
  requireAdminOrRedirect();

  // Búsqueda y filtros
  $("#btnSearch").addEventListener("click", () => {
    state.q = $("#q").value.trim();
    state.role = $("#role").value;
    state.page = 1;
    fetchUsers().catch(err => alert(err.message));
  });

  // Paginación
  $("#prevPage").addEventListener("click", () => {
    if (state.page > 1) { state.page--; fetchUsers().catch(e=>alert(e.message)); }
  });
  $("#nextPage").addEventListener("click", () => {
    if (state.page < state.pages) { state.page++; fetchUsers().catch(e=>alert(e.message)); }
  });

  // Nuevo usuario
  $("#btnNew").addEventListener("click", () => openModal(false, null));
  $("#btnCancel").addEventListener("click", closeModal);

  // Guardar (crear/editar)
  $("#btnSave").addEventListener("click", async () => {
    const id    = $("#uId").value;
    const name  = $("#uName").value.trim();
    const email = $("#uEmail").value.trim();
    const role  = $("#uRole").value;
    const password = $("#uPassword").value;

    if (!name || !email) return alert("Nombre y email son requeridos");
    if (!["user","admin"].includes(role)) return alert("Rol inválido");

    try {
      if (id) {
        const payload = { name, email, role };
        if (password) payload.password = password;
        await updateUser(id, payload);
      } else {
        if (!password) return alert("Password requerido para crear usuario");
        await createUser({ name, email, role, password });
      }
      closeModal();
      fetchUsers();
    } catch (e) { alert(e.message); }
  });

  // Editar / Eliminar (delegación)
  tableBody().addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    // Recuperar fila
    const tr = e.target.closest("tr");
    const row = JSON.parse(tr.dataset.row);

    if (btn.dataset.edit) {
      openModal(true, row);
      return;
    }
    if (btn.dataset.del) {
      if (!confirm(`¿Eliminar a ${row.name}?`)) return;
      try {
        await deleteUser(row._id);
        fetchUsers();
      } catch (e2) { alert(e2.message); }
    }
  });

  // Primera carga
  fetchUsers().catch(err => alert(err.message));
});
