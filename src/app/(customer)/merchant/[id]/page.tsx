import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import MerchantProducts from './MerchantProducts'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MerchantDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  // Get merchant data
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select(`
      *,
      subscription_tiers(name, name_ar, priority_level)
    `)
    .eq('id', id)
    .eq('approval_status', 'approved')
    .eq('subscription_status', 'active')
    .eq('is_banned', false)
    .single()

  if (merchantError || !merchant) {
    notFound()
  }

  // Get merchant's products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('merchant_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Get merchant's custom categories (from products)
  const { data: merchantCategories } = await supabase
    .from('categories')
    .select('*')
    .in('id', [...new Set((products || []).map(p => p.merchant_category_id).filter(Boolean))])
    .order('name')

  // Get total reviews count (if reviews table exists)
  const { count: reviewsCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('merchant_id', id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Merchant Header */}
      <div className="bg-white shadow-lg">
        {/* Cover Image */}
        <div className="relative h-72 bg-gradient-to-br from-purple-200 to-blue-200">
          {merchant.cover_image_url ? (
            <Image
              src={merchant.cover_image_url}
              alt={merchant.brand_name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-8xl mb-4">🏪</div>
                <div className="text-xl">No Cover Image</div>
              </div>
            </div>
          )}

          {/* Premium Badge */}
          {merchant.subscription_tiers?.priority_level === 1 && (
            <div className="absolute top-6 right-6">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-xl flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                FEATURED MERCHANT
              </div>
            </div>
          )}
        </div>

        {/* Merchant Info */}
        <div className="container mx-auto px-4">
          <div className="relative">
            {/* Logo Overlay */}
            <div className="absolute -top-20 left-0">
              {merchant.logo_url ? (
                <div className="relative w-40 h-40 rounded-full border-8 border-white shadow-xl bg-white overflow-hidden">
                  <Image
                    src={merchant.logo_url}
                    alt={merchant.brand_name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-40 h-40 rounded-full border-8 border-white shadow-xl bg-purple-100 flex items-center justify-center text-6xl">
                  🏪
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="pt-24 pb-8">
              <div className="flex items-start justify-between flex-wrap gap-6">
                <div className="flex-1 min-w-0">
                  {/* Brand Name */}
                  <h1 className="text-5xl font-bold text-gray-800 mb-2">
                    {merchant.brand_name}
                  </h1>
                  {merchant.brand_name_ar && (
                    <div className="text-2xl text-gray-600 mb-4">{merchant.brand_name_ar}</div>
                  )}

                  {/* Rating & Location */}
                  <div className="flex items-center gap-6 flex-wrap mb-4">
                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">⭐</span>
                      <span className="text-2xl font-bold text-gray-800">
                        {merchant.rating.toFixed(1)}
                      </span>
                      <span className="text-gray-600">
                        ({reviewsCount || 0} reviews)
                      </span>
                    </div>

                    {/* Location */}
                    {merchant.city && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-2xl">📍</span>
                        <span className="text-lg font-semibold">
                          {merchant.city}
                          {merchant.address && `, ${merchant.address}`}
                        </span>
                      </div>
                    )}

                    {/* Sales */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-2xl">📦</span>
                      <span className="text-lg font-semibold">
                        {merchant.total_sales.toLocaleString()} sales
                      </span>
                    </div>
                  </div>

                  {/* Short Description */}
                  {merchant.description_ar && (
                    <p className="text-gray-700 text-lg leading-relaxed max-w-3xl">
                      {merchant.description_ar}
                    </p>
                  )}
                </div>

                {/* Contact Buttons */}
                <div className="flex flex-col gap-3">
                  {merchant.phone && (
                    <a
                      href={`tel:${merchant.phone}`}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg flex items-center gap-3 text-lg"
                    >
                      <span className="text-2xl">📞</span>
                      Call Now
                    </a>
                  )}
                  {merchant.whatsapp && (
                    <a
                      href={`https://wa.me/${merchant.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-lg flex items-center gap-3 text-lg"
                    >
                      <span className="text-2xl">💬</span>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section with Client Component */}
      <div className="container mx-auto px-4 py-12">
        <MerchantProducts
          products={products || []}
          merchantCategories={merchantCategories || []}
        />
      </div>

      {/* About Section */}
      <div className="container mx-auto px-4 pb-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-4xl">ℹ️</span>
            About This Store
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div>
              {/* Description */}
              {merchant.description && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {merchant.description}
                  </p>
                </div>
              )}

              {merchant.description_ar && merchant.description !== merchant.description_ar && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">الوصف</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line" dir="rtl">
                    {merchant.description_ar}
                  </p>
                </div>
              )}

              {/* Business Hours */}
              {merchant.business_hours && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🕐</span>
                    Opening Hours
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {merchant.business_hours}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div>
              {/* Contact Information */}
              <div className="bg-purple-50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {merchant.phone && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📞</span>
                      <div>
                        <div className="text-sm text-gray-600">Phone</div>
                        <a href={`tel:${merchant.phone}`} className="text-lg font-semibold text-blue-600 hover:underline">
                          {merchant.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {merchant.whatsapp && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💬</span>
                      <div>
                        <div className="text-sm text-gray-600">WhatsApp</div>
                        <a
                          href={`https://wa.me/${merchant.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg font-semibold text-green-600 hover:underline"
                        >
                          {merchant.whatsapp}
                        </a>
                      </div>
                    </div>
                  )}
                  {merchant.email && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📧</span>
                      <div>
                        <div className="text-sm text-gray-600">Email</div>
                        <a href={`mailto:${merchant.email}`} className="text-lg font-semibold text-purple-600 hover:underline">
                          {merchant.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {merchant.city && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📍</span>
                      <div>
                        <div className="text-sm text-gray-600">Location</div>
                        <div className="text-lg font-semibold text-gray-800">
                          {merchant.address && `${merchant.address}, `}{merchant.city}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-6 text-center">
                  <div className="text-3xl mb-2">📦</div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {merchant.total_sales.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Sales</div>
                </div>
                <div className="bg-yellow-50 rounded-xl p-6 text-center">
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="text-3xl font-bold text-yellow-600 mb-1">
                    {merchant.rating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
