// Applies live restaurant settings (name, phone, WhatsApp, address, hours, announcement)
// to any element carrying data-set / data-wa / data-hours hooks. No-ops in static mode.
(function () {
  if (!window.ZAFRANA_API) return;
  fetch(window.ZAFRANA_API + "/api/settings", { cache: "no-store" })
    .then(r => (r.ok ? r.json() : null))
    .then(s => {
      if (!s) return;
      window.ZAFRANA_WA = s.whatsapp || window.ZAFRANA_WA;
      document.querySelectorAll('[data-set="announce"]').forEach(el => { el.textContent = s.announce || el.textContent; });
      document.querySelectorAll('[data-set="phone"]').forEach(el => {
        el.textContent = s.phone || el.textContent;
        if (el.tagName === "A" && s.phoneHref) el.href = "tel:" + s.phoneHref;
      });
      document.querySelectorAll('[data-set="address"]').forEach(el => { el.textContent = s.address || el.textContent; });
      document.querySelectorAll("[data-wa]").forEach(el => { if (s.whatsapp) el.href = "https://wa.me/" + s.whatsapp; });
      document.querySelectorAll("[data-hours]").forEach(el => {
        if (Array.isArray(s.hours) && s.hours.length)
          el.innerHTML = s.hours.map(h => "<a></a>").join("");
        if (Array.isArray(s.hours)) [...el.children].forEach((a, i) => { a.textContent = s.hours[i] || ""; });
      });
    })
    .catch(() => {});
})();
