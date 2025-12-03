// frontend_tienda/js/carrito.js
const CART_KEY = "tokyoNoodlesCart";

// ===== Helpers de storage =====
function getCartItems() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
  catch { return []; }
}
function saveCartItems(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartCount();
}
function formatCLP(value) {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency", currency: "CLP", maximumFractionDigits: 0
    }).format(n);
  } catch { return "$" + n.toLocaleString("es-CL"); }
}

// ===== API pública de carrito =====
function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (!el) return;
  const count = getCartItems().reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  el.textContent = count;
}

function addToCart(id, name, price, imageURL) {
  const items = getCartItems();
  const ix = items.findIndex(i => i.id === id);
  if (ix >= 0) {
    items[ix].quantity += 1;
  } else {
    items.push({
      id,
      name,
      price: Number(price || 0),
      quantity: 1,
      imageURL: imageURL || "img/placeholder.png"
    });
  }
  saveCartItems(items);
}

// ===== Render de carrito.html (si estamos ahí) =====
const SHIPPING_COST = 0;   // ajusta si quieres costo de envío
const DISCOUNT_AMOUNT = 0; // ajusta si usas descuentos

function renderCartPage() {
  const list = document.getElementById("cart-items-list");
  if (!list) return; // No es la página del carrito

  const items = getCartItems();
  const summary = document.querySelector(".cart-summary");
  list.innerHTML = "";

  if (!items.length) {
    list.innerHTML =
      `<div class="empty-cart">
        <h2>🍜 Tu Carrito está Vacío</h2>
        <p>¡Explora nuestro menú para encontrar el ramen perfecto!</p>
        <a href="menu.html" class="btn-checkout" style="width: 50%; display: inline-block; margin-top: 20px;">
          Ver Menú
        </a>
      </div>`;
    if (summary) summary.style.display = "none";
    updateCartCount();
    return;
  }

  if (summary) summary.style.display = "block";

  let subtotal = 0;
  const frag = document.createDocumentFragment();

  items.forEach((item) => {
    const total = Number(item.price) * Number(item.quantity);
    subtotal += total;

    const card = document.createElement("article");
    card.className = "item-card";
    card.setAttribute("data-item-id", item.id);
    card.innerHTML = `
      <div class="item-image">
        <img src="${item.imageURL || "img/placeholder.png"}" alt="${item.name}">
      </div>
      <div class="item-details">
        <h3>${item.name}</h3>
        <p>Precio unitario: ${formatCLP(item.price)}</p>
      </div>
      <div class="item-actions">
        <label for="qty-${item.id}">Cant:</label>
        <input type="number" id="qty-${item.id}" min="1" value="${item.quantity}" />
      </div>
      <div class="item-price-total">${formatCLP(total)}</div>
      <button class="btn-remove" data-remove="${item.id}">Eliminar</button>
    `;
    frag.appendChild(card);
  });

  list.appendChild(frag);

  // Totales
  const finalDiscount = subtotal >= 20000 ? DISCOUNT_AMOUNT : 0;
  const finalShipping = subtotal > 50000 ? 0 : SHIPPING_COST;
  const totalToPay = subtotal - finalDiscount + finalShipping;

  const q = (sel) => document.getElementById(sel) || document.querySelector(sel);

  q("summary-subtotal") && (q("summary-subtotal").textContent = formatCLP(subtotal));
  q("summary-discount") && (q("summary-discount").textContent = "-" + formatCLP(finalDiscount));
  q("summary-shipping") && (q("summary-shipping").textContent = formatCLP(finalShipping));
  q("summary-total") && (q("summary-total").textContent = formatCLP(totalToPay));

  updateCartCount();
}

// Delegación de eventos (sin inline handlers)
function wireCartPageEvents() {
  const list = document.getElementById("cart-items-list");
  if (!list) return;

  list.addEventListener("input", (e) => {
    const input = e.target.closest("input[type='number']");
    if (!input) return;
    const card = input.closest(".item-card");
    const id = card?.getAttribute("data-item-id");
    const qty = Math.max(1, parseInt(input.value || "1", 10));

    const items = getCartItems();
    const ix = items.findIndex(i => i.id === id);
    if (ix >= 0) {
      items[ix].quantity = qty;
      saveCartItems(items);
      // actualizar total de esa línea
      const lineTotal = Number(items[ix].price) * qty;
      card.querySelector(".item-price-total").textContent = formatCLP(lineTotal);
      // recomputar resumen
      renderCartPage();
    }
  });

  list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove]");
    if (!btn) return;
    const id = btn.getAttribute("data-remove");
    const items = getCartItems().filter(i => i.id !== id);
    saveCartItems(items);
    renderCartPage();
  });
}

// Exponer globales por compatibilidad (si alguna página llama inline)
window.updateCartCount = updateCartCount;
window.addToCart = addToCart;

// Auto init en todas las páginas
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  wireCartPageEvents();
  renderCartPage();
});
