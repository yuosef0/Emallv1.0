import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymobHmac } from '@/lib/paymob'
import { createClient } from '@supabase/supabase-js'

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
 * Paymob Webhook Handler
 * Handles payment callbacks from Paymob
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Extract data from Paymob callback
    const {
      obj,
      type,
      hmac,
    } = body

    if (!obj) {
      console.error('Missing obj in webhook data')
      return NextResponse.json(
        { error: 'Invalid webhook data' },
        { status: 400 }
      )
    }

    // Log the webhook event
    console.log('Paymob webhook received:', {
      type,
      transactionId: obj.id,
      success: obj.success,
      orderId: obj.order?.id,
    })

    // Verify HMAC signature
    if (process.env.PAYMOB_HMAC_SECRET) {
      const isValid = verifyPaymobHmac(obj, hmac || '')

      if (!isValid) {
        console.error('Invalid HMAC signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    // Log to database for audit trail
    await supabaseAdmin.from('webhook_logs').insert({
      provider: 'paymob',
      event_type: type || 'transaction',
      event_id: obj.id?.toString(),
      payload: obj,
      created_at: new Date().toISOString(),
    })

    // Handle based on transaction status
    if (obj.success === true || obj.success === 'true') {
      await handlePaymentSuccess(obj)
    } else {
      await handlePaymentFailure(obj)
    }

    // Return success response
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing Paymob webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(transaction: any) {
  console.log('Processing successful payment:', transaction.id)

  try {
    const paymobOrderId = transaction.order?.id
    const merchantOrderId = transaction.order?.merchant_order_id
    const amountCents = transaction.amount_cents

    if (!paymobOrderId && !merchantOrderId) {
      console.log('No order ID found in transaction')
      return
    }

    // Find order by Paymob order ID or merchant order ID
    let query = supabaseAdmin.from('orders').select('*')

    if (paymobOrderId) {
      query = query.eq('paymob_order_id', paymobOrderId.toString())
    } else if (merchantOrderId) {
      query = query.eq('id', merchantOrderId)
    }

    const { data: order, error: findError } = await query.single()

    if (findError || !order) {
      console.log('No order found for transaction:', { paymobOrderId, merchantOrderId })
      return
    }

    // Update order status
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        paid_at: new Date().toISOString(),
        paymob_transaction_id: transaction.id?.toString(),
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
      message: `Your payment of ${(amountCents / 100).toFixed(2)} EGP has been confirmed. Your order is being processed.`,
      type: 'success',
      link: `/orders/${order.id}`,
    })

    // Send notification to merchant
    if (order.merchant_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: order.merchant_id,
        title: 'New Order Received',
        message: `New order #${order.id.slice(0, 8)} - ${(order.total_amount || amountCents / 100).toFixed(2)} EGP`,
        type: 'order',
        link: `/dashboard/orders/${order.id}`,
      })
    }

    console.log('Order updated successfully:', order.id)
  } catch (error) {
    console.error('Error in handlePaymentSuccess:', error)
    throw error
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(transaction: any) {
  console.log('Processing failed payment:', transaction.id)

  try {
    const paymobOrderId = transaction.order?.id
    const merchantOrderId = transaction.order?.merchant_order_id
    const errorReason = transaction.data?.message || 'Payment failed'

    if (!paymobOrderId && !merchantOrderId) {
      console.log('No order ID found in transaction')
      return
    }

    // Find order by Paymob order ID or merchant order ID
    let query = supabaseAdmin.from('orders').select('*')

    if (paymobOrderId) {
      query = query.eq('paymob_order_id', paymobOrderId.toString())
    } else if (merchantOrderId) {
      query = query.eq('id', merchantOrderId)
    }

    const { data: order, error: findError } = await query.single()

    if (findError || !order) {
      console.log('No order found for transaction:', { paymobOrderId, merchantOrderId })
      return
    }

    // Update order status
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'failed',
        status: 'cancelled',
        paymob_transaction_id: transaction.id?.toString(),
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
      message: `Your payment could not be processed. Reason: ${errorReason}. Please try again or use a different payment method.`,
      type: 'error',
      link: `/orders/${order.id}`,
    })

    console.log('Order payment failed:', order.id)
  } catch (error) {
    console.error('Error in handlePaymentFailure:', error)
    throw error
  }
}

/**
 * Handle GET requests (for testing)
 */
export async function GET() {
  return NextResponse.json({
    message: 'Paymob webhook endpoint',
    status: 'ready',
  })
}
