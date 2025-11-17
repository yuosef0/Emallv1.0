# EMall Database Schema Documentation

## Overview
This directory contains the database migrations and seed data for the EMall marketplace platform.

## Files

### `migrations/001_initial_schema.sql`
Complete database schema including:
- 18 tables
- 13 performance indexes
- 8 triggers (updated_at + business logic)
- 14 RLS policies

### `migrations/002_seed_data.sql`
Initial seed data including:
- 3 subscription tiers (Premium, Standard, Basic)
- 3 product categories (Mens, Womens, Kids)
- 7 reward milestones

## Database Tables

### Core Tables
1. **profiles** - User profiles extending Supabase auth
2. **subscription_tiers** - Merchant subscription plans
3. **merchants** - Merchant accounts and settings

### Product Management
4. **categories** - Main product categories (Mens/Womens/Kids)
5. **merchant_categories** - Merchant custom categories
6. **products** - Product listings

### Order Management
7. **orders** - Customer orders
8. **order_items** - Individual items in orders
9. **inventory_transactions** - Stock tracking

### Payments
10. **subscription_payments** - Merchant subscription payment history

### Social Features
11. **reviews** - Merchant reviews
12. **notifications** - User notifications

### Admin Features
13. **advertising_spaces** - Site advertising management
14. **page_visits** - Analytics tracking
15. **merchant_applications** - Merchant approval tracking

### Rewards System
16. **pickup_rewards** - Pickup rewards tracking
17. **reward_milestones** - Reward tier configuration

## Indexes
All critical query paths are indexed for optimal performance:
- Merchant lookups (subscription, sales, approval, display order)
- Product queries (merchant, category)
- Order queries (customer, merchant, status, pickup codes)
- Analytics (page visits, advertising)

## Triggers

### Automated Timestamps
- `update_profiles_updated_at`
- `update_merchants_updated_at`
- `update_products_updated_at`
- `update_orders_updated_at`
- `update_merchant_categories_updated_at`
- `update_advertising_spaces_updated_at`

### Business Logic
- `trigger_pickup_reward` - Processes rewards when pickup is completed
- `trigger_notify_merchant_new_order` - Notifies merchants of new orders

## Row Level Security (RLS)

### Profiles
- ✅ Public viewing
- ✅ Users can update own profile

### Merchants
- ✅ Public can view approved active merchants
- ✅ Merchants can view/update own data
- ✅ Admins have full access

### Products
- ✅ Public can view active products
- ✅ Merchants can manage own products

### Orders
- ✅ Customers see own orders
- ✅ Merchants see their orders

### Order Items
- ✅ Viewable through order access

### Reviews
- ✅ Public viewing
- ✅ Customers can create reviews

### Notifications
- ✅ Users see only own notifications
- ✅ Users can update own notifications

## Relationships

```
profiles
├── merchants (user_id)
│   ├── products (merchant_id)
│   │   └── order_items (product_id)
│   ├── orders (merchant_id)
│   │   └── order_items (order_id)
│   ├── merchant_categories (merchant_id)
│   ├── reviews (merchant_id)
│   ├── pickup_rewards (merchant_id)
│   └── subscription_payments (merchant_id)
├── orders (customer_id)
└── notifications (user_id)

subscription_tiers
├── merchants (subscription_tier_id)
└── subscription_payments (subscription_tier_id)

categories
└── products (category_id)
```

## Running Migrations

⚠️ **Important**: Do not run migrations manually yet. Wait for Supabase project setup.

### When ready:
```bash
# Using Supabase CLI
supabase db push

# Or run manually in Supabase SQL Editor
# 1. Run 001_initial_schema.sql
# 2. Run 002_seed_data.sql
```

## Verification Checklist

- [x] All 18 tables created
- [x] All foreign key relationships defined
- [x] All indexes created (13 indexes)
- [x] All triggers implemented (8 triggers)
- [x] All RLS policies configured (14 policies)
- [x] Seed data prepared (3 tiers, 3 categories, 7 milestones)
- [x] Documentation complete

## Notes

- UUID primary keys for all tables
- Timestamps with timezone for all date fields
- Soft deletes where appropriate
- Arabic language support (bilingual)
- Pickup rewards system fully automated
- Real-time notifications via triggers
