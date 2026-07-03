import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getProfile } from '@/lib/supabase/queries'
import { Rail } from '@/components/rail'

export default async function MainLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const [profile, { data: spaces }] = await Promise.all([
    getProfile(user.id),
    supabase.from('spaces').select('id, type, name').order('created_at'),
  ])

  if (!profile?.display_name) redirect('/onboarding')

  const all = spaces ?? []
  const servers = all.filter((s) => s.type === 'server')
  const dms = all.filter((s) => s.type === 'dm')
  const privateSpace = all.find((s) => s.type === 'private') ?? null

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      <Rail servers={servers} dms={dms} privateSpace={privateSpace} profile={profile} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>{children}</div>
    </div>
  )
}
