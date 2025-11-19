-- ============================================
-- EMall - Row Level Security Policies
-- ============================================
-- Based on the actual database schema
-- Run this script in Supabase SQL Editor
-- This will update/fix RLS policies

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

-- Drop profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;

-- Drop merchants policies
DROP POLICY IF EXISTS "Approved active merchants are viewable by everyone" ON merchants;
DROP POLICY IF EXISTS "Anyone can view approved merchants" ON merchants;
DROP POLICY IF EXISTS "Merchants can view own data" ON merchants;
DROP POLICY IF EXISTS "Merchants can update own data" ON merchants;
DROP POLICY IF EXISTS "Users can create merchant profile" ON merchants;
DROP POLICY IF EXISTS "Admins can view all merchants" ON merchants;
DROP POLICY IF EXISTS "Admins can update merchants" ON merchants;
DROP POLICY IF EXISTS "Admins can manage all merchants" ON merchants;

-- Drop products policies
DROP POLICY IF EXISTS "Active products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Merchants can view own products" ON products;
DROP POLICY IF EXISTS "Merchants can create products" ON products;
DROP POLICY IF EXISTS "Merchants can update own products" ON products;
DROP POLICY IF EXISTS "Merchants can delete own products" ON products;
DROP POLICY IF EXISTS "Merchants can manage own products" ON products;

-- Drop orders policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
DROP POLICY IF EXISTS "Merchants can view own orders" ON orders;
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Merchants can update order status" ON orders;

-- Drop order_items policies
DROP POLICY IF EXISTS "Order items viewable through orders" ON order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Allow order items creation" ON order_items;

-- Drop notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Drop merchant_categories policies
DROP POLICY IF EXISTS "Anyone can view active categories" ON merchant_categories;
DROP POLICY IF EXISTS "Merchants can view own categories" ON merchant_categories;
DROP POLICY IF EXISTS "Merchants can create categories" ON merchant_categories;
DROP POLICY IF EXISTS "Merchants can update own categories" ON merchant_categories;
DROP POLICY IF EXISTS "Merchants can delete own categories" ON merchant_categories;

-- Drop pickup_rewards policies
DROP POLICY IF EXISTS "Customers can view own rewards" ON pickup_rewards;
DROP POLICY IF EXISTS "Merchants can view store rewards" ON pickup_rewards;

-- Drop subscription_tiers policies
DROP POLICY IF EXISTS "Anyone can view subscription tiers" ON subscription_tiers;

-- Drop reviews policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews for their orders" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;

-- ============================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: CREATE NEW POLICIES
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- ============================================

-- Everyone can view all profiles (public info)
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile (for registration)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. MERCHANTS TABLE
-- ============================================

-- Everyone can view approved, active, non-banned merchants
CREATE POLICY "Approved active merchants are viewable by everyone"
ON merchants FOR SELECT
USING (
  approval_status = 'approved'
  AND subscription_status = 'active'
  AND is_banned = FALSE
);

-- Merchants can view their own data (even if not approved)
CREATE POLICY "Merchants can view own data"
ON merchants FOR SELECT
USING (auth.uid() = user_id);

-- Merchants can update their own data
CREATE POLICY "Merchants can update own data"
ON merchants FOR UPDATE
USING (auth.uid() = user_id);

-- Merchants can insert their profile
CREATE POLICY "Merchants can insert own profile"
ON merchants FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can do everything with merchants
CREATE POLICY "Admins can manage all merchants"
ON merchants FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);

-- ============================================
-- 3. PRODUCTS TABLE
-- ============================================

-- Everyone can view active products from approved merchants
CREATE POLICY "Active products are viewable by everyone"
ON products FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = products.merchant_id
    AND merchants.approval_status = 'approved'
    AND merchants.subscription_status = 'active'
    AND merchants.is_banned = FALSE
  )
);

-- Merchants can view their own products (even inactive)
CREATE POLICY "Merchants can view own products"
ON products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = products.merchant_id
    AND merchants.user_id = auth.uid()
  )
);

-- Merchants can manage their own products (INSERT, UPDATE, DELETE)
CREATE POLICY "Merchants can manage own products"
ON products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = products.merchant_id
    AND merchants.user_id = auth.uid()
  )
);

-- ============================================
-- 4. ORDERS TABLE
-- ============================================

