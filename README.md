# 🛍️ EMall - Local Merchants Marketplace

<div align="center">

![EMall Logo](https://img.shields.io/badge/EMall-Marketplace-purple?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)

**A modern marketplace platform connecting local merchants with customers**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Documentation](#-project-structure)

</div>

---

## 📖 About EMall

### English
EMall is a comprehensive marketplace platform designed to empower local merchants in Egypt. It provides a complete e-commerce solution with innovative features like QR code pickup systems, tiered subscription plans, and automated rewards programs. The platform supports both delivery and pickup orders, with real-time notifications and payment processing through Stripe and Paymob.

### العربية
إيمول هي منصة سوق إلكتروني شاملة مصممة لدعم التجار المحليين في مصر. توفر حلاً متكاملاً للتجارة الإلكترونية مع ميزات مبتكرة مثل نظام الاستلام بـ QR Code، خطط اشتراك متدرجة، وبرامج مكافآت تلقائية. تدعم المنصة طلبات التوصيل والاستلام، مع إشعارات فورية ومعالجة مدفوعات عبر Stripe و Paymob.

---

## ✨ Features

### 🏪 For Merchants | للتجار

#### Subscription Tiers | المستويات المتدرجة
- **Premium Tier (Yellow Badge)** - Top visibility, unlimited products
  - **المستوى البريميوم (شارة ذهبية)** - أعلى ظهور، منتجات غير محدودة
- **Standard Tier (Purple Badge)** - Enhanced features, 100 products max
  - **المستوى القياسي (شارة بنفسجية)** - مميزات محسنة، حتى 100 منتج
- **Basic Tier (Blue Badge)** - Essential features, 50 products max
  - **المستوى الأساسي (شارة زرقاء)** - المميزات الأساسية، حتى 50 منتج

#### Dashboard Features | مميزات لوحة التحكم
- 📊 **Real-time Analytics** - Sales tracking, revenue monitoring
  - **تحليلات فورية** - تتبع المبيعات ومراقبة الإيرادات
- 📦 **Product Management** - Add, edit, delete products with images
  - **إدارة المنتجات** - إضافة وتعديل وحذف المنتجات مع الصور
- 🛒 **Order Management** - Process orders, update status
  - **إدارة الطلبات** - معالجة الطلبات وتحديث الحالة
- 🔍 **QR Pickup Verification** - Scan or enter pickup codes
  - **التحقق من الاستلام بـ QR** - مسح أو إدخال رموز الاستلام
- ⭐ **Rewards Dashboard** - Track pickup rewards and discounts
  - **لوحة المكافآت** - تتبع مكافآت الاستلام والخصومات
- 🔔 **Real-time Notifications** - Instant order alerts
  - **إشعارات فورية** - تنبيهات الطلبات الفورية

### 🛒 For Customers | للعملاء

#### Shopping Experience | تجربة التسوق
- 🏠 **Merchant Discovery** - Browse merchants by tier and category
  - **اكتشاف التجار** - تصفح التجار حسب المستوى والفئة
- 🔍 **Advanced Search** - Filter by location, category, rating
  - **بحث متقدم** - تصفية حسب الموقع والفئة والتقييم
- 📱 **Product Catalogs** - View detailed product information
  - **كتالوجات المنتجات** - عرض معلومات تفصيلية للمنتجات
- 🛍️ **Smart Cart** - Automatic merchant grouping
  - **سلة ذكية** - تجميع تلقائي حسب التاجر
- 📦 **Delivery Options** - Choose delivery or pickup
  - **خيارات التوصيل** - اختر التوصيل أو الاستلام

#### QR Pickup System | نظام الاستلام بـ QR
- 🎫 **6-Character Codes** - Unique alphanumeric pickup codes
  - **رموز من 6 أحرف** - رموز استلام فريدة
- ⏱️ **10-Minute Expiry** - Automatic expiration for security
  - **انتهاء صلاحية 10 دقائق** - انتهاء تلقائي للأمان
- 📷 **QR Code Generation** - Scannable QR codes for merchants
  - **توليد QR Code** - رموز قابلة للمسح للتجار
- ⚡ **Instant Rewards** - Automatic points on pickup completion
  - **مكافآت فورية** - نقاط تلقائية عند إتمام الاستلام

### 💳 Payment Processing | معالجة المدفوعات

#### Dual Gateway Support | دعم بوابتي دفع
- 🌍 **Stripe Integration** - International payments, subscriptions
  - **تكامل Stripe** - مدفوعات دولية واشتراكات
- 🇪🇬 **Paymob Integration** - Egyptian market (card, wallet, cash)
  - **تكامل Paymob** - السوق المصري (بطاقات، محافظ، كاش)
- 🔐 **Webhook Verification** - Secure HMAC signature validation
  - **التحقق من Webhooks** - التحقق الآمن من التوقيعات
- 📝 **Payment Logging** - Complete audit trail
  - **تسجيل المدفوعات** - سجل تدقيق كامل

### 🔔 Notification System | نظام الإشعارات

#### Real-time Updates | التحديثات الفورية
- ⚡ **Supabase Realtime** - Live notification subscriptions
  - **Supabase الفوري** - اشتراكات إشعارات حية
- 🔊 **Toast Notifications** - Sonner for elegant toasts
  - **إشعارات Toast** - Sonner للإشعارات الأنيقة
- 🔔 **Bell Component** - Unread count badge, dropdown menu
  - **مكون الجرس** - شارة العدد غير المقروء، قائمة منسدلة
- 🎵 **Sound Alerts** - Optional Web Audio API notifications
  - **تنبيهات صوتية** - إشعارات اختيارية بـ Web Audio
- 📧 **Email/SMS Ready** - Integration placeholders for SendGrid, Twilio
  - **جاهز للبريد/الرسائل** - جاهز لـ SendGrid و Twilio

### 👨‍💼 Admin Panel | لوحة الإدارة

#### Management Tools | أدوات الإدارة
- ✅ **Merchant Approval** - Review and approve applications
  - **الموافقة على التجار** - مراجعة والموافقة على الطلبات
- 🚫 **Ban Management** - Suspend problematic merchants
  - **إدارة الحظر** - تعليق التجار المشكلين
- 📊 **Analytics Dashboard** - Platform-wide statistics
  - **لوحة التحليلات** - إحصائيات المنصة الشاملة
- ⚙️ **Settings Control** - Platform configuration
  - **التحكم بالإعدادات** - إعدادات المنصة

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - App Router, Server Components, API Routes
- **TypeScript 5** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **React 19** - Latest React features
- **Sonner** - Toast notifications
- **@yudiel/react-qr-scanner** - QR code scanning

### Backend & Database
- **Supabase** - PostgreSQL database, Auth, Storage, Realtime
- **Supabase Realtime** - Live notifications and subscriptions
- **Service Role** - Admin operations and webhooks

### Payment Gateways
- **Stripe** - International payments and subscriptions
  - Payment Intents API
  - Subscription Management
  - Webhook Events
- **Paymob** - Egyptian payment processing
  - Card payments
  - Mobile wallets
  - Cash on delivery
  - HMAC signature verification

### Libraries & Tools
- **QRCode** - QR code generation
- **Axios** - HTTP client for Paymob
- **React Hot Toast** - Toast notifications (legacy)
- **Next.js Image** - Optimized images

### Development Tools
- **ESLint** - Code linting
- **Git** - Version control
- **npm** - Package management

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 or **yarn** >= 1.22.0
- **Git** for version control
- **Supabase Account** - [Create one here](https://supabase.com)
- **Stripe Account** (optional) - [Sign up here](https://stripe.com)
- **Paymob Account** (optional) - [Register here](https://paymob.com)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yuosef0/Emallv1.0.git
cd Emallv1.0
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Variables Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration (Optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Paymob Configuration (Optional)
PAYMOB_API_KEY=your_paymob_api_key
PAYMOB_INTEGRATION_ID=your_integration_id
PAYMOB_IFRAME_ID=your_iframe_id
PAYMOB_HMAC_SECRET=your_hmac_secret

# Optional: Email/SMS
SENDGRID_API_KEY=your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

### 4. Database Setup

#### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the SQL schema file (if provided) or create tables manually

#### Required Tables:

**Users & Profiles:**
- `profiles` - User profiles with role (customer, merchant, admin)
- `users` - Extended user information (managed by Supabase Auth)

**Merchants:**
- `merchants` - Merchant information and settings
- `subscription_tiers` - Premium, Standard, Basic tiers
- `merchant_categories` - Custom product categories per merchant

**Products:**
- `products` - Product listings with images and prices
- `product_images` - Additional product images

**Orders:**
- `orders` - Order records with delivery/pickup info
- `order_items` - Individual items in orders
- `pickup_codes` - Generated QR pickup codes (can be in orders table)

**Rewards:**
- `pickup_rewards` - Customer reward points tracking
- `reward_tiers` - Bronze, Silver, Gold, Platinum tiers

**Notifications:**
- `notifications` - In-app notification records
- `webhook_logs` - Payment webhook audit trail

**Reviews:**
- `reviews` - Customer reviews for merchants/products

#### Database Triggers (Important!)

Create Supabase database trigger for automatic rewards:

```sql
-- Trigger function to add pickup rewards
CREATE OR REPLACE FUNCTION add_pickup_rewards()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if pickup_code_used changed from FALSE to TRUE
  IF OLD.pickup_code_used = FALSE AND NEW.pickup_code_used = TRUE THEN
    -- Get customer's reward tier
    -- Calculate points based on tier
    -- Insert into pickup_rewards table
    -- Update customer total points
    -- Send notification
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_pickup_code_used
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION add_pickup_rewards();
```

#### Enable Supabase Realtime

```sql
-- Enable realtime for notifications table
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### 5. Storage Setup (Supabase)

Create storage buckets:

1. **merchant-logos** - For merchant logo images (public)
2. **merchant-covers** - For merchant cover images (public)
3. **product-images** - For product images (public)

Set appropriate bucket policies for public read access.

---

## 🏃‍♂️ Running Locally

### Development Mode

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run start
# or
yarn build
yarn start
```

### Linting

```bash
npm run lint
# or
yarn lint
```

---

## 🧪 Testing

### Manual Testing Checklist

#### Authentication Flow
- [ ] User registration (customer, merchant)
- [ ] Email verification
- [ ] Login/logout
- [ ] Password reset

#### Customer Journey
- [ ] Browse merchants by tier
- [ ] View merchant details
- [ ] Add products to cart
- [ ] Merchant grouping in cart
- [ ] Checkout with delivery
- [ ] Checkout with pickup (QR code generation)
- [ ] View order history

#### Merchant Dashboard
- [ ] View dashboard statistics
- [ ] Add/edit/delete products
- [ ] Upload product images
- [ ] Manage orders
- [ ] Verify pickup codes (QR scanner)
- [ ] View pickup rewards
- [ ] Receive real-time notifications

#### Payment Processing
- [ ] Stripe payment intent creation
- [ ] Paymob payment flow
- [ ] Webhook handling (Stripe)
- [ ] Webhook handling (Paymob)
- [ ] Payment status updates

#### Notifications
- [ ] Real-time notification bell updates
- [ ] Toast notifications on new events
- [ ] Mark as read functionality
- [ ] Notification sound (optional)

#### Admin Panel
- [ ] Review pending merchant applications
- [ ] Approve/reject merchants
- [ ] Ban/unban merchants
- [ ] View platform analytics

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

3. **Environment Variables**
   - Add all `.env.local` variables in Vercel dashboard
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is added

4. **Configure Webhooks**
   - Update Stripe webhook URL: `https://yourdomain.com/api/webhooks/stripe`
   - Update Paymob webhook URL: `https://yourdomain.com/api/webhooks/paymob`

### Deploy to Other Platforms

EMall can be deployed to any platform supporting Next.js:
- **Netlify**
- **Railway**
- **DigitalOcean App Platform**
- **AWS Amplify**
- **Self-hosted** (Docker)

---

## 📁 Project Structure

```
Emallv1.0/
├── src/
│   ├── app/
│   │   ├── (admin)/          # Admin dashboard routes
│   │   │   └── admin/
│   │   │       ├── merchants/
│   │   │       │   └── pending/  # Merchant approval page
│   │   │       ├── analytics/
│   │   │       └── settings/
│   │   ├── (auth)/            # Authentication routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (customer)/        # Customer-facing routes
│   │   │   ├── page.tsx       # Homepage (merchants by tier)
│   │   │   ├── merchant/[id]/ # Merchant detail page
│   │   │   └── cart/          # Shopping cart with QR codes
│   │   ├── (merchant)/        # Merchant dashboard routes
│   │   │   └── dashboard/
│   │   │       ├── page.tsx         # Main dashboard
│   │   │       ├── products/        # Product management
│   │   │       ├── orders/          # Order management
│   │   │       ├── rewards/         # Pickup rewards dashboard
│   │   │       ├── verify-pickup/   # QR verification page
│   │   │       ├── settings/
│   │   │       └── subscription/
│   │   ├── api/               # API Routes
│   │   │   ├── create-payment-intent/
│   │   │   ├── create-subscription/
│   │   │   ├── orders/
│   │   │   │   └── notify-merchant/
│   │   │   └── webhooks/
│   │   │       ├── stripe/
│   │   │       └── paymob/
│   │   ├── layout.tsx         # Root layout with Toaster
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   └── layout/
│   │       ├── NotificationBell.tsx    # Real-time notification bell
│   │       └── DashboardHeader.tsx     # Merchant dashboard header
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts      # Client-side Supabase
│       │   └── server.ts      # Server-side Supabase
│       ├── stripe.ts          # Stripe integration
│       ├── paymob.ts          # Paymob integration
│       ├── qrcode.ts          # QR code utilities
│       └── notifications.ts   # Notification system
├── public/                    # Static assets
├── .env.local                 # Environment variables (not in git)
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

### Key Directories Explained

#### `/app/(admin)` - Admin Dashboard
Protected routes for platform administrators to manage merchants, view analytics, and configure settings.

#### `/app/(customer)` - Customer Experience
Public-facing pages for browsing merchants, viewing products, and shopping.

#### `/app/(merchant)` - Merchant Dashboard
Protected merchant-only pages for managing products, orders, and viewing analytics.

#### `/app/api` - API Endpoints
Next.js API routes for payment processing, webhooks, and merchant notifications.

#### `/lib` - Utility Libraries
Reusable functions for Supabase, payments, QR codes, and notifications.

#### `/components` - React Components
Shared UI components like NotificationBell and DashboardHeader.

---

## 🔐 Security Best Practices

### Environment Variables
- ✅ Never commit `.env.local` to git
- ✅ Use different keys for development and production
- ✅ Rotate service role keys regularly

### Supabase
- ✅ Use Row Level Security (RLS) policies
- ✅ Service role key only on server-side
- ✅ Validate user permissions in API routes

### Payment Processing
- ✅ Verify webhook signatures (Stripe, Paymob)
- ✅ Log all webhook events
- ✅ Use HTTPS in production
- ✅ Validate payment amounts server-side

### Authentication
- ✅ Use Supabase Auth built-in security
- ✅ Implement role-based access control
- ✅ Verify user permissions before actions

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
   ```bash
   git commit -m "Add amazing feature: description"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Standards

- Follow TypeScript best practices
- Use functional components with hooks
- Implement error handling
- Add comments for complex logic
- Follow existing code style
- Update documentation

### Commit Message Format

```
<type>: <description>

[optional body]
[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat: Add QR code pickup verification page
fix: Resolve notification bell dropdown closing issue
docs: Update installation instructions
```

---

## 📚 API Documentation

### Notification API

#### Send Merchant Notification
```http
POST /api/orders/notify-merchant
Content-Type: application/json

{
  "orderId": "uuid-of-order"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Merchant notified successfully"
}
```

### Stripe API

#### Create Payment Intent
```http
POST /api/create-payment-intent
Content-Type: application/json

{
  "amount": 5000,
  "currency": "egp",
  "metadata": {
    "order_id": "uuid"
  }
}
```

#### Create Subscription
```http
POST /api/create-subscription
Content-Type: application/json

{
  "customerId": "cus_xxx",
  "priceId": "price_xxx"
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### Build Errors

**Issue:** `Module not found` errors
```bash
# Solution: Clean install
rm -rf node_modules package-lock.json
npm install
```

**Issue:** TypeScript errors
```bash
# Solution: Check TypeScript version
npm install -D typescript@latest
```

#### Supabase Connection

**Issue:** `Invalid API key` error
```bash
# Solution: Verify environment variables
# Ensure NEXT_PUBLIC_SUPABASE_URL and keys are correct
```

**Issue:** Realtime not working
```sql
-- Solution: Enable realtime for table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

#### Payment Processing

**Issue:** Stripe webhook not receiving events
- Ensure webhook URL is correct: `https://yourdomain.com/api/webhooks/stripe`
- Check webhook signing secret matches
- Verify endpoint is not behind authentication

**Issue:** Paymob HMAC verification fails
- Ensure HMAC secret matches Paymob dashboard
- Check field order in HMAC calculation
- Verify all 20 required fields are included

---

## 📝 License

This project is private and proprietary. All rights reserved.

---

## 👥 Team

- **Project Lead** - Platform architecture and development
- **Backend** - Supabase, payment integrations
- **Frontend** - Next.js, React components
- **DevOps** - Deployment and infrastructure

---

## 📞 Support

For issues and questions:

- 📧 **Email:** support@emall.example.com
- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/yuosef0/Emallv1.0/issues)
- 📖 **Documentation:** This README

---

## 🗺️ Roadmap

### Phase 1: Core Platform ✅
- [x] User authentication and roles
- [x] Merchant dashboard
- [x] Product management
- [x] Shopping cart
- [x] Order management

### Phase 2: Advanced Features ✅
- [x] QR pickup system
- [x] Payment integration (Stripe + Paymob)
- [x] Notification system
- [x] Pickup rewards

### Phase 3: Enhancements 🚧
- [ ] Customer reviews and ratings
- [ ] Advanced search and filters
- [ ] Email notifications (SendGrid)
- [ ] SMS notifications (Twilio)
- [ ] Mobile app (React Native)

### Phase 4: Scale 📅
- [ ] Multi-language support
- [ ] Analytics dashboard improvements
- [ ] Marketing tools
- [ ] API for third-party integrations
- [ ] Performance optimizations

---

## 🙏 Acknowledgments

- **Next.js Team** - Amazing framework
- **Supabase** - Backend-as-a-Service platform
- **Stripe** - Payment processing
- **Paymob** - Egyptian payment gateway
- **Vercel** - Hosting and deployment
- **Open Source Community** - All the amazing libraries

---

<div align="center">

**Built with ❤️ for Egyptian merchants**

![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js-black?style=flat-square&logo=next.js)
![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-green?style=flat-square&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript)

</div>
