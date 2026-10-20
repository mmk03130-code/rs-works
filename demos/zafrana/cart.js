// Zafrana cart + live menu rendering.
// Pages work fully static; when config.js sets ZAFRANA_API, the menu is re-rendered
// from the live API (owner edits, sold-out flags) and the cart binds to the fresh DOM.
let WA_NUMBER = window.ZAFRANA_WA || "442079460018";
const CART_KEY = "zafrana_cart_v1";
const fmt = n => "£" + n.toFixed(2);
let cart = new Map();
try { cart = new Map(JSON.parse(localStorage.getItem(CART_KEY) || "[]")); } catch (e) { cart = new Map(); }
function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify([...cart])); } catch (e) {} }

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function itemNode(it) {
  const d = document.createElement("div");
  d.className = "item" + (it.soldOut ? " soldout" : "");
  d.dataset.name = it.name; d.dataset.price = it.price;
  let inner = "";
  if (it.img) inner += '<img class="thumb" src="' + esc(it.img) + '" alt="" loading="lazy">';
  inner += '<div class="item-main"><h3>' + esc(it.name) + (it.tag ? ' <span class="tag">' + esc(it.tag) + "</span>" : "") + "</h3>" +
    (it.desc ? '<p class="desc">' + esc(it.desc) + "</p>" : "") + "</div>";
  inner += '<div class="item-side"><span class="p">' + fmt(Number(it.price)) + "</span>";
  if (it.soldOut) inner += '<span class="soldout-tag">Sold out</span>';
  else inner += '<button class="add-btn" type="button">Add</button><div class="stepper" hidden><button type="button" class="dec" aria-label="One less">−</button><span class="qty">1</span><button type="button" class="inc" aria-label="One more">+</button></div>';
  inner += "</div>";
  d.innerHTML = inner;
  return d;
}

function rowFor(name) { return document.querySelector('.item[data-name="' + CSS.escape(name) + '"]'); }
function syncRow(name) {
  const row = rowFor(name); if (!row) return;
  const add = row.querySelector('.add-btn'), st = row.querySelector('.stepper');
  if (!add || !st) return;
  const e = cart.get(name);
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
function bindItems() {
  document.querySelectorAll('.item').forEach(row => {
    const add = row.querySelector('.add-btn'); if (!add) return;
    const name = row.dataset.name, price = parseFloat(row.dataset.price);
    add.onclick = () => { cart.set(name, { price, qty: 1 }); saveCart(); render(); syncRow(name); };
    row.querySelector('.inc').onclick = () => { const e = cart.get(name); if (e) { e.qty++; saveCart(); render(); syncRow(name); } };
    row.querySelector('.dec').onclick = () => { const e = cart.get(name); if (e) { e.qty--; if (e.qty <= 0) cart.delete(name); saveCart(); render(); syncRow(name); } };
    syncRow(name);
  });
}
function wireDrawer() {
  const drawer = document.getElementById('drawer'), scrim = document.getElementById('scrim');
  const openBtn = document.getElementById('openCart'); if (openBtn) openBtn.onclick = () => { drawer.hidden = false; scrim.hidden = false; };
  const closeBtn = document.getElementById('closeCart'); if (closeBtn) closeBtn.onclick = () => { drawer.hidden = true; scrim.hidden = true; };
  if (scrim) scrim.onclick = () => { drawer.hidden = true; scrim.hidden = true; };
  const sendBtn = document.getElementById('sendOrder');
  if (sendBtn) sendBtn.onclick = () => {
    if (cart.size === 0) return;
    const fulfil = document.querySelector('input[name="fulfil"]:checked').value;
    let total = 0; const out = ["Hello Zafrana, I'd like to order for " + fulfil.toLowerCase() + ":", ""];
    for (const [name, e] of cart) { out.push(e.qty + " × " + name + " — " + fmt(e.qty * e.price)); total += e.qty * e.price; }
    out.push("", "Total: " + fmt(total), "", "Name:", "Address (if delivery):");
    window.open("https://wa.me/" + (window.ZAFRANA_WA || WA_NUMBER) + "?text=" + encodeURIComponent(out.join("\n")), "_blank");
  };
}

async function init() {
  wireDrawer();
  const slug = document.body.dataset.cat;
  const isHub = document.body.dataset.hub;
  if (window.ZAFRANA_API && (slug || isHub)) {
    try {
      const ctl = new AbortController(); setTimeout(() => ctl.abort(), 4000);
      const r = await fetch(window.ZAFRANA_API + "/api/menu", { signal: ctl.signal, cache: "no-store" });
      if (r.ok) {
        const menu = await r.json();
        if (slug) {
          const cat = menu.find(c => c.slug === slug);
          const wrap = document.getElementById('items');
          if (cat && wrap) { wrap.innerHTML = ""; cat.items.forEach(it => wrap.appendChild(itemNode(it))); }
        }
        if (isHub) menu.forEach(c => {
          const el = document.querySelector('[data-count-for="' + c.slug + '"]');
          if (el) el.textContent = c.items.length;
        });
      }
    } catch (e) { /* static fallback stays */ }
  }
  bindItems();
  render();
}
init();
