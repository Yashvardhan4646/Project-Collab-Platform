import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSpaceChannels } from '@/lib/supabase/queries'
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

  const [{ data: space }, channels] = await Promise.all([
    supabase.from('spaces').select('id, name, type').eq('id', spaceId).single(),
    getSpaceChannels(spaceId),
  ])
  if (!space) notFound()

  const spaceName =
    space.name ?? (space.type === 'private' ? 'Private' : space.type === 'dm' ? 'Direct message' : 'Server')

  return (
    <div style={{ display: 'flex', flex: 1, minWidth: 0, height: '100%' }}>
      <ChannelColumn spaceName={spaceName} spaceId={spaceId} channels={channels} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>{children}</div>
    </div>
  )
}
