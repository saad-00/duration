# Executive Duration Calculator | حاسبة المدة التنفيذية

A simple web tool that tells an employee whether a service request, complaint or report has **exceeded its executive duration** for the current stage.

> **Note:** all data in this project is demo data, used only to try out the tool. The page shows the same notice at the top.

## Features

- Pick the service / complaint / report, the stage, and the stage start date and time
- Result: **Overdue** or **Not overdue**, with a progress ring, the time remaining or exceeded, and the exact end time
- Elapsed time since the stage started (working days and calendar days)
- The next stage and its duration, shown in case the request is late
- Stages: Handling, Complaints Management, Escalation 1, 2 and 3
- Four duration types: continuous hours, working hours (within office hours), calendar days, working days (weekend and holidays skipped)
- Notes for specific services (for example, water tankers and refunds)
- Search, filter by type (service / complaint / report), and quick access to the last 4 searches
- Uses server time and a fixed company timezone, not the device clock
- Installable on phones and desktops, and works offline (falls back to the device clock)
- "Noticed a wrong duration?" link to a feedback form

## Project structure

| File | Purpose |
|---|---|
| `index.html` | Page layout |
| `style.css` | Styling |
| `app.js` | Calculation logic |
| `data.js` | **Settings and durations (edit here)** |
| `manifest.json`, `sw.js`, `icons/` | Installable app support (app icon: a water drop with clock hands) |
| `logos/` | Operator company and parent company logos (currently hidden, see below) |

## Updating the durations

Edit the `RAW` block in `data.js`, one line per service:

```
Service name|Handling|Complaints|Escalation 1|Escalation 2|Escalation 3
```

| Code | Meaning |
|---|---|
| `24h` | 24 continuous hours |
| `12k` | 12 working hours (office hours only) |
| `10w` | 10 working days |
| `30c` | 30 calendar days |
| `x` | Direct escalation (no handling period) |
| `-` | Stage not applicable |

To show a note with a service, add it to the `NOTES` object in `data.js` using the exact service name.

These settings are at the top of `data.js`:

| Setting | Current value |
|---|---|
| `TIMEZONE` | `Asia/Riyadh` |
| `WEEKEND` | Friday and Saturday |
| `WORK_START`, `WORK_END` | 8 AM to 4 PM (used by the `k` type) |
| `HOLIDAYS` | Official holidays, e.g. `"2026-10-20"` |

After changing any file, increase the version in `sw.js` by one (it is now `v3`, so the next is `v4`) so users receive the update.

## Company logos

The two logos at the top of the page are disabled for now and replaced by the demo-data notice. To bring them back, remove the comment around `<header class="top">` in `index.html`.

## Deployment

Hosted on GitHub Pages (Settings > Pages > Deploy from branch `main`).

After a new app icon is published, phones that already installed the app may keep the old icon. Remove the app from the home screen and install it again to see the new one.

<div dir="rtl">

## نبذة

أداة ويب بسيطة تبيّن للموظف هل **تجاوز الطلب (خدمة / شكوى / بلاغ) المدة التنفيذية** للمرحلة الحالية.

> **تنبيه:** جميع البيانات في هذا المشروع تجريبية وغرضها تجربة الأداة فقط، ويظهر التنبيه نفسه أعلى الصفحة.

## المميزات

- اختيار الخدمة والمرحلة وتاريخ ووقت بداية المرحلة
- النتيجة: **متجاوز** أو **غير متجاوز**، مع حلقة تقدّم والوقت المتبقي أو المتجاوز وموعد الانتهاء بدقة
- الوقت المنقضي منذ بداية المرحلة (أيام عمل وأيام عادية)
- عرض المرحلة التالية ومدتها في حال التأخر
- المراحل: مدة التعامل، إدارة الشكاوي، تصعيد 1 و2 و3
- أربعة أنواع للمدد: ساعات متواصلة، ساعات عمل (ضمن الدوام)، أيام عادية، أيام عمل (تُستثنى العطلة والإجازات)
- ملاحظات خاصة ببعض الخدمات (مثل الناقلات واسترداد الأموال)
- بحث وفلترة بحسب النوع (خدمة / شكوى / بلاغ)، ووصول سريع لآخر 4 عمليات بحث
- يعتمد على وقت الخادم وتوقيت ثابت للشركة بدل ساعة الجهاز
- يُثبَّت على الجوال والكمبيوتر ويعمل بدون إنترنت (مع استخدام ساعة الجهاز)
- رابط «لاحظت مدة غير صحيحة؟» لنموذج الملاحظات

## هيكل المشروع

| الملف | الوظيفة |
|---|---|
| `index.html` | هيكل الصفحة |
| `style.css` | التصميم |
| `app.js` | منطق الحساب |
| `data.js` | **الإعدادات والمدد (التعديل هنا)** |
| `manifest.json` و`sw.js` و`icons/` | دعم التثبيت كتطبيق (الأيقونة: قطرة ماء بداخلها عقارب ساعة) |
| `logos/` | شعارا الشركة المشغلة والشركة الأم (مخفيان حالياً، انظر أدناه) |

## تعديل المدد

عدّل كتلة `RAW` في `data.js`، سطر لكل خدمة:

```
اسم الخدمة|التعامل|الشكاوي|تصعيد1|تصعيد2|تصعيد3
```

| الرمز | المعنى |
|---|---|
| `24h` | 24 ساعة متواصلة |
| `12k` | 12 ساعة عمل (ضمن الدوام فقط) |
| `10w` | 10 أيام عمل |
| `30c` | 30 يوماً عادياً |
| `x` | تصعيد مباشرة (بلا مدة تعامل) |
| `-` | المرحلة لا تنطبق |

لإظهار ملاحظة مع خدمة، أضفها في كائن `NOTES` داخل `data.js` باسم الخدمة نفسه تماماً.

وهذه الإعدادات في أعلى `data.js`:

| الإعداد | القيمة الحالية |
|---|---|
| `TIMEZONE` | `Asia/Riyadh` |
| `WEEKEND` | الجمعة والسبت |
| `WORK_START` و`WORK_END` | من 8 صباحاً إلى 4 عصراً (يستخدمها النوع `k`) |
| `HOLIDAYS` | الإجازات الرسمية، مثل `"2026-10-20"` |

بعد تعديل أي ملف ارفع رقم النسخة في `sw.js` بمقدار واحد (هي الآن `v3`، فالتالية `v4`) ليصل التحديث للمستخدمين.

## شعارا الشركتين

الشعاران أعلى الصفحة معطّلان حالياً، ويظهر مكانهما تنبيه البيانات التجريبية. لإعادتهما، أزل التعليق المحيط بـ `<header class="top">` في `index.html`.

## النشر

الموقع مستضاف على GitHub Pages (Settings ثم Pages ثم Deploy from branch ثم `main`).

بعد نشر أيقونة جديدة قد تبقى الأيقونة القديمة على الجوالات المثبَّت عليها التطبيق، فاحذف التطبيق من الشاشة الرئيسية وثبّته من جديد لتظهر الجديدة.

</div>
