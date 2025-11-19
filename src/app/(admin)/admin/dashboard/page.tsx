import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Store, ShoppingBag, TrendingUp, Settings, LogOut } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type, full_name, email')
    .eq('id', user.id)
    .single()

  if (profile?.user_type !== 'admin') {
    redirect('/')
  }

  // Fetch statistics
  const [
    { count: totalUsers },
    { count: totalMerchants },
    { count: pendingMerchants },
    { count: totalOrders },
    { count: totalProducts },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('merchants').select('*', { count: 'exact', head: true }),
    supabase
      .from('merchants')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending'),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
  ])

  // Fetch recent merchants
  const { data: recentMerchants } = await supabase
    .from('merchants')
    .select('*, profiles!merchants_user_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*, profiles!orders_customer_id_fkey(full_name), merchants(brand_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {profile?.full_name || 'Admin'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium"
              >
                View Site
              </Link>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {totalUsers || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Total Merchants */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Merchants</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {totalMerchants || 0}
                </p>
                {pendingMerchants ? (
                  <p className="text-xs text-orange-600 mt-1">
                    {pendingMerchants} pending approval
                  </p>
                ) : null}
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {totalOrders || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Products */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {totalProducts || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/merchants"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
            >
              <Store className="w-8 h-8 text-indigo-600 mb-2" />
              <h3 className="font-bold text-gray-900 mb-1">Manage Merchants</h3>
              <p className="text-sm text-gray-600">
                Approve, reject, or ban merchant accounts
              </p>
            </Link>

            <Link
              href="/admin/users"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <Users className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-bold text-gray-900 mb-1">Manage Users</h3>
              <p className="text-sm text-gray-600">
                View and manage user accounts
              </p>
            </Link>

            <Link
              href="/admin/settings"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
            >
              <Settings className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="font-bold text-gray-900 mb-1">Settings</h3>
              <p className="text-sm text-gray-600">
                Configure site settings and tiers
              </p>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Merchants */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Recent Merchants</h2>
            </div>
            <div className="p-6">
              {!recentMerchants || recentMerchants.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No merchants yet
                </p>
              ) : (
                <div className="space-y-4">
                  {recentMerchants.map((merchant: any) => (
                    <div
                      key={merchant.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {merchant.brand_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {merchant.profiles?.email || 'No email'}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          merchant.approval_status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : merchant.approval_status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {merchant.approval_status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            </div>
            <div className="p-6">
              {!recentOrders || recentOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No orders yet
                </p>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          Order #{order.order_number}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.merchants?.brand_name || 'Unknown merchant'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {order.total_amount.toFixed(2)} EGP
                        </p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
