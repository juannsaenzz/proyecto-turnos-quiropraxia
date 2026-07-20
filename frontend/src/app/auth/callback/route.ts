export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/admin/turnos'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const redirectUrl = new URL(requestUrl.href)
      redirectUrl.pathname = next
      redirectUrl.search = `?t=${Date.now()}` // prevent caching
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('Error exchanging code for session:', error)
    }
  }

  // return the user to an error page with instructions
  const errorUrl = new URL(requestUrl.href)
  errorUrl.pathname = '/login'
  errorUrl.searchParams.set('error', 'true')
  return NextResponse.redirect(errorUrl)
}
