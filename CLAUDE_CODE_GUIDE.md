# 🎯 دليل العمل مع Claude Code - مشروع EMall

## 📋 قبل ما تبدأ (Pre-Work Setup)

### 1. تجهيز البيئة المحلية

#### أ) تثبيت الأدوات الأساسية:
```bash
# تأكد إن عندك Node.js (v18+)
node --version
npm --version

# تثبيت Claude Code
npm install -g @anthropic-ai/claude-code

# تثبيت Git
git --version

# محرر كود (اختر واحد)
# - VS Code (موصى به)
# - Cursor
# - أي محرر تاني
```

#### ب) إنشاء Accounts:
- [ ] **Supabase Account**: https://supabase.com
  - إنشئ مشروع جديد
  - احتفظ بـ URL و API Keys
  
- [ ] **Stripe Account**: https://stripe.com
  - Test mode API keys
  - Webhook endpoint (هنعمله بعدين)
  
- [ ] **Paymob Account**: https://paymob.com
  - API credentials
  - Integration ID
  
- [ ] **Google Cloud Console**: https://console.cloud.google.com
  - OAuth 2.0 credentials
  
- [ ] **Vercel Account**: https://vercel.com
  - للـ deployment

#### ج) تحضير الملفات:
```bash
# إنشاء مجلد للمشروع
mkdir emall-project
cd emall-project

# نسخ الملفات اللي عملناها
# 1. EMALL_PROJECT_ROADMAP.md
# 2. PICKUP_REWARDS_SYSTEM.md

# إنشاء ملف للـ Environment Variables Template
touch .env.example
```

#### د) فهم المشروع:
- [ ] اقرأ الـ EMALL_PROJECT_ROADMAP.md كامل
- [ ] افهم الـ Database Schema
- [ ] راجع الـ User Flow
- [ ] اقرأ PICKUP_REWARDS_SYSTEM.md

---

## 🚀 أثناء العمل مع Claude Code

### المرحلة 1: إعداد المشروع (Week 1)

#### الجلسة الأولى - Project Initialization:
```bash
# افتح terminal
claude-code
```

**Prompt #1:**
```
مرحباً Claude Code! أنا عايز أبني مشروع EMall. 

عندي الـ roadmap الكامل في ملف اسمه EMALL_PROJECT_ROADMAP.md

ابدأ معايا بالخطوات دي بالترتيب:

1. قرأ ملف EMALL_PROJECT_ROADMAP.md كامل
2. إنشئ Next.js project بالإعدادات المطلوبة
3. ثبت كل الـ dependencies المطلوبة
4. إعمل project structure حسب الموجود في الملف
5. إنشئ ملف .env.local و احط فيه كل الـ variables

لا تبدأ في الكود بعد، فقط Setup. 
بعد ما تخلص، قولي "Setup Complete" وانتظر.
```

**✅ نصيحة:** خلي كل prompt واضح ومحدد. قول بالظبط عايز إيه.

---

#### الجلسة الثانية - Database Setup:
**Prompt #2:**
```
ممتاز! دلوقتي نشتغل على Database.

من الـ roadmap:
1. إنشئ ملف supabase/migrations/001_initial_schema.sql
2. انسخ كل الـ schema من الـ roadmap
3. إنشئ ملف supabase/migrations/002_seed_data.sql
4. انسخ الـ seed data

لا تنفذ المigrations بعد، فقط جهز الملفات.

بعد ما تخلص، اعرض عليا summary للجداول اللي اتعملت.
```

**Verification Step:**
```bash
# تحقق إن الملفات اتعملت
ls -la supabase/migrations/

# راجع محتوى الـ schema
cat supabase/migrations/001_initial_schema.sql
```

---

### المرحلة 2: Core Configuration (Week 1-2)

#### الجلسة الثالثة - Supabase Configuration:
**Prompt #3:**
```
الآن نربط Supabase:

1. إنشئ src/lib/supabase/client.ts (حسب الـ roadmap)
2. إنشئ src/lib/supabase/server.ts
3. إنشئ src/middleware.ts
4. اتأكد إن كل الـ types صح

اعرض عليا الملفات قبل ما تكملهم عشان أتأكد.
```

