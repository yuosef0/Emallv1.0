import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()

  // Get subscription tiers
  const { data: tiers } = await supabase
    .from('subscription_tiers')
    .select('*')
    .order('priority_level', { ascending: true })

  // Get merchants grouped by tier (10 per tier)
  const merchantsByTier = await Promise.all(
    (tiers || []).map(async (tier) => {
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
        merchants: merchants || []
      }
    })
  )

  // Get categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Welcome to EMall</h1>
          <p className="text-xl mb-8">Discover the best local brands</p>
          <div className="flex justify-center gap-4 flex-wrap">
            {categories?.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.name}`}
                className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition transform hover:scale-105"
              >
                {category.name_ar}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Merchants by Tier */}
      {merchantsByTier.map(({ tier, merchants }) => (
        merchants.length > 0 && (
          <section key={tier.id} className="container mx-auto px-4 py-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold">
                  {tier.priority_level === 1 && 'P Featured Merchants - '}
                  {tier.priority_level === 2 && '=� Premium Merchants - '}
                  {tier.priority_level === 3 && '<� EMall Merchants - '}
                  {tier.name === 'premium' ? 'Premium Tier' : tier.name === 'standard' ? 'Standard Tier' : 'Basic Tier'}
                </h2>
                <p className="text-gray-600 mt-2">Top 10 merchants in this tier</p>
              </div>
              <Link
                href={`/merchants?tier=${tier.id}`}
                className="text-purple-600 hover:underline font-semibold"
              >
                View All �
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {merchants.map((merchant) => (
                <Link
                  key={merchant.id}
                  href={`/merchant/${merchant.id}`}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition group"
                >
                  <div className="relative h-48 bg-gray-200">
                    {merchant.cover_image_url ? (
                      <Image
                        src={merchant.cover_image_url}
                        alt={merchant.brand_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                    {tier.priority_level === 1 && (
                      <div className="absolute top-4 right-4 bg-yellow-400 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        P Featured
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      {merchant.logo_url && (
                        <Image
                          src={merchant.logo_url}
                          alt={merchant.brand_name}
                          width={50}
                          height={50}
                          className="rounded-full"
                        />
                      )}
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-purple-600 transition">
                          {merchant.brand_name}
                        </h3>
                        <p className="text-sm text-gray-500">{merchant.city}</p>
                      </div>
                    </div>
                    {merchant.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {merchant.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">P</span>
                        <span>{merchant.rating.toFixed(1)}</span>
                      </div>
                      <div className="text-gray-500">
                        {merchant.total_sales} sales
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      ))}
    </div>
  )
}
