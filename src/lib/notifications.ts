import { createClient } from '@supabase/supabase-js'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Notification System
 * Handles in-app notifications, real-time subscriptions, and merchant notifications
 */

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'order' | 'payment' | 'pickup' | 'reward'

export interface NotificationData {
  user_id: string
  title: string
  message: string
  type: NotificationType
  link?: string
  metadata?: Record<string, any>
  send_email?: boolean
  send_sms?: boolean
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  link: string | null
  metadata: Record<string, any> | null
  is_read: boolean
  created_at: string
}

/**
 * Send a notification to a user
 * Creates in-app notification and optionally sends email/SMS
 * @param data - Notification data
 * @returns Created notification object
 */
export async function sendNotification(data: NotificationData): Promise<Notification | null> {
  try {
    // Validate required fields
    if (!data.user_id || !data.title || !data.message) {
      console.error('Missing required notification fields')
      return null
    }

    // Create in-app notification
    const { data: notification, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: data.user_id,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        link: data.link || null,
        metadata: data.metadata || null,
        is_read: false,
      })
      .select()
      .single()

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      return null
    }

    // Optional: Send email notification
    if (data.send_email) {
      await sendEmailNotification(data)
    }

    // Optional: Send SMS notification
    if (data.send_sms) {
      await sendSMSNotification(data)
    }

    return notification
  } catch (error) {
    console.error('Error in sendNotification:', error)
    return null
  }
}

/**
 * Send email notification (placeholder for future implementation)
 * @param data - Notification data
 */
async function sendEmailNotification(data: NotificationData): Promise<void> {
  try {
    // Get user email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', data.user_id)
      .single()

    if (userError || !user?.email) {
      console.log('No email found for user:', data.user_id)
      return
    }

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log('Email notification would be sent to:', user.email)
    console.log('Subject:', data.title)
    console.log('Message:', data.message)

    // Example: SendGrid integration
    // await sendGridClient.send({
    //   to: user.email,
    //   from: 'notifications@emall.com',
    //   subject: data.title,
    //   text: data.message,
    //   html: `<p>${data.message}</p>`,
    // })
  } catch (error) {
    console.error('Error sending email notification:', error)
  }
}

/**
 * Send SMS notification (placeholder for future implementation)
 * @param data - Notification data
 */
async function sendSMSNotification(data: NotificationData): Promise<void> {
  try {
    // Get user phone
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('phone')
      .eq('id', data.user_id)
      .single()

    if (userError || !user?.phone) {
      console.log('No phone found for user:', data.user_id)
      return
    }

    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log('SMS notification would be sent to:', user.phone)
    console.log('Message:', data.message)

    // Example: Twilio integration
    // await twilioClient.messages.create({
    //   to: user.phone,
    //   from: '+1234567890',
    //   body: `${data.title}: ${data.message}`,
    // })
  } catch (error) {
    console.error('Error sending SMS notification:', error)
  }
}

/**
 * Notify merchant when new order is created
 * @param orderId - Order ID
 * @returns True if notification sent successfully
 */
export async function notifyMerchantNewOrder(orderId: string): Promise<boolean> {
  try {
    // Fetch order details with customer and merchant info
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        total_amount,
        delivery_method,
        payment_method,
        status,
        payment_status,
        customer_id,
        merchant_id,
        created_at,
        customers:customer_id (
          full_name,
          phone
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', orderId)
      return false
    }

    if (!order.merchant_id) {
      console.log('No merchant associated with order:', orderId)
      return false
    }

    // Get merchant user_id
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('user_id, business_name, business_name_ar')
      .eq('id', order.merchant_id)
      .single()

    if (merchantError || !merchant) {
      console.error('Merchant not found for order:', orderId)
      return false
    }

    // Prepare notification message
    const orderShortId = order.id.slice(0, 8)
    const orderData = order as any
    const customerName = orderData.customers?.full_name || 'Customer'
    const deliveryMethod = order.delivery_method === 'pickup' ? 'Pickup' : 'Delivery'

    const title = '🛍️ New Order Received!'
    const message = `New ${deliveryMethod} order #${orderShortId} from ${customerName} - ${order.total_amount.toFixed(2)} EGP`

    // Send notification to merchant
    const notification = await sendNotification({
      user_id: merchant.user_id,
      title,
      message,
      type: 'order',
      link: `/dashboard/orders/${order.id}`,
      metadata: {
        order_id: order.id,
        customer_id: order.customer_id,
        total_amount: order.total_amount,
        delivery_method: order.delivery_method,
      },
      send_email: false, // Can be enabled based on merchant preferences
      send_sms: false,   // Can be enabled based on merchant preferences
    })

    return notification !== null
  } catch (error) {
    console.error('Error in notifyMerchantNewOrder:', error)
    return false
  }
}

/**
 * Notify customer about order updates
 * @param orderId - Order ID
 * @param status - New order status
 * @returns True if notification sent successfully
 */
