import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getMyRole, getSpaceChannels, getDmPeers } from '@/lib/supabase/queries'
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

  // For a DM, title the column with the other person instead of "Direct message".
  let dmName: string | null = null
  if (space.type === 'dm' && user) {
    const peers = await getDmPeers([spaceId], user.id)
    dmName = peers.get(spaceId)?.name ?? null
  }

  const spaceName =
    space.name ?? dmName ?? (space.type === 'private' ? 'Private' : space.type === 'dm' ? 'Direct message' : 'Server')
  // invite + member management only make sense in a server.
  const canInvite = space.type === 'server' && (role === 'owner' || role === 'admin')

  return (
    <div style={{ display: 'flex', flex: 1, minWidth: 0, height: '100%' }}>
      <ChannelColumn spaceName={spaceName} spaceId={spaceId} channels={channels} canInvite={canInvite} isServer={space.type === 'server'} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>{children}</div>
    </div>
  )
}
