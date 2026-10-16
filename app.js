const $ = id => document.getElementById(id);
const H = 3600000, D = 86400000;
const UNIT = { work: "أيام عمل", cal: "أيام عادية", hour: "ساعات" };

const pad = n => String(n).padStart(2, "0");
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmt = d => {
  const h = d.getHours(), h12 = h % 12 || 12;
  return `${ymd(d)} — ${pad(h12)}:${pad(d.getMinutes())} ${h < 12 ? "ص" : "م"}`;
};
const isOff = d => WEEKEND.includes(d.getDay()) || HOLIDAYS.includes(ymd(d));

function addTime(start, n, mode) {
  if (mode === "hour") return new Date(start.getTime() + n * H);
  const d = new Date(start);
  if (mode === "cal") { d.setDate(d.getDate() + n); return d; }
  let left = n;                       // أيام العمل: يحتفظ بنفس وقت اليوم
  while (left > 0) { d.setDate(d.getDate() + 1); if (!isOff(d)) left--; }
  return d;
}

function span(ms) {                    // مدة مقروءة: أيام وساعات ودقائق
  const m = Math.floor(ms / 60000);
  const parts = [];
  if (m >= 1440) parts.push(`${Math.floor(m / 1440)} يوم`);
  if (Math.floor(m % 1440 / 60)) parts.push(`${Math.floor(m % 1440 / 60)} ساعة`);
  if (m % 60) parts.push(`${m % 60} دقيقة`);
  return parts.join(" و ") || "أقل من دقيقة";
}

const durText = (v, m) => m === "hour" ? `${v} ساعة` : `${v} ${v === 1 ? "يوم" : "أيام"}`;
const fill = (sel, items) => sel.innerHTML = items.map(i => `<option>${i}</option>`).join("");

function render() {
  const service = $("service").value, stage = $("stage").value, startStr = $("start").value;
  const [value, mode] = DATA[service][stage];
  $("info").innerHTML = `المرحلة: <b>${stage}</b> · المدة الأساسية: <b>${durText(value, mode)}</b> · النوع: <b>${UNIT[mode]}</b>`;

  const box = $("result");
  if (!startStr) { box.className = "result idle"; box.innerHTML = "أدخل تاريخ ووقت بداية الخدمة لعرض النتيجة."; return; }

  const due = addTime(new Date(startStr), value, mode);
  const diff = due - new Date();
  let cls, head, sub;
  if (diff < 0)        { cls = "late"; head = "متجاوز";     sub = `تجاوز المدة منذ ${span(-diff)}`; }
  else if (diff < D)   { cls = "warn"; head = "غير متجاوز"; sub = `تبقى أقل من 24 ساعة: ${span(diff)}`; }
  else                 { cls = "ok";   head = "غير متجاوز"; sub = `المتبقي ${span(diff)}`; }

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

function update() { renderTable(); render(); }

fill($("service"), Object.keys(DATA));
fill($("stage"), STAGES);
["service", "stage", "start"].forEach(id => $(id).addEventListener("input", update));
$("now").addEventListener("click", () => {
  $("start").value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  update();
});
setInterval(render, 60000);            // تحديث النتيجة كل دقيقة
update();