**🔍 Best Practice:** كل ما تخلص جزء، اطلب من Claude يعرض ملخص قبل ما يكمل.

---

#### الجلسة الرابعة - Run Migrations:
**الآن وقت Supabase Dashboard:**

```
توقف عن Claude Code مؤقتاً
↓
افتح Supabase Dashboard
↓
روح على SQL Editor
↓
انسخ محتوى 001_initial_schema.sql والصقه
↓
اضغط Run
↓
انسخ محتوى 002_seed_data.sql والصقه  
↓
اضغط Run
↓
تحقق إن كل الجداول اتعملت
```

**ارجع لـ Claude Code:**
```
Prompt: تمام! الـ database جاهزة. دلوقتي:
1. جيب لي الـ database types من Supabase
2. إنشئ ملف src/types/database.types.ts
3. حدث الـ imports في كل الملفات
```

---

### المرحلة 3: Authentication System (Week 2)

#### الجلسة الخامسة - Auth Pages:
**Prompt #5:**
```
نبدأ في صفحات Authentication:

Phase 1: Login Page
1. إنشئ src/app/(auth)/login/page.tsx
2. استخدم الكود من الـ roadmap
3. أضف Google OAuth button
4. اعمل styling بـ Tailwind

عايز الصفحة:
- تدعم Email/Password
- تدعم Google OAuth
- فيها error handling
- responsive

اعرض عليا الكود قبل ما تحفظه.
```

**✅ Testing:**
```bash
# شغل الـ dev server
npm run dev

# افتح http://localhost:3000/login
# جرب التسجيل
```

---

#### الجلسة السادسة - Register Page:
**Prompt #6:**
```
الآن صفحة Register:

1. إنشئ src/app/(auth)/register/page.tsx
2. استخدم الكود من roadmap
3. خليها تدعم اختيار user type (customer/merchant)
4. أضف Google OAuth option
5. validation على الـ forms

Important: لما merchant يسجل، الـ approval_status يكون 'pending'

جرب الصفحة وتأكد الـ flow شغال.
```

---

### 🎯 استراتيجية التقسيم (Chunking Strategy)

**القاعدة الذهبية:** قسم الشغل لـ chunks صغيرة

❌ **خطأ:**
```
"اعمل كل الـ authentication system كامل"
```

✅ **صح:**
```
Session 1: "اعمل login page بس"
Session 2: "اعمل register page بس"  
Session 3: "اعمل middleware للحماية"
Session 4: "اختبر كل الـ authentication flow"
```

---

### المرحلة 4: Admin Dashboard (Week 3-4)

#### نموذج Prompt للـ Admin Pages:
```
Session: Admin Dashboard Main Page

Task: إنشئ src/app/(admin)/admin/page.tsx

Requirements:
1. عرض Statistics (users, merchants, orders)
2. Most visited pages (من page_visits table)
3. Quick action cards
4. استخدم الكود من الـ roadmap كـ base

Steps:
1. إنشئ الملف
2. اعمل الـ data fetching من Supabase
3. اعمل الـ UI components
4. اختبر إن الـ data بتظهر صح

Important: فقط admin users يقدروا يدخلوا
```

---

### المرحلة 5: Merchant Features (Week 5-6)

#### مثال - Merchant Dashboard:
```
Session: Merchant Dashboard

Context: أنا دلوقتي في Week 5، خلصت Admin pages

Task: 
إنشئ لوحة تحكم التاجر الكاملة:

1. Main Dashboard (src/app/(merchant)/dashboard/page.tsx)
   - Statistics (products, orders, revenue, rating)
   - Pickup rewards stats
   - Quick actions

2. Products Management
   - List products
   - Add new product
   - Edit product
   - Delete product

ابدأ بالـ main dashboard الأول. 
استخدم الكود من الـ roadmap.

أضف الـ Pickup Rewards section حسب التحديث الأخير.
```

