import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Exclude static assets AND the public SEO/GEO files, so crawlers get them
    // directly instead of being bounced to /login by the auth redirect.
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|llms.txt|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
