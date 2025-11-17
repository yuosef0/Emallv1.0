# 📝 EMall - Ready-to-Use Prompts Collection

## استخدم الـ Prompts دي مباشرة مع Claude Code
**نسخ → لصق → تنفيذ ✨**

---

## 🎬 Phase 1: Project Initialization

### Prompt 1.1 - Project Setup
```
مرحباً Claude Code! أنا عايز أبني مشروع EMall - منصة marketplace للتجار المحليين.

عندي roadmap كامل في ملف اسمه EMALL_PROJECT_ROADMAP.md

المهمة:
1. اقرأ الملف EMALL_PROJECT_ROADMAP.md من أوله لآخره
2. ابدأ بـ Phase 1: Project Setup
3. نفذ Step 1.1: Initialize Next.js Project بالضبط
4. ثبت كل الـ dependencies من Step 1.2

بعد ما تخلص قولي "Setup Complete ✅" وانتظر التعليمات التالية.

ملحوظة: استخدم TypeScript و Tailwind CSS و App Router
```

---

### Prompt 1.2 - Project Structure
```
ممتاز! الآن:

المهمة: إنشاء Project Structure
من الـ roadmap، انشئ كل المجلدات والملفات الأساسية:

emall/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (customer)/
│   │   ├── (merchant)/
│   │   ├── (admin)/
│   │   └── api/
│   ├── components/
│   ├── lib/
│   └── types/
├── supabase/
└── public/

فقط إنشئ الـ structure، لا تكتب كود بعد.

اعرض عليا tree للمجلدات بعد ما تخلص.
```

---

### Prompt 1.3 - Environment Setup
```
المهمة: Environment Variables

1. إنشئ ملف .env.local
2. إنشئ ملف .env.example
3. احط كل الـ variables من Step 1.3 في الـ roadmap

Variables المطلوبة:
- Supabase (URL, ANON_KEY, SERVICE_KEY)
- Stripe (PUBLISHABLE, SECRET, WEBHOOK)
- Paymob (API_KEY, INTEGRATION_ID, IFRAME_ID)
- Google OAuth (CLIENT_ID, SECRET)
- Email service (RESEND_API_KEY)

في .env.local احط placeholder values
في .env.example احط descriptions

اعرض عليا المحتوى للمراجعة.
```

---

## 🗄️ Phase 2: Database Setup

### Prompt 2.1 - Database Schema
```
المهمة: Database Schema

من EMALL_PROJECT_ROADMAP.md Phase 2:

1. إنشئ ملف: supabase/migrations/001_initial_schema.sql
2. انسخ الـ schema الكامل من Step 2.1
3. تأكد من:
   - كل الجداول موجودة
   - الـ relationships صح
   - الـ indexes موجودة
   - RLS policies موجودة
   - الـ triggers موجودة

Important: لا تنفذ المigration بعد، فقط جهز الملف.

اعرض عليا ملخص للجداول اللي هتتعمل (اسم الجدول + عدد الـ columns)
```

---

### Prompt 2.2 - Seed Data
```
المهمة: Seed Data

1. إنشئ ملف: supabase/migrations/002_seed_data.sql
2. احط الـ seed data من الـ roadmap:
   - subscription_tiers (3 tiers)
   - categories (mens, womens, kids)
   - reward_milestones (7 milestones)

اعرض عليا المحتوى للتأكد.
```

---

### Prompt 2.3 - Supabase Config Files
```
المهمة: Supabase Configuration

إنشئ الملفات دي بالكود الكامل من الـ roadmap:

1. src/lib/supabase/client.ts
   - Browser client
   - TypeScript types

2. src/lib/supabase/server.ts
   - Server client
   - Cookie handling

3. src/middleware.ts
   - Auth middleware
   - Protected routes

اعمل الملفات واحد واحد. بعد كل ملف، اعرضه عليا للمراجعة.
```

---

## 🔐 Phase 3: Authentication

### Prompt 3.1 - Login Page
```
المهمة: Login Page

ملف: src/app/(auth)/login/page.tsx

المطلوب:
1. استخدم الكود من Step 5.1 في الـ roadmap
2. Support Email/Password login
3. أضف Google OAuth button مع الـ icon
4. Error handling مع toast notifications
5. Redirect logic (merchant → dashboard, customer → home)
6. Responsive design

Important: 
- استخدم Supabase Auth
- Tailwind للتنسيق
- TypeScript types

اعرض preview للصفحة بعد ما تخلص.
```

