import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Protected app group. Middleware already guarantees a session here, but we also
 * enforce the onboarding gate: no display_name yet -> send to /onboarding.
 * (/onboarding lives outside this group, so there's no redirect loop.)
 */
export default async function MainLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  if (!profile?.display_name) redirect('/onboarding')

  return <>{children}</>
}
