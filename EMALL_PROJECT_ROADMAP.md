# EMall Project - Complete Development Roadmap
## Project Overview
**EMall** is a marketplace platform that allows local merchants to register their brands and showcase their products online with subscription-based visibility tiers.

## User Flow

### 🏪 Merchant Flow:
1. Register as merchant → Account stays **pending** until admin approval
2. Admin activates account and assigns subscription tier (Premium/Standard/Basic)
3. After activation, merchant can:
   - Add products with full control
   - Create categories and subcategories
   - Manage category ordering and visibility
   - Control which categories are active/inactive
   - Full dashboard access to manage their store
   - View orders and sales analytics

### 👨‍💼 Admin Flow:
1. Full control over the platform:
   - Approve/reject merchant applications
   - Ban merchants if needed
   - Control merchant visibility and display order
   - Manage merchant tier assignments
   - Manage advertising spaces on the site
   - View analytics: total users, most visited pages, sales statistics
   - Control which merchants appear first in each category

### 🛍️ Customer Flow:
1. Register/Login via Google or Email
2. Browse merchants by tier:
   - View first 10 merchants from Tier 1 (Premium)
   - View first 10 merchants from Tier 2 (Standard)
   - View first 10 merchants from Tier 3 (Basic)
3. Filter merchants by preferences
4. Add products to cart
5. In cart, products are **grouped by merchant**
6. Choose delivery method:
   - **Option A**: Request delivery (standard checkout)
   - **Option B**: Pick up in person → Generate QR code (valid for 10 minutes) → Show code to merchant when picking up

## Tech Stack
- **Frontend**: Next.js 14+ (App Router)
- **Backend**: Next.js API Routes + Supabase
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for images/logos)
- **Payment Gateways**: 
  - Stripe (International payments)
  - Paymob (Local Egyptian payments)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (Frontend) + Supabase (Backend)

---

## Project Structure
```
emall/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx
│   │   ├── (customer)/
│   │   │   ├── page.tsx (Homepage)
│   │   │   ├── categories/
│   │   │   │   ├── mens/
│   │   │   │   ├── womens/
│   │   │   │   └── kids/
│   │   │   ├── merchant/[id]/
│   │   │   └── cart/
│   │   ├── (merchant)/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx
│   │   │       ├── products/
│   │   │       ├── orders/
│   │   │       ├── subscription/
│   │   │       └── settings/
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   ├── stripe/
│   │   │   │   └── paymob/
│   │   │   ├── payments/
│   │   │   └── merchants/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── layout/
│   │   ├── merchant/
│   │   └── customer/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── stripe.ts
│   │   ├── paymob.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── database.types.ts
│   └── middleware.ts
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── public/
├── .env.local
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## Phase 1: Project Setup & Configuration
### Step 1.1: Initialize Next.js Project
```bash
npx create-next-app@latest emall --typescript --tailwind --app --src-dir
cd emall
```

### Step 1.2: Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install stripe @stripe/stripe-js
npm install axios # for Paymob integration
npm install zod # for validation
npm install react-hook-form @hookform/resolvers
npm install lucide-react # icons
npm install date-fns # date utilities
npm install sonner # toast notifications
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
npm install class-variance-authority clsx tailwind-merge
npm install qrcode # QR code generation
npm install @types/qrcode -D
npm install next-auth # Google OAuth (alternative auth option)
npm install react-qr-reader # QR scanner for merchants
npm install react-hot-toast # Alternative toast notifications
# For email notifications (choose one):
npm install resend # Recommended for emails
# OR npm install @sendgrid/mail
# For SMS notifications (optional):
# npm install twilio
```

### Step 1.3: Environment Variables Setup
Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Paymob
PAYMOB_API_KEY=your_paymob_api_key
PAYMOB_INTEGRATION_ID=your_paymob_integration_id
PAYMOB_IFRAME_ID=your_paymob_iframe_id

# Google OAuth (for Supabase Auth)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Service (Resend - recommended)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# OR SendGrid (alternative)
# SENDGRID_API_KEY=your_sendgrid_api_key

# SMS Service (Twilio - optional)
# TWILIO_ACCOUNT_SID=your_twilio_account_sid
# TWILIO_AUTH_TOKEN=your_twilio_auth_token
# TWILIO_PHONE_NUMBER=your_twilio_phone_number

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: Enable Google OAuth in Supabase Dashboard → Authentication → Providers → Google

---

## Phase 2: Database Schema Setup (Supabase)
### Step 2.1: Create Database Tables

