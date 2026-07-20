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
      // Next.js has a known bug where cookies().set() is dropped if we return NextResponse.redirect().
      // To bypass this, we return an HTML page that redirects the browser, ensuring cookies are sent!
      const redirectUrl = new URL(requestUrl.href)
      redirectUrl.pathname = next
      redirectUrl.search = `?t=${Date.now()}`
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="refresh" content="0; url=${redirectUrl.toString()}">
          </head>
          <body>
            <p>Redirigiendo...</p>
          </body>
        </html>
      `
      
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      })
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