---

### Prompt 3.2 - Register Page
```
المهمة: Register Page

ملف: src/app/(auth)/register/page.tsx

المطلوب:
1. User type selection (Customer/Merchant) - visual cards
2. Registration form:
   - Full name
   - Email
   - Phone
   - Password
3. Google OAuth option
4. عند تسجيل merchant:
   - approval_status = 'pending'
   - create profile in profiles table
   - redirect to /dashboard (pending message)

استخدم الكود من roadmap Step 5.1

اعمل validation كاملة على الـ form.
```

---

### Prompt 3.3 - Auth Callback
```
المهمة: Google OAuth Callback

إنشئ: src/app/auth/callback/route.ts

الملف ده يعالج Google OAuth redirect:
1. استقبال code من Google
2. التأكد من الـ session
3. إنشاء profile إذا لم يكن موجود
4. Redirect حسب user_type

استخدم Supabase Auth helpers.
```

---

## 👨‍💼 Phase 4: Admin Dashboard

### Prompt 4.1 - Admin Main Page
```
المهمة: Admin Dashboard

ملف: src/app/(admin)/admin/page.tsx

من roadmap Phase 6:

المطلوب:
1. Statistics cards:
   - Total users
   - Total merchants
   - Pending merchants (مع تنبيه)
   - Active merchants
   - Total products
   - Total orders

2. Most visited pages (last 7 days)
   - Query من page_visits
   - عرض top 5

3. Quick action cards:
   - Review pending merchants
   - Manage merchants
   - Advertising spaces
   - Analytics

Important: 
- فقط admin user_type يدخل
- Redirect غير الـ admin
- Real-time stats

اعمل الصفحة واعرض preview.
```

---

### Prompt 4.2 - Pending Merchants Approval
```
المهمة: Pending Merchants Page

ملف: src/app/(admin)/admin/merchants/pending/page.tsx

الصفحة دي تعرض كل التجار اللي approval_status = 'pending'

لكل تاجر اعرض:
- Brand info (logo, name, description)
- Contact info (email, phone, address)
- Application date
- Dropdown لاختيار subscription tier
- زرار approve (أخضر)
- زرار reject (أحمر)

عند approve:
- approval_status = 'approved'
- subscription_status = 'active'
- assign selected tier
- set subscription dates (30 days)

استخدم الكود من roadmap Phase 6.

اعمل الصفحة client component عشان التفاعل.
```

---

## 🏪 Phase 5: Merchant Dashboard

### Prompt 5.1 - Merchant Main Dashboard
```
المهمة: Merchant Dashboard

ملف: src/app/(merchant)/dashboard/page.tsx

من roadmap Step 5.3:

المطلوب:
1. Header card:
   - Merchant logo & name
   - Address
   - Subscription tier badge

2. Statistics (4 cards):
   - Products count
   - Pending orders
   - Total revenue
   - Rating

3. Pickup Rewards Section (gradient card):
   - Pickup orders count
   - Reward points
   - Discount percentage
   - Link to /dashboard/rewards

4. Quick actions (3 cards):
   - Add new product
   - Manage orders
   - Settings

Important:
- Show "Pending Approval" message إذا approval_status = 'pending'
- Fetch merchant data من merchants table
- عرض الـ rewards stats

اعمل الصفحة واعرض preview.
```

---

### Prompt 5.2 - Products List
```
المهمة: Products Management - List View

ملف: src/app/(merchant)/dashboard/products/page.tsx

المطلوب:
1. Header مع "Add New Product" button
2. Search bar
3. Filters:
   - Category
   - Active/Inactive
   - In stock / Out of stock

4. Products grid/table:
   - Product image
   - Name
   - Price
   - Category
   - Stock quantity
   - Status (active/inactive toggle)
   - Actions (edit, delete)

5. Empty state إذا مفيش منتجات

استخدم Supabase للـ data fetching
Implement real-time updates
Responsive design
```

---