**File**: `supabase/migrations/001_initial_schema.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  user_type TEXT CHECK (user_type IN ('customer', 'merchant', 'admin')) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription tiers
CREATE TABLE public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL, -- 'premium', 'standard', 'basic'
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  priority_level INTEGER NOT NULL, -- 1 (highest) to 3 (lowest)
  features JSONB,
  max_products INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchants
CREATE TABLE public.merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  brand_name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  address TEXT NOT NULL,
  address_ar TEXT,
  city TEXT,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  subscription_tier_id UUID REFERENCES public.subscription_tiers(id),
  subscription_status TEXT CHECK (subscription_status IN ('pending', 'active', 'inactive', 'expired', 'banned')) DEFAULT 'pending',
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  total_sales INTEGER DEFAULT 0,
  pickup_orders_count INTEGER DEFAULT 0, -- Count of completed pickup orders
  pickup_rewards_points INTEGER DEFAULT 0, -- Points earned from pickups
  discount_percentage DECIMAL(5,2) DEFAULT 0, -- Subscription discount earned
  rating DECIMAL(3,2) DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_reason TEXT,
  display_order INTEGER DEFAULT 999, -- Lower number = higher priority in display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product categories (main categories)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL, -- 'mens', 'womens', 'kids'
  name_ar TEXT UNIQUE NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchant custom categories (for organizing their own products)
CREATE TABLE public.merchant_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  parent_category_id UUID REFERENCES public.merchant_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0, -- Lower number shows first
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2), -- for showing discounts
  category_id UUID REFERENCES public.categories(id), -- Main category (mens/womens/kids)
  merchant_category_id UUID REFERENCES public.merchant_categories(id), -- Merchant's custom category
  inventory_quantity INTEGER DEFAULT 0,
  sku TEXT,
  images JSONB, -- array of image URLs
  sizes JSONB, -- array: ['S', 'M', 'L', 'XL']
  colors JSONB, -- array: [{name: 'Red', hex: '#FF0000'}]
  is_active BOOLEAN DEFAULT TRUE,
  views INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id),
  merchant_id UUID REFERENCES public.merchants(id),
  status TEXT CHECK (status IN ('pending', 'confirmed', 'processing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled', 'refunded')) DEFAULT 'pending',
  delivery_method TEXT CHECK (delivery_method IN ('delivery', 'pickup')) NOT NULL DEFAULT 'delivery',
  pickup_code TEXT UNIQUE, -- QR code for pickup orders
  pickup_code_expires_at TIMESTAMP WITH TIME ZONE,
  pickup_code_used BOOLEAN DEFAULT FALSE,
  pickup_code_used_at TIMESTAMP WITH TIME ZONE,
  total_amount DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('stripe', 'paymob', 'cash_on_delivery', 'pay_on_pickup')),
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  payment_intent_id TEXT, -- Stripe or Paymob transaction ID
  shipping_address JSONB,
  customer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL, -- price at time of purchase
  size TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory transactions (for tracking stock changes)
CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_change INTEGER NOT NULL, -- positive for additions, negative for sales
  transaction_type TEXT CHECK (transaction_type IN ('sale', 'restock', 'adjustment', 'return')),
  reference_id UUID, -- order_id if it's a sale
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription payments history
CREATE TABLE public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  subscription_tier_id UUID REFERENCES public.subscription_tiers(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  payment_intent_id TEXT,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('order', 'subscription', 'system', 'promotion')),
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advertising spaces on the website
CREATE TABLE public.advertising_spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- 'homepage_banner', 'sidebar_ad', etc.
  location TEXT NOT NULL, -- where on the site
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
  image_url TEXT,
  link_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site analytics for admin dashboard
CREATE TABLE public.page_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_url TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchant application tracking
CREATE TABLE public.merchant_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  requested_tier_id UUID REFERENCES public.subscription_tiers(id),
  application_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pickup rewards system
CREATE TABLE public.pickup_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL,
  reward_type TEXT CHECK (reward_type IN ('pickup_completed', 'milestone_bonus', 'admin_bonus')),
  description TEXT,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reward milestones configuration
CREATE TABLE public.reward_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pickups_required INTEGER NOT NULL, -- e.g. 50, 100, 200
  reward_type TEXT CHECK (reward_type IN ('discount', 'visibility_boost', 'featured_badge')) NOT NULL,
  reward_value DECIMAL(10,2), -- discount percentage or boost value
  description TEXT,
  description_ar TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_merchants_subscription ON public.merchants(subscription_tier_id, subscription_status);
CREATE INDEX idx_merchants_sales ON public.merchants(total_sales DESC);
CREATE INDEX idx_merchants_approval ON public.merchants(approval_status, subscription_status);
CREATE INDEX idx_merchants_display ON public.merchants(display_order ASC);
CREATE INDEX idx_products_merchant ON public.products(merchant_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_merchant_category ON public.products(merchant_category_id);
CREATE INDEX idx_merchant_categories_merchant ON public.merchant_categories(merchant_id);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_merchant ON public.orders(merchant_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_pickup_code ON public.orders(pickup_code) WHERE pickup_code IS NOT NULL;
CREATE INDEX idx_page_visits_url ON public.page_visits(page_url);
CREATE INDEX idx_page_visits_date ON public.page_visits(visited_at);
CREATE INDEX idx_advertising_active ON public.advertising_spaces(is_active, start_date, end_date);
CREATE INDEX idx_pickup_rewards_merchant ON public.pickup_rewards(merchant_id);
CREATE INDEX idx_merchants_pickup_count ON public.merchants(pickup_orders_count DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to process pickup rewards when code is used
CREATE OR REPLACE FUNCTION process_pickup_reward()
RETURNS TRIGGER AS $$
DECLARE
  points_to_add INTEGER := 1;
  milestone_record RECORD;
BEGIN
  -- Only process if pickup code was just used
  IF NEW.pickup_code_used = TRUE AND OLD.pickup_code_used = FALSE THEN
    
    -- Add 1 point for completed pickup
    INSERT INTO public.pickup_rewards (merchant_id, points_earned, reward_type, description, order_id)
    VALUES (NEW.merchant_id, points_to_add, 'pickup_completed', 'Pickup order completed', NEW.id);
    
    -- Update merchant counters
    UPDATE public.merchants
    SET 
      pickup_orders_count = pickup_orders_count + 1,
      pickup_rewards_points = pickup_rewards_points + points_to_add
    WHERE id = NEW.merchant_id;
    
    -- Check for milestone achievements
    FOR milestone_record IN 
      SELECT * FROM public.reward_milestones 
      WHERE is_active = TRUE 
      AND pickups_required <= (SELECT pickup_orders_count FROM public.merchants WHERE id = NEW.merchant_id)
      ORDER BY pickups_required DESC
      LIMIT 1
    LOOP
      -- Apply discount
      IF milestone_record.reward_type = 'discount' THEN
        UPDATE public.merchants
        SET discount_percentage = GREATEST(discount_percentage, milestone_record.reward_value)
        WHERE id = NEW.merchant_id;
      END IF;
      
      -- Apply visibility boost
      IF milestone_record.reward_type = 'visibility_boost' THEN
        UPDATE public.merchants
        SET display_order = GREATEST(0, display_order - milestone_record.reward_value::INTEGER)
        WHERE id = NEW.merchant_id;
      END IF;
      
      -- Send notification about milestone
      INSERT INTO public.notifications (user_id, title, message, type)
      SELECT 
        user_id,
        'تهانينا! لقد حققت إنجاز جديد 🎉',
        'لقد أكملت ' || milestone_record.pickups_required || ' طلب استلام وحصلت على: ' || milestone_record.description_ar,
        'system'
      FROM public.merchants
      WHERE id = NEW.merchant_id;
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for pickup rewards
CREATE TRIGGER trigger_pickup_reward
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION process_pickup_reward();

-- Function to notify merchant of new order
CREATE OR REPLACE FUNCTION notify_merchant_new_order()
RETURNS TRIGGER AS $$
DECLARE
  merchant_user_id UUID;
  customer_name TEXT;
  order_total TEXT;
BEGIN
  -- Get merchant user_id
  SELECT user_id INTO merchant_user_id
  FROM public.merchants
  WHERE id = NEW.merchant_id;
  
  -- Get customer name
  SELECT full_name INTO customer_name
  FROM public.profiles
  WHERE id = NEW.customer_id;
  
  -- Format total amount
  order_total := NEW.total_amount || ' EGP';
  
  -- Create notification for merchant
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    merchant_user_id,
    '🛒 طلب جديد #' || NEW.order_number,
    'لديك طلب جديد من ' || COALESCE(customer_name, 'عميل') || 
    ' بقيمة ' || order_total || 
    CASE 
      WHEN NEW.delivery_method = 'pickup' THEN ' - استلام من المحل'
      ELSE ' - توصيل'
    END,
    'order',
    '/dashboard/orders/' || NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify merchant when order is created
CREATE TRIGGER trigger_notify_merchant_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION notify_merchant_new_order();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for merchants
CREATE POLICY "Approved active merchants are viewable by everyone" ON public.merchants
  FOR SELECT USING (
    approval_status = 'approved' 
    AND subscription_status = 'active'
    AND is_banned = FALSE
  );

CREATE POLICY "Merchants can view own data" ON public.merchants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Merchants can update own data" ON public.merchants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all merchants" ON public.merchants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- RLS Policies for products
CREATE POLICY "Active products are viewable by everyone" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Merchants can manage own products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.merchants
      WHERE merchants.id = products.merchant_id
      AND merchants.user_id = auth.uid()
    )
  );

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = customer_id OR
    EXISTS (
      SELECT 1 FROM public.merchants
      WHERE merchants.id = orders.merchant_id
      AND merchants.user_id = auth.uid()
    )
  );

-- RLS Policies for order_items
CREATE POLICY "Order items viewable through orders" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.customer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.merchants
          WHERE merchants.id = orders.merchant_id
          AND merchants.user_id = auth.uid()
        )
      )
    )
  );
```