---

### المرحلة 6: Customer Features (Week 7-8)

#### Homepage Development:
```
Session: Customer Homepage

Task: src/app/(customer)/page.tsx

Requirements:
1. عرض 10 merchants من كل tier
2. ترتيب حسب: tier priority → display_order → sales
3. Category buttons
4. Responsive grid

من الـ roadmap استخدم الكود الموجود في Step 5.2

اعرض preview قبل ما تحفظ.
```

---

### المرحلة 7: Cart & Checkout (Week 9-10)

#### Cart with Grouping:
```
Session: Shopping Cart

Task: Cart مع تقسيم حسب التاجر

Requirements:
1. Group items by merchant_id
2. كل merchant له section منفصلة
3. لكل merchant:
   - عرض اللوجو والاسم
   - المنتجات بتاعته
   - الـ subtotal
   - اختيار delivery method

4. لو pickup:
   - زرار "توليد كود استلام"
   - QR code يظهر (valid 10 min)

استخدم الكود من roadmap Phase 6.

اعمل الـ local storage للـ cart أول.
```

---

### المرحلة 8: Payments Integration (Week 11-12)

#### Stripe Setup:
```
Session: Stripe Integration

Task: دمج Stripe payments

Part 1: Client-side
1. src/lib/stripe.ts - setup functions
2. Checkout component مع Stripe Elements

Part 2: Server-side  
3. API route: src/app/api/create-payment-intent/route.ts
4. Webhook: src/app/api/webhooks/stripe/route.ts

استخدم الأمثلة من الـ roadmap.

Important: الـ webhook لازم يكون موقع ويحدث الـ orders table.
```

---

### المرحلة 9: Pickup Rewards (Week 13)

#### Rewards System:
```
Session: Pickup Rewards Implementation

Context: الـ database triggers جاهزة من قبل

Task: 
1. Rewards Dashboard للتاجر
   src/app/(merchant)/dashboard/rewards/page.tsx
   
2. عرض:
   - Current stats (pickups, points, discount)
   - Progress to next milestone
   - All milestones with status
   - Recent rewards history

3. Update main dashboard بـ rewards section

استخدم الكود الكامل من PICKUP_REWARDS_SYSTEM.md

اعمل mock data الأول للاختبار.
```

---

## 🔧 Best Practices أثناء العمل

### 1. Version Control Strategy:
```bash
# بعد كل session ناجحة
git add .
git commit -m "feat: complete [feature name]"
git push

# مثال
git commit -m "feat: complete merchant dashboard with rewards"
```

### 2. Testing After Each Session:
```
After every major feature:
1. شغل npm run dev
2. اختبر الـ feature يدوياً
3. تأكد مفيش errors في console
4. اختبر على mobile (responsive)
```

### 3. Error Handling:
```
لو حصل error:

1. اقرأ الـ error message كويس
2. ابحث في الكود عن المشكلة
3. اسأل Claude Code:
   "عندي error ده: [error message]
    في الملف ده: [file path]
    إيه السبب وإزاي أحله؟"
```

### 4. Code Review:
```
كل 3-4 sessions:

Prompt: "راجع الكود اللي كتبناه في:
- [list files]

تحقق من:
1. TypeScript types صح
2. Error handling موجود
3. Loading states موجودة
4. Mobile responsive
5. Best practices

قولي لو في حاجة محتاجة تتحسن."
```

---

## 📊 تتبع التقدم (Progress Tracking)

### إنشئ Checklist File:
```bash
touch PROGRESS.md
```

**محتوى PROGRESS.md:**
```markdown
# EMall Project Progress

## Week 1-2: Foundation ✅
- [x] Project setup
- [x] Database schema
- [x] Migrations run
- [x] Supabase config
- [x] Auth pages (login/register)

## Week 3-4: Admin Features 🚧
- [x] Admin dashboard
- [x] Pending merchants page
- [ ] Merchants management
- [ ] Analytics page
- [ ] Advertising management

## Week 5-6: Merchant Features ⏳
- [ ] Merchant dashboard
- [ ] Products CRUD
- [ ] Categories management
- [ ] Orders management

## Week 7-8: Customer Features ⏳
- [ ] Homepage
- [ ] Category pages
- [ ] Merchant pages
- [ ] Product pages
- [ ] Cart

... etc
```

