import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getMyRole, getSpaceChannels } from '@/lib/supabase/queries'
import { ChannelColumn } from '@/components/channel-column'

export default async function SpaceLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ spaceId: string }>
}) {
  const { spaceId } = await params
  const supabase = await createClient()
  const user = await getCurrentUser() // cache hit: resolved in the main layout

  const [{ data: space }, channels, role] = await Promise.all([
    supabase.from('spaces').select('id, name, type').eq('id', spaceId).single(),
    getSpaceChannels(spaceId),
    user ? getMyRole(spaceId, user.id) : Promise.resolve(null),
  ])
  if (!space) notFound()

  const spaceName =
    space.name ?? (space.type === 'private' ? 'Private' : space.type === 'dm' ? 'Direct message' : 'Server')
  const canInvite = role === 'owner' || role === 'admin'

  return (
    <div style={{ display: 'flex', flex: 1, minWidth: 0, height: '100%' }}>
      <ChannelColumn spaceName={spaceName} spaceId={spaceId} channels={channels} canInvite={canInvite} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>{children}</div>
    </div>
  )
}
