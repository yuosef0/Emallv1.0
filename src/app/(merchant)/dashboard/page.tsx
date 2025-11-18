import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from '@/components/layout/DashboardHeader'

export const dynamic = 'force-dynamic'

export default async function MerchantDashboard() {
  const supabase = await createServerSupabaseClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  // Redirect if not merchant
  if (profile?.user_type !== 'merchant') {
    redirect('/')
  }

  // Get merchant data with subscription tier
  const { data: merchant } = await supabase
    .from('merchants')
    .select(`
      *,
      subscription_tiers(*)
    `)
    .eq('user_id', user.id)
    .single()

  // If no merchant record, redirect to setup
  if (!merchant) {
    redirect('/dashboard/setup')
  }

  // Get statistics
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('merchant_id', merchant.id)

  const { data: orders } = await supabase
    .from('orders')
    .select('total_amount, status')
    .eq('merchant_id', merchant.id)

  const totalRevenue = orders?.reduce((sum, order) =>
    order.status === 'delivered' ? sum + parseFloat(order.total_amount as any) : sum, 0
  ) || 0

  const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0

  // Check if pending approval
  const isPending = merchant.approval_status === 'pending'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Pending Approval Alert */}
        {isPending && (
          <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="text-5xl">⏳</div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Account Pending Approval</h2>
                <p className="text-white/90">
                  Your merchant application is currently under review. You&apos;ll receive a notification once your account is approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header Card with Notification Bell */}
        <DashboardHeader merchant={merchant} userId={user.id} />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Products Count */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📦</div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Products</div>
                <div className="text-3xl font-bold text-gray-800">{productsCount || 0}</div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Max: {merchant.subscription_tiers?.max_products || 0}
            </div>
            <div className="mt-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full h-2"
                  style={{
                    width: `${Math.min(
                      ((productsCount || 0) / (merchant.subscription_tiers?.max_products || 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🛒</div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Pending Orders</div>
                <div className="text-3xl font-bold text-orange-600">{pendingOrders}</div>
              </div>
            </div>
            {pendingOrders > 0 ? (
              <Link
                href="/dashboard/orders"
                className="text-sm text-orange-600 hover:underline font-semibold"
              >
                View pending orders →
              </Link>
            ) : (
              <div className="text-sm text-gray-600">No pending orders</div>
            )}
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">💰</div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Revenue</div>
                <div className="text-3xl font-bold text-green-600">
                  {totalRevenue.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">EGP from delivered orders</div>
          </div>

          {/* Rating */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">⭐</div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Rating</div>
                <div className="text-3xl font-bold text-yellow-600">
                  {merchant.rating.toFixed(1)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={star <= Math.round(merchant.rating) ? 'text-yellow-500' : 'text-gray-300'}
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Pickup Rewards Section */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">🎁 Pickup Rewards System</h2>
              <p className="text-white/90 text-lg">
                Earn rewards and discounts by completing pickup orders
              </p>
            </div>
            <Link
              href="/dashboard/rewards"
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              View Details →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pickup Orders */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-5xl font-bold mb-2">{merchant.pickup_orders_count}</div>
              <div className="text-white/90 text-sm">Pickup Orders Completed</div>
            </div>

            {/* Reward Points */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-5xl font-bold mb-2">{merchant.pickup_rewards_points}</div>
              <div className="text-white/90 text-sm">Reward Points Earned</div>
            </div>

            {/* Discount */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-5xl font-bold mb-2">{merchant.discount_percentage}%</div>
              <div className="text-white/90 text-sm">Subscription Discount</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">⚡ Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Add New Product */}
            <Link
              href="/dashboard/products/new"
              className={`bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg p-8 hover:shadow-xl transition transform hover:scale-105 text-center ${
                isPending ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div className="text-5xl mb-4">➕</div>
              <div className="text-2xl font-bold mb-2">Add New Product</div>
              <div className="text-sm text-white/90">
                {isPending ? 'Available after approval' : 'Create a new product listing'}
              </div>
            </Link>

            {/* Manage Orders */}
            <Link
              href="/dashboard/orders"
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition transform hover:scale-105 text-center"
            >
              <div className="text-5xl mb-4">📋</div>
              <div className="text-2xl font-bold mb-2 text-gray-800">Manage Orders</div>
              <div className="text-sm text-gray-600">
                {pendingOrders > 0 ? `${pendingOrders} pending orders` : 'View and process orders'}
              </div>
              {pendingOrders > 0 && (
                <div className="mt-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block">
                  {pendingOrders} NEW
                </div>
              )}
            </Link>

            {/* Settings */}
            <Link
              href="/dashboard/settings"
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition transform hover:scale-105 text-center"
            >
              <div className="text-5xl mb-4">⚙️</div>
              <div className="text-2xl font-bold mb-2 text-gray-800">Settings</div>
              <div className="text-sm text-gray-600">
                Manage your store settings
              </div>
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        {merchant.subscription_end_date && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">ℹ️</div>
              <div>
                <div className="font-semibold text-blue-900">Subscription Information</div>
                <div className="text-sm text-blue-700 mt-1">
                  Your subscription expires on{' '}
                  <span className="font-semibold">
                    {new Date(merchant.subscription_end_date).toLocaleDateString()}
                  </span>
                  {' '}
                  <Link href="/dashboard/subscription" className="text-blue-600 hover:underline ml-2">
                    Manage subscription →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
