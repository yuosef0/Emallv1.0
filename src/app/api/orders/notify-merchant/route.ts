import { NextRequest, NextResponse } from 'next/server'
import { notifyMerchantNewOrder } from '@/lib/notifications'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Notify Merchant API Endpoint
 * Sends notification to merchant when a new order is created
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { orderId } = body

    // Validate order ID
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    // Optional: Authenticate user
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user owns this order (customer) or is the merchant
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, customer_id, merchant_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if user is the customer who created the order
    if (order.customer_id !== user.id) {
      // Check if user is the merchant
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', order.merchant_id)
        .single()

      if (!merchant) {
        return NextResponse.json(
          { error: 'Unauthorized to access this order' },
          { status: 403 }
        )
      }
    }

    // Send notification to merchant
    const success = await notifyMerchantNewOrder(orderId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Merchant notified successfully',
    })
  } catch (error) {
    console.error('Error in notify-merchant endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET handler for testing
 */
export async function GET() {
  return NextResponse.json({
    message: 'Notify Merchant API endpoint',
    status: 'ready',
    usage: 'POST /api/orders/notify-merchant with { orderId: string }',
  })
}
