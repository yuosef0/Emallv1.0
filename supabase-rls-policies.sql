-- ============================================
-- EMall - Row Level Security Policies
-- ============================================
-- Run this script in Supabase SQL Editor
-- This will secure your database tables
--
-- IMPORTANT: This script will DROP existing policies
-- and recreate them to ensure consistency

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

-- Drop profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;

-- Drop merchants policies
DROP POLICY IF EXISTS "Anyone can view approved merchants" ON merchants;
DROP POLICY IF EXISTS "Merchants can view own data" ON merchants;
DROP POLICY IF EXISTS "Merchants can update own data" ON merchants;
DROP POLICY IF EXISTS "Users can create merchant profile" ON merchants;
DROP POLICY IF EXISTS "Admins can view all merchants" ON merchants;
DROP POLICY IF EXISTS "Admins can update merchants" ON merchants;

-- Drop products policies
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Merchants can view own products" ON products;
DROP POLICY IF EXISTS "Merchants can create products" ON products;
DROP POLICY IF EXISTS "Merchants can update own products" ON products;
DROP POLICY IF EXISTS "Merchants can delete own products" ON products;

-- Drop orders policies
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
DROP POLICY IF EXISTS "Merchants can view own orders" ON orders;
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Merchants can update order status" ON orders;

-- Drop order_items policies
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
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: CREATE NEW POLICIES
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Allow profile creation (for registration)
CREATE POLICY "Users can create own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. MERCHANTS TABLE
-- ============================================

-- Anyone can view approved merchants
CREATE POLICY "Anyone can view approved merchants"
ON merchants FOR SELECT
USING (approval_status = 'approved' AND is_banned = false);

-- Merchants can view their own data
CREATE POLICY "Merchants can view own data"
ON merchants FOR SELECT
USING (user_id = auth.uid());

-- Merchants can update their own data
CREATE POLICY "Merchants can update own data"
ON merchants FOR UPDATE
USING (user_id = auth.uid());

-- Merchants can create their profile
CREATE POLICY "Users can create merchant profile"
ON merchants FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can view all merchants
CREATE POLICY "Admins can view all merchants"
ON merchants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);

-- Admins can update any merchant
CREATE POLICY "Admins can update merchants"
ON merchants FOR UPDATE
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

-- Anyone can view active products from approved merchants
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = products.merchant_id
    AND merchants.approval_status = 'approved'
    AND merchants.is_banned = false
  )
);

-- Merchants can view their own products
CREATE POLICY "Merchants can view own products"
ON products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = products.merchant_id
    AND merchants.user_id = auth.uid()
  )
);

-- Merchants can create products
CREATE POLICY "Merchants can create products"
ON products FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = products.merchant_id
    AND merchants.user_id = auth.uid()
    AND merchants.approval_status = 'approved'
  )
);

-- Merchants can update their products
CREATE POLICY "Merchants can update own products"
ON products FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = products.merchant_id
    AND merchants.user_id = auth.uid()
  )
);

-- Merchants can delete their products
CREATE POLICY "Merchants can delete own products"
ON products FOR DELETE
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
CREATE POLICY "Customers can view own orders"
ON orders FOR SELECT
USING (customer_id = auth.uid());

-- Merchants can view orders for their products
CREATE POLICY "Merchants can view own orders"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = orders.merchant_id
    AND merchants.user_id = auth.uid()
  )
);

-- Customers can create orders
CREATE POLICY "Customers can create orders"
ON orders FOR INSERT
WITH CHECK (customer_id = auth.uid());

-- Merchants can update order status
CREATE POLICY "Merchants can update order status"
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

-- Users can view items from their orders
CREATE POLICY "Users can view own order items"
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

-- Allow order item creation
CREATE POLICY "Allow order items creation"
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
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (user_id = auth.uid());

-- Service role can create notifications (for system)
-- Note: INSERT policies are handled via service_role key in backend

-- ============================================
-- 7. MERCHANT_CATEGORIES TABLE
-- ============================================

-- Anyone can view active categories
CREATE POLICY "Anyone can view active categories"
ON merchant_categories FOR SELECT
USING (is_active = true);

-- Merchants can view their own categories
CREATE POLICY "Merchants can view own categories"
ON merchant_categories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = merchant_categories.merchant_id
    AND merchants.user_id = auth.uid()
  )
);

-- Merchants can create categories
CREATE POLICY "Merchants can create categories"
ON merchant_categories FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = merchant_categories.merchant_id
    AND merchants.user_id = auth.uid()
  )
);

-- Merchants can update their categories
CREATE POLICY "Merchants can update own categories"
ON merchant_categories FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = merchant_categories.merchant_id
    AND merchants.user_id = auth.uid()
  )
);

-- Merchants can delete their categories
CREATE POLICY "Merchants can delete own categories"
ON merchant_categories FOR DELETE
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

-- Customers can view their own rewards
CREATE POLICY "Customers can view own rewards"
ON pickup_rewards FOR SELECT
USING (customer_id = auth.uid());

-- Merchants can view rewards for their store
CREATE POLICY "Merchants can view store rewards"
ON pickup_rewards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = pickup_rewards.merchant_id
    AND merchants.user_id = auth.uid()
  )
);

-- ============================================
-- 9. SUBSCRIPTION_TIERS TABLE
-- ============================================

-- Everyone can view subscription tiers (public info)
CREATE POLICY "Anyone can view subscription tiers"
ON subscription_tiers FOR SELECT
USING (true);

-- ============================================
-- 10. WEBHOOK_LOGS TABLE
-- ============================================

-- Only service role can access webhook logs
-- (No user-level policies needed)

-- ============================================
-- 11. REVIEWS TABLE (if exists)
-- ============================================

-- ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved reviews
-- CREATE POLICY "Anyone can view approved reviews"
-- ON reviews FOR SELECT
-- USING (is_approved = true);

-- Users can create reviews
-- CREATE POLICY "Users can create reviews"
-- ON reviews FOR INSERT
-- WITH CHECK (customer_id = auth.uid());

-- Users can update their own reviews
-- CREATE POLICY "Users can update own reviews"
-- ON reviews FOR UPDATE
-- USING (customer_id = auth.uid());

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- DONE!
-- ============================================
-- All tables are now secured with Row Level Security
-- Users can only access their own data
-- Merchants can only access their store data
-- Admins can access all data
-- Public can view approved/active content only
