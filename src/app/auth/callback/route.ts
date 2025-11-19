import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  console.log('Auth callback triggered with code:', code ? 'present' : 'missing')

  if (code) {
    const cookieStore: Record<string, string> = {}

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore[name] || request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore[name] = value
          },
          remove(name: string, options: CookieOptions) {
            delete cookieStore[name]
          },
        },
      }
    )

    // Exchange code for session
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error('❌ Session exchange error:', {
        message: sessionError.message,
        status: sessionError.status,
        name: sessionError.name,
      })
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(sessionError.message)}`)
    }

    if (!session?.user) {
      console.error('❌ No user in session')
      return NextResponse.redirect(`${origin}/login?error=no_user`)
    }

    console.log('✓ Session created for user:', session.user.email)

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single()

    // If profile doesn't exist, create one (for Google OAuth users)
    if (profileError || !existingProfile) {
      console.log('Creating new profile for OAuth user:', session.user.email)
      const userMetadata = session.user.user_metadata

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          email: session.user.email!,
          full_name: userMetadata.full_name || userMetadata.name || '',
          phone: userMetadata.phone || '',
          user_type: 'customer', // Default to customer for OAuth
          avatar_url: userMetadata.avatar_url || userMetadata.picture || '',
        })

      if (insertError) {
        console.error('❌ Profile creation error:', insertError)
        // Continue anyway, profile might have been created by trigger
      } else {
        console.log('✓ Profile created successfully')
      }

      // Set cookies in response
      const response = NextResponse.redirect(`${origin}/`)

      Object.entries(cookieStore).forEach(([name, value]) => {
        response.cookies.set(name, value, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
      })

      return response
    }

    console.log('✓ Existing profile found, user_type:', existingProfile.user_type)

    // Set cookies in response
    const redirectUrl = (existingProfile.user_type === 'merchant' || existingProfile.user_type === 'admin')
      ? `${origin}/dashboard`
      : `${origin}/`

    const response = NextResponse.redirect(redirectUrl)

    Object.entries(cookieStore).forEach(([name, value]) => {
      response.cookies.set(name, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    })

    return response
  }

  // No code present, redirect to login
  console.error('❌ No code in callback URL')
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
