// frontend_tienda/js/menu.js

const API_PRODUCTS = "/api/products";

// Mapeo de categoría -> sección y título formateado de precio
const CATEGORY_TO_SECTION = {
  ramen: "sec-ramen",
  vegan: "sec-vegan",
  side:  "sec-side",
  otros: "sec-otros",
};

function formatCLP(value) {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
  } catch {
    return "$" + n.toLocaleString("es-CL");
  }
}

function renderCard(p) {
  const img = p.image && p.image.trim() ? p.image : "img/placeholder.png";
  const price = formatCLP(p.price);
  const desc = p.description || "";

  return `
    <article class="dish-card" data-id="${p._id}" data-name="${p.name}" data-price="${p.price}">
      <div class="dish-image"><img src="${img}" alt="${p.name}" onerror="this.src='img/placeholder.png'"></div>
      <div class="dish-info">
        <div class="dish-header">
          <h3>${p.name}</h3>
          <span class="dish-price">${price}</span>
        </div>
        <p class="dish-description">${desc}</p>
        <button class="btn-add" data-add="${p._id}">Añadir al Carrito</button>
      </div>
    </article>
  `;
}

// Fallback local si no existe carrito.js:addToCart
function localAddToCart(item) {
  const key = "tokyoNoodlesCart";
  const items = JSON.parse(localStorage.getItem(key) || "[]");
  const exists = items.find(i => i.id === item.id);
  if (exists) exists.quantity += 1;
  else items.push(item);
  localStorage.setItem(key, JSON.stringify(items));
  // intentar refrescar contador si existe función
  if (typeof updateCartCount === "function") updateCartCount();
}

async function cargarMenu() {
  try {
    const res = await fetch(API_PRODUCTS);
    if (!res.ok) throw new Error("No se pudo cargar el menú");
    const products = await res.json();

    // limpiar secciones
    Object.values(CATEGORY_TO_SECTION).forEach(secId => {
      const sec = document.getElementById(secId);
      if (sec) sec.querySelector(".cards").innerHTML = "";
    });

    // agrupar por categoría
    for (const p of products) {
      const cat = (p.category || "otros").toLowerCase();
      const secId = CATEGORY_TO_SECTION[cat] || CATEGORY_TO_SECTION.otros;
      const sec = document.getElementById(secId);
      if (!sec) continue;
      sec.querySelector(".cards").insertAdjacentHTML("beforeend", renderCard(p));
    }

    // Ocultar secciones vacías
    Object.values(CATEGORY_TO_SECTION).forEach(secId => {
      const sec = document.getElementById(secId);
      if (!sec) return;
      const hasCards = sec.querySelector(".cards").children.length > 0;
      sec.style.display = hasCards ? "" : "none";
    });

    // Delegación para botones "Añadir al Carrito"
    document.getElementById("menuContainer").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add]");
      if (!btn) return;

      const card = btn.closest(".dish-card");
      const item = {
        id: card.getAttribute("data-id"),
        name: card.getAttribute("data-name"),
        price: Number(card.getAttribute("data-price")),
        quantity: 1,
        imageURL: card.querySelector("img")?.getAttribute("src") || "img/placeholder.png",
      };

      if (typeof addToCart === "function") {
        // usar carrito.js si está presente
        addToCart(item.id, item.name, item.price, item.imageURL);
      } else {
        // fallback local
        localAddToCart(item);
      }
    });
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", cargarMenu);
