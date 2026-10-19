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

function renderClock() {
  $("clock").innerHTML = `الوقت الآن (${TZ_LABEL}): <b>${fmt(nowWall())}</b> · ` +
    (synced ? "✔ متزامن مع الخادم" : "⚠ تعذّر التحقق من الوقت، يُستخدم وقت الجهاز");
}

function render() {
  const service = $("service").value, stage = $("stage").value, startStr = $("start").value;
  const [value, mode] = DATA[service][stage];
  $("info").innerHTML = `المرحلة: <b>${stage}</b> · المدة الأساسية: <b>${durText(value, mode)}</b> · النوع: <b>${UNIT[mode]}</b>`;

  const box = $("result");
  if (!startStr) { box.className = "result idle"; box.innerHTML = "أدخل تاريخ ووقت بداية الخدمة لعرض النتيجة."; return; }

  const due = addTime(parseWall(startStr), value, mode);
  const diff = due - nowWall();
  let cls, head, sub;
  if (diff < 0)      { cls = "late"; head = "متجاوز";     sub = `تجاوز المدة منذ ${span(-diff)}`; }
  else if (diff < D) { cls = "warn"; head = "غير متجاوز"; sub = `تبقى أقل من 24 ساعة: ${span(diff)}`; }
  else               { cls = "ok";   head = "غير متجاوز"; sub = `المتبقي ${span(diff)}`; }

  box.className = "result " + cls;
  box.innerHTML = `<div class="head">${head}</div><div class="sub">${sub}</div>
    <div class="due">ينتهي: <b>${fmt(due)}</b></div>`;
}

function renderTable() {
  const s = DATA[$("service").value];
  $("tbody").innerHTML = STAGES.map(st => {
    const [v, m] = s[st];
    return `<tr class="${st === $("stage").value ? "cur" : ""}"><td>${st}</td><td>${durText(v, m)}</td><td>${UNIT[m]}</td></tr>`;
  }).join("");
}

const tick = () => { renderClock(); render(); };
function update() { renderTable(); tick(); }

// ---- init ----
fill($("service"), Object.keys(DATA));
fill($("stage"), STAGES);
["service", "stage", "start"].forEach(id => $(id).addEventListener("input", update));
$("now").addEventListener("click", () => { $("start").value = nowWall().toISOString().slice(0, 16); update(); });
update();
syncTime().then(tick);
setInterval(tick, 15000);                        // تحديث العرض كل 15 ثانية
setInterval(() => syncTime().then(tick), 600000); // إعادة المزامنة كل 10 دقائق
