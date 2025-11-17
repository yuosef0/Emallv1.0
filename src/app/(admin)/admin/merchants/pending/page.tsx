'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface Merchant {
  id: string
  user_id: string
  brand_name: string
  brand_name_ar: string | null
  description: string | null
  description_ar: string | null
  logo_url: string | null
  cover_image_url: string | null
  address: string
  address_ar: string | null
  city: string | null
  phone: string
  whatsapp: string | null
  approval_status: string
  created_at: string
  profiles?: {
    email: string
    full_name: string | null
  }
}

interface SubscriptionTier {
  id: string
  name: string
  price_monthly: number
  price_yearly: number
  priority_level: number
  max_products: number
}

export default function PendingMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [selectedTiers, setSelectedTiers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type !== 'admin') {
      router.push('/')
      return
    }

    setIsAdmin(true)
  }

  const loadData = async () => {
    setLoading(true)

    // Load pending merchants
    const { data: merchantsData, error: merchantsError } = await supabase
      .from('merchants')
      .select(`
        *,
        profiles!inner(email, full_name)
      `)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: true })

    if (merchantsError) {
      toast.error('Failed to load pending merchants')
      console.error(merchantsError)
    } else {
      setMerchants(merchantsData || [])
    }

    // Load subscription tiers
    const { data: tiersData, error: tiersError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .order('priority_level', { ascending: true })

    if (tiersError) {
      toast.error('Failed to load subscription tiers')
      console.error(tiersError)
    } else {
      setTiers(tiersData || [])
      // Set default tier for each merchant (Basic tier)
      const defaults: Record<string, string> = {}
      merchantsData?.forEach((merchant) => {
        const basicTier = tiersData?.find(t => t.name === 'basic')
        if (basicTier) {
          defaults[merchant.id] = basicTier.id
        }
      })
      setSelectedTiers(defaults)
    }

    setLoading(false)
  }

  const handleApprove = async (merchantId: string) => {
    const selectedTierId = selectedTiers[merchantId]

    if (!selectedTierId) {
      toast.error('Please select a subscription tier')
      return
    }

    setProcessingId(merchantId)

    try {
      // Calculate subscription dates (30 days)
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30)

      // Get current user (admin) for approval tracking
      const { data: { user } } = await supabase.auth.getUser()

      // Update merchant
      const { error } = await supabase
        .from('merchants')
        .update({
          approval_status: 'approved',
          subscription_status: 'active',
          subscription_tier_id: selectedTierId,
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString(),
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', merchantId)

      if (error) {
        toast.error('Failed to approve merchant')
        console.error(error)
      } else {
        toast.success('Merchant approved successfully!')

        // Send notification to merchant
        const merchant = merchants.find(m => m.id === merchantId)
        if (merchant) {
          await supabase.from('notifications').insert({
            user_id: merchant.user_id,
            title: 'Merchant Account Approved!',
            message: `Your merchant account "${merchant.brand_name}" has been approved and activated. You can now start adding products!`,
            type: 'system',
            link: '/dashboard',
          })
        }

        // Reload data
        loadData()
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (merchantId: string) => {
    const reason = prompt('Enter rejection reason (optional):')

    setProcessingId(merchantId)

    try {
      const { error } = await supabase
        .from('merchants')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason || 'Not specified',
        })
        .eq('id', merchantId)

      if (error) {
        toast.error('Failed to reject merchant')
        console.error(error)
      } else {
        toast.success('Merchant rejected')

        // Send notification to merchant
        const merchant = merchants.find(m => m.id === merchantId)
        if (merchant) {
          await supabase.from('notifications').insert({
            user_id: merchant.user_id,
            title: 'Merchant Application Rejected',
            message: `Your merchant application for "${merchant.brand_name}" has been rejected. Reason: ${reason || 'Not specified'}`,
            type: 'system',
          })
        }

        // Reload data
        loadData()
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    } finally {
      setProcessingId(null)
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Checking permissions...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending merchants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Pending Merchant Applications
              </h1>
              <p className="text-gray-600">
                Review and approve merchant applications
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-600">
                {merchants.length}
              </div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
          </div>
        </div>

        {/* Merchants List */}
        {merchants.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              All Caught Up!
            </h2>
            <p className="text-gray-600">
              No pending merchant applications at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {merchants.map((merchant) => {
              const selectedTier = tiers.find(t => t.id === selectedTiers[merchant.id])
              const isProcessing = processingId === merchant.id

              return (
                <div
                  key={merchant.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                >
                  <div className="md:flex">
                    {/* Left Side - Images */}
                    <div className="md:w-1/3 bg-gray-100 relative">
                      {merchant.cover_image_url ? (
                        <div className="relative h-48 md:h-full">
                          <Image
                            src={merchant.cover_image_url}
                            alt={merchant.brand_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-48 md:h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <div className="text-6xl mb-2">🏪</div>
                            <div>No Cover Image</div>
                          </div>
                        </div>
                      )}
                      {merchant.logo_url && (
                        <div className="absolute bottom-4 left-4">
                          <Image
                            src={merchant.logo_url}
                            alt={merchant.brand_name}
                            width={80}
                            height={80}
                            className="rounded-full border-4 border-white shadow-lg"
                          />
                        </div>
                      )}
                    </div>

                    {/* Right Side - Info */}
                    <div className="md:w-2/3 p-6">
                      {/* Brand Info */}
                      <div className="mb-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                              {merchant.brand_name}
                              {merchant.brand_name_ar && (
                                <span className="text-gray-500 text-lg mr-2">
                                  ({merchant.brand_name_ar})
                                </span>
                              )}
                            </h2>
                            <div className="text-sm text-gray-500 mt-1">
                              Applied on: {new Date(merchant.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {merchant.description && (
                          <p className="text-gray-600 mt-2">{merchant.description}</p>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-500">Contact Person</div>
                          <div className="font-semibold">
                            {merchant.profiles?.full_name || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Email</div>
                          <div className="font-semibold">{merchant.profiles?.email}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Phone</div>
                          <div className="font-semibold">{merchant.phone}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">WhatsApp</div>
                          <div className="font-semibold">{merchant.whatsapp || 'N/A'}</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-sm text-gray-500">Address</div>
                          <div className="font-semibold">
                            {merchant.address}
                            {merchant.city && `, ${merchant.city}`}
                          </div>
                        </div>
                      </div>

                      {/* Subscription Tier Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Assign Subscription Tier
                        </label>
                        <select
                          value={selectedTiers[merchant.id] || ''}
                          onChange={(e) =>
                            setSelectedTiers({
                              ...selectedTiers,
                              [merchant.id]: e.target.value,
                            })
                          }
                          disabled={isProcessing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white disabled:opacity-50"
                        >
                          <option value="">Select a tier...</option>
                          {tiers.map((tier) => (
                            <option key={tier.id} value={tier.id}>
                              {tier.name.toUpperCase()} - {tier.price_monthly} EGP/month
                              (Max {tier.max_products} products)
                            </option>
                          ))}
                        </select>
                        {selectedTier && (
                          <div className="mt-2 text-sm text-gray-600">
                            Selected: <span className="font-semibold">{selectedTier.name.toUpperCase()}</span> -
                            30-day trial period
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleApprove(merchant.id)}
                          disabled={isProcessing || !selectedTiers[merchant.id]}
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              ✅ Approve & Activate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(merchant.id)}
                          disabled={isProcessing}
                          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              ❌ Reject
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
