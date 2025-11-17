'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'

interface CartItem {
  product_id: string
  quantity: number
  selected_size?: string
  selected_color?: string
}

interface ProductDetails {
  id: string
  name: string
  name_ar: string | null
  price: number
  merchant_id: string
  images: any
  inventory_quantity: number
}

interface MerchantDetails {
  id: string
  brand_name: string
  brand_name_ar: string | null
  logo_url: string | null
  address: string | null
  city: string | null
  phone: string | null
}

interface MerchantGroup {
  merchant: MerchantDetails
  items: Array<{
    product: ProductDetails
    cartItem: CartItem
  }>
  subtotal: number
  deliveryMethod: 'delivery' | 'pickup'
  pickupCode?: string
  pickupCodeExpiry?: string
  orderId?: string
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [merchantGroups, setMerchantGroups] = useState<MerchantGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingCode, setGeneratingCode] = useState<string | null>(null)
  const [qrDataUrls, setQrDataUrls] = useState<{ [key: string]: string }>({})
  const router = useRouter()
  const supabase = createClient()
  const qrCanvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({})

  useEffect(() => {
    loadCartData()
  }, [])

  const loadCartData = async () => {
    setLoading(true)

    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Load cart from localStorage
    const cartData = localStorage.getItem('cart')
    if (!cartData) {
      setLoading(false)
      return
    }

    const items: CartItem[] = JSON.parse(cartData)
    setCartItems(items)

    if (items.length === 0) {
      setLoading(false)
      return
    }

    // Load product details
    const productIds = items.map(item => item.product_id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, name_ar, price, merchant_id, images, inventory_quantity')
      .in('id', productIds)

    if (productsError || !products) {
      toast.error('Failed to load cart products')
      setLoading(false)
      return
    }

    // Get unique merchant IDs
    const merchantIds = [...new Set(products.map(p => p.merchant_id))]

    // Load merchant details
    const { data: merchants, error: merchantsError } = await supabase
      .from('merchants')
      .select('id, brand_name, brand_name_ar, logo_url, address, city, phone')
      .in('id', merchantIds)

    if (merchantsError || !merchants) {
      toast.error('Failed to load merchant details')
      setLoading(false)
      return
    }

    // Group by merchant
    const groups: MerchantGroup[] = merchants.map(merchant => {
      const merchantProducts = products.filter(p => p.merchant_id === merchant.id)
      const merchantItems = merchantProducts.map(product => {
        const cartItem = items.find(item => item.product_id === product.id)!
        return {
          product,
          cartItem
        }
      })

      const subtotal = merchantItems.reduce((sum, item) => {
        return sum + (item.product.price * item.cartItem.quantity)
      }, 0)

      return {
        merchant,
        items: merchantItems,
        subtotal,
        deliveryMethod: 'delivery'
      }
    })

    setMerchantGroups(groups)
    setLoading(false)
  }

  const handleDeliveryMethodChange = (merchantId: string, method: 'delivery' | 'pickup') => {
    setMerchantGroups(groups =>
      groups.map(group =>
        group.merchant.id === merchantId
          ? { ...group, deliveryMethod: method, pickupCode: undefined, pickupCodeExpiry: undefined, orderId: undefined }
          : group
      )
    )
    // Clear QR code if switching away from pickup
    if (method === 'delivery') {
      setQrDataUrls(prev => {
        const newUrls = { ...prev }
        delete newUrls[merchantId]
        return newUrls
      })
    }
  }

  const generatePickupCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleGeneratePickupCode = async (merchantId: string) => {
    setGeneratingCode(merchantId)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please login first')
        router.push('/login')
        return
      }

      const group = merchantGroups.find(g => g.merchant.id === merchantId)
      if (!group) return

      // Generate pickup code
      const pickupCode = generatePickupCode()

      // Set expiry (10 minutes from now)
      const expiryDate = new Date()
      expiryDate.setMinutes(expiryDate.getMinutes() + 10)

      // Create order
      const orderData = {
        customer_id: user.id,
        merchant_id: merchantId,
        total_amount: group.subtotal,
        status: 'pending',
        delivery_method: 'pickup',
        pickup_code: pickupCode,
        pickup_code_expiry: expiryDate.toISOString(),
        pickup_code_used: false
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) {
        console.error('Order creation error:', orderError)
        toast.error('Failed to create order')
        setGeneratingCode(null)
        return
      }

      // Create order items
      const orderItems = group.items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.cartItem.quantity,
        price_at_time: item.product.price,
        selected_size: item.cartItem.selected_size,
        selected_color: item.cartItem.selected_color
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Order items error:', itemsError)
        toast.error('Failed to create order items')
        setGeneratingCode(null)
        return
      }

      // Update merchant group with pickup code
      setMerchantGroups(groups =>
        groups.map(g =>
          g.merchant.id === merchantId
            ? { ...g, pickupCode, pickupCodeExpiry: expiryDate.toISOString(), orderId: order.id }
            : g
        )
      )

      // Generate QR code
      try {
        const qrCanvas = document.createElement('canvas')
        await QRCode.toCanvas(qrCanvas, pickupCode, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        const qrDataUrl = qrCanvas.toDataURL()
        setQrDataUrls(prev => ({ ...prev, [merchantId]: qrDataUrl }))
      } catch (qrError) {
        console.error('QR generation error:', qrError)
        toast.error('Failed to generate QR code')
      }

      // Remove items from cart for this merchant
      const updatedCart = cartItems.filter(item => {
        const product = group.items.find(i => i.product.id === item.product_id)
        return !product
      })
      setCartItems(updatedCart)
      localStorage.setItem('cart', JSON.stringify(updatedCart))

      toast.success('Pickup code generated! صلاحيته 10 دقائق', { duration: 6000 })
    } catch (error) {
      console.error('Error generating pickup code:', error)
      toast.error('Failed to generate pickup code')
    } finally {
      setGeneratingCode(null)
    }
  }

  const handleRemoveItem = (productId: string) => {
    const updatedCart = cartItems.filter(item => item.product_id !== productId)
    setCartItems(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
    loadCartData()
  }

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    const updatedCart = cartItems.map(item =>
      item.product_id === productId
        ? { ...item, quantity: newQuantity }
        : item
    )
    setCartItems(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
    loadCartData()
  }

  const getTotalAmount = () => {
    return merchantGroups.reduce((sum, group) => sum + group.subtotal, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    )
  }

  if (merchantGroups.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-8xl mb-6">🛒</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 text-lg mb-8">
              Start shopping to add items to your cart
            </p>
            <Link
              href="/"
              className="inline-block bg-purple-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-purple-700 transition transform hover:scale-105 shadow-lg"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <span className="text-6xl">🛒</span>
            Shopping Cart
          </h1>
          <p className="text-gray-600 text-lg">Review your items and complete your order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items - Grouped by Merchant */}
          <div className="lg:col-span-2 space-y-6">
            {merchantGroups.map((group) => (
              <div key={group.merchant.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Merchant Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
                  <div className="flex items-center gap-4">
                    {group.merchant.logo_url ? (
                      <div className="relative w-16 h-16 rounded-full border-4 border-white overflow-hidden flex-shrink-0">
                        <Image
                          src={group.merchant.logo_url}
                          alt={group.merchant.brand_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl flex-shrink-0">
                        🏪
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold">{group.merchant.brand_name}</h2>
                      {group.merchant.city && (
                        <p className="text-white/90 flex items-center gap-1">
                          <span>📍</span>
                          {group.merchant.address && `${group.merchant.address}, `}{group.merchant.city}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Products List */}
                <div className="p-6">
                  {!group.pickupCode ? (
                    <>
                      <div className="space-y-4 mb-6">
                        {group.items.map(({ product, cartItem }) => {
                          const productImage = product.images && Array.isArray(product.images) && product.images.length > 0
                            ? product.images[0]
                            : null

                          return (
                            <div key={product.id} className="flex gap-4 border-b border-gray-200 pb-4">
                              {/* Product Image */}
                              <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {productImage ? (
                                  <Image
                                    src={productImage}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="h-full flex items-center justify-center text-4xl">
                                    📦
                                  </div>
                                )}
                              </div>

                              {/* Product Details */}
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-800 mb-1">
                                  {product.name}
                                </h3>
                                {product.name_ar && (
                                  <p className="text-sm text-gray-600 mb-2" dir="rtl">
                                    {product.name_ar}
                                  </p>
                                )}

                                {/* Size & Color */}
                                <div className="flex gap-3 mb-2 text-sm text-gray-600">
                                  {cartItem.selected_size && (
                                    <span className="bg-gray-100 px-2 py-1 rounded">
                                      Size: {cartItem.selected_size}
                                    </span>
                                  )}
                                  {cartItem.selected_color && (
                                    <span className="bg-gray-100 px-2 py-1 rounded">
                                      Color: {cartItem.selected_color}
                                    </span>
                                  )}
                                </div>

                                {/* Price & Quantity */}
                                <div className="flex items-center justify-between">
                                  <div className="text-2xl font-bold text-gray-800">
                                    {product.price.toFixed(2)} EGP
                                  </div>

                                  {/* Quantity Controls */}
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => handleUpdateQuantity(product.id, cartItem.quantity - 1)}
                                      className="bg-gray-200 text-gray-700 w-8 h-8 rounded-lg font-bold hover:bg-gray-300 transition"
                                    >
                                      -
                                    </button>
                                    <span className="font-semibold text-lg w-8 text-center">
                                      {cartItem.quantity}
                                    </span>
                                    <button
                                      onClick={() => handleUpdateQuantity(product.id, cartItem.quantity + 1)}
                                      className="bg-gray-200 text-gray-700 w-8 h-8 rounded-lg font-bold hover:bg-gray-300 transition"
                                      disabled={cartItem.quantity >= product.inventory_quantity}
                                    >
                                      +
                                    </button>
                                    <button
                                      onClick={() => handleRemoveItem(product.id)}
                                      className="ml-3 text-red-600 hover:text-red-700 font-semibold"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Subtotal */}
                      <div className="bg-purple-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between text-xl">
                          <span className="font-semibold text-gray-800">Subtotal:</span>
                          <span className="font-bold text-purple-600">
                            {group.subtotal.toFixed(2)} EGP
                          </span>
                        </div>
                      </div>

                      {/* Delivery Method Selection */}
                      <div className="mb-6">
                        <h3 className="font-bold text-lg text-gray-800 mb-4">Delivery Method</h3>
                        <div className="space-y-3">
                          {/* Delivery Option */}
                          <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                            group.deliveryMethod === 'delivery'
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}>
                            <input
                              type="radio"
                              name={`delivery-${group.merchant.id}`}
                              value="delivery"
                              checked={group.deliveryMethod === 'delivery'}
                              onChange={() => handleDeliveryMethodChange(group.merchant.id, 'delivery')}
                              className="w-5 h-5 text-purple-600"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 flex items-center gap-2">
                                <span className="text-2xl">🚚</span>
                                Home Delivery
                              </div>
                              <div className="text-sm text-gray-600">We&apos;ll deliver to your address</div>
                            </div>
                          </label>

                          {/* Pickup Option */}
                          <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                            group.deliveryMethod === 'pickup'
                              ? 'border-green-600 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}>
                            <input
                              type="radio"
                              name={`delivery-${group.merchant.id}`}
                              value="pickup"
                              checked={group.deliveryMethod === 'pickup'}
                              onChange={() => handleDeliveryMethodChange(group.merchant.id, 'pickup')}
                              className="w-5 h-5 text-green-600"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 flex items-center gap-2">
                                <span className="text-2xl">📍</span>
                                Pickup from Store
                              </div>
                              <div className="text-sm text-gray-600">Pick up from merchant location</div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {group.deliveryMethod === 'pickup' ? (
                        <button
                          onClick={() => handleGeneratePickupCode(group.merchant.id)}
                          disabled={generatingCode === group.merchant.id}
                          className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition disabled:bg-gray-400 flex items-center justify-center gap-3"
                        >
                          {generatingCode === group.merchant.id ? (
                            <>
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <span className="text-2xl">📱</span>
                              Generate Pickup Code
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => toast.success('Checkout feature coming soon!')}
                          className="w-full bg-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-purple-700 transition flex items-center justify-center gap-3"
                        >
                          <span className="text-2xl">💳</span>
                          Proceed to Checkout
                        </button>
                      )}
                    </>
                  ) : (
                    /* Pickup Code Display */
                    <div className="text-center">
                      <div className="mb-6">
                        <div className="inline-block bg-green-100 text-green-800 px-6 py-3 rounded-lg font-bold text-lg mb-4">
                          ✓ Order Created Successfully!
                        </div>
                      </div>

                      {/* QR Code */}
                      {qrDataUrls[group.merchant.id] && (
                        <div className="mb-6">
                          <div className="inline-block bg-white p-6 rounded-xl shadow-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={qrDataUrls[group.merchant.id]}
                              alt="Pickup QR Code"
                              className="w-72 h-72 mx-auto"
                            />
                          </div>
                        </div>
                      )}

                      {/* Pickup Code */}
                      <div className="bg-gray-50 rounded-xl p-8 mb-6">
                        <div className="text-sm text-gray-600 mb-2">Your Pickup Code</div>
                        <div className="text-6xl font-bold text-purple-600 tracking-widest mb-4 font-mono">
                          {group.pickupCode}
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          Show this code at the store
                        </div>
                        {group.pickupCodeExpiry && (
                          <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg inline-block font-semibold">
                            ⏰ صلاحيته 10 دقائق - Expires at{' '}
                            {new Date(group.pickupCodeExpiry).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>

                      {/* Store Info */}
                      <div className="bg-purple-50 rounded-lg p-6">
                        <h3 className="font-bold text-lg text-gray-800 mb-3">Store Location</h3>
                        <div className="text-gray-700">
                          <p className="font-semibold">{group.merchant.brand_name}</p>
                          {group.merchant.address && <p>{group.merchant.address}</p>}
                          {group.merchant.city && <p>{group.merchant.city}</p>}
                          {group.merchant.phone && (
                            <p className="mt-2">
                              <a
                                href={`tel:${group.merchant.phone}`}
                                className="text-blue-600 hover:underline font-semibold"
                              >
                                📞 {group.merchant.phone}
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Items:</span>
                  <span className="font-semibold">{cartItems.length}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{getTotalAmount().toFixed(2)} EGP</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-xl">
                    <span className="font-bold text-gray-800">Total:</span>
                    <span className="font-bold text-purple-600">
                      {getTotalAmount().toFixed(2)} EGP
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">💡 Tip:</p>
                <p>Choose pickup to earn rewards for your merchant!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
