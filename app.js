const $ = id => document.getElementById(id);
const H = 3600000, D = 86400000;
const UNIT = { work: "أيام عمل", cal: "أيام عادية", hour: "ساعات" };
const pad = n => String(n).padStart(2, "0");

/* ===== الوقت الحقيقي وتوقيت الشركة =====
   كل الحسابات بتوقيت الشركة (TIMEZONE) مهما كان توقيت الجهاز.
   التواريخ تمثّل "الساعة على جدار الشركة" وتُقرأ بدوال getUTC* */
let offset = 0, synced = false;
const nowMs = () => Date.now() + offset;

function tzOffset(ms) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  }).formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000;
}
const nowWall = () => { const n = nowMs(); return new Date(n + tzOffset(n)); };

async function syncTime() {
  try {
    const t0 = Date.now();
    const r = await fetch(location.href.split("#")[0].split("?")[0] + "?_=" + t0, { method: "HEAD", cache: "no-store" });
    const t1 = Date.now(), d = r.headers.get("Date");
    if (!d) throw new Error("no date");
    offset = new Date(d).getTime() + (t1 - t0) / 2 - t1;
    synced = true;
  } catch (e) { synced = false; offset = 0; }
}

/* ===== التنسيق والحساب ===== */
const ymd = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const fmt = d => { const h = d.getUTCHours(); return `${ymd(d)} · ${pad(h % 12 || 12)}:${pad(d.getUTCMinutes())} ${h < 12 ? "ص" : "م"}`; };
const isOff = d => WEEKEND.includes(d.getUTCDay()) || HOLIDAYS.includes(ymd(d));

function parseWall(s) {
  const [dt, tm] = s.split("T"), [y, m, d] = dt.split("-").map(Number), [h, mi] = tm.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, h, mi));
}
function addTime(start, n, mode) {
  if (mode === "hour") return new Date(start.getTime() + n * H);
  const d = new Date(start);
  if (mode === "cal") { d.setUTCDate(d.getUTCDate() + n); return d; }
  let left = n;
  while (left > 0) { d.setUTCDate(d.getUTCDate() + 1); if (!isOff(d)) left--; }
  return d;
}
function workElapsed(start, now) {
  let n = 0; const d = new Date(start);
  for (;;) { d.setUTCDate(d.getUTCDate() + 1); if (d > now) break; if (!isOff(d)) n++; }
  return n;
}
function span(ms) {
  const m = Math.floor(ms / 60000), parts = [];
  if (m >= 1440) parts.push(`${Math.floor(m / 1440)} يوم`);
  if (Math.floor(m % 1440 / 60)) parts.push(`${Math.floor(m % 1440 / 60)} ساعة`);
  if (m % 60) parts.push(`${m % 60} دقيقة`);
  return parts.join(" و ") || "أقل من دقيقة";
}
const durText = (v, m) => m === "hour" ? `${v} ساعة` : `${v} ${v === 1 ? "يوم" : "أيام"}`;
const short = c => c === "x" ? "مباشرة" : c ? durText(c[0], c[1]) : "—";
const full = c => c === "x" ? "تصعيد مباشرة" : c ? `${durText(c[0], c[1])} ${c[1] === "hour" ? "" : "(" + UNIT[c[1]] + ")"}`.trim() : "—";

/* ===== الحالة ===== */
let sel = null, stage = STAGES[0], type = "";
const store = {
  get() { try { return JSON.parse(localStorage.getItem("recent")) || []; } catch (e) { return []; } },
  add(n) { try { localStorage.setItem("recent", JSON.stringify([n, ...this.get().filter(x => x !== n)].slice(0, 4))); } catch (e) {} }
};

function selectService(n) {
  sel = n; $("q").value = n; store.add(n);
  stage = STAGES.find(s => DATA[n][s] !== "x" && DATA[n][s]) || STAGES[0];
  renderAll();
}

/* ===== العرض ===== */
function renderTypes() {
  $("types").innerHTML = ["", "خدمة", "شكوى", "بلاغ"].map(t => `<button type="button" data-t="${t}" class="${t === type ? "on" : ""}">${t || "الكل"}</button>`).join("");
}

function renderPick() {
  $("pick").hidden = !!sel;
  if (sel) return;
  const q = $("q").value.trim();
  const list = ORDER.filter(n => n.includes(q) && (!type || typeOf(n) === type));
  const rec = q ? [] : store.get().filter(n => DATA[n]);
  $("recent").hidden = !rec.length;
  $("recent").innerHTML = rec.length ? `<span class="k">آخر ما بحثت عنه</span>` + rec.map(n => `<button type="button" data-i="${ORDER.indexOf(n)}">${n}</button>`).join("") : "";
  $("count").textContent = `${list.length} نتيجة`;
  $("results").innerHTML = list.length ? list.map(n => {
    const name = q ? n.replace(q, m => `<mark>${m}</mark>`) : n;
    return `<li tabindex="0" data-i="${ORDER.indexOf(n)}"><div>${name}<span class="k">التعامل: ${full(DATA[n][STAGES[0]])}</span></div><span class="tg">${typeOf(n)}</span></li>`;
  }).join("") : `<li class="empty">لا توجد نتائج مطابقة</li>`;
}

