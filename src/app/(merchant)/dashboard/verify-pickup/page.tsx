'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Scanner } from '@yudiel/react-qr-scanner'
import { isPickupCodeExpired, formatRemainingTime } from '@/lib/qrcode'
import Link from 'next/link'

interface Order {
  id: string
  customer_id: string
  merchant_id: string
  total_amount: number
  delivery_method: string
  pickup_code: string | null
  pickup_code_expiry: string | null
  pickup_code_used: boolean
  status: string
  payment_status: string
  created_at: string
  customers?: {
    full_name: string
    phone: string
  }
}

interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  products?: {
    name: string
    name_ar: string
  }
}

export default function VerifyPickupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [merchantId, setMerchantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const [pickupCode, setPickupCode] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  const [verifiedOrder, setVerifiedOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

  const [totalPickups, setTotalPickups] = useState(0)

  // Check authentication and load merchant
  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get merchant record
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (merchantError || !merchant) {
        toast.error('Merchant profile not found')
        router.push('/dashboard')
        return
      }

      setMerchantId(merchant.id)

      // Load total pickups count
      await loadPickupStats(merchant.id)

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadPickupStats = async (mId: string) => {
    try {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', mId)
        .eq('delivery_method', 'pickup')
        .eq('pickup_code_used', true)

      setTotalPickups(count || 0)
    } catch (error) {
      console.error('Error loading pickup stats:', error)
    }
  }

  const handleVerifyCode = async (code: string) => {
    if (!code || code.trim().length === 0) {
      toast.error('Please enter a pickup code')
      return
    }

    if (!merchantId) {
      toast.error('Merchant not found')
      return
    }

    setVerifying(true)
    setVerifiedOrder(null)
    setOrderItems([])

    try {
      // Find order by pickup code
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customers:customer_id (
            full_name,
            phone
          )
        `)
        .eq('pickup_code', code.toUpperCase().trim())
        .single()

      if (orderError || !order) {
        toast.error('Invalid pickup code')
        return
      }

      // Check if belongs to this merchant
      if (order.merchant_id !== merchantId) {
        toast.error('This pickup code does not belong to your store')
        return
      }

      // Check if already used
      if (order.pickup_code_used) {
        toast.error('This pickup code has already been used')
        return
      }

      // Check if expired
      if (order.pickup_code_expiry && isPickupCodeExpired(order.pickup_code_expiry)) {
        toast.error('This pickup code has expired')
        return
      }

      // Load order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products:product_id (
            name,
            name_ar
          )
        `)
        .eq('order_id', order.id)

      if (itemsError) {
        throw itemsError
      }

      setVerifiedOrder(order)
      setOrderItems(items || [])
      toast.success('✓ Pickup code verified successfully!')

    } catch (error) {
      console.error('Error verifying code:', error)
      toast.error('Failed to verify pickup code')
    } finally {
      setVerifying(false)
    }
  }

  const handleConfirmPickup = async () => {
    if (!verifiedOrder) return

    setConfirming(true)

    try {
      // Mark pickup code as used
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          pickup_code_used: true,
          status: 'completed',
        })
        .eq('id', verifiedOrder.id)

      if (updateError) {
        throw updateError
      }

      // Send notification to customer
      await supabase.from('notifications').insert({
        user_id: verifiedOrder.customer_id,
        title: 'Order Picked Up',
        message: `Your order #${verifiedOrder.id.slice(0, 8)} has been picked up successfully. Enjoy your purchase!`,
        type: 'success',
        link: `/orders/${verifiedOrder.id}`,
      })

      toast.success('✓ Pickup confirmed! Rewards added automatically.', { duration: 5000 })

      // Reload pickup stats
      if (merchantId) {
        await loadPickupStats(merchantId)
      }

      // Reset form
      setPickupCode('')
      setVerifiedOrder(null)
      setOrderItems([])

    } catch (error) {
      console.error('Error confirming pickup:', error)
      toast.error('Failed to confirm pickup')
    } finally {
      setConfirming(false)
    }
  }

  const handleScanSuccess = (result: string) => {
    setPickupCode(result)
    setShowScanner(false)
    handleVerifyCode(result)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🔍 Verify Pickup Code
              </h1>
              <p className="text-gray-600">
                Scan or enter customer pickup codes to confirm orders
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              ← Back
            </Link>
          </div>

          {/* Stats */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-5xl">📦</span>
              <div>
                <div className="text-sm opacity-90">Total Pickups Completed</div>
                <div className="text-4xl font-bold">{totalPickups}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Enter Pickup Code</h2>

          <div className="space-y-4">
            {/* Manual Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pickup Code (6 characters)
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={pickupCode}
                  onChange={(e) => setPickupCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyCode(pickupCode)
                    }
                  }}
                  placeholder="e.g., ABC123"
                  maxLength={6}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-mono tracking-wider uppercase"
                />
                <button
                  onClick={() => handleVerifyCode(pickupCode)}
                  disabled={verifying}
                  className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
                >
                  {verifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>

            {/* QR Scanner Button */}
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">OR</div>
              <button
                onClick={() => setShowScanner(!showScanner)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg flex items-center gap-2 mx-auto"
              >
                <span className="text-xl">📷</span>
                {showScanner ? 'Close Scanner' : 'Scan QR Code'}
              </button>
            </div>

            {/* QR Scanner */}
            {showScanner && (
              <div className="mt-6 bg-gray-100 rounded-xl p-6">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
                    Point camera at QR code
                  </h3>
                  <div className="rounded-xl overflow-hidden shadow-2xl">
                    <Scanner
                      onScan={(result) => {
                        if (result && result.length > 0) {
                          handleScanSuccess(result[0].rawValue)
                        }
                      }}
                      onError={(error) => {
                        console.error('Scanner error:', error)
                        toast.error('Camera access denied or not available')
                      }}
                      constraints={{
                        facingMode: 'environment'
                      }}
                      styles={{
                        container: {
                          width: '100%',
                        },
                        video: {
                          width: '100%',
                          borderRadius: '12px',
                        }
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 text-center mt-3">
                    Make sure the QR code is clearly visible and well-lit
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verified Order Details */}
        {verifiedOrder && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border-4 border-green-500">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">✓</span>
                <div>
                  <h2 className="text-2xl font-bold">Valid Pickup Code</h2>
                  <p className="text-green-100">Ready for confirmation</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <div className="text-sm opacity-90 mb-1">Pickup Code</div>
                <div className="text-3xl font-mono font-bold tracking-wider">
                  {verifiedOrder.pickup_code}
                </div>
                {verifiedOrder.pickup_code_expiry && (
                  <div className="text-sm opacity-90 mt-2">
                    Expires in: {formatRemainingTime(verifiedOrder.pickup_code_expiry)}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Customer Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👤</span>
                  <span className="font-semibold">
                    {verifiedOrder.customers?.full_name || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📱</span>
                  <span className="text-gray-700">
                    {verifiedOrder.customers?.phone || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🆔</span>
                  <span className="text-gray-700 font-mono text-sm">
                    Order #{verifiedOrder.id.slice(0, 8)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Order Items</h3>
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">
                        {item.products?.name || 'Unknown Product'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Quantity: {item.quantity} × {item.price.toFixed(2)} EGP
                      </div>
                    </div>
                    <div className="font-bold text-purple-600">
                      {(item.quantity * item.price).toFixed(2)} EGP
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-purple-600">
                  {verifiedOrder.total_amount.toFixed(2)} EGP
                </span>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirmPickup}
              disabled={confirming}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
            >
              {confirming ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Confirming...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="text-2xl">✓</span>
                  Confirm Pickup & Complete Order
                </span>
              )}
            </button>

            <p className="text-sm text-gray-600 text-center mt-4">
              ⚡ Rewards will be added automatically to the customer&apos;s account
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">ℹ️</span>
            How It Works
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span>Ask the customer for their 6-character pickup code or scan their QR code</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span>System verifies the code is valid, not expired, and belongs to your store</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span>Review order details and confirm pickup</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">4.</span>
              <span>Customer receives rewards automatically based on their tier</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
