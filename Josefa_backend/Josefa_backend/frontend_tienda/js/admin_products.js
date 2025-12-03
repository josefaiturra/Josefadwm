const PRODUCTS_API = "/api/products";

// ====== Helpers auth ======
function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  const t = getToken();
  return t
    ? { Authorization: "Bearer " + t, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

function mustBeAdminGuard(res) {
  if (res.status === 401 || res.status === 403) {
    alert("Tu sesión expiró o no eres admin.");
    location.href = "/Inicio Sesion.html";
    return true;
  }
  return false;
}

// ====== DOM refs ======
const $tableBody = document.getElementById("productsTable");
const $openModal = document.getElementById("openModalBtn");
const $modal = document.getElementById("modal");
const $modalTitle = document.getElementById("modalTitle");
const $closeModal = document.getElementById("closeModalBtn");
const $saveBtn = document.getElementById("saveProductBtn");

const $pId = document.getElementById("pId");
const $pName = document.getElementById("pName");
const $pPrice = document.getElementById("pPrice");
const $pCat = document.getElementById("pCat");
const $pDesc = document.getElementById("pDesc");
const $pImg = document.getElementById("pImg");

const productCache = new Map();

// ====== Modal ======
function openCreateModal() {
  $modalTitle.textContent = "Crear Producto";
  $pId.value = "";
  $pName.value = "";
  $pPrice.value = "";
  $pCat.value = "";
  $pDesc.value = "";
  $pImg.value = "";
  $modal.style.display = "flex";
}

function openEditModal(p) {
  $modalTitle.textContent = "Editar Producto";
  $pId.value = p._id;
  $pName.value = p.name;
  $pPrice.value = p.price;
  $pCat.value = p.category;
  $pDesc.value = p.description;
  $pImg.value = p.image;
  $modal.style.display = "flex";
}

function closeModal() {
  $modal.style.display = "none";
}

// ====== Sanitizers ======
function escapeHTML(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(s = "") {
  return String(s).replaceAll('"', "&quot;");
}

// ====== Render ======
function renderProducts(products) {
  $tableBody.innerHTML = "";
  productCache.clear();

  products.forEach((p) => {
    productCache.set(p._id, p);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHTML(p.name)}</td>
      <td>$${Number(p.price).toLocaleString("es-CL")}</td>
      <td>${escapeHTML(p.category)}</td>
      <td>
        ${
          p.image
            ? `<img src="${escapeAttr(p.image)}" style="height:40px;border-radius:6px;object-fit:cover;">`
            : "<em>—</em>"
        }
      </td>
      <td>
        <button class="btn btn-edit" data-action="edit" data-id="${p._id}">Editar</button>
        <button class="btn btn-delete" data-action="del" data-id="${p._id}">Eliminar</button>
      </td>
    `;
    $tableBody.appendChild(tr);
  });
}

// ====== API ======
async function apiList() {
  const res = await fetch(PRODUCTS_API);
  if (mustBeAdminGuard(res)) return [];
  return res.json();
}

async function apiCreate(payload) {
  const res = await fetch(PRODUCTS_API, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (mustBeAdminGuard(res)) return;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

async function apiUpdate(id, payload) {
  const res = await fetch(`${PRODUCTS_API}/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (mustBeAdminGuard(res)) return;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

async function apiDelete(id) {
  const res = await fetch(`${PRODUCTS_API}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (mustBeAdminGuard(res)) return;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

// ====== Event Listeners ======
$openModal.addEventListener("click", openCreateModal);
$closeModal.addEventListener("click", closeModal);

// Guardar (crear o editar)
$saveBtn.addEventListener("click", async () => {
  try {
    const id = $pId.value.trim();
    const payload = {
      name: $pName.value.trim(),
      price: Number($pPrice.value),
      category: $pCat.value.trim(),
      description: $pDesc.value.trim(),
      image: $pImg.value.trim(),
    };

    if (!payload.name || !payload.category || !payload.description || !payload.price) {
      alert("Completa todos los campos");
      return;
    }

    if (id) {
      await apiUpdate(id, payload);
      alert("✅ Producto actualizado");
    } else {
      await apiCreate(payload);
      alert("✅ Producto creado");
    }

    closeModal();
    reload();
  } catch (e) {
    alert("Error: " + e.message);
  }
});

// Delegación para Editar / Eliminar
$tableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "edit") {
    openEditModal(productCache.get(id));
  }

  if (action === "del") {
    if (!confirm("¿Eliminar producto?")) return;
    await apiDelete(id);
    reload();
  }
});

// ====== Init ======
async function reload() {
  const products = await apiList();
  renderProducts(products);
}

document.addEventListener("DOMContentLoaded", reload);