### Prompt 5.3 - Add Product
```
المهمة: Add New Product

ملف: src/app/(merchant)/dashboard/products/new/page.tsx

Form fields:
1. Product name (EN/AR)
2. Description (EN/AR)
3. Price & Compare at price
4. Main category (dropdown من categories table)
5. Merchant category (dropdown - merchant's custom categories)
6. Images upload (multiple) → Supabase Storage
7. Sizes (multi-select: S, M, L, XL, XXL)
8. Colors (add color with name + hex)
9. SKU
10. Inventory quantity

Validation:
- كل الحقول المهمة required
- Price > 0
- Quantity >= 0
- على الأقل صورة واحدة

عند Submit:
- Upload images to Supabase Storage
- Insert to products table
- Redirect to products list
- Success toast

اعمل الـ form كامل مع validation.
```

---

### Prompt 5.4 - Pickup Rewards Dashboard
```
المهمة: Pickup Rewards Dashboard للتاجر

ملف: src/app/(merchant)/dashboard/rewards/page.tsx

استخدم الكود الكامل من PICKUP_REWARDS_SYSTEM.md

المطلوب:
1. Current Status Cards (3):
   - Total pickup orders
   - Reward points
   - Current discount %

2. Next Milestone Section:
   - Milestone description
   - Progress bar
   - Remaining pickups count

3. All Milestones List:
   - Show all 7 milestones
   - Mark achieved ✅
   - Mark current 🎯
   - Mark locked 🔒

4. Recent Rewards History
   - Last 10 rewards
   - Date, description, points

5. Call to Action Card
   - Motivational message
   - Benefits grid

اعمل الصفحة كاملة مع animations للـ progress bar.
```

---

## 🛍️ Phase 6: Customer Pages

### Prompt 6.1 - Homepage
```
المهمة: Customer Homepage

ملف: src/app/(customer)/page.tsx

من roadmap Step 5.2 مع التحديثات:

المطلوب:
1. Hero Section:
   - Gradient background
   - Welcome message
   - Category buttons

2. Merchants by Tier:
   - Section لكل tier (Premium, Standard, Basic)
   - عرض أول 10 merchants من كل tier
   - Sorting:
     * subscription_tier priority (1 first)
     * display_order (ASC)
     * total_sales (DESC)
   - Merchant cards:
     * Cover image
     * Logo
     * Brand name
     * City
     * Rating
     * Sales count
     * "Featured" badge for premium

3. Link "View All" لكل tier

Important:
- Filter merchants: approved + active + not banned
- Responsive grid
- Loading states

اعمل الصفحة كاملة مع all tiers.
```

---

### Prompt 6.2 - Merchant Detail Page
```
المهمة: Merchant Detail Page

ملف: src/app/(customer)/merchant/[id]/page.tsx

المطلوب:
1. Merchant Header:
   - Cover image (hero)
   - Logo overlay
   - Brand name
   - Rating & reviews count
   - Location
   - Contact buttons (phone, whatsapp)

2. Categories Tabs:
   - Merchant's custom categories
   - Filter products بتاعت الـ category

3. Products Grid:
   - Product cards
   - Image, name, price
   - Click → product detail

4. About Section:
   - Description
   - Address map (optional)
   - Opening hours (if available)

Server component للـ initial data
Client components للـ interactions
```

---

### Prompt 6.3 - Shopping Cart
```
المهمة: Shopping Cart with Merchant Grouping

ملف: src/app/(customer)/cart/page.tsx

هذي أهم صفحة! استخدم الكود من roadmap Phase 6.

المطلوب:
1. Group cart items by merchant_id
2. لكل merchant:
   - Header (logo, name, address)
   - Products list
   - Subtotal
   - Delivery method selection:
     * Radio: Delivery
     * Radio: Pickup from store
   
3. إذا pickup selected:
   - Button: "Generate Pickup Code"
   - عند الضغط:
     * Create order in database
     * Generate 6-char code
     * Set expiry (10 min)
     * Show QR code
     * Show code text
     * Alert: "صلاحيته 10 دقائق"

4. إذا delivery selected:
   - Button: "Proceed to Checkout"

Important:
- Cart data من localStorage أول
- Load product details من Supabase
- Group algorithm صح
- Handle empty cart

اعمل الصفحة كاملة مع QR generation.
```

