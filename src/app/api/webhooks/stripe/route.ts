import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Use service role key for admin database operations
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

/**
 * Stripe Webhook Handler
 * Handles webhook events from Stripe
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook secret is configured
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Verify webhook signature and construct event
    let event: Stripe.Event
    try {
      event = constructWebhookEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Log the event
    console.log(`Stripe webhook event received: ${event.type}`, {
      id: event.id,
      type: event.type,
      created: event.created,
    })

    // Log to database for audit trail
    await supabaseAdmin.from('webhook_logs').insert({
      provider: 'stripe',
      event_type: event.type,
      event_id: event.id,
      payload: event.data.object,
      created_at: new Date().toISOString(),
    })

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Return success response
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment_intent.succeeded:', paymentIntent.id)

  try {
    // Find order by payment intent ID
    const { data: order, error: findError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('payment_intent_id', paymentIntent.id)
      .single()

    if (findError || !order) {
      console.log('No order found for payment intent:', paymentIntent.id)
      return
    }

    // Update order status
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Error updating order:', updateError)
      throw updateError
    }

    // Send notification to customer
    await supabaseAdmin.from('notifications').insert({
      user_id: order.customer_id,
      title: 'Payment Successful',
      message: 'Your payment has been confirmed. Your order is being processed.',
      type: 'success',
      link: `/orders/${order.id}`,
    })

    // Send notification to merchant
    if (order.merchant_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: order.merchant_id,
        title: 'New Order Received',
        message: `New order #${order.id.slice(0, 8)} - ${order.total_amount} EGP`,
        type: 'order',
        link: `/dashboard/orders/${order.id}`,
      })
    }

    console.log('Order updated successfully:', order.id)
  } catch (error) {
    console.error('Error in handlePaymentIntentSucceeded:', error)
    throw error
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment_intent.payment_failed:', paymentIntent.id)

  try {
    // Find order by payment intent ID
    const { data: order, error: findError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('payment_intent_id', paymentIntent.id)
      .single()

    if (findError || !order) {
      console.log('No order found for payment intent:', paymentIntent.id)
      return
    }

    // Update order status
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'failed',
        status: 'cancelled',
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Error updating order:', updateError)
      throw updateError
    }

    // Send notification to customer
    await supabaseAdmin.from('notifications').insert({
      user_id: order.customer_id,
      title: 'Payment Failed',
      message: 'Your payment could not be processed. Please try again or use a different payment method.',
      type: 'error',
      link: `/orders/${order.id}`,
    })

    console.log('Order payment failed:', order.id)
  } catch (error) {
    console.error('Error in handlePaymentIntentFailed:', error)
    throw error
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.created:', subscription.id)

  try {
    const customerId = subscription.customer as string
    const userId = subscription.metadata?.user_id
    const tierId = subscription.metadata?.tier_id

    if (!userId) {
      console.log('No user_id in subscription metadata')
      return
    }

    // Get merchant record
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (merchantError || !merchant) {
      console.log('No merchant found for user:', userId)
      return
    }

    // Update merchant subscription
    const subscriptionData = subscription as any
    const { error: updateError } = await supabaseAdmin
      .from('merchants')
      .update({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        subscription_status: subscription.status,
        subscription_tier_id: tierId || merchant.subscription_tier_id,
        subscription_start_date: new Date(subscriptionData.current_period_start * 1000).toISOString(),
        subscription_end_date: new Date(subscriptionData.current_period_end * 1000).toISOString(),
      })
      .eq('id', merchant.id)

    if (updateError) {
      console.error('Error updating merchant subscription:', updateError)
      throw updateError
    }

    console.log('Merchant subscription created:', merchant.id)
  } catch (error) {
    console.error('Error in handleSubscriptionCreated:', error)
    throw error
  }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.updated:', subscription.id)

  try {
    const customerId = subscription.customer as string

    // Find merchant by subscription ID
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (merchantError || !merchant) {
      console.log('No merchant found for subscription:', subscription.id)
      return
    }

    // Update merchant subscription
    const subscriptionData = subscription as any
    const { error: updateError } = await supabaseAdmin
      .from('merchants')
      .update({
        stripe_customer_id: customerId,
        subscription_status: subscription.status,
        subscription_start_date: new Date(subscriptionData.current_period_start * 1000).toISOString(),
        subscription_end_date: new Date(subscriptionData.current_period_end * 1000).toISOString(),
      })
      .eq('id', merchant.id)

    if (updateError) {
      console.error('Error updating merchant subscription:', updateError)
      throw updateError
    }

    // Send notification if subscription is about to expire
    if (subscriptionData.cancel_at) {
      await supabaseAdmin.from('notifications').insert({
        user_id: merchant.user_id,
        title: 'Subscription Ending Soon',
        message: `Your subscription will end on ${new Date(subscriptionData.cancel_at * 1000).toLocaleDateString()}`,
        type: 'warning',
        link: '/dashboard/subscription',
      })
    }

    console.log('Merchant subscription updated:', merchant.id)
  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error)
    throw error
  }
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.deleted:', subscription.id)

  try {
    // Find merchant by subscription ID
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (merchantError || !merchant) {
      console.log('No merchant found for subscription:', subscription.id)
      return
    }

    // Update merchant subscription status
    const { error: updateError } = await supabaseAdmin
      .from('merchants')
      .update({
        subscription_status: 'expired',
        subscription_end_date: new Date().toISOString(),
      })
      .eq('id', merchant.id)

    if (updateError) {
      console.error('Error updating merchant subscription:', updateError)
      throw updateError
    }

    // Send notification to merchant
    await supabaseAdmin.from('notifications').insert({
      user_id: merchant.user_id,
      title: 'Subscription Expired',
      message: 'Your subscription has expired. Renew now to continue accessing premium features.',
      type: 'error',
      link: '/dashboard/subscription',
    })

    console.log('Merchant subscription deleted:', merchant.id)
  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error)
    throw error
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_succeeded:', invoice.id)

  try {
    const invoiceData = invoice as any
    const subscriptionId = invoiceData.subscription as string | null

    if (!subscriptionId) {
      console.log('No subscription found for invoice:', invoice.id)
      return
    }

    // Find merchant by subscription ID
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (merchantError || !merchant) {
      console.log('No merchant found for subscription:', subscriptionId)
      return
    }

    // Send notification to merchant
    await supabaseAdmin.from('notifications').insert({
      user_id: merchant.user_id,
      title: 'Payment Received',
      message: `Your subscription payment of ${(invoiceData.amount_paid / 100).toFixed(2)} ${invoiceData.currency.toUpperCase()} has been received.`,
      type: 'success',
      link: '/dashboard/subscription',
    })

    console.log('Invoice payment succeeded for merchant:', merchant.id)
  } catch (error) {
    console.error('Error in handleInvoicePaymentSucceeded:', error)
    throw error
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_failed:', invoice.id)

  try {
    const invoiceData = invoice as any
    const subscriptionId = invoiceData.subscription as string | null

    if (!subscriptionId) {
      console.log('No subscription found for invoice:', invoice.id)
      return
    }

    // Find merchant by subscription ID
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (merchantError || !merchant) {
      console.log('No merchant found for subscription:', subscriptionId)
      return
    }

    // Send notification to merchant
    await supabaseAdmin.from('notifications').insert({
      user_id: merchant.user_id,
      title: 'Payment Failed',
      message: 'Your subscription payment failed. Please update your payment method to avoid service interruption.',
      type: 'error',
      link: '/dashboard/subscription',
    })

    console.log('Invoice payment failed for merchant:', merchant.id)
  } catch (error) {
    console.error('Error in handleInvoicePaymentFailed:', error)
    throw error
  }
}