export async function notifyCustomerOrderUpdate(
  orderId: string,
  status: 'confirmed' | 'processing' | 'ready' | 'completed' | 'cancelled'
): Promise<boolean> {
  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_id, total_amount')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', orderId)
      return false
    }

    const orderShortId = order.id.slice(0, 8)

    const statusMessages: Record<string, { title: string; message: string; type: NotificationType }> = {
      confirmed: {
        title: '✓ Order Confirmed',
        message: `Your order #${orderShortId} has been confirmed and is being prepared.`,
        type: 'success',
      },
      processing: {
        title: '⏳ Order Processing',
        message: `Your order #${orderShortId} is being processed.`,
        type: 'info',
      },
      ready: {
        title: '✓ Order Ready',
        message: `Your order #${orderShortId} is ready for pickup/delivery!`,
        type: 'success',
      },
      completed: {
        title: '🎉 Order Completed',
        message: `Your order #${orderShortId} has been completed. Thank you for shopping with us!`,
        type: 'success',
      },
      cancelled: {
        title: '❌ Order Cancelled',
        message: `Your order #${orderShortId} has been cancelled.`,
        type: 'error',
      },
    }

    const statusInfo = statusMessages[status]
    if (!statusInfo) {
      console.error('Invalid status:', status)
      return false
    }

    const notification = await sendNotification({
      user_id: order.customer_id,
      title: statusInfo.title,
      message: statusInfo.message,
      type: statusInfo.type,
      link: `/orders/${order.id}`,
      metadata: {
        order_id: order.id,
        status,
      },
    })

    return notification !== null
  } catch (error) {
    console.error('Error in notifyCustomerOrderUpdate:', error)
    return false
  }
}

/**
 * Notify customer about payment status
 * @param orderId - Order ID
 * @param paymentStatus - Payment status
 * @returns True if notification sent successfully
 */
export async function notifyPaymentStatus(
  orderId: string,
  paymentStatus: 'paid' | 'failed' | 'refunded'
): Promise<boolean> {
  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_id, total_amount')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', orderId)
      return false
    }

    const orderShortId = order.id.slice(0, 8)

    const paymentMessages: Record<string, { title: string; message: string; type: NotificationType }> = {
      paid: {
        title: '✓ Payment Successful',
        message: `Your payment of ${order.total_amount.toFixed(2)} EGP for order #${orderShortId} has been confirmed.`,
        type: 'success',
      },
      failed: {
        title: '❌ Payment Failed',
        message: `Payment for order #${orderShortId} failed. Please try again or use a different payment method.`,
        type: 'error',
      },
      refunded: {
        title: '💰 Payment Refunded',
        message: `Your payment of ${order.total_amount.toFixed(2)} EGP for order #${orderShortId} has been refunded.`,
        type: 'info',
      },
    }

    const paymentInfo = paymentMessages[paymentStatus]
    if (!paymentInfo) {
      console.error('Invalid payment status:', paymentStatus)
      return false
    }

    const notification = await sendNotification({
      user_id: order.customer_id,
      title: paymentInfo.title,
      message: paymentInfo.message,
      type: paymentInfo.type,
      link: `/orders/${order.id}`,
      metadata: {
        order_id: order.id,
        payment_status: paymentStatus,
        amount: order.total_amount,
      },
    })

    return notification !== null
  } catch (error) {
    console.error('Error in notifyPaymentStatus:', error)
    return false
  }
}

/**
 * Notify customer about rewards earned
 * @param customerId - Customer ID
 * @param merchantId - Merchant ID
 * @param pointsEarned - Points earned
 * @returns True if notification sent successfully
 */
export async function notifyRewardsEarned(
  customerId: string,
  merchantId: string,
  pointsEarned: number
): Promise<boolean> {
  try {
    // Get merchant name
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('business_name, business_name_ar')
      .eq('id', merchantId)
      .single()

    const merchantName = merchant?.business_name || 'Store'

    const notification = await sendNotification({
      user_id: customerId,
      title: '⭐ Rewards Earned!',
      message: `You earned ${pointsEarned} pickup points from ${merchantName}! Keep collecting for rewards.`,
      type: 'reward',
      link: '/rewards',
      metadata: {
        merchant_id: merchantId,
        points_earned: pointsEarned,
      },
    })

    return notification !== null
  } catch (error) {
    console.error('Error in notifyRewardsEarned:', error)
    return false
  }
}

/**
 * Subscribe to real-time notifications for a user
 * Uses Supabase Realtime to listen for new notifications
 * @param userId - User ID to subscribe to
 * @param callback - Callback function called when new notification arrives
 * @returns Realtime channel for managing subscription
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
): RealtimeChannel {
  // Create regular client (not admin) for realtime subscriptions
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Subscribe to INSERT events on notifications table for this user
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('New notification received:', payload.new)
        callback(payload.new as Notification)
      }
    )
    .subscribe((status) => {
      console.log('Notification subscription status:', status)
    })

  return channel
}

/**
 * Mark notification as read
 * @param notificationId - Notification ID
 * @returns True if successful
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error)
    return false
  }
}

/**
 * Mark all notifications as read for a user
 * @param userId - User ID
 * @returns True if successful
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error)
    return false
  }
}

/**
 * Get unread notification count for a user
 * @param userId - User ID
 * @returns Count of unread notifications
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error('Error getting unread count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error in getUnreadNotificationCount:', error)
    return 0
  }
}

/**
 * Get recent notifications for a user
 * @param userId - User ID
 * @param limit - Number of notifications to fetch (default: 20)
 * @returns Array of notifications
 */
export async function getRecentNotifications(
  userId: string,
  limit: number = 20
): Promise<Notification[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error getting recent notifications:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getRecentNotifications:', error)
    return []
  }
}

/**
 * Delete notification
 * @param notificationId - Notification ID
 * @returns True if successful
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error('Error deleting notification:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteNotification:', error)
    return false
  }
}

/**
 * Delete all notifications for a user
 * @param userId - User ID
 * @returns True if successful
 */
export async function deleteAllNotifications(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting all notifications:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteAllNotifications:', error)
    return false
  }
}