### Step 2.2: Seed Initial Data

**File**: `supabase/migrations/002_seed_data.sql`

```sql
-- Insert subscription tiers
INSERT INTO public.subscription_tiers (name, price_monthly, price_yearly, priority_level, max_products, features) VALUES
('premium', 999.00, 9990.00, 1, 1000, '{"priority_support": true, "featured_listing": true, "analytics": true, "custom_domain": true}'),
('standard', 499.00, 4990.00, 2, 500, '{"priority_support": false, "featured_listing": false, "analytics": true, "custom_domain": false}'),
('basic', 199.00, 1990.00, 3, 100, '{"priority_support": false, "featured_listing": false, "analytics": false, "custom_domain": false}');

-- Insert categories
INSERT INTO public.categories (name, name_ar, icon) VALUES
('mens', 'رجالي', 'user'),
('womens', 'حريمي', 'user-circle'),
('kids', 'أطفال', 'baby');

-- Insert reward milestones
INSERT INTO public.reward_milestones (pickups_required, reward_type, reward_value, description, description_ar) VALUES
(10, 'discount', 5.00, '5% subscription discount', 'خصم 5% على الاشتراك'),
(25, 'visibility_boost', 10.00, 'Display order boost', 'تحسين ترتيب الظهور'),
(50, 'discount', 10.00, '10% subscription discount', 'خصم 10% على الاشتراك'),
(100, 'featured_badge', 0.00, 'Featured merchant badge', 'شارة تاجر مميز'),
(100, 'discount', 15.00, '15% subscription discount', 'خصم 15% على الاشتراك'),
(200, 'discount', 20.00, '20% subscription discount', 'خصم 20% على الاشتراك'),
(500, 'discount', 30.00, '30% subscription discount + VIP status', 'خصم 30% على الاشتراك + حالة VIP');
```

---

## Phase 3: Supabase Configuration Files
### Step 3.1: Supabase Client Setup

**File**: `src/lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**File**: `src/lib/supabase/server.ts`
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie removal errors
          }
        },
      },
    }
  )
}
```

**File**: `src/middleware.ts`
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect merchant dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## Phase 4: Payment Integration
### Step 4.1: Stripe Setup

**File**: `src/lib/stripe.ts`
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

export const createPaymentIntent = async (amount: number, currency: string = 'usd') => {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
  })
}

export const createSubscription = async (customerId: string, priceId: string) => {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  })
}
```

### Step 4.2: Paymob Setup

**File**: `src/lib/paymob.ts`
```typescript
import axios from 'axios'

const PAYMOB_BASE_URL = 'https://accept.paymob.com/api'

interface PaymobAuthResponse {
  token: string
}

interface PaymobOrderResponse {
  id: number
}

interface PaymobPaymentKeyResponse {
  token: string
}

export class PaymobClient {
  private apiKey: string
  private integrationId: string

  constructor() {
    this.apiKey = process.env.PAYMOB_API_KEY!
    this.integrationId = process.env.PAYMOB_INTEGRATION_ID!
  }

  async authenticate(): Promise<string> {
    const response = await axios.post<PaymobAuthResponse>(`${PAYMOB_BASE_URL}/auth/tokens`, {
      api_key: this.apiKey,
    })
    return response.data.token
  }

  async createOrder(authToken: string, amountCents: number, merchantOrderId: string): Promise<number> {
    const response = await axios.post<PaymobOrderResponse>(`${PAYMOB_BASE_URL}/ecommerce/orders`, {
      auth_token: authToken,
      delivery_needed: 'false',
      amount_cents: amountCents,
      currency: 'EGP',
      merchant_order_id: merchantOrderId,
    })
    return response.data.id
  }

  async getPaymentKey(authToken: string, orderId: number, amountCents: number, billingData: any): Promise<string> {
    const response = await axios.post<PaymobPaymentKeyResponse>(`${PAYMOB_BASE_URL}/acceptance/payment_keys`, {
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: billingData,
      currency: 'EGP',
      integration_id: this.integrationId,
    })
    return response.data.token
  }

  async initiatePayment(
    amountEGP: number,
    merchantOrderId: string,
    billingData: {
      first_name: string
      last_name: string
      email: string
      phone_number: string
      city: string
      country: string
      street: string
    }
  ): Promise<string> {
    const authToken = await this.authenticate()
    const amountCents = Math.round(amountEGP * 100)
    const orderId = await this.createOrder(authToken, amountCents, merchantOrderId)
    const paymentKey = await this.getPaymentKey(authToken, orderId, amountCents, billingData)
    
    return `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`
  }
}

export const paymob = new PaymobClient()
```

### Step 4.3: QR Code Utilities

**File**: `src/lib/qrcode.ts`
```typescript
import QRCode from 'qrcode'

