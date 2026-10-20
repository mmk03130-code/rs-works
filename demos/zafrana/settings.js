// Applies live restaurant settings (name, phone, WhatsApp, address, hours, announcement)
// to any element carrying data-set / data-wa / data-hours / data-hours-table hooks.
// Also highlights today's opening-hours line automatically. No-ops in static mode.
(function () {
  if (!window.ZAFRANA_API) return;

  var DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  function coversToday(dayPart, todayTok) {
    if (!dayPart) return false;
    var tokens = dayPart.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/g);
    if (!tokens || !tokens.length) return false;
    var today = todayTok || DAY_ORDER[(new Date().getDay() + 6) % 7]; // JS getDay: Sun=0 → Mon-first index
    if (tokens.length === 1) return tokens[0] === today;
    if (tokens.length === 2) {
      var a = DAY_ORDER.indexOf(tokens[0]), b = DAY_ORDER.indexOf(tokens[1]), guard = 0;
      var cur = a;
      while (guard++ < 8) {
        if (DAY_ORDER[cur] === today) return true;
        if (cur === b) break;
        cur = (cur + 1) % 7;
      }
      return false;
    }
    return tokens.indexOf(today) >= 0;
  }

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
      document.querySelectorAll("[data-tel]").forEach(el => { if (s.phoneHref) el.href = "tel:" + s.phoneHref; });
      document.querySelectorAll('[data-set="address"]').forEach(el => { el.textContent = s.address || el.textContent; });
      document.querySelectorAll("[data-wa]").forEach(el => {
        if (s.whatsapp) el.href = el.href.replace(/wa\.me\/\d+/, "wa.me/" + s.whatsapp);
      });

      // Footer-style hour lines: <span data-hours><a>…</a></span>
      document.querySelectorAll("[data-hours]").forEach(el => {
        if (!Array.isArray(s.hours) || !s.hours.length) return;
        el.innerHTML = s.hours.map(h => {
          var day = String(h).split("·")[0];
          return "<a" + (coversToday(day) ? ' class="today-line"' : "") + "></a>";
        }).join("");
        [...el.children].forEach((a, i) => { a.textContent = s.hours[i] || ""; });
      });

      // Visit-page hours table: <table data-hours-table> — rebuild rows, highlight today.
      document.querySelectorAll("[data-hours-table]").forEach(tbl => {
        if (!Array.isArray(s.hours) || !s.hours.length) return;
        tbl.innerHTML = s.hours.map(h => {
          var parts = String(h).split("·").map(x => x.trim());
          var day = parts[0] || "", time = parts.slice(1).join(" · ") || "";
          var today = coversToday(day);
          var pill = today ? ' <span class="today-pill">Today</span>' : "";
          return "<tr" + (today ? ' class="today-row"' : "") + "><td>" + day + pill + "</td><td>" + time + "</td></tr>";
        }).join("");
      });
      // Open-now chip (#openNow): read today's line in the restaurant's timezone.
      var openEl = document.getElementById('openNow');
      if (openEl && Array.isArray(s.hours) && s.hours.length) {
        try {
          var tz = s.tz || "Europe/London";
          var parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
          var wd = "", hh = 0, mm = 0;
          parts.forEach(p => {
            if (p.type === "weekday") wd = p.value.slice(0, 3);
            if (p.type === "hour") hh = Number(p.value) % 24;
            if (p.type === "minute") mm = Number(p.value);
          });
          var line = s.hours.find(h => coversToday(String(h).split("·")[0], wd));
          if (line) {
            var m = String(line).match(/(\d{1,2}):(\d{2})\s*[\u2013-]\s*(\d{1,2}):(\d{2})/);
            if (m) {
              var open = Number(m[1]) * 60 + Number(m[2]), close = Number(m[3]) * 60 + Number(m[4]);
              var now = hh * 60 + mm;
              var f = (h2, m2) => String(h2).padStart(2, "0") + ":" + String(m2).padStart(2, "0");
              openEl.textContent = now >= open && now < close
                ? "Open now · until " + f(Number(m[3]), Number(m[4]))
                : now < open ? "Opens today · " + f(Number(m[1]), Number(m[2])) : "Closed · back tomorrow";
            }
          } else { openEl.textContent = "Closed today"; }
        } catch (e) { /* keep the static fallback text */ }
      }
    })
    .catch(() => {});
})();
