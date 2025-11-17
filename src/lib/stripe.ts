import Stripe from 'stripe'

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
})

/**
 * Create a payment intent for one-time payments
 * @param amount - Amount in cents (e.g., 1000 = 10.00 EGP)
 * @param currency - Currency code (default: 'egp')
 * @param metadata - Additional metadata to attach to the payment intent
 * @returns Payment intent with client secret
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'egp',
  metadata?: Stripe.MetadataParam
): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return paymentIntent
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

/**
 * Create a subscription for recurring payments
 * @param customerId - Stripe customer ID
 * @param priceId - Stripe price ID for the subscription plan
 * @param metadata - Additional metadata to attach to the subscription
 * @returns Subscription object
 */
export async function createSubscription(
  customerId: string,
  priceId: string,
  metadata?: Stripe.MetadataParam
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      metadata,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    return subscription
  } catch (error) {
    console.error('Error creating subscription:', error)
    throw error
  }
}

/**
 * Create or retrieve a Stripe customer
 * @param email - Customer email
 * @param name - Customer name
 * @param metadata - Additional metadata
 * @returns Stripe customer
 */
export async function createOrGetCustomer(
  email: string,
  name?: string,
  metadata?: Stripe.MetadataParam
): Promise<Stripe.Customer> {
  try {
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0]
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    })

    return customer
  } catch (error) {
    console.error('Error creating/getting customer:', error)
    throw error
  }
}

/**
 * Cancel a subscription
 * @param subscriptionId - Stripe subscription ID
 * @returns Cancelled subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId)
    return subscription
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    throw error
  }
}

/**
 * Update a subscription
 * @param subscriptionId - Stripe subscription ID
 * @param priceId - New price ID
 * @returns Updated subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  priceId: string
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
    })

    return updatedSubscription
  } catch (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

/**
 * Retrieve a payment intent
 * @param paymentIntentId - Payment intent ID
 * @returns Payment intent
 */
export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return paymentIntent
  } catch (error) {
    console.error('Error retrieving payment intent:', error)
    throw error
  }
}

/**
 * Construct webhook event from request
 * @param payload - Request body
 * @param signature - Stripe signature from headers
 * @param webhookSecret - Webhook secret
 * @returns Stripe event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    return event
  } catch (error) {
    console.error('Error constructing webhook event:', error)
    throw error
  }
}