export const generatePickupQRCode = async (pickupCode: string): Promise<string> => {
  try {
    // Generate QR code as data URL
    const qrDataURL = await QRCode.toDataURL(pickupCode, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
    return qrDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

export const generatePickupCode = (): string => {
  // Generate 6-character alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing characters
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export const isPickupCodeExpired = (expiresAt: string): boolean => {
  return new Date(expiresAt) < new Date()
}

export const getRemainingTime = (expiresAt: string): number => {
  const now = new Date().getTime()
  const expires = new Date(expiresAt).getTime()
  return Math.max(0, expires - now)
}
```

### Step 4.4: Notification System

**File**: `src/lib/notifications.ts`
```typescript
import { createServerSupabaseClient } from './supabase/server'

interface NotificationData {
  userId: string
  title: string
  message: string
  type: 'order' | 'subscription' | 'system' | 'promotion'
  link?: string
}

export const sendNotification = async (data: NotificationData) => {
  const supabase = await createServerSupabaseClient()
  
  // Create in-app notification
  await supabase.from('notifications').insert({
    user_id: data.userId,
    title: data.title,
    message: data.message,
    type: data.type,
    link: data.link,
  })
  
  // Get user contact info
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, phone')
    .eq('id', data.userId)
    .single()
  
  if (!profile) return
  
  // TODO: Send email notification (using service like SendGrid, Resend, etc.)
  // await sendEmail({
  //   to: profile.email,
  //   subject: data.title,
  //   html: data.message,
  // })
  
  // TODO: Send SMS notification for urgent orders (using Twilio, etc.)
  // if (data.type === 'order') {
  //   await sendSMS({
  //     to: profile.phone,
  //     message: `${data.title}: ${data.message}`,
  //   })
  // }
}

// Send notification when order is placed
export const notifyMerchantNewOrder = async (orderId: string) => {
  const supabase = await createServerSupabaseClient()
  
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      merchants!inner(user_id, brand_name),
      profiles!customer_id(full_name)
    `)
    .eq('id', orderId)
    .single()
  
  if (!order) return
  
  await sendNotification({
    userId: order.merchants.user_id,
    title: `🛒 طلب جديد #${order.order_number}`,
    message: `لديك طلب ${order.delivery_method === 'pickup' ? 'استلام' : 'توصيل'} جديد من ${order.profiles.full_name || 'عميل'} بقيمة ${order.total_amount} EGP`,
    type: 'order',
    link: `/dashboard/orders/${order.id}`,
  })
}

// Real-time notifications using Supabase Realtime
export const subscribeToNotifications = (userId: string, callback: (notification: any) => void) => {
  const supabase = createClient()
  
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()
  
  return channel
}
```

**File**: `src/app/api/orders/notify-merchant/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { notifyMerchantNewOrder } from '@/lib/notifications'

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json()
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }
    
    await notifyMerchantNewOrder(orderId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
```

---

## Phase 5: Core Features Development

### Step 5.1: Authentication Pages

**File**: `src/app/(auth)/login/page.tsx`
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Check user type and redirect accordingly
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', data.user.id)
      .single()

    if (profile?.user_type === 'merchant') {
      router.push('/dashboard')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          تسجيل الدخول
        </h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/register" className="text-purple-600 hover:underline">
            ليس لديك حساب؟ سجل الآن
          </Link>
        </div>
      </div>
    </div>
  )
}
```

**File**: `src/app/(auth)/register/page.tsx`
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    userType: 'customer' as 'customer' | 'merchant',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Create profile
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone,
          user_type: formData.userType,
        })

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      // If merchant, create merchant profile
      if (formData.userType === 'merchant') {
        router.push('/dashboard/setup')
      } else {
        router.push('/')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          إنشاء حساب جديد
        </h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع الحساب
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, userType: 'customer' })}
                className={`p-4 rounded-lg border-2 transition ${
                  formData.userType === 'customer'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🛍️</div>
                  <div className="font-semibold">عميل</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, userType: 'merchant' })}
                className={`p-4 rounded-lg border-2 transition ${
                  formData.userType === 'merchant'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🏪</div>
                  <div className="font-semibold">تاجر</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الاسم الكامل
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رقم الهاتف
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-purple-600 hover:underline">
            لديك حساب بالفعل؟ سجل دخولك
          </Link>
        </div>
      </div>
    </div>
  )
}
```

### Step 5.2: Customer Homepage

**File**: `src/app/(customer)/page.tsx`
```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()

  // Get subscription tiers
  const { data: tiers } = await supabase
    .from('subscription_tiers')
    .select('*')
    .order('priority_level', { ascending: true })

  // Get merchants grouped by tier (10 per tier)
  const merchantsByTier = await Promise.all(
    (tiers || []).map(async (tier) => {
      const { data: merchants } = await supabase
        .from('merchants')
        .select('*')
        .eq('subscription_tier_id', tier.id)
        .eq('approval_status', 'approved')
        .eq('subscription_status', 'active')
        .eq('is_banned', false)
        .order('display_order', { ascending: true })
        .order('total_sales', { ascending: false })
        .limit(10)

      return {
        tier,
        merchants: merchants || []
      }
    })
  )

  // Get categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">مرحباً بك في EMall</h1>
          <p className="text-xl mb-8">اكتشف أفضل العلامات التجارية المحلية</p>
          <div className="flex justify-center gap-4 flex-wrap">
            {categories?.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.name}`}
                className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
              >
                {category.name_ar}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Merchants by Tier */}
      {merchantsByTier.map(({ tier, merchants }) => (
        merchants.length > 0 && (
          <section key={tier.id} className="container mx-auto px-4 py-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold">
                  {tier.priority_level === 1 && '⭐ التجار المميزون - '}
                  {tier.priority_level === 2 && '💎 التجار المتميزون - '}
                  {tier.priority_level === 3 && '🏪 تجار EMall - '}
                  {tier.name === 'premium' ? 'باقة بريميوم' : tier.name === 'standard' ? 'باقة ستاندرد' : 'باقة بيسك'}
                </h2>
                <p className="text-gray-600 mt-2">أفضل 10 تجار في هذه الفئة</p>
              </div>
              <Link
                href={`/merchants?tier=${tier.id}`}
                className="text-purple-600 hover:underline font-semibold"
              >
                عرض الكل →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {merchants.map((merchant) => (
                <Link
                  key={merchant.id}
                  href={`/merchant/${merchant.id}`}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition group"
                >
                  <div className="relative h-48 bg-gray-200">
                    {merchant.cover_image_url ? (
                      <Image
                        src={merchant.cover_image_url}
                        alt={merchant.brand_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                    {tier.priority_level === 1 && (
                      <div className="absolute top-4 right-4 bg-yellow-400 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        ⭐ مميز
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      {merchant.logo_url && (
                        <Image
                          src={merchant.logo_url}
                          alt={merchant.brand_name}
                          width={50}
                          height={50}
                          className="rounded-full"
                        />
                      )}
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-purple-600 transition">
                          {merchant.brand_name}
                        </h3>
                        <p className="text-sm text-gray-500">{merchant.city}</p>
                      </div>
                    </div>
                    {merchant.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {merchant.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span>{merchant.rating.toFixed(1)}</span>
                      </div>
                      <div className="text-gray-500">
                        {merchant.total_sales} مبيعات
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      ))}
    </div>
  )
}
```

