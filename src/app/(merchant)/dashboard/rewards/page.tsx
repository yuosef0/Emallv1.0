'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Merchant {
  id: string
  brand_name: string
  pickup_orders_count: number
  pickup_rewards_points: number
  discount_percentage: number
}

interface Milestone {
  id: string
  pickups_required: number
  reward_type: string
  reward_value: number
  description: string
  description_ar: string
  is_active: boolean
}

interface RewardHistory {
  id: string
  points_earned: number
  reward_type: string
  description: string
  created_at: string
}

export default function PickupRewardsPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [rewardHistory, setRewardHistory] = useState<RewardHistory[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Get merchant record
    const { data: merchantData, error: merchantError } = await supabase
      .from('merchants')
      .select('id, brand_name, pickup_orders_count, pickup_rewards_points, discount_percentage')
      .eq('user_id', user.id)
      .single()

    if (merchantError || !merchantData) {
      toast.error('Failed to load merchant data')
      router.push('/dashboard')
      return
    }

    setMerchant(merchantData)

    // Load milestones
    const { data: milestonesData, error: milestonesError } = await supabase
      .from('reward_milestones')
      .select('*')
      .eq('is_active', true)
      .order('pickups_required', { ascending: true })

    if (milestonesError) {
      // Fallback to hardcoded milestones if table doesn't exist or error
      setMilestones([
        {
          id: '1',
          pickups_required: 10,
          reward_type: 'discount',
          reward_value: 5,
          description: '5% Discount on monthly subscription',
          description_ar: 'خصم 5% على الاشتراك الشهري',
          is_active: true,
        },
        {
          id: '2',
          pickups_required: 25,
          reward_type: 'boost',
          reward_value: 10,
          description: 'Visibility boost - 10 positions higher',
          description_ar: 'تحسين ترتيب الظهور بـ 10 مراكز',
          is_active: true,
        },
        {
          id: '3',
          pickups_required: 50,
          reward_type: 'discount',
          reward_value: 10,
          description: '10% Discount on monthly subscription',
          description_ar: 'خصم 10% على الاشتراك الشهري',
          is_active: true,
        },
        {
          id: '4',
          pickups_required: 100,
          reward_type: 'badge',
          reward_value: 15,
          description: 'Featured Badge + 15% Discount',
          description_ar: 'شارة "تاجر مميز" + خصم 15%',
          is_active: true,
        },
        {
          id: '5',
          pickups_required: 200,
          reward_type: 'discount',
          reward_value: 20,
          description: '20% Discount on monthly subscription',
          description_ar: 'خصم 20% على الاشتراك الشهري',
          is_active: true,
        },
        {
          id: '6',
          pickups_required: 500,
          reward_type: 'vip',
          reward_value: 30,
          description: '30% Discount + VIP Status',
          description_ar: 'خصم 30% + حالة VIP',
          is_active: true,
        },
      ])
    } else {
      setMilestones(milestonesData || [])
    }

    // Load reward history
    const { data: historyData } = await supabase
      .from('pickup_rewards')
      .select('*')
      .eq('merchant_id', merchantData.id)
      .order('created_at', { ascending: false })
      .limit(10)

    setRewardHistory(historyData || [])
    setLoading(false)
  }

  const getCurrentMilestone = () => {
    if (!merchant) return null

    for (let i = milestones.length - 1; i >= 0; i--) {
      if (merchant.pickup_orders_count >= milestones[i].pickups_required) {
        return milestones[i]
      }
    }
    return null
  }

  const getNextMilestone = () => {
    if (!merchant) return null

    for (const milestone of milestones) {
      if (merchant.pickup_orders_count < milestone.pickups_required) {
        return milestone
      }
    }
    return null
  }

  const calculateProgress = () => {
    if (!merchant) return 0

    const nextMilestone = getNextMilestone()
    if (!nextMilestone) return 100

    const currentMilestone = getCurrentMilestone()
    const startPickups = currentMilestone ? currentMilestone.pickups_required : 0
    const targetPickups = nextMilestone.pickups_required
    const currentPickups = merchant.pickup_orders_count

    const progress = ((currentPickups - startPickups) / (targetPickups - startPickups)) * 100
    return Math.min(Math.max(progress, 0), 100)
  }

  const getMilestoneStatus = (milestone: Milestone) => {
    if (!merchant) return 'locked'

    if (merchant.pickup_orders_count >= milestone.pickups_required) {
      return 'achieved'
    }

    const nextMilestone = getNextMilestone()
    if (nextMilestone?.id === milestone.id) {
      return 'current'
    }

    return 'locked'
  }

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case 'achieved':
        return '✅'
      case 'current':
        return '🎯'
      default:
        return '🔒'
    }
  }

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return '💰'
      case 'boost':
        return '📈'
      case 'badge':
        return '⭐'
      case 'vip':
        return '👑'
      default:
        return '🎁'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rewards...</p>
        </div>
      </div>
    )
  }

  if (!merchant) {
    return null
  }

  const nextMilestone = getNextMilestone()
  const progress = calculateProgress()
  const remainingPickups = nextMilestone
    ? nextMilestone.pickups_required - merchant.pickup_orders_count
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-purple-600 hover:text-purple-700 font-semibold mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎁 Pickup Rewards</h1>
          <p className="text-gray-600">Track your progress and earn amazing rewards</p>
        </div>

        {/* Current Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Pickup Orders */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl font-bold mb-2">{merchant.pickup_orders_count}</div>
            <div className="text-xl font-semibold mb-1">Pickup Orders</div>
            <div className="text-white/80 text-sm">طلبات الاستلام المكتملة</div>
          </div>

          {/* Reward Points */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl font-bold mb-2">{merchant.pickup_rewards_points}</div>
            <div className="text-xl font-semibold mb-1">Reward Points</div>
            <div className="text-white/80 text-sm">نقاط المكافآت</div>
          </div>

          {/* Current Discount */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl font-bold mb-2">{merchant.discount_percentage}%</div>
            <div className="text-xl font-semibold mb-1">Subscription Discount</div>
            <div className="text-white/80 text-sm">خصم الاشتراك الشهري</div>
          </div>
        </div>

        {/* Next Milestone Section */}
        {nextMilestone && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🎯 Next Milestone</h2>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{nextMilestone.description}</h3>
                  <p className="text-gray-600">{nextMilestone.description_ar}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600">
                    {getRewardTypeIcon(nextMilestone.reward_type)}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">
                  Progress: {merchant.pickup_orders_count} / {nextMilestone.pickups_required} pickups
                </span>
                <span className="text-sm font-semibold text-purple-600">
                  {progress.toFixed(0)}%
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 h-4 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  <div className="h-full w-full bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Remaining Pickups */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-purple-700 font-semibold">Remaining Pickups</div>
                  <div className="text-xs text-purple-600">طلبات متبقية</div>
                </div>
                <div className="text-4xl font-bold text-purple-600">{remainingPickups}</div>
              </div>
            </div>
          </div>
        )}

        {/* All Milestones List */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 All Milestones</h2>

          <div className="space-y-4">
            {milestones.map((milestone) => {
              const status = getMilestoneStatus(milestone)
              const icon = getMilestoneIcon(status)

              return (
                <div
                  key={milestone.id}
                  className={`border-2 rounded-xl p-6 transition ${
                    status === 'achieved'
                      ? 'border-green-500 bg-green-50'
                      : status === 'current'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{icon}</div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl font-bold text-gray-800">
                            {milestone.pickups_required}
                          </span>
                          <span className="text-sm text-gray-500">pickups</span>
                          {status === 'current' && (
                            <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              IN PROGRESS
                            </span>
                          )}
                          {status === 'achieved' && (
                            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              ACHIEVED
                            </span>
                          )}
                        </div>
                        <div className="text-lg font-semibold text-gray-700">
                          {milestone.description}
                        </div>
                        <div className="text-sm text-gray-600">{milestone.description_ar}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl">{getRewardTypeIcon(milestone.reward_type)}</div>
                      {milestone.reward_type === 'discount' || milestone.reward_type === 'vip' ? (
                        <div className="text-2xl font-bold text-purple-600 mt-2">
                          {milestone.reward_value}%
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Rewards History */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">📜 Recent Rewards History</h2>

          {rewardHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎁</div>
              <p className="text-gray-600">No rewards earned yet</p>
              <p className="text-sm text-gray-500 mt-2">Complete pickup orders to start earning rewards!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rewardHistory.map((reward) => (
                <div
                  key={reward.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{getRewardTypeIcon(reward.reward_type)}</div>
                      <div>
                        <div className="font-semibold text-gray-800">{reward.description}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(reward.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                        +{reward.points_earned} points
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action Card */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">🚀 Keep Going!</h2>
            <p className="text-xl text-white/90">
              More pickups = More rewards = More savings!
            </p>
            <p className="text-white/80 mt-2">
              كل ما تزيد طلبات الاستلام، كل ما توفر أكثر!
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">💰</div>
              <div className="font-bold mb-1">Save Money</div>
              <div className="text-sm text-white/80">Up to 30% discount on subscription</div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">📈</div>
              <div className="font-bold mb-1">Better Visibility</div>
              <div className="text-sm text-white/80">Higher ranking on platform</div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">⭐</div>
              <div className="font-bold mb-1">Featured Badge</div>
              <div className="text-sm text-white/80">Stand out from competition</div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">👑</div>
              <div className="font-bold mb-1">VIP Status</div>
              <div className="text-sm text-white/80">Exclusive benefits & support</div>
            </div>
          </div>

          {/* Quick Action */}
          <div className="mt-8 text-center">
            <Link
              href="/dashboard/orders"
              className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition shadow-lg"
            >
              View Pending Orders →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
