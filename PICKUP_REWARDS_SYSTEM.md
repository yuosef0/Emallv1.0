# 🎁 Pickup Rewards System - Quick Reference

## Overview
نظام مكافآت تلقائي لتشجيع التجار على قبول طلبات الاستلام من المحل. كل ما يزيد عدد طلبات الاستلام المكتملة، كل ما يحصل التاجر على مزايا أفضل.

## How It Works

### For Customers:
1. يختار منتجات من تاجر
2. في السلة يختار "استلام من المحل"
3. يتم توليد QR Code صلاحيته 10 دقائق
4. يذهب للمحل ويعرض الكود
5. التاجر يمسح الكود ويعطيه المنتجات

### For Merchants:
1. تصله رسالة فورية: "طلب استلام جديد"
2. العميل يجي المحل
3. التاجر يمسح/يدخل الكود في الداش بورد
4. الكود يتفعل والطلب يتم
5. **تلقائياً** التاجر يحصل على نقاط مكافآت

### Automatic Process (Backend):
```
When merchant verifies QR code:
├─ Database trigger fires automatically
├─ Add +1 reward point
├─ Increment pickup_orders_count
├─ Check if milestone reached
│  └─ If yes:
│     ├─ Update discount_percentage
│     ├─ Improve display_order
│     ├─ Add featured_badge (if applicable)
│     └─ Send notification to merchant
└─ Save pickup_reward record
```

## Reward Milestones

| Pickups | Reward | Details |
|---------|--------|---------|
| 10 | 5% Discount | خصم 5% على الاشتراك الشهري |
| 25 | Visibility Boost | تحسين ترتيب الظهور بـ 10 مراكز |
| 50 | 10% Discount | خصم 10% على الاشتراك |
| 100 | Featured Badge + 15% | شارة "تاجر مميز" + خصم 15% |
| 200 | 20% Discount | خصم 20% على الاشتراك |
| 500 | 30% + VIP | خصم 30% + حالة VIP |

## Database Tables

### merchants table (updated fields):
```sql
pickup_orders_count INTEGER DEFAULT 0      -- عدد طلبات الاستلام المكتملة
pickup_rewards_points INTEGER DEFAULT 0    -- نقاط المكافآت
discount_percentage DECIMAL(5,2) DEFAULT 0 -- نسبة الخصم المكتسبة
```

### pickup_rewards table:
```sql
merchant_id UUID                          -- التاجر
points_earned INTEGER                     -- النقاط المكتسبة
reward_type TEXT                          -- نوع المكافأة
description TEXT                          -- الوصف
order_id UUID                            -- الطلب المرتبط
created_at TIMESTAMP                     -- التاريخ
```

### reward_milestones table:
```sql
pickups_required INTEGER                 -- عدد الطلبات المطلوبة
reward_type TEXT                         -- نوع المكافأة (discount/boost/badge)
reward_value DECIMAL                     -- قيمة المكافأة
description TEXT                         -- الوصف بالإنجليزية
description_ar TEXT                      -- الوصف بالعربية
is_active BOOLEAN                        -- فعالة أم لا
```

## Key Functions

### Database Trigger (Automatic):
```sql
CREATE FUNCTION process_pickup_reward()
-- Runs automatically when pickup_code_used changes to TRUE
-- No manual intervention needed
```

### Notification System:
```typescript
// Automatic notification on order creation
CREATE FUNCTION notify_merchant_new_order()

// In-app notification appears immediately
// Optional: Email/SMS can be added
```

## API Endpoints

### Verify Pickup Code:
```typescript
POST /api/orders/verify-pickup
Body: {
  pickupCode: "ABC123",
  merchantId: "uuid"
}
Response: {
  success: true,
  order: {...},
  rewardEarned: true,
  newPickupCount: 15,
  nextMilestone: 25
}
```

### Get Merchant Rewards:
```typescript
GET /api/merchants/rewards/:merchantId
Response: {
  pickup_orders_count: 15,
  pickup_rewards_points: 15,
  discount_percentage: 5,
  current_milestone: "10 pickups - 5% discount",
  next_milestone: "25 pickups - Visibility boost",
  progress: 60 // percentage to next milestone
}
```

## UI Components

