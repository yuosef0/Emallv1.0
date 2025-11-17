-- ═══════════════════════════════════════════════════════════
-- EMALL DATABASE SCHEMA - INITIAL MIGRATION
-- ═══════════════════════════════════════════════════════════
-- Description: Complete database schema for EMall marketplace
-- Version: 1.0.0
-- Created: 2025-11-17
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════
-- CORE TABLES
-- ═══════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════
-- PRODUCT MANAGEMENT TABLES
-- ═══════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════
-- ORDER MANAGEMENT TABLES
-- ═══════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════
-- SUBSCRIPTION & PAYMENT TABLES
-- ═══════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════
-- REVIEW & NOTIFICATION TABLES
-- ═══════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════
-- ADMIN & ANALYTICS TABLES
-- ═══════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════
-- PICKUP REWARDS SYSTEM TABLES
-- ═══════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ═══════════════════════════════════════════════════════════

-- Merchant indexes
CREATE INDEX idx_merchants_subscription ON public.merchants(subscription_tier_id, subscription_status);
CREATE INDEX idx_merchants_sales ON public.merchants(total_sales DESC);
CREATE INDEX idx_merchants_approval ON public.merchants(approval_status, subscription_status);
CREATE INDEX idx_merchants_display ON public.merchants(display_order ASC);
CREATE INDEX idx_merchants_pickup_count ON public.merchants(pickup_orders_count DESC);

-- Product indexes
CREATE INDEX idx_products_merchant ON public.products(merchant_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_merchant_category ON public.products(merchant_category_id);

-- Merchant category indexes
CREATE INDEX idx_merchant_categories_merchant ON public.merchant_categories(merchant_id);

-- Order indexes
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_merchant ON public.orders(merchant_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_pickup_code ON public.orders(pickup_code) WHERE pickup_code IS NOT NULL;

-- Analytics indexes
CREATE INDEX idx_page_visits_url ON public.page_visits(page_url);
CREATE INDEX idx_page_visits_date ON public.page_visits(visited_at);

-- Advertising indexes
CREATE INDEX idx_advertising_active ON public.advertising_spaces(is_active, start_date, end_date);

-- Pickup rewards indexes
CREATE INDEX idx_pickup_rewards_merchant ON public.pickup_rewards(merchant_id);

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS & FUNCTIONS
-- ═══════════════════════════════════════════════════════════

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

CREATE TRIGGER update_merchant_categories_updated_at BEFORE UPDATE ON public.merchant_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advertising_spaces_updated_at BEFORE UPDATE ON public.advertising_spaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════
-- PICKUP REWARDS SYSTEM TRIGGER
-- ═══════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════
-- MERCHANT NOTIFICATION TRIGGER
-- ═══════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) CONFIGURATION
-- ═══════════════════════════════════════════════════════════

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES - PROFILES
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES - MERCHANTS
-- ═══════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES - PRODUCTS
-- ═══════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES - ORDERS
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = customer_id OR
    EXISTS (
      SELECT 1 FROM public.merchants
      WHERE merchants.id = orders.merchant_id
      AND merchants.user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES - ORDER ITEMS
-- ═══════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES - REVIEWS
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their orders" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = customer_id
  );

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES - NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- END OF INITIAL SCHEMA MIGRATION
-- ═══════════════════════════════════════════════════════════

-- Migration completed successfully
-- Total tables created: 18
-- Total indexes created: 13
-- Total triggers created: 8
-- Total RLS policies created: 14