### Update بعد كل session:
```bash
# بعد كل session
# علم ✅ على اللي خلصته
# حدث الأسبوع الحالي
```

---

## 🐛 التعامل مع المشاكل الشائعة

### مشكلة 1: Claude Code مش فاهم
```
❌ "اعمل الموقع"

✅ "من ملف EMALL_PROJECT_ROADMAP.md، 
    اقرأ Section: Phase 1
    ونفذ Steps 1.1, 1.2, 1.3 بالضبط"
```

### مشكلة 2: الكود مش شغال
```
Prompt: "الكود ده مش شغال:
[copy paste error]

الملف: src/app/page.tsx
السطر: 25

حلل المشكلة واقترح fix مع شرح."
```

### مشكلة 3: نسيت حاجة عملتها قبل كده
```
Prompt: "في جلسة سابقة عملنا [feature].
        فين الكود ده؟ 
        اعرض عليا الملفات المتعلقة."
```

---

## 💾 بعد كل Session

### 1. Save Progress:
```bash
# Commit changes
git add .
git commit -m "session: [what you completed]"

# Push to GitHub
git push origin main
```

### 2. Document في PROGRESS.md:
```markdown
### Session [N] - [Date]
**Time:** 2 hours
**Completed:**
- ✅ Feature X
- ✅ Feature Y

**Issues:**
- Fixed TypeScript error in file.ts

**Next Session:**
- [ ] Start Feature Z
```

### 3. Test Summary:
```bash
# اكتب ملاحظات
- ✅ Feature X works on desktop
- ⚠️  Feature X needs mobile testing
- ❌ Feature Y has bug with [describe]
```

---

## 🎯 بعد ما تخلص (Post-Development)

### 1. Final Testing:
```
Testing Checklist (from roadmap):

Week 15:
- [ ] اختبر كل الـ authentication flows
- [ ] اختبر Admin approval process
- [ ] اختبر Pickup rewards
- [ ] اختبر Payments (Stripe + Paymob)
- [ ] اختبر Cart grouping
- [ ] اختبر QR code generation
- [ ] اختبر Notifications

استخدم الـ Testing Checklist من الـ roadmap.
```

### 2. Performance Optimization:
```
Session: Performance Check

Task:
1. افحص page load times
2. optimize images
3. implement lazy loading
4. check bundle size
5. add caching strategies

استخدم Lighthouse للتحليل.
```

### 3. Deployment Preparation:
```
Session: Deployment Setup

Part 1: Vercel
1. Connect GitHub repo
2. Set environment variables
3. Deploy to preview

Part 2: Supabase
1. Production database
2. Run migrations
3. Configure RLS policies

Part 3: Stripe/Paymob
1. Production keys
2. Webhook URLs
3. Test payments
```

### 4. Documentation:
```
Session: Write Docs

Create:
1. README.md - Setup instructions
2. DEPLOYMENT.md - Deployment guide  
3. API.md - API endpoints documentation
4. USER_GUIDE.md - للمستخدمين

اعمل docs واضحة مع أمثلة.
```

---

## 🎨 نصائح للعمل الفعال مع Claude Code

### ✅ DO:
1. **كن محدداً**: "اعمل login page" أحسن من "اعمل authentication"
2. **قسم الشغل**: session واحدة = feature واحدة صغيرة
3. **اطلب مراجعة**: "اعرض الكود قبل ما تحفظه"
4. **اختبر دايماً**: بعد كل feature
5. **استخدم الـ roadmap**: "حسب Phase 3 من الـ roadmap"
6. **وثق**: اكتب ملاحظات عن كل session

