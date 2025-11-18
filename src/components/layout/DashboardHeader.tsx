'use client'

import Image from 'next/image'
import NotificationBell from './NotificationBell'

interface DashboardHeaderProps {
  merchant: {
    logo_url: string | null
    brand_name: string
    brand_name_ar: string | null
    address: string
    city: string | null
    subscription_tiers: {
      name: string
      priority_level: number
    } | null
    subscription_status: string | null
  }
  userId: string
}

export default function DashboardHeader({ merchant, userId }: DashboardHeaderProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {merchant.logo_url ? (
            <Image
              src={merchant.logo_url}
              alt={merchant.brand_name}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-3xl">
              🏪
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{merchant.brand_name}</h1>
            {merchant.brand_name_ar && (
              <div className="text-gray-500">{merchant.brand_name_ar}</div>
            )}
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <span>📍</span>
              {merchant.address}
              {merchant.city && `, ${merchant.city}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <NotificationBell userId={userId} playSound={true} />

          {/* Subscription Tier */}
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Subscription Tier</div>
            <div className={`inline-block px-4 py-2 rounded-full font-bold text-sm ${
              merchant.subscription_tiers?.priority_level === 1
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                : merchant.subscription_tiers?.priority_level === 2
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                : 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
            }`}>
              {merchant.subscription_tiers?.name?.toUpperCase() || 'NO TIER'}
            </div>
            {merchant.subscription_status === 'active' && (
              <div className="text-xs text-green-600 mt-1 font-semibold">✓ Active</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
