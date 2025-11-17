import axios, { AxiosInstance } from 'axios'

/**
 * Paymob Payment Gateway Client
 * Handles payment processing for Egyptian market
 */

interface PaymobConfig {
  apiKey: string
  integrationId: string
  iframeId: string
  hmacSecret: string
}

interface AuthResponse {
  token: string
}

interface OrderResponse {
  id: number
  merchant_id: number
  amount_cents: number
  currency: string
}

interface PaymentKeyResponse {
  token: string
}

export class PaymobClient {
  private config: PaymobConfig
  private apiClient: AxiosInstance
  private authToken: string | null = null

  constructor(config?: PaymobConfig) {
    // Load config from environment variables or use provided config
    this.config = config || {
      apiKey: process.env.PAYMOB_API_KEY || '',
      integrationId: process.env.PAYMOB_INTEGRATION_ID || '',
      iframeId: process.env.PAYMOB_IFRAME_ID || '',
      hmacSecret: process.env.PAYMOB_HMAC_SECRET || '',
    }

    // Validate configuration
    if (!this.config.apiKey) {
      throw new Error('PAYMOB_API_KEY is not configured')
    }
    if (!this.config.integrationId) {
      throw new Error('PAYMOB_INTEGRATION_ID is not configured')
    }

    // Initialize Axios client
    this.apiClient = axios.create({
      baseURL: 'https://accept.paymob.com/api',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })
  }

  /**
   * Authenticate with Paymob and get auth token
   * @returns Authentication token
   */
  async authenticate(): Promise<string> {
    try {
      const response = await this.apiClient.post<AuthResponse>('/auth/tokens', {
        api_key: this.config.apiKey,
      })

      this.authToken = response.data.token
      return this.authToken
    } catch (error) {
      console.error('Paymob authentication failed:', error)
      throw new Error('Failed to authenticate with Paymob')
    }
  }

  /**
   * Create an order in Paymob
   * @param amountCents - Amount in cents (e.g., 10000 = 100.00 EGP)
   * @param currency - Currency code (default: EGP)
   * @param orderId - Your internal order ID
   * @returns Paymob order object
   */
  async createOrder(
    amountCents: number,
    currency: string = 'EGP',
    orderId?: string
  ): Promise<OrderResponse> {
    try {
      // Ensure we have an auth token
      if (!this.authToken) {
        await this.authenticate()
      }

      const response = await this.apiClient.post<OrderResponse>('/ecommerce/orders', {
        auth_token: this.authToken,
        delivery_needed: false,
        amount_cents: amountCents,
        currency: currency.toUpperCase(),
        merchant_order_id: orderId || `order_${Date.now()}`,
        items: [],
      })

      return response.data
    } catch (error) {
      console.error('Paymob order creation failed:', error)
      throw new Error('Failed to create Paymob order')
    }
  }

  /**
   * Get payment key for processing payment
   * @param amountCents - Amount in cents
   * @param orderId - Paymob order ID
   * @param billingData - Customer billing information
   * @returns Payment token
   */
  async getPaymentKey(
    amountCents: number,
    orderId: number,
    billingData: {
      firstName: string
      lastName: string
      email: string
      phone: string
      city?: string
      country?: string
      street?: string
    }
  ): Promise<string> {
    try {
      // Ensure we have an auth token
      if (!this.authToken) {
        await this.authenticate()
      }

      const response = await this.apiClient.post<PaymentKeyResponse>('/acceptance/payment_keys', {
        auth_token: this.authToken,
        amount_cents: amountCents,
        expiration: 3600, // 1 hour
        order_id: orderId,
        billing_data: {
          first_name: billingData.firstName,
          last_name: billingData.lastName,
          email: billingData.email,
          phone_number: billingData.phone,
          city: billingData.city || 'N/A',
          country: billingData.country || 'Egypt',
          street: billingData.street || 'N/A',
          apartment: 'N/A',
          floor: 'N/A',
          building: 'N/A',
          shipping_method: 'N/A',
          postal_code: 'N/A',
          state: 'N/A',
        },
        currency: 'EGP',
        integration_id: parseInt(this.config.integrationId),
      })

      return response.data.token
    } catch (error) {
      console.error('Paymob payment key generation failed:', error)
      throw new Error('Failed to get payment key')
    }
  }

  /**
   * Complete payment flow - authenticate, create order, get payment key
   * @param amountCents - Amount in cents
   * @param orderId - Your internal order ID
   * @param billingData - Customer billing information
   * @returns Payment URL and token
   */
  async initiatePayment(
    amountCents: number,
    orderId: string,
    billingData: {
      firstName: string
      lastName: string
      email: string
      phone: string
      city?: string
      country?: string
      street?: string
    }
  ): Promise<{ paymentUrl: string; paymentToken: string; paymobOrderId: number }> {
    try {
      // Step 1: Authenticate
      await this.authenticate()

      // Step 2: Create order
      const order = await this.createOrder(amountCents, 'EGP', orderId)

      // Step 3: Get payment key
      const paymentToken = await this.getPaymentKey(amountCents, order.id, billingData)

      // Step 4: Construct payment URL
      const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${this.config.iframeId}?payment_token=${paymentToken}`

      return {
        paymentUrl,
        paymentToken,
        paymobOrderId: order.id,
      }
    } catch (error) {
      console.error('Paymob payment initiation failed:', error)
      throw error
    }
  }

  /**
   * Verify HMAC signature for webhook callbacks
   * @param data - Webhook data
   * @param receivedHmac - HMAC from webhook
   * @returns Whether signature is valid
   */
  verifyHmac(data: any, receivedHmac: string): boolean {
    try {
      const crypto = require('crypto')

      // Construct HMAC string according to Paymob documentation
      const hmacString = [
        data.amount_cents,
        data.created_at,
        data.currency,
        data.error_occured,
        data.has_parent_transaction,
        data.id,
        data.integration_id,
        data.is_3d_secure,
        data.is_auth,
        data.is_capture,
        data.is_refunded,
        data.is_standalone_payment,
        data.is_voided,
        data.order?.id,
        data.owner,
        data.pending,
        data.source_data?.pan,
        data.source_data?.sub_type,
        data.source_data?.type,
        data.success,
      ].join('')

      const calculatedHmac = crypto
        .createHmac('sha512', this.config.hmacSecret)
        .update(hmacString)
        .digest('hex')

      return calculatedHmac === receivedHmac
    } catch (error) {
      console.error('HMAC verification failed:', error)
      return false
    }
  }

  /**
   * Get payment iframe URL
   * @param paymentToken - Payment token from getPaymentKey
   * @returns iframe URL
   */
  getIframeUrl(paymentToken: string): string {
    return `https://accept.paymob.com/api/acceptance/iframes/${this.config.iframeId}?payment_token=${paymentToken}`
  }
}

// Export singleton instance
let paymobClient: PaymobClient | null = null

export function getPaymobClient(): PaymobClient {
  if (!paymobClient) {
    paymobClient = new PaymobClient()
  }
  return paymobClient
}

// Export helper functions
export async function createPaymobPayment(
  amountCents: number,
  orderId: string,
  billingData: {
    firstName: string
    lastName: string
    email: string
    phone: string
    city?: string
    country?: string
    street?: string
  }
): Promise<{ paymentUrl: string; paymentToken: string; paymobOrderId: number }> {
  const client = getPaymobClient()
  return client.initiatePayment(amountCents, orderId, billingData)
}

export function verifyPaymobHmac(data: any, receivedHmac: string): boolean {
  const client = getPaymobClient()
  return client.verifyHmac(data, receivedHmac)
}
