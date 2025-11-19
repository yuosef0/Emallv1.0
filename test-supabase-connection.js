#!/usr/bin/env node

/**
 * Test Supabase Connection
 * Quick script to verify Supabase keys are valid
 */

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('\n🔍 Testing Supabase Connection...\n')

// Check if variables exist
if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is missing in .env.local')
  process.exit(1)
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env.local')
  process.exit(1)
}

// Validate format
console.log('✓ Environment variables found')
console.log(`  URL: ${SUPABASE_URL}`)
console.log(`  Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`)

if (!SUPABASE_URL.startsWith('https://')) {
  console.error('\n❌ SUPABASE_URL should start with https://')
  process.exit(1)
}

if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
  console.error('\n❌ ANON_KEY should start with eyJ (JWT token)')
  process.exit(1)
}

console.log('\n✓ Format looks correct')

// Try to make a simple request
console.log('\n🌐 Testing API connection...')

fetch(`${SUPABASE_URL}/rest/v1/`, {
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
})
  .then(res => {
    console.log(`  Status: ${res.status}`)
    if (res.status === 200) {
      console.log('\n✅ SUCCESS! Supabase connection is working!')
      console.log('\n📝 Next steps:')
      console.log('  1. Make sure Google OAuth is enabled in Supabase Dashboard')
      console.log('  2. Go to: Authentication → Providers → Google')
      console.log('  3. Enable it and add Client ID & Secret from Google Cloud')
      console.log('  4. Add this redirect URL in Google Cloud Console:')
      console.log(`     ${SUPABASE_URL}/auth/v1/callback`)
    } else if (res.status === 401) {
      console.error('\n❌ AUTHENTICATION FAILED!')
      console.error('  Your Supabase keys are invalid or expired')
      console.error('\n📝 To fix:')
      console.error('  1. Go to https://supabase.com/dashboard')
      console.error('  2. Select your project')
      console.error('  3. Settings → API')
      console.error('  4. Copy the correct URL and anon key to .env.local')
    } else {
      console.error(`\n❌ Unexpected status: ${res.status}`)
    }
  })
  .catch(err => {
    console.error('\n❌ Connection Error:', err.message)
    console.error('\nPossible issues:')
    console.error('  - Network problem')
    console.error('  - Invalid Supabase URL')
    console.error('  - Firewall blocking the request')
  })
