import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Exchange code for session
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    if (!session?.user) {
      return NextResponse.redirect(`${origin}/login?error=no_user`)
    }

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single()

    // If profile doesn't exist, create one (for Google OAuth users)
    if (profileError || !existingProfile) {
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
        console.error('Profile creation error:', insertError)
        // Continue anyway, profile might have been created by trigger
      }

      // Redirect to home for new customers
      return NextResponse.redirect(`${origin}/`)
    }

    // Redirect based on user type
    if (existingProfile.user_type === 'merchant' || existingProfile.user_type === 'admin') {
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    // Default redirect to home for customers
    return NextResponse.redirect(`${origin}/`)
  }

  // No code present, redirect to login
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
