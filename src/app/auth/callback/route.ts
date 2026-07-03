import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// OAuth / email-confirmation callback: exchange the code for a session, then
// send the user into the app (middleware + the (main) layout take it from there).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }
  return NextResponse.redirect(`${origin}/login?error=auth_callback`)
}
