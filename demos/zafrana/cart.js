// Zafrana cart + live menu rendering.
// Pages work fully static; when config.js sets ZAFRANA_API, the menu is re-rendered
// from the live API (owner edits, sold-out flags) and the cart binds to the fresh DOM.
let WA_NUMBER = window.ZAFRANA_WA || "442079460018";
const CART_KEY = "zafrana_cart_v1";
const fmt = n => "£" + n.toFixed(2);
let cart = new Map();
try { cart = new Map(JSON.parse(localStorage.getItem(CART_KEY) || "[]")); } catch (e) { cart = new Map(); }
function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify([...cart])); } catch (e) {} }
for (const e of cart.values()) { if (e.was === undefined) e.was = e.price; }

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let DISCOUNT_ALL = 0; // overall % from settings (live mode)
let DELIVERY_FEE = 2.5, DELIVERY_FREE_OVER = 25; // from settings (live mode); defaults match the demo note
const STATIC_PAGES = { starters: 1, grill: 1, mains: 1, sides: 1, sweet: 1 };
const catHref = slug => STATIC_PAGES[slug] ? "menu-" + slug + ".html" : "menu-cat.html?c=" + encodeURIComponent(slug);
function pctFor(it) { const d = Number(it.discount) || 0; return d > 0 ? d : DISCOUNT_ALL; }
function effPrice(it) { const p = pctFor(it); return p > 0 ? Math.round(Number(it.price) * (1 - p / 100) * 100) / 100 : Number(it.price); }
function itemNode(it) {
  const d = document.createElement("div");
  d.className = "item" + (it.soldOut ? " soldout" : "");
  const eff = effPrice(it), pct = pctFor(it);
  d.dataset.name = it.name; d.dataset.price = eff; if (pct > 0) d.dataset.was = it.price;
  let inner = "";
  if (it.img) inner += '<img class="thumb" src="' + esc(it.img) + '" alt="" loading="lazy">';
  inner += '<div class="item-main"><h3>' + esc(it.name) + (it.tag ? ' <span class="tag">' + esc(it.tag) + "</span>" : "") + "</h3>" +
    (it.desc ? '<p class="desc">' + esc(it.desc) + "</p>" : "") + "</div>";
  inner += '<div class="item-side"><span class="p">' + (pct > 0 ? "<s>" + fmt(Number(it.price)) + "</s>" + fmt(eff) + '<span class="off-badge">-' + pct + "%</span>" : fmt(eff)) + "</span>";
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
function fulfilType() { const r = document.querySelector('input[name="fulfil"]:checked'); return r ? r.value : "Collection"; }
function deliveryCharge(subtotal) {
  if (fulfilType() !== "Delivery" || subtotal <= 0) return 0;
  if (DELIVERY_FREE_OVER > 0 && subtotal >= DELIVERY_FREE_OVER) return 0;
  return DELIVERY_FEE;
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
    const fee = deliveryCharge(total);
    document.getElementById('cartTotal').textContent = fmt(total + fee);
    const ct0 = document.querySelector('.cart-total');
    if (ct0) {
      let dv = document.getElementById('cartDelivery');
      if (!dv) { dv = document.createElement('div'); dv.id = "cartDelivery"; dv.className = "cart-del"; ct0.parentNode.insertBefore(dv, ct0); }
      if (count === 0 || fulfilType() !== "Delivery") { dv.hidden = true; dv.innerHTML = ""; }
      else {
        dv.hidden = false;
        let html = "<span>Delivery</span><b>" + (fee > 0 ? fmt(fee) : "FREE") + "</b>";
        if (fee > 0 && DELIVERY_FREE_OVER > 0) html += '<span class="del-hint">Add ' + fmt(DELIVERY_FREE_OVER - total) + " more for free delivery</span>";
        dv.innerHTML = html;
      }
    }
    let savings = 0;
    for (const e of cart.values()) { if (e.was > e.price) savings += e.qty * (e.was - e.price); }
    const ct = document.querySelector('.cart-total');
    if (ct) {
      let sv = document.getElementById('cartSavings');
      if (!sv) { sv = document.createElement('div'); sv.id = "cartSavings"; sv.className = "cart-save"; ct.parentNode.insertBefore(sv, ct); }
      sv.hidden = savings <= 0;
      sv.innerHTML = savings > 0 ? "<span>You save</span><b>" + fmt(savings) + "</b>" : "";
    }
  }
}
function bindItems() {
  document.querySelectorAll('.item').forEach(row => {
    const add = row.querySelector('.add-btn'); if (!add) return;
    const name = row.dataset.name, price = parseFloat(row.dataset.price);
    const was = row.dataset.was ? parseFloat(row.dataset.was) : price;
    add.onclick = () => { cart.set(name, { price, was, qty: 1 }); saveCart(); render(); syncRow(name); };
    row.querySelector('.inc').onclick = () => { const e = cart.get(name); if (e) { e.qty++; saveCart(); render(); syncRow(name); } };
    row.querySelector('.dec').onclick = () => { const e = cart.get(name); if (e) { e.qty--; if (e.qty <= 0) cart.delete(name); saveCart(); render(); syncRow(name); } };
    syncRow(name);
  });
}
function wireDrawer() {
  document.querySelectorAll('input[name="fulfil"]').forEach(r => r.addEventListener("change", render));
  const drawer = document.getElementById('drawer'), scrim = document.getElementById('scrim');
  const openBtn = document.getElementById('openCart'); if (openBtn) openBtn.onclick = () => { drawer.hidden = false; scrim.hidden = false; };
  const closeBtn = document.getElementById('closeCart'); if (closeBtn) closeBtn.onclick = () => { drawer.hidden = true; scrim.hidden = true; };
  if (scrim) scrim.onclick = () => { drawer.hidden = true; scrim.hidden = true; };
  const sendBtn = document.getElementById('sendOrder');
  if (sendBtn) sendBtn.onclick = () => {
    if (cart.size === 0) return;
    const fulfil = document.querySelector('input[name="fulfil"]:checked').value;
    let total = 0; const out = ["Hello Zafrana, I'd like to order for " + fulfil.toLowerCase() + ":", ""];
    let savings = 0;
    for (const [name, e] of cart) { out.push(e.qty + " × " + name + " — " + fmt(e.qty * e.price)); total += e.qty * e.price; if (e.was > e.price) savings += e.qty * (e.was - e.price); }
    if (fulfil === "Delivery") { const fee = deliveryCharge(total); out.push("Delivery: " + (fee > 0 ? fmt(fee) : "FREE")); total += fee; }
    out.push("", "Total: " + fmt(total));
    if (savings > 0) out.push("You saved: " + fmt(savings));
    out.push("", "Name:", "Address (if delivery):");
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
      const [rm, rs] = await Promise.all([
        fetch(window.ZAFRANA_API + "/api/menu", { signal: ctl.signal, cache: "no-store" }),
        fetch(window.ZAFRANA_API + "/api/settings", { signal: ctl.signal, cache: "no-store" }).catch(() => null),
      ]);
      if (rs && rs.ok) { const st = await rs.json(); DISCOUNT_ALL = Math.min(95, Math.max(0, Number(st.discountAll) || 0)); if (st.deliveryFee !== undefined) DELIVERY_FEE = Math.max(0, Number(st.deliveryFee) || 0); if (st.deliveryFreeOver !== undefined) DELIVERY_FREE_OVER = Math.max(0, Number(st.deliveryFreeOver) || 0); }
      if (rm.ok) {
        const menu = await rm.json();
        const nav = document.querySelector('.menu-cats');
        if (nav) {
          nav.innerHTML = '<a href="menu.html">All categories</a>' + menu.map(c =>
            '<a href="' + catHref(c.slug) + '"' + (c.slug === slug ? ' class="on"' : "") + ">" + esc(c.title) + "</a>").join("");
        }
        if (slug) {
          const cat = menu.find(c => c.slug === slug);
          const wrap = document.getElementById('items');
          if (wrap) {
            if (cat) {
              wrap.innerHTML = ""; cat.items.forEach(it => wrap.appendChild(itemNode(it)));
              const eb = document.querySelector('[data-cat-eyebrow]'); if (eb) eb.textContent = cat.eyebrow || "";
              const ti = document.querySelector('[data-cat-title]'); if (ti) { ti.textContent = cat.title; document.title = cat.title + " — Zafrana · Afghan Kitchen, Lewisham"; }
              const le = document.querySelector('[data-cat-lede]'); if (le) le.textContent = cat.lede || "";
            } else {
              wrap.innerHTML = '<p class="desc">This part of the menu has moved. <a href="menu.html">See the full menu →</a></p>';
            }
          }
        }
        if (isHub) {
          const grid = document.querySelector('.cat-grid');
          if (grid) menu.forEach(c => {
            if (document.querySelector('[data-count-for="' + c.slug + '"]')) return;
            const first = c.items.find(i => i.img);
            const a = document.createElement('a');
            a.className = "cat-card"; a.href = catHref(c.slug);
            a.innerHTML = (first ? '<img src="' + esc(first.img) + '" alt="" loading="lazy">' : "") +
              '<div class="cat-card-body">' +
              (c.eyebrow ? '<span class="eyebrow">' + esc(c.eyebrow) + "</span>" : "") +
              "<h3>" + esc(c.title) + "</h3>" +
              (c.lede ? "<p>" + esc(c.lede) + "</p>" : "") +
              '<span class="cat-go"><span data-count-for="' + c.slug + '">0</span> dishes · View &amp; order →</span></div>';
            grid.appendChild(a);
          });
          menu.forEach(c => {
            const el = document.querySelector('[data-count-for="' + c.slug + '"]');
            if (el) el.textContent = c.items.length;
          });
        }
      }
    } catch (e) { /* static fallback stays */ }
  }
  bindItems();
  render();
}
init();
