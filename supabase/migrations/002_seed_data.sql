-- ═══════════════════════════════════════════════════════════
-- EMALL DATABASE - SEED DATA
-- ═══════════════════════════════════════════════════════════
-- Description: Initial seed data for EMall marketplace
-- Version: 1.0.0
-- Created: 2025-11-17
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- SUBSCRIPTION TIERS
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.subscription_tiers (name, price_monthly, price_yearly, priority_level, max_products, features) VALUES
('premium', 999.00, 9990.00, 1, 1000, '{"priority_support": true, "featured_listing": true, "analytics": true, "custom_domain": true}'),
('standard', 499.00, 4990.00, 2, 500, '{"priority_support": false, "featured_listing": false, "analytics": true, "custom_domain": false}'),
('basic', 199.00, 1990.00, 3, 100, '{"priority_support": false, "featured_listing": false, "analytics": false, "custom_domain": false}');

-- ═══════════════════════════════════════════════════════════
-- PRODUCT CATEGORIES
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.categories (name, name_ar, icon) VALUES
('mens', 'رجالي', 'user'),
('womens', 'حريمي', 'user-circle'),
('kids', 'أطفال', 'baby');

-- ═══════════════════════════════════════════════════════════
-- REWARD MILESTONES
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.reward_milestones (pickups_required, reward_type, reward_value, description, description_ar) VALUES
(10, 'discount', 5.00, '5% subscription discount', 'خصم 5% على الاشتراك'),
(25, 'visibility_boost', 10.00, 'Display order boost', 'تحسين ترتيب الظهور'),
(50, 'discount', 10.00, '10% subscription discount', 'خصم 10% على الاشتراك'),
(100, 'featured_badge', 0.00, 'Featured merchant badge', 'شارة تاجر مميز'),
(100, 'discount', 15.00, '15% subscription discount', 'خصم 15% على الاشتراك'),
(200, 'discount', 20.00, '20% subscription discount', 'خصم 20% على الاشتراك'),
(500, 'discount', 30.00, '30% subscription discount + VIP status', 'خصم 30% على الاشتراك + حالة VIP');

-- ═══════════════════════════════════════════════════════════
-- END OF SEED DATA
-- ═══════════════════════════════════════════════════════════

-- Seed data inserted successfully:
-- - 3 Subscription tiers (Premium, Standard, Basic)
-- - 3 Product categories (Mens, Womens, Kids)
-- - 7 Reward milestones (10, 25, 50, 100, 100, 200, 500 pickups)
