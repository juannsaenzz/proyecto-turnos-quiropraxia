import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin/turnos'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      let redirectUrl = `${origin}${next}`
      
      if (!isLocalEnv && forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`
      }
      
      // Append a timestamp to prevent the browser from using a cached 307 redirect to /login
      const separator = redirectUrl.includes('?') ? '&' : '?'
      redirectUrl = `${redirectUrl}${separator}t=${Date.now()}`
      
      const response = NextResponse.redirect(redirectUrl)
      
      // Manually copy cookies to the response to bypass Next.js bug
      const allCookies = cookieStore.getAll()
      allCookies.forEach(cookie => {
        response.cookies.set(cookie.name, cookie.value)
      })
      
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=true`)
}
