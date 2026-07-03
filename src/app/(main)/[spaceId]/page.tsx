import { redirect } from 'next/navigation'
import { getSpaceChannels } from '@/lib/supabase/queries'

export default async function SpacePage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params

  // Cached: the space layout already fetched this in the same request.
  const channels = await getSpaceChannels(spaceId)
  if (channels.length > 0) {
    redirect(`/${spaceId}/${channels[0].id}`)
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#888',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      No channels here yet.
    </div>
  )
}