-- Customers can view their own orders
-- Merchants can view orders for their store
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (
  auth.uid() = customer_id
  OR EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = orders.merchant_id
    AND merchants.user_id = auth.uid()
  )
);

-- Customers can create orders
CREATE POLICY "Customers can create orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Customers can update their own orders (cancel, etc.)
CREATE POLICY "Customers can update own orders"
ON orders FOR UPDATE
USING (auth.uid() = customer_id);

-- Merchants can update orders for their store
CREATE POLICY "Merchants can update store orders"
ON orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = orders.merchant_id
    AND merchants.user_id = auth.uid()
  )
);

-- ============================================
-- 5. ORDER_ITEMS TABLE
-- ============================================

-- Users can view order items if they can view the order
CREATE POLICY "Order items viewable through orders"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (
      orders.customer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM merchants
        WHERE merchants.id = orders.merchant_id
        AND merchants.user_id = auth.uid()
      )
    )
  )
);

-- Customers can create order items for their orders
CREATE POLICY "Customers can create order items"
ON order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.customer_id = auth.uid()
  )
);

-- ============================================
-- 6. NOTIFICATIONS TABLE
-- ============================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (auth.uid() = user_id);

-- Service role can create notifications (handled via backend with service_role key)

-- ============================================
-- 7. MERCHANT_CATEGORIES TABLE
-- ============================================

-- Everyone can view active merchant categories
CREATE POLICY "Anyone can view active merchant categories"
ON merchant_categories FOR SELECT
USING (is_active = true);

-- Merchants can view their own categories (even inactive)
CREATE POLICY "Merchants can view own categories"
ON merchant_categories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = merchant_categories.merchant_id
    AND merchants.user_id = auth.uid()
  )
);

-- Merchants can manage their own categories
CREATE POLICY "Merchants can manage own categories"
ON merchant_categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = merchant_categories.merchant_id
    AND merchants.user_id = auth.uid()
  )
);

-- ============================================
-- 8. PICKUP_REWARDS TABLE
-- ============================================
-- NOTE: pickup_rewards tracks merchant rewards, not customer rewards
-- Columns: merchant_id, points_earned, reward_type, description, order_id

-- Merchants can view their own pickup rewards
CREATE POLICY "Merchants can view own pickup rewards"
ON pickup_rewards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = pickup_rewards.merchant_id
    AND merchants.user_id = auth.uid()
  )
);

-- Admins can view all pickup rewards
CREATE POLICY "Admins can view all pickup rewards"
ON pickup_rewards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);

-- Service role can create pickup rewards (via trigger)

-- ============================================
-- 9. SUBSCRIPTION_TIERS TABLE
-- ============================================

-- Everyone can view subscription tiers (public pricing info)
CREATE POLICY "Anyone can view subscription tiers"
ON subscription_tiers FOR SELECT
USING (true);

-- ============================================
-- 10. REVIEWS TABLE
-- ============================================

-- Everyone can view all reviews
CREATE POLICY "Reviews are viewable by everyone"
ON reviews FOR SELECT
USING (true);

-- Users can create reviews for their own orders
CREATE POLICY "Users can create reviews for their orders"
ON reviews FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON reviews FOR UPDATE
USING (auth.uid() = customer_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
ON reviews FOR DELETE
USING (auth.uid() = customer_id);

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Verify RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'profiles',
  'merchants',
  'products',
  'orders',
  'order_items',
  'notifications',
  'merchant_categories',
  'pickup_rewards',
  'subscription_tiers',
  'reviews'
)
ORDER BY tablename;

-- ============================================
-- DONE!
-- ============================================
-- All tables are now secured with Row Level Security
-- Policies are based on the actual database schema:
--
-- ✅ profiles: Everyone can view, users can update own
-- ✅ merchants: Public sees approved/active, merchants manage own, admins manage all
-- ✅ products: Public sees active products, merchants manage own
-- ✅ orders: Customers and merchants see their own orders
-- ✅ order_items: Viewable through orders
-- ✅ notifications: Users see and manage their own
-- ✅ merchant_categories: Public sees active, merchants manage own
-- ✅ pickup_rewards: Merchants see their own rewards (merchant_id based)
-- ✅ subscription_tiers: Public can view all
-- ✅ reviews: Public can view, users can create/update/delete own