---

## 💳 Phase 7: Payments

### Prompt 7.1 - Stripe Setup
```
المهمة: Stripe Integration - Setup

ملف: src/lib/stripe.ts

من roadmap Step 4.1:

1. Export stripe instance
2. createPaymentIntent function
3. createSubscription function

ملف: src/app/api/create-payment-intent/route.ts

API endpoint:
- Input: amount, currency
- Output: clientSecret
- Error handling

اعمل الملفات بالكود الكامل من الـ roadmap.
```

---

### Prompt 7.2 - Stripe Webhook
```
المهمة: Stripe Webhook Handler

ملف: src/app/api/webhooks/stripe/route.ts

استخدم الكود من roadmap Phase 7.

Handle events:
1. payment_intent.succeeded
   - Update order: payment_status = 'paid'
   - Update order: status = 'confirmed'

2. payment_intent.payment_failed
   - Update: payment_status = 'failed'

3. customer.subscription.updated
   - Update merchant subscription

4. customer.subscription.deleted
   - subscription_status = 'expired'

Important:
- Verify webhook signature
- Use service role key
- Log all events

اعمل الـ webhook handler كامل.
```

---

### Prompt 7.3 - Paymob Integration
```
المهمة: Paymob Payment Integration

ملف: src/lib/paymob.ts

من roadmap Step 4.2:

Implement PaymobClient class:
1. authenticate() - get auth token
2. createOrder() - create paymob order
3. getPaymentKey() - get payment token
4. initiatePayment() - full flow

ملف: src/app/api/webhooks/paymob/route.ts

Webhook handler:
- Handle success callback
- Handle failure callback
- Update order status

اعمل الملفات كاملة مع error handling.
```

---

## 🎁 Phase 8: Advanced Features

### Prompt 8.1 - QR Code Utilities
```
المهمة: QR Code System

ملف: src/lib/qrcode.ts

من roadmap Step 4.3:

Functions:
1. generatePickupQRCode(code) 
   - Returns data URL
   - 300x300 size

2. generatePickupCode()
   - 6 characters
   - Alphanumeric (no confusing chars)

3. isPickupCodeExpired(expiresAt)
   - Check if expired

4. getRemainingTime(expiresAt)
   - Return milliseconds

Install qrcode package أول:
npm install qrcode @types/qrcode

اعمل الـ utilities كلها.
```

---

### Prompt 8.2 - QR Verification Page
```
المهمة: QR Code Verification (Merchant Side)

ملف: src/app/(merchant)/dashboard/verify-pickup/page.tsx

المطلوب:
1. Input field لكود الاستلام (manual entry)
2. أو QR Scanner button
3. عند إدخال الكود:
   - Verify من database
   - Check not expired
   - Check not used
   - Check belongs to this merchant

4. إذا valid:
   - Show order details
   - Show products
   - Confirmation button

5. عند Confirm:
   - Mark pickup_code_used = TRUE
   - ⚡ Database trigger يشتغل تلقائياً
   - Rewards تتضاف تلقائياً
   - Success message
   - Show new pickup count

Use react-qr-reader للـ scanner
```

---

### Prompt 8.3 - Notifications System
```
المهمة: Notification System

ملف: src/lib/notifications.ts

من roadmap Step 4.4:

Functions:
1. sendNotification(data)
   - Create in-app notification
   - Optional: email
   - Optional: SMS

2. notifyMerchantNewOrder(orderId)
   - Called when order created
   - Fetch order details
   - Send to merchant

3. subscribeToNotifications(userId, callback)
   - Supabase Realtime
   - Listen to new notifications

ملف: src/app/api/orders/notify-merchant/route.ts
- API endpoint
- Call notification function

اعمل الـ notification system كامل.
```

---

### Prompt 8.4 - Real-time Notifications UI
```
المهمة: Notifications Bell Component

ملف: src/components/layout/NotificationBell.tsx

المطلوب:
1. Bell icon مع badge للعدد
2. Dropdown menu عند الضغط:
   - List آخر 5 notifications
   - Mark as read button
   - "View All" link

3. Real-time updates:
   - Subscribe to notifications
   - Auto-update count
   - Toast popup on new notification
   - Sound (optional)

4. في الـ merchant dashboard:
   - Add component to header
   - Show unread count

استخدم Supabase Realtime subscriptions
استخدم sonner للـ toast
```

