import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Search, Store, ShoppingBag, TrendingUp, MapPin } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in, check user type and redirect accordingly
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    // Redirect admins and merchants to dashboard
    if (profile?.user_type === 'admin') {
      redirect('/admin/dashboard')
    } else if (profile?.user_type === 'merchant') {
      redirect('/dashboard')
    }
  }

  // Fetch subscription tiers for display
  const { data: tiers } = await supabase
    .from('subscription_tiers')
    .select('*')
    .order('priority_level', { ascending: true })

  // Fetch merchants by tier (top merchants from each tier)
  const { data: merchants } = await supabase
    .from('merchants')
    .select(`
      *,
      subscription_tiers (
        name,
        priority_level
      )
    `)
    .eq('approval_status', 'approved')
    .eq('subscription_status', 'active')
    .eq('is_banned', false)
    .order('display_order', { ascending: true })
    .limit(12)

  // Group merchants by tier
  const merchantsByTier = tiers?.map(tier => ({
    tier,
    merchants: (merchants || []).filter((m: any) =>
      m.subscription_tiers?.name === tier.name
    ).slice(0, 4) // Show max 4 merchants per tier
  })) || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">EMall</h1>
                <p className="text-xs text-gray-500">Local Marketplace</p>
              </div>
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {!user ? (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <Link
                  href="/cart"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Cart
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Welcome to EMall
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-indigo-100">
              Discover Local Merchants & Amazing Products
            </p>
            <p className="text-lg mb-10 text-indigo-100 max-w-2xl mx-auto">
              Shop from verified local merchants, enjoy exclusive deals, and earn rewards with every pickup order!
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for merchants or products..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 text-lg shadow-2xl focus:ring-4 focus:ring-white/30 outline-none"
                />
              </div>
            </div>

            {/* CTA Buttons */}
            {!user && (
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all shadow-xl"
                >
                  Start Shopping
                </Link>
                <Link
                  href="/register/merchant"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all"
                >
                  Become a Merchant
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <Store className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Verified Merchants
              </h3>
              <p className="text-gray-600">
                Shop from trusted local businesses verified by our team
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Pickup & Delivery
              </h3>
              <p className="text-gray-600">
                Choose to pickup in-store or get it delivered to your door
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
                <TrendingUp className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Earn Rewards
              </h3>
              <p className="text-gray-600">
                Get rewards points with every pickup order you complete
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Merchants by Tier */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Browse Our Merchants
        </h2>

        {merchantsByTier.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">
              No merchants available yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {merchantsByTier.map(({ tier, merchants }) => (
              <div key={tier.id}>
                {/* Tier Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`px-4 py-2 rounded-lg ${
                    tier.name === 'premium'
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
                      : tier.name === 'standard'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white'
                      : 'bg-gradient-to-r from-gray-400 to-gray-600 text-white'
                  }`}>
                    <span className="font-bold text-lg capitalize">{tier.name} Tier</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                {/* Merchants Grid */}
                {merchants.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No {tier.name} merchants yet
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {merchants.map((merchant: any) => (
                      <Link
                        key={merchant.id}
                        href={`/merchants/${merchant.id}`}
                        className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all overflow-hidden border border-gray-200 hover:border-indigo-300"
                      >
                        {/* Merchant Image */}
                        <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 relative overflow-hidden">
                          {merchant.cover_image_url ? (
                            <img
                              src={merchant.cover_image_url}
                              alt={merchant.brand_name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Store className="w-16 h-16 text-indigo-300" />
                            </div>
                          )}
                        </div>

                        {/* Merchant Info */}
                        <div className="p-4">
                          <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                            {merchant.brand_name}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {merchant.description || 'No description available'}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              {merchant.pickup_orders_count || 0} pickups
                            </span>
                            {merchant.rating > 0 && (
                              <span className="text-yellow-500 font-semibold">
                                ⭐ {merchant.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">EMall</h3>
              <p className="text-gray-400">
                Your local merchants marketplace. Connecting communities through commerce.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/register/merchant" className="hover:text-white">Become a Merchant</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} EMall. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