### Step 5.3: Merchant Dashboard

**File**: `src/app/(merchant)/dashboard/page.tsx`
```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get merchant data
  const { data: merchant } = await supabase
    .from('merchants')
    .select(`
      *,
      subscription_tiers(*)
    `)
    .eq('user_id', user.id)
    .single()

  if (!merchant) {
    redirect('/dashboard/setup')
  }

  // Get statistics
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('merchant_id', merchant.id)

  const { data: orders } = await supabase
    .from('orders')
    .select('total_amount, status')
    .eq('merchant_id', merchant.id)

  const totalRevenue = orders?.reduce((sum, order) => 
    order.status === 'delivered' ? sum + parseFloat(order.total_amount as any) : sum, 0
  ) || 0

  const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                🏪
              </div>
              <div>
                <h1 className="text-2xl font-bold">{merchant.brand_name}</h1>
                <p className="text-gray-600">{merchant.address}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">باقة الاشتراك</div>
              <div className="text-lg font-bold text-purple-600">
                {merchant.subscription_tiers?.name}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl mb-2">📦</div>
            <div className="text-2xl font-bold">{productsCount}</div>
            <div className="text-gray-600">منتج</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl mb-2">🛒</div>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <div className="text-gray-600">طلب جديد</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} EGP</div>
            <div className="text-gray-600">إجمالي المبيعات</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold">{merchant.rating.toFixed(1)}</div>
            <div className="text-gray-600">التقييم</div>
          </div>
        </div>

        {/* Pickup Rewards Stats */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">🎁 نظام المكافآت النشط</h2>
              <p className="opacity-90">اجمع المزيد من طلبات الاستلام للحصول على مزايا أفضل</p>
            </div>
            <Link 
              href="/dashboard/rewards"
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              عرض التفاصيل →
            </Link>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{merchant.pickup_orders_count}</div>
              <div className="text-sm opacity-90">طلب استلام مكتمل</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{merchant.pickup_rewards_points}</div>
              <div className="text-sm opacity-90">نقطة مكافآت</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{merchant.discount_percentage}%</div>
              <div className="text-sm opacity-90">خصم على الاشتراك</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/dashboard/products/new"
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg p-8 hover:opacity-90 transition text-center"
          >
            <div className="text-4xl mb-4">➕</div>
            <div className="text-xl font-bold">إضافة منتج جديد</div>
          </Link>
          <Link
            href="/dashboard/orders"
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition text-center"
          >
            <div className="text-4xl mb-4">📋</div>
            <div className="text-xl font-bold">إدارة الطلبات</div>
          </Link>
          <Link
            href="/dashboard/settings"
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition text-center"
          >
            <div className="text-4xl mb-4">⚙️</div>
            <div className="text-xl font-bold">الإعدادات</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
```

---

## Phase 6: Additional Essential Pages

### Admin Dashboard

**File**: `src/app/(admin)/admin/page.tsx`
- Full statistics dashboard
- Pending merchant applications count
- Active merchants count  
- Total users and products
- Most visited pages in last 7 days
- Quick action buttons

### Pending Merchants Approval Page

**File**: `src/app/(admin)/admin/merchants/pending/page.tsx`
- List all pending merchant applications
- Display merchant details (brand name, address, contact info)
- Select subscription tier dropdown
- Approve button → Set merchant to active with selected tier
- Reject button → Mark as rejected with reason
- Auto-notify merchant on approval/rejection

### Shopping Cart with Merchant Grouping

**File**: `src/app/(customer)/cart/page.tsx`
- Cart items grouped by merchant
- Each merchant section shows:
  - Merchant logo and name
  - List of products from that merchant
  - Subtotal for that merchant
- Delivery method selection per merchant:
  - **Delivery**: Proceed to checkout with payment
  - **Pickup**: Generate QR code valid for 10 minutes
- QR code generation creates order with `pickup_code`
- Merchant can scan code to verify and complete order

### QR Code Verification (Merchant Side)

**File**: `src/app/(merchant)/dashboard/verify-pickup/page.tsx`
- QR scanner or manual code input
- Verify pickup code validity (not expired, not used)
- Show order details when code is valid
- Mark order as complete and mark code as used
- Update inventory accordingly
- **Automatically award pickup points to merchant**

### Merchant Rewards Dashboard

