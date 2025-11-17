import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

interface Merchant {
  id: string
  brand_name: string
  brand_name_ar: string | null
  logo_url: string | null
  cover_image_url: string | null
  city: string | null
  description: string | null
  description_ar: string | null
  rating: number
  total_sales: number
  display_order: number
}

interface Tier {
  id: string
  name: string
  name_ar: string
  priority_level: number
}

interface Category {
  id: string
  name: string
  name_ar: string
}

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()

  // Get subscription tiers
  const { data: tiers } = await supabase
    .from('subscription_tiers')
    .select('*')
    .order('priority_level', { ascending: true })

  // Get merchants grouped by tier (10 per tier)
  const merchantsByTier = await Promise.all(
    (tiers || []).map(async (tier: Tier) => {
      const { data: merchants } = await supabase
        .from('merchants')
        .select('*')
        .eq('subscription_tier_id', tier.id)
        .eq('approval_status', 'approved')
        .eq('subscription_status', 'active')
        .eq('is_banned', false)
        .order('display_order', { ascending: true })
        .order('total_sales', { ascending: false })
        .limit(10)

      return {
        tier,
        merchants: (merchants || []) as Merchant[]
      }
    })
  )

  // Get categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  const getTierInfo = (priorityLevel: number) => {
    switch (priorityLevel) {
      case 1:
        return {
          title: 'Premium Merchants',
          titleAr: 'التجار المميزون',
          icon: '👑',
          badgeText: 'FEATURED',
          badgeClass: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
          borderClass: 'border-2 border-yellow-400'
        }
      case 2:
        return {
          title: 'Standard Merchants',
          titleAr: 'التجار القياسيون',
          icon: '⭐',
          badgeText: 'STANDARD',
          badgeClass: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
          borderClass: 'border-2 border-purple-400'
        }
      case 3:
        return {
          title: 'Basic Merchants',
          titleAr: 'تجار إيمول',
          icon: '🏪',
          badgeText: 'BASIC',
          badgeClass: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white',
          borderClass: 'border-2 border-blue-400'
        }
      default:
        return {
          title: 'Merchants',
          titleAr: 'التجار',
          icon: '🏪',
          badgeText: 'MERCHANT',
          badgeClass: 'bg-gray-500 text-white',
          borderClass: 'border-2 border-gray-400'
        }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold mb-4 animate-fade-in">
              Welcome to EMall
            </h1>
            <p className="text-2xl mb-2 text-white/90">
              Discover Amazing Local Brands
            </p>
            <p className="text-xl text-white/80">
              اكتشف أفضل العلامات التجارية المحلية
            </p>
          </div>

          {/* Category Buttons */}
          <div className="flex justify-center gap-4 flex-wrap max-w-4xl mx-auto">
            {(categories || []).map((category: Category) => (
              <Link
                key={category.id}
                href={`/categories/${category.name.toLowerCase()}`}
                className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-full font-semibold hover:bg-white/30 transition transform hover:scale-105 border-2 border-white/40"
              >
                {category.name_ar}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Merchants by Tier */}
      <div className="container mx-auto px-4 py-12">
        {merchantsByTier.map(({ tier, merchants }) => {
          const tierInfo = getTierInfo(tier.priority_level)

          if (merchants.length === 0) return null

          return (
            <section key={tier.id} className="mb-16">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-5xl">{tierInfo.icon}</span>
                    <h2 className="text-4xl font-bold text-gray-800">
                      {tierInfo.title}
                    </h2>
                  </div>
                  <p className="text-gray-600 text-lg ml-16">
                    {tierInfo.titleAr}
                  </p>
                </div>
                <Link
                  href={`/merchants?tier=${tier.id}`}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition transform hover:scale-105 shadow-lg"
                >
                  View All →
                </Link>
              </div>

              {/* Merchants Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {merchants.map((merchant) => (
                  <Link
                    key={merchant.id}
                    href={`/merchant/${merchant.id}`}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition transform hover:scale-105 group"
                  >
                    {/* Cover Image */}
                    <div className="relative h-40 bg-gradient-to-br from-purple-100 to-blue-100">
                      {merchant.cover_image_url ? (
                        <Image
                          src={merchant.cover_image_url}
                          alt={merchant.brand_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <div className="text-5xl mb-2">🏪</div>
                            <div className="text-sm">No Cover Image</div>
                          </div>
                        </div>
                      )}
                      {/* Featured Badge */}
                      {tier.priority_level === 1 && (
                        <div className="absolute top-3 right-3">
                          <div className={`${tierInfo.badgeClass} px-3 py-1 rounded-full text-xs font-bold shadow-lg`}>
                            ⭐ {tierInfo.badgeText}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                      {/* Logo & Brand Name */}
                      <div className="flex items-center gap-3 mb-3">
                        {merchant.logo_url ? (
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <Image
                              src={merchant.logo_url}
                              alt={merchant.brand_name}
                              fill
                              className="rounded-full object-cover border-2 border-purple-200"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                            🏪
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-600 transition truncate">
                            {merchant.brand_name}
                          </h3>
                          {merchant.city && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 truncate">
                              <span>📍</span>
                              {merchant.city}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {merchant.description_ar && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {merchant.description_ar}
                        </p>
                      )}

                      {/* Rating & Sales */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 text-lg">⭐</span>
                          <span className="font-semibold text-gray-800">
                            {merchant.rating.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 font-semibold">
                          {merchant.total_sales.toLocaleString()} sales
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Empty State */}
      {merchantsByTier.every(({ merchants }) => merchants.length === 0) && (
        <div className="container mx-auto px-4 py-20">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              No Merchants Available
            </h2>
            <p className="text-gray-600">
              Check back soon for amazing local brands!
            </p>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Want to sell on EMall?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join hundreds of successful merchants today
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-lg"
          >
            Become a Merchant →
          </Link>
        </div>
      </section>
    </div>
  )
}