function ring(color, pct, head, hc, big, small) {
  return `<div class="ring"><svg width="200" height="200" viewBox="0 0 180 180" role="img" aria-label="${head}"><circle cx="90" cy="90" r="80" fill="none" stroke="#24425c" stroke-width="13"/><circle cx="90" cy="90" r="80" fill="none" stroke="${color}" stroke-width="13" stroke-linecap="round" stroke-dasharray="${Math.round(pct * 503)} 503" transform="rotate(-90 90 90)"/></svg><div class="mid"><div class="st" style="color:${hc}">${head}</div><div class="big">${big}</div><div class="sm">${small}</div></div></div>`;
}

function renderWork() {
  $("work").hidden = !sel;
  if (!sel) return;
  const rows = DATA[sel];
  $("stages").innerHTML = STAGES.map(s => `<button type="button" data-s="${s}" class="${s === stage ? "on" : ""}">${s}<b>${short(rows[s])}</b></button>`).join("");

  const cell = rows[stage], note = NOTES[sel] ? ` · ${NOTES[sel]}` : "";
  $("info").innerHTML = cell && cell !== "x" ? `المدة الأساسية: <b>${durText(cell[0], cell[1])}</b> · النوع: <b>${UNIT[cell[1]]}</b>${note}` : note.slice(3);
  const box = $("result");
  if (cell === "x") { box.innerHTML = `<div class="msg warn"><b>تصعيد مباشرة</b>لا توجد مدة تعامل لهذه الخدمة، انتقل إلى إدارة الشكاوي.</div>`; return; }
  if (!cell) { box.innerHTML = `<div class="msg">هذه المرحلة غير منطبقة على هذه الخدمة.</div>`; return; }
  const startStr = $("start").value;
  if (!startStr) { box.innerHTML = `<div class="msg">أدخل تاريخ ووقت بداية المرحلة لعرض النتيجة.</div>`; return; }

  const [value, mode] = cell, start = parseWall(startStr), now = nowWall();
  const due = addTime(start, value, mode), diff = due - now, el = now - start;
  const done = mode === "hour" ? el / (value * H) : mode === "cal" ? el / (value * D) : workElapsed(start, now) / value;
  const pct = Math.max(0, Math.min(1, done));
  const parts = span(Math.abs(diff)).split(" و ");
  const late = diff < 0, soon = !late && diff < D;
  const color = late ? "#ff948c" : soon ? "#a9bccd" : "#4fb6ec", hc = late ? "#ff948c" : "#5fe0a8";
  const elapsed = el < 0 ? "لم تبدأ بعد" : `${workElapsed(start, now)} أيام عمل`;
  const ni = STAGES.indexOf(stage) + 1, nxt = ni < STAGES.length ? `${STAGES[ni]} · ${full(rows[STAGES[ni]])}` : "لا توجد مرحلة تالية";

  box.innerHTML = ring(color, late ? 1 : pct, late ? "متجاوز" : "غير متجاوز", hc, parts[0], parts.slice(1).join(" و ")) +
    `<div class="k cap">${late ? "مدة التجاوز" : soon ? "تبقى أقل من 24 ساعة" : "المتبقي حتى الانتهاء"}</div>
    <div class="tiles"><div class="tile"><span class="k">${late ? "كان ينتهي" : "ينتهي"}</span><b>${fmt(due)}</b></div><div class="tile"><span class="k">المنقضي</span><b>${elapsed}</b><span class="k">${Math.max(0, Math.floor(el / D))} يوم عادي</span></div></div>
    <div class="next"><span class="k">المرحلة التالية عند التأخر</span><b>${nxt}</b></div>`;
}

function renderClock() {
  $("clock").innerHTML = `الوقت الآن (${TZ_LABEL}): <b>${fmt(nowWall())}</b> · ` + (synced ? "متزامن مع الخادم" : "⚠ تعذّر التحقق من الوقت، يُستخدم وقت الجهاز");
}
function renderAll() { $("clear").hidden = !$("q").value; renderTypes(); renderPick(); renderWork(); renderClock(); }
const tick = () => { renderClock(); if (sel) renderWork(); };

/* ===== الأحداث ===== */
$("q").addEventListener("input", () => { sel = null; renderAll(); });
$("q").addEventListener("focus", e => { if (sel) e.target.select(); });
$("clear").addEventListener("click", () => { $("q").value = ""; sel = null; renderAll(); $("q").focus(); });
$("types").addEventListener("click", e => { const t = e.target.closest("button"); if (t) { type = t.dataset.t; renderAll(); } });
const pickEvt = e => { const li = e.target.closest("[data-i]"); if (li) selectService(ORDER[li.dataset.i]); };
$("results").addEventListener("click", pickEvt);
$("results").addEventListener("keydown", e => { if (e.key === "Enter") pickEvt(e); });
$("recent").addEventListener("click", pickEvt);
$("stages").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { stage = b.dataset.s; renderWork(); } });
$("start").addEventListener("input", renderWork);

/* ===== التثبيت كتطبيق ===== */
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
let deferred;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; $("install").hidden = false; });
$("install").addEventListener("click", () => { deferred.prompt(); $("install").hidden = true; });
if (/iPhone|iPad/.test(navigator.userAgent) && !navigator.standalone) $("ios").hidden = false;

renderAll();
syncTime().then(tick);
setInterval(tick, 15000);
setInterval(() => syncTime().then(tick), 600000);