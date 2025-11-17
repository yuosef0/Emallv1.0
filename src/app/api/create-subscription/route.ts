import { NextRequest, NextResponse } from 'next/server'
import { createSubscription, createOrGetCustomer } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login first.' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { priceId, tierId } = body

    // Validate price ID
    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid priceId. Price ID is required.' },
        { status: 400 }
      )
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    if (!profile?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const customer = await createOrGetCustomer(
      profile.email,
      profile.full_name || undefined,
      {
        user_id: user.id,
        tier_id: tierId || '',
      }
    )

    // Update user profile with Stripe customer ID if not exists
    if (!profile.email.includes('stripe_customer_id')) {
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', user.id)
    }

    // Create subscription
    const subscription = await createSubscription(
      customer.id,
      priceId,
      {
        user_id: user.id,
        tier_id: tierId || '',
      }
    )

    // Extract client secret from the subscription
    let clientSecret: string | null = null

    if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
      const invoice = subscription.latest_invoice as any
      if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
        clientSecret = invoice.payment_intent.client_secret || null
      }
    }

    // Return subscription details
    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret,
      customerId: customer.id,
      status: subscription.status,
    })
  } catch (error) {
    console.error('Error in create-subscription API:', error)

    // Handle Stripe-specific errors
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as { type: string; message: string }
      return NextResponse.json(
        { error: stripeError.message || 'Subscription creation error' },
        { status: 400 }
      )
    }

    // Generic error
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}
