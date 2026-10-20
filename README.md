# Executive Duration Calculator | حاسبة المدة التنفيذية

A simple web tool that tells an employee whether a service request, complaint or report has **exceeded its executive duration** for the current stage.

## Features

- Pick the service / complaint / report, the stage, and the stage start date and time
- Result: **Overdue** or **Not overdue**, with the time remaining or exceeded and the exact end time
- Elapsed time since the stage started (calendar days and working days)
- Stages: Handling, Complaints Management, Escalation 1, 2 and 3
- Three duration types: hours, calendar days, working days (weekend and holidays skipped)
- Search and filter by type (service / complaint / report)
- "Copy result" button for a ready-to-paste summary
- Uses server time and a fixed company timezone, not the device clock
- Installable on phones and desktops, and works offline (falls back to the device clock)

## Project structure

| File | Purpose |
|---|---|
| `index.html` | Page layout |
| `style.css` | Styling (light and dark) |
| `app.js` | Calculation logic |
| `data.js` | **Settings and durations (edit here)** |
| `manifest.json`, `sw.js`, `icons/` | Installable app support |
| `logos/` | Operator company and parent company logos |

## Updating the durations

Edit the `RAW` block in `data.js`, one line per service:

```
Service name|Handling|Complaints|Escalation 1|Escalation 2|Escalation 3
```

| Code | Meaning |
|---|---|
| `24h` | 24 hours |
| `10w` | 10 working days |
| `30c` | 30 calendar days |
| `x` | Direct escalation (no handling period) |
| `-` | Stage not applicable |

Company timezone, weekend days and official holidays are also set at the top of `data.js`.
After changing any file, increase the version in `sw.js` (`v1` to `v2`) so users receive the update.

## Deployment

Hosted on GitHub Pages (Settings > Pages > Deploy from branch `main`).

<div dir="rtl">

## نبذة

أداة ويب بسيطة تبيّن للموظف هل **تجاوز الطلب (خدمة / شكوى / بلاغ) المدة التنفيذية** للمرحلة الحالية.

## المميزات

- اختيار الخدمة والمرحلة وتاريخ ووقت بداية المرحلة
- النتيجة: **متجاوز** أو **غير متجاوز**، مع الوقت المتبقي أو المتجاوز وموعد الانتهاء بدقة
- الوقت المنقضي منذ بداية المرحلة (أيام عادية وأيام عمل)
- المراحل: مدة التعامل، إدارة الشكاوي، تصعيد 1 و2 و3
- ثلاثة أنواع للمدد: ساعات، أيام عادية، أيام عمل (تُستثنى العطلة والإجازات)
- بحث وفلترة بحسب النوع (خدمة / شكوى / بلاغ)
- زر «نسخ النتيجة» لملخص جاهز للصق
- يعتمد على وقت الخادم وتوقيت ثابت للشركة بدل ساعة الجهاز
- يُثبَّت على الجوال والكمبيوتر ويعمل بدون إنترنت (مع استخدام ساعة الجهاز)

## هيكل المشروع

| الملف | الوظيفة |
|---|---|
| `index.html` | هيكل الصفحة |
| `style.css` | التصميم (فاتح وداكن) |
| `app.js` | منطق الحساب |
| `data.js` | **الإعدادات والمدد (التعديل هنا)** |
| `manifest.json` و`sw.js` و`icons/` | دعم التثبيت كتطبيق |
| `logos/` | شعارا الشركة المشغلة والشركة الأم |

## تعديل المدد

عدّل كتلة `RAW` في `data.js`، سطر لكل خدمة:

```
اسم الخدمة|التعامل|الشكاوي|تصعيد1|تصعيد2|تصعيد3
```

| الرمز | المعنى |
|---|---|
| `24h` | 24 ساعة |
| `10w` | 10 أيام عمل |
| `30c` | 30 يوماً عادياً |
| `x` | تصعيد مباشرة (بلا مدة تعامل) |
| `-` | المرحلة لا تنطبق |

ويمكن أيضاً ضبط توقيت الشركة وأيام العطلة والإجازات الرسمية في أعلى `data.js`.
بعد تعديل أي ملف ارفع رقم النسخة في `sw.js` (من `v1` إلى `v2`) ليصل التحديث للمستخدمين.

## النشر

الموقع مستضاف على GitHub Pages (Settings ثم Pages ثم Deploy from branch ثم `main`).

</div>