**File**: `src/app/(merchant)/dashboard/rewards/page.tsx`
```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RewardsDashboardPage() {
  const [merchant, setMerchant] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [recentRewards, setRecentRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadRewardsData()
  }, [])

  const loadRewardsData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get merchant data
    const { data: merchantData } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get milestones
    const { data: milestonesData } = await supabase
      .from('reward_milestones')
      .select('*')
      .eq('is_active', true)
      .order('pickups_required', { ascending: true })

    // Get recent rewards
    const { data: rewardsData } = await supabase
      .from('pickup_rewards')
      .select('*')
      .eq('merchant_id', merchantData?.id)
      .order('created_at', { ascending: false })
      .limit(10)

    setMerchant(merchantData)
    setMilestones(milestonesData || [])
    setRecentRewards(rewardsData || [])
    setLoading(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>
  }

  const nextMilestone = milestones.find(m => m.pickups_required > merchant.pickup_orders_count)
  const progress = nextMilestone 
    ? (merchant.pickup_orders_count / nextMilestone.pickups_required) * 100
    : 100

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">🎁 نظام المكافآت</h1>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg p-6">
            <div className="text-sm opacity-90 mb-2">إجمالي طلبات الاستلام</div>
            <div className="text-4xl font-bold">{merchant.pickup_orders_count}</div>
            <div className="text-sm opacity-90 mt-2">طلب مكتمل</div>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl shadow-lg p-6">
            <div className="text-sm opacity-90 mb-2">نقاط المكافآت</div>
            <div className="text-4xl font-bold">{merchant.pickup_rewards_points}</div>
            <div className="text-sm opacity-90 mt-2">نقطة</div>
          </div>

          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl shadow-lg p-6">
            <div className="text-sm opacity-90 mb-2">الخصم الحالي</div>
            <div className="text-4xl font-bold">{merchant.discount_percentage}%</div>
            <div className="text-sm opacity-90 mt-2">على الاشتراك</div>
          </div>
        </div>

        {/* Next Milestone Progress */}
        {nextMilestone && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">الهدف القادم</h2>
                <p className="text-gray-600">{nextMilestone.description_ar}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">
                  {merchant.pickup_orders_count} / {nextMilestone.pickups_required}
                </div>
                <div className="text-sm text-gray-500">طلب</div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            
            <div className="text-center mt-2 text-sm text-gray-600">
              باقي {nextMilestone.pickups_required - merchant.pickup_orders_count} طلب للوصول للهدف
            </div>
          </div>
        )}

        {/* All Milestones */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">جميع الأهداف والمكافآت</h2>
          <div className="space-y-4">
            {milestones.map((milestone) => {
              const isAchieved = merchant.pickup_orders_count >= milestone.pickups_required
              const isCurrent = nextMilestone?.id === milestone.id

              return (
                <div 
                  key={milestone.id}
                  className={`p-4 rounded-lg border-2 transition ${
                    isAchieved 
                      ? 'border-green-500 bg-green-50' 
                      : isCurrent
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`text-3xl ${
                        isAchieved ? '✅' : isCurrent ? '🎯' : '🔒'
                      }`}>
                        {isAchieved ? '✅' : isCurrent ? '🎯' : '🔒'}
                      </div>
                      <div>
                        <div className="font-bold text-lg">
                          {milestone.pickups_required} طلب استلام
                        </div>
                        <div className="text-gray-600">
                          {milestone.description_ar}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {milestone.reward_type === 'discount' && (
                        <div className="text-2xl font-bold text-green-600">
                          {milestone.reward_value}%
                        </div>
                      )}
                      {isAchieved && (
                        <div className="text-sm text-green-600 font-semibold">
                          تم الإنجاز ✓
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Rewards History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">آخر المكافآت المكتسبة</h2>
          {recentRewards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد مكافآت بعد. ابدأ باستقبال طلبات الاستلام!
            </div>
          ) : (
            <div className="space-y-3">
              {recentRewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🎁</div>
                    <div>
                      <div className="font-semibold">{reward.description}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(reward.created_at).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-purple-600">
                    +{reward.points_earned} نقطة
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">
            💪 كلما زاد عدد طلبات الاستلام، كلما حصلت على مزايا أكثر!
          </h3>
          <p className="text-lg opacity-90 mb-6">
            شجع عملاءك على الاستلام من المحل واحصل على خصومات تصل إلى 30% على اشتراكك
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl mb-2">🎯</div>
              <div className="font-semibold">خصومات أكبر</div>
            </div>
            <div>
              <div className="text-3xl mb-2">⭐</div>
              <div className="font-semibold">ظهور أفضل</div>
            </div>
            <div>
              <div className="text-3xl mb-2">🏆</div>
              <div className="font-semibold">شارات مميزة</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Merchant Categories Management

**File**: `src/app/(merchant)/dashboard/categories/page.tsx`
- Create custom categories for merchant's store
- Create subcategories (parent_category_id)
- Drag-and-drop ordering (display_order)
- Toggle active/inactive per category
- Assign products to categories

---

## Phase 7: Payment Webhooks

### Step 7.1: Stripe Webhook

**File**: `src/app/api/webhooks/stripe/route.ts`
```typescript
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object
      
      // Update order status
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
        })
        .eq('payment_intent_id', paymentIntent.id)
      
      break

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object
      
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
        })
        .eq('payment_intent_id', failedPayment.id)
      
      break

    case 'customer.subscription.updated':
    case 'customer.subscription.created':
      const subscription = event.data.object
      
      // Update merchant subscription
      const merchantId = subscription.metadata.merchant_id
      
      await supabase
        .from('merchants')
        .update({
          subscription_status: subscription.status === 'active' ? 'active' : 'inactive',
          subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
          subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('id', merchantId)
      
      break

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object
      
      await supabase
        .from('merchants')
        .update({
          subscription_status: 'expired',
        })
        .eq('id', deletedSub.metadata.merchant_id)
      
      break
  }

  return NextResponse.json({ received: true })
}
```

### Step 6.2: Paymob Webhook

**File**: `src/app/api/webhooks/paymob/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.json()
  
  const supabase = await createServerSupabaseClient()

  // Paymob sends success/failure in different formats
  const success = body.obj?.success === 'true' || body.obj?.success === true
  const orderId = body.obj?.order?.merchant_order_id
  const transactionId = body.obj?.id

  if (!orderId) {
    return NextResponse.json({ error: 'No order ID' }, { status: 400 })
  }

  if (success) {
    // Update order to paid
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        payment_intent_id: transactionId?.toString(),
      })
      .eq('order_number', orderId)
  } else {
    // Update order to failed
    await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
      })
      .eq('order_number', orderId)
  }

  return NextResponse.json({ received: true })
}
```

---

## Phase 8: Testing & Deployment Checklist

### Testing Checklist:
- [ ] User registration (customer & merchant)
- [ ] User login/logout (Email & Google OAuth)
- [ ] Merchant profile setup
- [ ] Merchant application stays pending until admin approval
- [ ] Admin can approve/reject merchants
- [ ] Admin can assign subscription tiers
- [ ] Admin can ban merchants
- [ ] Admin can control merchant display order
- [ ] Merchant can create custom categories
- [ ] Merchant can create subcategories
- [ ] Merchant can reorder categories (display_order)
- [ ] Merchant can toggle category active/inactive
- [ ] Product CRUD operations
- [ ] Inventory sync when selling offline
- [ ] Order placement (delivery)
- [ ] Order placement (pickup with QR code)
- [ ] QR code generation (10 min expiry)
- [ ] QR code verification by merchant
- [ ] **Pickup rewards automatically awarded on verification**
- [ ] **Milestone achievements trigger notifications**
- [ ] **Discount percentage updates automatically**
- [ ] **Display order improves with milestones**
- [ ] **Merchant notification on new order (in-app)**
- [ ] **Real-time notifications in merchant dashboard**
- [ ] **Rewards dashboard shows correct progress**
- [ ] Cart grouping by merchant
- [ ] Stripe payment flow
- [ ] Paymob payment flow
- [ ] Subscription management
- [ ] **Subscription discount applied from rewards**
- [ ] Homepage displays 10 merchants per tier
- [ ] Merchant prioritization by tier and sales
- [ ] Admin advertising space management
- [ ] Admin analytics (page visits)
- [ ] Search and filtering
- [ ] Responsive design on mobile
- [ ] Image uploads to Supabase Storage
- [ ] Google OAuth login
- [ ] Notifications system
- [ ] Email notifications (optional)
- [ ] SMS notifications (optional)

### Deployment Steps:
1. **Supabase Setup:**
   - Create project on Supabase
   - Run migrations
   - Configure Storage buckets for images (merchants/logos, merchants/covers, products/)
   - Set up Row Level Security policies
   - **Enable Google OAuth**: 
     - Go to Authentication → Providers → Google
     - Add Google Client ID and Secret
     - Add authorized redirect URLs
   - Get API keys

2. **Google OAuth Setup:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing
   - Enable Google+ API
   - Go to Credentials → Create OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for development)
   - Copy Client ID and Secret to Supabase

3. **Stripe Setup:**
   - Create Stripe account
   - Get API keys
   - Create webhook endpoint
   - Create subscription products/prices

4. **Paymob Setup:**
   - Create Paymob account
   - Get API credentials
   - Set up iframe integration
   - Configure webhook

5. **Vercel Deployment:**
   ```bash
   vercel
   ```
   - Add environment variables
   - Configure custom domain
   - Set up webhook URLs

6. **Post-Deployment:**
   - Test all payment flows
   - Test Google OAuth login
   - Verify webhooks are working
   - Test QR code generation and verification
   - Test admin approval flow
   - Monitor error logs
   - Set up backup strategy
   - Create first admin user manually in database

---

## Development Priority Order

### Phase 1 (Week 1-2): Foundation
1. ✅ Project setup with Next.js 14+
2. ✅ Database schema with all tables
3. ✅ Authentication system (Email + Google OAuth)
4. ✅ Basic routing structure
5. ✅ Supabase configuration

### Phase 2 (Week 3-4): Admin & Merchant Approval
1. Admin dashboard creation
2. Merchant registration flow (stays pending)
3. Admin approval/rejection system
4. Subscription tier assignment
5. Merchant dashboard (locked until approved)
6. Admin merchant management (ban, display order)

### Phase 3 (Week 5-6): Merchant Features
1. Merchant custom category creation
2. Subcategory support
3. Category ordering and active/inactive toggle
4. Product management (CRUD)
5. Image upload system
6. Inventory management

### Phase 4 (Week 7-8): Customer Features
1. Homepage with 10 merchants per tier
2. Merchant filtering system
3. Category pages
4. Merchant detail pages
5. Product detail pages
6. Shopping cart with merchant grouping

### Phase 5 (Week 9-10): Orders & Pickup System
1. Checkout flow for delivery
2. QR code generation for pickup
3. QR code verification (merchant side)
4. Order management
5. Order status updates
6. Inventory sync on orders

### Phase 6 (Week 11-12): Payments
1. Stripe integration
2. Paymob integration
3. Webhook handlers
4. Subscription billing
5. Payment confirmation flows

### Phase 7 (Week 13-14): Admin Analytics & Ads
1. Page visit tracking
2. Admin analytics dashboard
3. Most visited pages
4. Advertising space management
5. Ad impressions and click tracking

### Phase 8 (Week 15-16): Polish & Deploy
1. Responsive design refinement
2. Error handling
3. Loading states
4. SEO optimization
5. Performance optimization
6. Comprehensive testing
7. Deployment to Vercel
8. Production monitoring setup

---

## Important Notes for Claude Code

1. **Always use TypeScript** for type safety
2. **Implement proper error handling** for all API calls
3. **Use React Server Components** where possible for better performance
4. **Implement loading states** for all async operations
5. **Add proper validation** using Zod for all forms
6. **Use Tailwind CSS** for styling consistency
7. **Implement proper SEO** with metadata
8. **Add analytics tracking** for business insights
9. **Implement rate limiting** for API routes
10. **Use environment variables** for all sensitive data

## EMall-Specific Implementation Notes

### Merchant Approval Flow
- All new merchant registrations must start with `approval_status = 'pending'`
- Merchant dashboard should be accessible but show "pending approval" message
- Admin must manually approve and assign tier before merchant can go live
- Send email notification on approval/rejection

### QR Code System
- Use crypto-random strings for pickup codes (not predictable)
- Codes expire after exactly 10 minutes
- Store expiration timestamp in database
- Implement cleanup job to delete expired codes
- QR codes should be large and clear for easy scanning
- Consider using libraries like `qrcode` or `qrcode.react`

### Cart Grouping Logic
- ALWAYS group cart items by merchant_id before checkout
- Each merchant group should be a separate order
- Users can choose different delivery methods per merchant
- Calculate shipping separately per merchant

### Display Priority Algorithm
```
Sort merchants by:
1. subscription_tier.priority_level (ASC) - 1 is highest
2. display_order (ASC) - admin can manually set
3. total_sales (DESC) - most sales first
4. created_at (DESC) - newer merchants first
```

### Admin Controls
- Admin user_type must be set manually in database (security)
- Admin can override display_order to feature specific merchants
- Admin can ban merchants (sets is_banned = true)
- Banned merchants disappear from site immediately

### Category Management
- Main categories are fixed: mens, womens, kids
- Merchants create their own sub-categories within their store
- Merchant categories support unlimited nesting (parent_category_id)
- display_order allows drag-and-drop ordering
- Inactive categories don't show but products remain

### Analytics Tracking
- Track page visits on every page load
- Store: page_url, user_id (if logged in), session_id, timestamp
- Use middleware to automatically track
- Admin dashboard shows top 10 pages
- Consider using Vercel Analytics + custom tracking

### Pickup Rewards System 🎁
**How it works:**
1. Customer places pickup order → QR code generated
2. Customer shows code to merchant → Merchant scans/verifies
3. On verification, merchant automatically gets:
   - +1 reward point
   - pickup_orders_count incremented
   - Database trigger checks for milestone achievement

**Reward Milestones:**
```
10 pickups  → 5% discount
25 pickups  → Visibility boost (display_order improved)
50 pickups  → 10% discount
100 pickups → Featured badge + 15% discount
200 pickups → 20% discount
500 pickups → 30% discount + VIP status
```

**Benefits for Merchants:**
- Automatic discount on subscription (saved in `discount_percentage`)
- Better visibility (improved `display_order`)
- Featured badges
- Notifications when reaching milestones

**Implementation:**
- Database trigger `process_pickup_reward()` runs automatically
- When `pickup_code_used` changes from FALSE to TRUE
- Applies rewards immediately
- Sends notification to merchant
- No manual intervention needed

### Order Notifications 📧
**When order is placed:**
1. Database trigger `notify_merchant_new_order()` fires automatically
2. Creates in-app notification for merchant
3. Notification includes:
   - Order number
   - Customer name
   - Total amount
   - Delivery method (pickup/delivery)
   - Link to order details
4. Optional: Send email/SMS (configure in code)

**Real-time notifications:**
- Use Supabase Realtime subscriptions
- Merchant dashboard listens for new notifications
- Toast/popup appears instantly when new order arrives
- Sound notification (optional)

## Security Considerations
- Never expose service role keys on client
- Implement CSRF protection
- Validate all user inputs
- Use parameterized queries (Supabase handles this)
- Implement rate limiting on sensitive endpoints
- Use HTTPS only
- Sanitize file uploads
- Implement proper CORS policies

## Performance Optimization
- Use Next.js Image component for images
- Implement lazy loading for lists
- Use Server Components for static content
- Implement caching strategies
- Optimize images before upload
- Use CDN for static assets
- Implement pagination for large lists
- Use database indexes appropriately

---

## Support & Resources
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- Paymob Docs: https://docs.paymob.com/
- Tailwind CSS: https://tailwindcss.com/docs

---

**This roadmap provides a complete blueprint for building EMall. Follow each phase sequentially, test thoroughly, and deploy with confidence!**

---

## Quick Start Commands Summary

```bash
# Initialize project
npx create-next-app@latest emall --typescript --tailwind --app --src-dir
cd emall

# Install all dependencies
npm install @supabase/supabase-js @supabase/ssr stripe @stripe/stripe-js axios zod react-hook-form @hookform/resolvers lucide-react date-fns sonner @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select class-variance-authority clsx tailwind-merge qrcode react-qr-reader
npm install @types/qrcode -D

# Set up environment variables
cp .env.example .env.local
# Fill in all the values

# Run development server
npm run dev

# Deploy to Vercel
vercel
```

## Key Features Recap

✅ **Merchant Management**
- Pending approval flow
- Admin approval with tier assignment
- Custom categories and subcategories
- Full product management
- **Pickup rewards system with automatic discounts**
- **Real-time order notifications**

✅ **Customer Experience**
- 10 merchants per tier display
- Merchant filtering
- Cart grouping by merchant
- Pickup QR codes (10 min expiry)

✅ **Admin Dashboard**
- Approve/reject merchants
- Assign tiers and display order
- Ban merchants
- View analytics and page visits
- Manage advertising spaces
- **Configure reward milestones**

✅ **Payment Integration**
- Stripe (international)
- Paymob (Egypt)
- Cash on delivery
- Pay on pickup

✅ **Authentication**
- Email/password
- Google OAuth
- Role-based access (customer/merchant/admin)

✅ **Gamification & Rewards** 🎮
- Automatic rewards on pickup verification
- Progressive discount tiers (5% → 30%)
- Visibility boosts
- Featured badges
- Milestone notifications
- Real-time progress tracking

✅ **Notifications System** 🔔
- In-app notifications
- Real-time updates via Supabase
- Order notifications to merchants
- Milestone achievement alerts
- Optional email/SMS integration

## Architecture Highlights

```
Frontend: Next.js 14 (App Router)
Backend: Supabase (PostgreSQL + Auth + Storage)
Payments: Stripe + Paymob
Hosting: Vercel
```

## Database Summary
- 15+ tables with proper relationships
- Row Level Security enabled
- Comprehensive indexes
- Audit trails (created_at, updated_at)

## Timeline
**16 weeks** for complete development from scratch to production

**Good luck building EMall! 🚀**

---

## 🎁 Pickup Rewards System Flow

```
Customer Journey:
1. Add items to cart
2. Choose "Pickup from store" 
3. Generate QR code (valid 10 min)
4. Go to merchant's store
5. Show QR code to merchant

Merchant Journey:
1. Receive in-app notification: "New pickup order!"
2. Customer arrives with QR code
3. Scan/verify code in dashboard
4. Hand over products
5. ✨ AUTOMATICALLY RECEIVE REWARDS ✨

Automatic Rewards Calculation:
┌─────────────────────────────────────────┐
│  QR Code Verified                       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Database Trigger Fires                 │
│  - Add +1 reward point                  │
│  - Increment pickup_orders_count        │
│  - Check milestone achievements         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Milestone Reached?                     │
└────┬─────────────────────────┬──────────┘
     │ YES                     │ NO
     ▼                         ▼
┌────────────────────┐    ┌──────────────┐
│ Apply Rewards:     │    │ Save point   │
│ • Update discount% │    │ Continue     │
│ • Boost visibility │    └──────────────┘
│ • Add badge        │
│ • Send notification│
└────────────────────┘

Example Progression:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pickups: 0
Discount: 0%
Status: New Merchant
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ↓ (10 pickups)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pickups: 10 🎯
Discount: 5%
Status: Active Merchant
Notification: "🎉 مبروك! حصلت على خصم 5%"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ↓ (50 pickups)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pickups: 50 🎯
Discount: 10%
Status: Silver Merchant
Display improved by 10 positions
Notification: "🎉 رائع! خصم 10% + ظهور أفضل"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ↓ (100 pickups)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pickups: 100 🎯
Discount: 15%
Status: Gold Merchant ⭐
Featured Badge Added
Notification: "🏆 أنت الآن تاجر ذهبي!"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ↓ (200+ pickups)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pickups: 200+ 🎯
Discount: 20-30%
Status: Platinum/VIP Merchant 👑
Maximum benefits unlocked
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Why This System Works:

1. **Encourages Pickup Orders** 📱
   - Merchants save on delivery costs
   - Better profit margins
   - Direct customer interaction

2. **Reduces Platform Costs** 💰
   - Less delivery infrastructure needed
   - Lower operational overhead
   - Sustainable business model

3. **Builds Merchant Loyalty** 🤝
   - Clear progression path
   - Tangible rewards
   - Long-term engagement

4. **Gamification Effect** 🎮
   - Visible progress bars
   - Achievement notifications
   - Status upgrades
   - Competition between merchants

5. **Automatic & Fair** ⚖️
   - No manual intervention
   - Transparent rules
   - Real-time updates
   - Can't be cheated (QR codes expire)


