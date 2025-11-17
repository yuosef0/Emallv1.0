import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profile?.user_type !== 'admin') {
    redirect('/')
  }

  // Get statistics
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: totalMerchants } = await supabase
    .from('merchants')
    .select('*', { count: 'exact', head: true })

  const { count: pendingMerchants } = await supabase
    .from('merchants')
    .select('*', { count: 'exact', head: true })
    .eq('approval_status', 'pending')

  const { count: activeMerchants } = await supabase
    .from('merchants')
    .select('*', { count: 'exact', head: true })
    .eq('approval_status', 'approved')
    .eq('subscription_status', 'active')

  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  // Get most visited pages (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: pageVisits } = await supabase
    .from('page_visits')
    .select('page_url')
    .gte('visited_at', sevenDaysAgo.toISOString())

  // Count visits per page
  const visitCounts: Record<string, number> = {}
  pageVisits?.forEach(visit => {
    visitCounts[visit.page_url] = (visitCounts[visit.page_url] || 0) + 1
  })

  // Sort and get top 5
  const topPages = Object.entries(visitCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your EMall platform</p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">👥</div>
              <div className="text-right">
                <div className="text-sm opacity-90">Total Users</div>
                <div className="text-4xl font-bold">{totalUsers || 0}</div>
              </div>
            </div>
            <div className="text-sm opacity-90">All registered users</div>
          </div>

          {/* Total Merchants */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🏪</div>
              <div className="text-right">
                <div className="text-sm opacity-90">Total Merchants</div>
                <div className="text-4xl font-bold">{totalMerchants || 0}</div>
              </div>
            </div>
            <div className="text-sm opacity-90">All merchant accounts</div>
          </div>

          {/* Pending Merchants */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl shadow-lg p-6 relative overflow-hidden">
            {(pendingMerchants || 0) > 0 && (
              <div className="absolute top-2 right-2">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">⏳</div>
              <div className="text-right">
                <div className="text-sm opacity-90">Pending Approval</div>
                <div className="text-4xl font-bold">{pendingMerchants || 0}</div>
              </div>
            </div>
            <div className="text-sm opacity-90">
              {(pendingMerchants || 0) > 0 ? 'Requires your attention!' : 'All merchants approved'}
            </div>
          </div>

          {/* Active Merchants */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">✅</div>
              <div className="text-right">
                <div className="text-sm opacity-90">Active Merchants</div>
                <div className="text-4xl font-bold">{activeMerchants || 0}</div>
              </div>
            </div>
            <div className="text-sm opacity-90">Approved & active</div>
          </div>

          {/* Total Products */}
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📦</div>
              <div className="text-right">
                <div className="text-sm opacity-90">Total Products</div>
                <div className="text-4xl font-bold">{totalProducts || 0}</div>
              </div>
            </div>
            <div className="text-sm opacity-90">Products listed</div>
          </div>

          {/* Total Orders */}
          <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🛒</div>
              <div className="text-right">
                <div className="text-sm opacity-90">Total Orders</div>
                <div className="text-4xl font-bold">{totalOrders || 0}</div>
              </div>
            </div>
            <div className="text-sm opacity-90">All time orders</div>
          </div>
        </div>

        {/* Most Visited Pages */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            📊 Most Visited Pages
            <span className="text-sm font-normal text-gray-500">(Last 7 days)</span>
          </h2>
          {topPages.length > 0 ? (
            <div className="space-y-3">
              {topPages.map(([url, count], index) => (
                <div
                  key={url}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{url}</div>
                      <div className="text-sm text-gray-500">{count} visits</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{count}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No page visit data available yet
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Review Pending Merchants */}
            <Link
              href="/admin/merchants/pending"
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105 relative"
            >
              {(pendingMerchants || 0) > 0 && (
                <div className="absolute -top-2 -right-2 bg-white text-red-600 font-bold text-sm px-3 py-1 rounded-full shadow-lg">
                  {pendingMerchants}
                </div>
              )}
              <div className="text-4xl mb-4">⏳</div>
              <div className="text-xl font-bold mb-2">Review Pending</div>
              <div className="text-sm opacity-90">
                {(pendingMerchants || 0) > 0
                  ? `${pendingMerchants} merchant${pendingMerchants !== 1 ? 's' : ''} awaiting approval`
                  : 'No pending merchants'}
              </div>
            </Link>

            {/* Manage Merchants */}
            <Link
              href="/admin/merchants"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105"
            >
              <div className="text-4xl mb-4">🏪</div>
              <div className="text-xl font-bold mb-2">Manage Merchants</div>
              <div className="text-sm opacity-90">
                View, edit, and manage all merchants
              </div>
            </Link>

            {/* Advertising Spaces */}
            <Link
              href="/admin/advertising"
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105"
            >
              <div className="text-4xl mb-4">📢</div>
              <div className="text-xl font-bold mb-2">Advertising</div>
              <div className="text-sm opacity-90">
                Manage advertising spaces and campaigns
              </div>
            </Link>

            {/* Analytics */}
            <Link
              href="/admin/analytics"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105"
            >
              <div className="text-4xl mb-4">📈</div>
              <div className="text-xl font-bold mb-2">Analytics</div>
              <div className="text-sm opacity-90">
                View detailed platform analytics
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">🔔 Recent Activity</h2>
          <div className="text-center py-8 text-gray-500">
            Activity feed coming soon...
          </div>
        </div>
      </div>
    </div>
  )
}
