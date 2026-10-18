# دليل النشر السحابي الدائم — Cloud Deployment Guide
## منصة أكاديمية مدى (Mada Academy Platform)

تم إعداد المشروع بالكامل ليدعم النشر السحابي الدائم للباك إند (.NET 10 Web API) وقاعدة البيانات (PostgreSQL عبر Supabase) والتخزين السحابي (Supabase Storage)، مع ربطه بالواجهات الأمامية (React و Angular) المنشورة على Vercel.

---

### خيارات النشر المدعومة والمجهزة في المشروع:

1. **الخيار الأول: Railway (الأسهل والأسرع — موصى به)**
2. **الخيار الثاني: Render (عبر ملف `render.yaml`)**
3. **الخيار الثالث: سيرفر خاص VPS / Docker (عبر `docker-compose.yml`)**

---

## 1. النشر على Railway (خطوة بخطوة)

الريبو مزود الآن بملف [`railway.json`](railway.json) و [`.dockerignore`](.dockerignore) للتعرف التلقائي على إعدادات الـ Dockerfile وفحص الصحة `/api/v1/health`.

### الخطوات:
1. اذهب إلى [railway.app](https://railway.app) وسجل الدخول بحساب GitHub.
2. اضغط **New Project** ثم اختر **Deploy from GitHub repo**.
3. اختر ريبوزيتوري المشروع `mada-academy-dashboard`.
4. سيتعرف Railway تلقائياً على `railway.json` ومسار `backend/Dockerfile`.
5. انتقل إلى تبويب **Variables** في خدمة الـ API وأضف المتغيرات السرية التالية:

| اسم المتغير | القيمة المطلوبة | ملاحظات |
| :--- | :--- | :--- |
| `ASPNETCORE_ENVIRONMENT` | `Production` | تفعيل وضع الإنتاج وحماية الأمان |
| `ASPNETCORE_URLS` | `http://+:8080` | المنفذ المخصص للخدمة |
| `DATABASE_URL` | `Host=aws-1-eu-central-1.pooler.supabase.com;Port=5432;Database=postgres;Username=...;Password=...` | اتصال PostgreSQL الخاص بـ Supabase |
| `MADA_JWT_SIGNING_KEY` | *(مفتاح عشوائي لا يقل عن 32 حرفاً)* | لحماية وتوقيع رموز JWT |
| `MADA_FRONTEND_URL` | `https://your-frontend.vercel.app` | رابط واجهة الفرونت إند الأساسية |
| `MADA_CORS_ORIGINS` | `https://your-frontend.vercel.app,https://your-angular.vercel.app` | الروابط المسموح لها بالاتصال بالـ API |
| `MADA_RATE_LIMIT_MODE` | `single-instance` | نمط محدد السرعة الآمن |
| `MADA_RATE_LIMIT_EXPECTED_INSTANCES` | `1` | نسخة خادم واحدة نشطة |
| `MADA_PRIVATE_STORAGE_MODE` | `supabase` | تخزين المرفقات في Supabase |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` | رابط مشروع Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `<service-role-secret>` | مفتاح الخدمة الداخلي السري (لا يُعطى للفرونت إند) |
| `SUPABASE_STORAGE_BUCKET` | `private-evidence` | باكت إيصالات الدفع الخاصة |

6. في تبويب **Settings**، اضغط على **Generate Domain** للحصول على الرابط السحابي الدائم، مثلاً:
   `https://mada-api-production.up.railway.app`

---

## 2. النشر على Render

الريبو مجهز بملف [`render.yaml`](render.yaml) للإنشاء السريع (Blueprint):
1. اذهب إلى [render.com](https://render.com) وسجل الدخول.
2. اضغط **New +** ثم اختر **Blueprint** أو **Web Service**.
3. اختر الريبو، وسيقوم Render بقراءة `render.yaml` وبناء الحاوية عبر `backend/Dockerfile`.
4. املأ المتغيرات السرية المطلوبة المذكورة في الجدول أعلاه من لوحة تحكم Render.

---

## 3. النشر الذاتي على سيرفر خاص (VPS / Docker Compose)

إذا كنت تستخدم سيرفر Ubuntu أو VPS خاصاً بك:
1. انسخ الكود إلى السيرفر:
   ```bash
   git clone <repo-url>
   cd mada-academy-dashboard
   ```
2. أنشئ ملف المتغيرات `.env` مستنداً إلى `backend/.env.production.example`.
3. شغل الخدمة فوراً بالأمر:
   ```bash
   docker compose up -d --build
   ```
4. افحص حالة الحاوية:
   ```bash
   docker compose ps
   curl http://localhost:8080/api/v1/health
   ```

---

## 4. ربط الفرونت إند (Vercel) بالـ API السحابي الجديد

بعد نشر الباك إند وحصولك على الرابط العام (مثلاً `https://mada-api-production.up.railway.app`):
1. في لوحة تحكم مشروعك على **Vercel** (للـ React و Angular):
2. افتح **Settings -> Environment Variables**.
3. اضبط المتغير:
   ```env
   VITE_API_URL=https://mada-api-production.up.railway.app/api/v1
   ```
4. أعد نشر الفرونت إند (Redeploy).

---

## 5. اختبار التشغيل والتحقق (Smoke Verification)

للتأكد من أن السيرفر السحابي يعمل بكفاءة وأمان كامل:

### عبر PowerShell (على نظام Windows):
```powershell
.\scripts\staging-smoke.ps1 -ApiBaseUrl "https://mada-api-production.up.railway.app/api/v1" -StaffPhone "01000000001" -StaffPassword "YourStrongPassword123"
```

### عبر Bash / Linux:
```bash
API_BASE_URL=https://mada-api-production.up.railway.app/api/v1 \
STAFF_PHONE="01000000001" \
STAFF_PASSWORD="YourStrongPassword123" \
./scripts/staging-smoke.sh
```

عند نجاح الفحص، ستحصل على تأكيد فوري بفحص:
- `/health` Status Healthy
- Staff Login & JWT Token
- `/me` Identity & Role check
- `/finance/invoices` Data extraction
