const $ = id => document.getElementById(id);
const H = 3600000, D = 86400000;
const UNIT = { work: "أيام عمل", cal: "أيام عادية", hour: "ساعات" };
const pad = n => String(n).padStart(2, "0");

/* ===== الوقت الحقيقي وتوقيت الشركة =====
   كل الحسابات تتم بتوقيت الشركة (TIMEZONE) بغض النظر عن توقيت جهاز الموظف.
   التواريخ هنا تمثّل "الساعة على جدار الشركة" وتُقرأ بدوال getUTC* */
let offset = 0, synced = false;                 // الفرق بين ساعة الجهاز وساعة الخادم
const nowMs = () => Date.now() + offset;

function tzOffset(ms) {                          // فرق توقيت الشركة عن UTC لحظة ms
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  }).formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000;
}
const nowWall = () => { const n = nowMs(); return new Date(n + tzOffset(n)); };

async function syncTime() {                      // يقرأ الوقت من ترويسة Date لخادم الموقع نفسه
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
const fmt = d => {
  const h = d.getUTCHours(), h12 = h % 12 || 12;
  return `${ymd(d)} — ${pad(h12)}:${pad(d.getUTCMinutes())} ${h < 12 ? "ص" : "م"}`;
};
const isOff = d => WEEKEND.includes(d.getUTCDay()) || HOLIDAYS.includes(ymd(d));

function parseWall(s) {                          // "2026-10-16T14:30" => ساعة جدار الشركة
  const [dt, tm] = s.split("T"), [y, m, d] = dt.split("-").map(Number), [h, mi] = tm.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, h, mi));
}

function addTime(start, n, mode) {
  if (mode === "hour") return new Date(start.getTime() + n * H);
  const d = new Date(start);
  if (mode === "cal") { d.setUTCDate(d.getUTCDate() + n); return d; }
  let left = n;                                  // أيام العمل: نفس وقت اليوم
  while (left > 0) { d.setUTCDate(d.getUTCDate() + 1); if (!isOff(d)) left--; }
  return d;
}

function span(ms) {
  const m = Math.floor(ms / 60000), parts = [];
  if (m >= 1440) parts.push(`${Math.floor(m / 1440)} يوم`);
  if (Math.floor(m % 1440 / 60)) parts.push(`${Math.floor(m % 1440 / 60)} ساعة`);
  if (m % 60) parts.push(`${m % 60} دقيقة`);
  return parts.join(" و ") || "أقل من دقيقة";
}

const durText = (v, m) => m === "hour" ? `${v} ساعة` : `${v} ${v === 1 ? "يوم" : "أيام"}`;
const fill = (sel, items) => sel.innerHTML = items.map(i => `<option>${i}</option>`).join("");

function workElapsed(start, now) {
  let n = 0; const d = new Date(start);
  for (;;) { d.setUTCDate(d.getUTCDate() + 1); if (d > now) break; if (!isOff(d)) n++; }
  return n;
}

function renderClock() {
  $("clock").innerHTML = `الوقت الآن (${TZ_LABEL}): <b>${fmt(nowWall())}</b> · ` +
    (synced ? "✔ متزامن مع الخادم" : "⚠ تعذّر التحقق من الوقت، يُستخدم وقت الجهاز");
}