---

## 🧪 Phase 9: Testing

### Prompt 9.1 - Test Authentication
```
المهمة: Test Authentication Flow

يدوياً:
1. Register as customer
2. Register as merchant
3. Login with email/password
4. Login with Google OAuth
5. Test redirects
6. Test error handling

اكتب test cases في ملف TESTING.md

لكل test case:
- Description
- Steps
- Expected result
- Actual result ✅/❌

ساعدني أعمل الـ test cases list.
```

---

### Prompt 9.2 - Test Pickup Rewards
```
المهمة: Test Pickup Rewards System

Scenarios:
1. First pickup (0 → 1)
2. Reach 10 pickups milestone
3. Reach 50 pickups milestone
4. Verify discount applies
5. Verify notification sent
6. Verify display_order improves

اعمل لي test plan كامل مع:
- Setup steps
- Test data
- Expected behavior
- How to verify each step

ساعدني أختبر الـ rewards system.
```

---

## 🚀 Phase 10: Deployment

### Prompt 10.1 - Pre-deployment Checklist
```
المهمة: Pre-deployment Check

راجع كل ده قبل deploy:

1. Environment Variables:
   - All production keys ready?
   - Webhook URLs correct?
   
2. Database:
   - All migrations run?
   - RLS policies active?
   - Indexes created?

3. Code:
   - No console.logs?
   - Error handling complete?
   - Loading states everywhere?

4. Performance:
   - Images optimized?
   - Bundle size OK?
   - Lighthouse score?

اعمل لي checklist مفصلة.
```

---

### Prompt 10.2 - Vercel Deployment
```
المهمة: Deploy to Vercel

Steps:
1. Connect GitHub repo
2. Set all environment variables
3. Configure build settings
4. Deploy to preview first
5. Test preview URL
6. Deploy to production

ساعدني في الخطوات وقولي:
- أي env variables ضرورية
- كيف أختبر الـ preview
- إيه اللي أتأكد منه قبل production
```

---

## 📚 Documentation Prompts

### Prompt Doc.1 - README
```
المهمة: Write README.md

اكتب README شامل يحتوي على:

1. Project Description
2. Features List (بالعربي والإنجليزي)
3. Tech Stack
4. Prerequisites
5. Installation Steps
6. Environment Variables Setup
7. Database Setup
8. Running Locally
9. Testing
10. Deployment
11. Project Structure
12. Contributing Guidelines

اجعله professional و easy to follow.
```

---

## 🎯 Quick Fixes Prompts

### Fix: TypeScript Errors
```
عندي TypeScript errors في الملفات دي:
[list files]

Errors:
[paste errors]

راجع الأخطاء واعطني الحلول مع شرح.
```

---

### Fix: Styling Issues
```
الصفحة [page name] فيها مشاكل styling:
- [describe issue 1]
- [describe issue 2]

الملف: [file path]

حلل المشكلة وحل الـ CSS/Tailwind issues.
```

---

### Fix: Database Query
```
الـ query ده مش راجع النتيجة الصح:

```sql
[paste query]
```

المفروض يرجع: [expected]
بيرجع: [actual]

إيه المشكلة؟ وإزاي أحلها؟
```

---

## 💡 Tips for Using These Prompts

1. **Copy the full prompt** - لا تختصر
2. **Add context** - قول في أي week أنت
3. **Mention roadmap** - دايماً قول "من الـ roadmap"
4. **Ask for preview** - قول "اعرض عليا الكود قبل ما تحفظه"
5. **Test after each** - اختبر بعد كل feature

---

## 🎬 Starting Template

```
═══════════════════════════════════
SESSION START
═══════════════════════════════════

Context: أنا بابني EMall project
Week: [current week]
Last completed: [last feature]

Ready for next prompt! 🚀
═══════════════════════════════════
```

---

**استخدم الـ prompts دي كما هي، أو عدلها حسب احتياجك!**

**Good luck with EMall! 💪✨**
