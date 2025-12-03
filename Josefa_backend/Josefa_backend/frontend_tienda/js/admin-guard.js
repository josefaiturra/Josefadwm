// frontend_tienda/js/admin-guard.js
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return location.href = "/login.html";
  try {
    const r = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return location.href = "/login.html";
    const me = await r.json();
    if (me.role !== "admin") return location.href = "/login.html";
  } catch {
    location.href = "/login.html";
  }
});