### ❌ DON'T:
1. **طلبات عامة**: "اعمل الموقع كله"
2. **كذا feature مرة واحدة**: "اعمل auth + dashboard + payments"
3. **تنسى الـ context**: قول "من الـ roadmap"
4. **تتجاهل الـ errors**: حلها فوراً
5. **تنسى الـ commit**: commit بعد كل session ناجحة

---

## 📝 Template للـ Sessions

### نموذج Session:
```
═══════════════════════════════════
SESSION [N]: [Feature Name]
DATE: [Date]
TIME: [Start - End]
═══════════════════════════════════

📌 GOAL:
[What you want to achieve]

📋 CONTEXT:
"أنا في Week [X], خلصت [previous features]"

🎯 TASK:
"من EMALL_PROJECT_ROADMAP.md Phase [X]:
1. [Specific step 1]
2. [Specific step 2]
3. [Specific step 3]"

✅ ACCEPTANCE CRITERIA:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

🧪 TESTING:
- Test case 1
- Test case 2

═══════════════════════════════════
```

### مثال حقيقي:
```
═══════════════════════════════════
SESSION 8: Merchant Products CRUD
DATE: 2024-01-15
TIME: 2:00 PM - 4:00 PM
═══════════════════════════════════

📌 GOAL:
إنشاء صفحات إدارة المنتجات للتاجر

📋 CONTEXT:
"أنا في Week 5، خلصت Merchant Dashboard الأساسي"

🎯 TASK:
"من EMALL_PROJECT_ROADMAP.md Phase 5:

إنشئ Products Management:
1. List page: src/app/(merchant)/dashboard/products/page.tsx
   - عرض كل منتجات التاجر
   - Search & filter
   - Edit/delete buttons

2. Add page: src/app/(merchant)/dashboard/products/new/page.tsx
   - Form لإضافة منتج
   - Upload images
   - Select category
   - Inventory quantity

3. Edit page: src/app/(merchant)/dashboard/products/[id]/page.tsx
   - نفس الـ form بس مملوء بالبيانات
   - Update functionality

استخدم Supabase للـ CRUD operations"

✅ ACCEPTANCE CRITERIA:
- [ ] يقدر يضيف منتج جديد
- [ ] يقدر يعدل منتج
- [ ] يقدر يمسح منتج
- [ ] الصور بتتحمل على Supabase Storage
- [ ] الـ validation شغالة
- [ ] Responsive design

🧪 TESTING:
- أضف منتج جديد مع صورة
- عدل منتج موجود
- امسح منتج
- تأكد الصور بتظهر صح
- اختبر على mobile

═══════════════════════════════════
```

---

## 🚀 Quick Start Command

```bash
# افتح المشروع
cd emall-project

# شغل Claude Code
claude-code

# First Prompt
"مرحباً! أنا جاهز لبناء EMall.
عندي ملف EMALL_PROJECT_ROADMAP.md جاهز.
نبدأ من Phase 1: Project Setup؟"
```

---

## 📞 عندك مشكلة؟

### Troubleshooting Quick Reference:

| مشكلة | الحل |
|------|-----|
| TypeScript errors | اسأل Claude يفحص الـ types |
| Database connection | راجع .env.local |
| Build errors | `npm install` مرة تانية |
| Styling issues | راجع Tailwind config |
| API not working | افحص الـ routes |

---

## ✨ Summary: Golden Rules

1. **📖 اقرأ الـ roadmap كويس** قبل ما تبدأ
2. **🎯 session = feature واحدة** لا تعمل كذا حاجة مع بعض
3. **✅ اختبر بعد كل feature** لا تستنى للآخر
4. **💾 Commit regularly** بعد كل session ناجحة
5. **📝 وثق شغلك** PROGRESS.md مهم
6. **🔄 راجع الكود** كل كام session
7. **🐛 حل الـ bugs فوراً** لا تسيبها
8. **📱 اختبر mobile** مش بس desktop

---

**جاهز؟ Let's build EMall! 🚀**

ابدأ بـ Phase 1 وخذ وقتك. المشروع كبير، بس لو اتبعت الخطوات هيكون سهل.

Good luck! 💪
