// Zafrana shared cart — persists across menu pages via localStorage.
const WA_NUMBER = "442079460018";
const CART_KEY = "zafrana_cart_v1";
const fmt = n => "£" + n.toFixed(2);
let cart = new Map();
try { cart = new Map(JSON.parse(localStorage.getItem(CART_KEY) || "[]")); } catch (e) { cart = new Map(); }
function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify([...cart])); } catch (e) {} }

function rowFor(name) { return document.querySelector('.item[data-name="' + CSS.escape(name) + '"]'); }
function syncRow(name) {
  const row = rowFor(name); if (!row) return;
  const e = cart.get(name);
  const add = row.querySelector('.add-btn'), st = row.querySelector('.stepper');
  if (e && e.qty > 0) { add.hidden = true; st.hidden = false; st.querySelector('.qty').textContent = e.qty; }
  else { add.hidden = false; st.hidden = true; }
}
function render() {
  let count = 0, total = 0;
  for (const e of cart.values()) { count += e.qty; total += e.qty * e.price; }
  const bar = document.getElementById('cartBar');
  if (bar) {
    bar.hidden = count === 0;
    document.getElementById('cartSummary').textContent = count + (count === 1 ? " item" : " items") + " · " + fmt(total);
  }
  const lines = document.getElementById('cartLines');
  if (lines) {
    lines.innerHTML = "";
    for (const [name, e] of cart) {
      const d = document.createElement('div'); d.className = "cline";
      d.innerHTML = '<span class="cname"></span><div class="stepper small"><button type="button" class="dec">−</button><span class="qty"></span><button type="button" class="inc">+</button></div><b class="cline-total"></b>';
      d.querySelector('.cname').textContent = name;
      d.querySelector('.qty').textContent = e.qty;
      d.querySelector('.cline-total').textContent = fmt(e.qty * e.price);
      d.querySelector('.inc').onclick = () => { e.qty++; saveCart(); render(); syncRow(name); };
      d.querySelector('.dec').onclick = () => { e.qty--; if (e.qty <= 0) cart.delete(name); saveCart(); render(); syncRow(name); };
      lines.appendChild(d);
    }
    document.getElementById('cartTotal').textContent = fmt(total);
  }
}
document.querySelectorAll('.item').forEach(row => {
  const name = row.dataset.name, price = parseFloat(row.dataset.price);
  row.querySelector('.add-btn').onclick = () => { cart.set(name, { price, qty: 1 }); saveCart(); render(); syncRow(name); };
  row.querySelector('.inc').onclick = () => { const e = cart.get(name); if (e) { e.qty++; saveCart(); render(); syncRow(name); } };
  row.querySelector('.dec').onclick = () => { const e = cart.get(name); if (e) { e.qty--; if (e.qty <= 0) cart.delete(name); saveCart(); render(); syncRow(name); } };
  syncRow(name);
});
const drawer = document.getElementById('drawer'), scrim = document.getElementById('scrim');
function openDrawer() { if (drawer) { drawer.hidden = false; scrim.hidden = false; } }
function closeDrawer() { if (drawer) { drawer.hidden = true; scrim.hidden = true; } }
const openBtn = document.getElementById('openCart'); if (openBtn) openBtn.onclick = openDrawer;
const closeBtn = document.getElementById('closeCart'); if (closeBtn) closeBtn.onclick = closeDrawer;
if (scrim) scrim.onclick = closeDrawer;
const sendBtn = document.getElementById('sendOrder');
if (sendBtn) sendBtn.onclick = () => {
  if (cart.size === 0) return;
  const fulfil = document.querySelector('input[name="fulfil"]:checked').value;
  let total = 0; const out = ["Hello Zafrana, I'd like to order for " + fulfil.toLowerCase() + ":", ""];
  for (const [name, e] of cart) { out.push(e.qty + " × " + name + " — " + fmt(e.qty * e.price)); total += e.qty * e.price; }
  out.push("", "Total: " + fmt(total), "", "Name:", "Address (if delivery):");
  window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(out.join("\n")), "_blank");
};
render();
