import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { amount, currency = 'egp', metadata } = body

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be a positive number.' },
        { status: 400 }
      )
    }

    // Validate currency (optional, defaults to EGP)
    const validCurrencies = ['egp', 'usd', 'eur', 'gbp']
    if (currency && !validCurrencies.includes(currency.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid currency. Supported currencies: egp, usd, eur, gbp' },
        { status: 400 }
      )
    }

    // Get authenticated user (optional, for tracking)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Add user ID to metadata if authenticated
    const paymentMetadata = {
      ...metadata,
      ...(user && { user_id: user.id }),
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent(
      amount,
      currency.toLowerCase(),
      paymentMetadata
    )

    // Return client secret
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    })
  } catch (error) {
    console.error('Error in create-payment-intent API:', error)

    // Handle Stripe-specific errors
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as { type: string; message: string }
      return NextResponse.json(
        { error: stripeError.message || 'Payment processing error' },
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