function render() {
  const box = $("result"), service = $("service").value, stage = $("stage").value, startStr = $("start").value;
  if (!service) { $("info").innerHTML = ""; box.className = "result idle"; box.innerHTML = "لا توجد نتائج مطابقة للبحث."; return; }
  const cell = DATA[service][stage], note = NOTES[service] ? `<br>ملاحظة: ${NOTES[service]}` : "";
  if (cell === "x") { $("info").innerHTML = `المرحلة: <b>${stage}</b>${note}`; box.className = "result warn"; box.innerHTML = `<div class="head">تصعيد مباشرة</div><div class="sub">لا توجد مدة تعامل لهذه الخدمة، انتقل إلى إدارة الشكاوي.</div>`; return; }
  if (!cell) { $("info").innerHTML = `المرحلة: <b>${stage}</b>${note}`; box.className = "result idle"; box.innerHTML = "هذه المرحلة غير منطبقة على هذه الخدمة."; return; }
  const [value, mode] = cell;
  $("info").innerHTML = `المرحلة: <b>${stage}</b> · المدة الأساسية: <b>${durText(value, mode)}</b> · النوع: <b>${UNIT[mode]}</b>${note}`;
  if (!startStr) { box.className = "result idle"; box.innerHTML = "أدخل تاريخ ووقت بداية المرحلة لعرض النتيجة."; return; }

  const start = parseWall(startStr), now = nowWall(), due = addTime(start, value, mode), diff = due - now, el = now - start;
  let cls, head, sub;
  if (diff < 0)      { cls = "late"; head = "متجاوز";     sub = `تجاوز المدة منذ ${span(-diff)}`; }
  else if (diff < D) { cls = "warn"; head = "غير متجاوز"; sub = `تبقى أقل من 24 ساعة: ${span(diff)}`; }
  else               { cls = "ok";   head = "غير متجاوز"; sub = `المتبقي ${span(diff)}`; }
  const elapsed = el < 0 ? "لم تبدأ بعد" : `${span(el)} (${Math.floor(el / D)} يوم عادي · ${workElapsed(start, now)} يوم عمل)`;
  box.className = "result " + cls;
  box.innerHTML = `<div class="head">${head}</div><div class="sub">${sub}</div>
    <div class="due">ينتهي: <b>${fmt(due)}</b></div><div class="due">المنقضي منذ البداية: <b>${elapsed}</b></div>
    <button type="button" id="copy" class="ghost">نسخ النتيجة</button>`;
  $("copy").onclick = () => {
    const t = `${service} — ${stage}\nالبداية: ${fmt(start)}\nالمدة: ${durText(value, mode)} (${UNIT[mode]})\nينتهي: ${fmt(due)}\nالحالة: ${head} — ${sub}`;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => $("copy").textContent = "تم النسخ ✔").catch(() => prompt("انسخ النتيجة:", t));
  };
}

function cellText(c) { return c === "x" ? "تصعيد مباشرة" : c ? `${durText(c[0], c[1])} · ${UNIT[c[1]]}` : "—"; }

function renderTable() {
  const s = DATA[$("service").value];
  $("tbody").innerHTML = s ? STAGES.map(st => `<tr class="${st === $("stage").value ? "cur" : ""}"><td>${st}</td><td>${cellText(s[st])}</td></tr>`).join("") : "";
}

const tick = () => { renderClock(); render(); };
function update() { renderTable(); tick(); }

function filterServices() {
  const q = $("q").value.trim(), t = $("type").value, cur = $("service").value;
  const list = ORDER.filter(n => n.includes(q) && (!t || typeOf(n) === t));
  fill($("service"), list);
  if (list.includes(cur)) $("service").value = cur;
  update();
}

// ---- init ----
$("type").innerHTML = ["", "خدمة", "شكوى", "بلاغ"].map(t => `<option value="${t}">${t || "الكل"}</option>`).join("");
fill($("stage"), STAGES);
["q", "type"].forEach(id => $(id).addEventListener("input", filterServices));
["service", "stage", "start"].forEach(id => $(id).addEventListener("input", update));
$("now").addEventListener("click", () => { $("start").value = nowWall().toISOString().slice(0, 16); update(); });
filterServices();
syncTime().then(tick);
setInterval(tick, 15000);
setInterval(() => syncTime().then(tick), 600000);

// تثبيت كتطبيق
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
let prompt_;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); prompt_ = e; $("install").hidden = false; });
$("install").onclick = () => { prompt_.prompt(); $("install").hidden = true; };
