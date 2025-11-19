#!/usr/bin/env node

/**
 * Make User Admin Script
 * Quick script to promote a user to admin role
 */

require('dotenv').config({ path: '.env.local' })

const email = process.argv[2]

if (!email) {
  console.error('❌ Please provide an email address')
  console.log('\nUsage: node make-admin.js your@email.com')
  process.exit(1)
}

console.log(`\n🔧 Making ${email} an admin...\n`)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables in .env.local')
  process.exit(1)
}

// Update profile to admin
fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}`, {
  method: 'PATCH',
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify({
    user_type: 'admin'
  })
})
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    return res.json()
  })
  .then(data => {
    if (data && data.length > 0) {
      console.log('✅ SUCCESS! User is now an admin:')
      console.log(`   Email: ${data[0].email}`)
      console.log(`   Name: ${data[0].full_name || 'N/A'}`)
      console.log(`   User Type: ${data[0].user_type}`)
      console.log(`   ID: ${data[0].id}`)
      console.log('\n✨ You can now access the admin panel at /admin\n')
    } else {
      console.error('❌ User not found with email:', email)
      console.log('\nMake sure:')
      console.log('  1. The user has registered/logged in at least once')
      console.log('  2. The email is correct')
      console.log('  3. The profile exists in the database')
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message)
    console.log('\nTroubleshooting:')
    console.log('  1. Check your Supabase credentials in .env.local')
    console.log('  2. Make sure SERVICE_ROLE_KEY is set correctly')
    console.log('  3. Verify the user exists in the database')
  })