### Merchant Dashboard Card:
```typescript
<div className="rewards-card">
  <h3>نظام المكافآت</h3>
  <div className="stats">
    <div>{pickup_orders_count} طلب استلام</div>
    <div>{discount_percentage}% خصم</div>
  </div>
  <Link href="/dashboard/rewards">عرض التفاصيل</Link>
</div>
```

### Rewards Dashboard Page:
- Current statistics (pickups, points, discount)
- Progress bar to next milestone
- List of all milestones (achieved/pending)
- Recent rewards history
- Motivational call-to-action

### Notification Badge:
```typescript
<Bell icon with badge>
  {unreadNotifications.count}
</Bell>

// Real-time using Supabase subscriptions
supabase
  .channel('notifications')
  .on('INSERT', callback)
  .subscribe()
```

## Implementation Checklist

- [x] Database schema updated
- [x] Reward milestones seeded
- [x] Database triggers created
- [x] pickup_rewards table ready
- [ ] QR code verification endpoint
- [ ] Rewards dashboard page
- [ ] Real-time notifications
- [ ] Email notifications (optional)
- [ ] SMS notifications (optional)
- [ ] Admin panel for milestone config
- [ ] Testing all reward tiers
- [ ] Testing notification system

## Benefits

### For Platform (EMall):
✅ Reduces delivery infrastructure costs
✅ Encourages sustainable business model
✅ Builds strong merchant relationships
✅ Creates competitive environment

### For Merchants:
✅ Save on delivery fees
✅ Direct customer contact
✅ Better profit margins
✅ Subscription cost reduction (up to 30%)
✅ Better visibility on platform
✅ Status recognition (badges)

### For Customers:
✅ Faster fulfillment (no delivery wait)
✅ Can inspect products before taking
✅ Meet merchant in person
✅ No delivery fees

## Security Considerations

1. **QR Code Expiry**: Codes expire after 10 minutes
2. **One-time Use**: Each code can only be used once
3. **Merchant Verification**: Only the designated merchant can verify their orders
4. **Database Triggers**: Can't be manipulated from frontend
5. **Audit Trail**: All rewards logged in pickup_rewards table

## Future Enhancements

- [ ] Leaderboard of top merchants by pickups
- [ ] Monthly/weekly pickup challenges
- [ ] Bonus rewards during promotions
- [ ] Referral bonuses for bringing customers
- [ ] Team achievements (multiple branches)
- [ ] Seasonal milestone multipliers

## Testing Scenarios

### Scenario 1: First Pickup
```
Given: Merchant with 0 pickups
When: First pickup code verified
Then: 
  - pickup_orders_count = 1
  - pickup_rewards_points = 1
  - discount_percentage = 0 (no milestone yet)
  - Notification sent
```

### Scenario 2: Reaching 10 Pickups
```
Given: Merchant with 9 pickups
When: 10th pickup code verified
Then:
  - pickup_orders_count = 10
  - discount_percentage = 5
  - Notification: "مبروك! حصلت على خصم 5%"
  - Reward record created
```

### Scenario 3: Expired QR Code
```
Given: QR code older than 10 minutes
When: Merchant tries to verify
Then:
  - Error: "انتهت صلاحية الكود"
  - pickup_orders_count unchanged
  - No rewards
```

### Scenario 4: Already Used Code
```
Given: QR code already verified
When: Merchant tries to verify again
Then:
  - Error: "هذا الكود تم استخدامه من قبل"
  - No duplicate rewards
```

## Support & Documentation

For merchants who ask about the system:

**Arabic Message:**
```
🎁 نظام المكافآت

كل ما تستقبل طلبات استلام أكثر، كل ما تحصل على مزايا أفضل:

✨ 10 طلبات = خصم 5%
✨ 50 طلب = خصم 10%
✨ 100 طلب = خصم 15% + شارة مميزة
✨ 200 طلب = خصم 20%
✨ 500 طلب = خصم 30% + VIP

المكافآت تلقائية وفورية!
```

**How to explain to merchants:**
"في كل مرة عميل يجيلك المحل ويستلم طلب عن طريق الكود، انت تلقائياً بتحصل على نقاط. النقاط دي بتديك خصومات على اشتراكك وترتيب أفضل في الموقع. المكافآت تلقائية، مش محتاج تعمل حاجة."

---

**Questions? Check the main roadmap file for complete implementation details.**
