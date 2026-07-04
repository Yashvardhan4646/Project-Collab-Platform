'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Channel = { id: string; type: string; name: string }

const typeIcon: Record<string, string> = {
  text: '#',
  voice_video: '🔊',
  whiteboard: '▧',
  todo: '☑',
  notes: '≡',
  reminders: '⏰',
  docs_sheet: '▤',
  cubicle: '◻',
}

export function ChannelColumn({
  spaceName,
  spaceId,
  channels,
  canInvite,
  isServer,
}: {
  spaceName: string
  spaceId: string
  channels: Channel[]
  canInvite: boolean
  isServer: boolean
}) {
  const pathname = usePathname()
  const activeChannelId = pathname.split('/')[2]
  const supabase = useMemo(() => createClient(), [])

  const [open, setOpen] = useState(false)
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function toggleInvite() {
    const next = !open
    setOpen(next)
    if (!next || link || busy) return
    setBusy(true)
    const { data, error } = await supabase.rpc('generate_invite', { p_space_id: spaceId })
    setBusy(false)
    if (error) {
      alert(error.message)
      setOpen(false)
      return
    }
    setLink(`${window.location.origin}/join/${data}`)
  }

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <aside className="app-channels" style={{ width: 220, background: '#191919', color: '#ddd', height: '100%', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #262626', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spaceName}</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          {canInvite && (
            <button
              onClick={toggleInvite}
              title="Invite people"
              style={{ background: open ? '#3730a3' : '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            >
              invite
            </button>
          )}
          {isServer && (
            <Link href={`/${spaceId}/members`} title="Members" style={{ color: '#888', textDecoration: 'none', fontSize: 12 }}>
              members
            </Link>
          )}
        </div>
      </div>

      {open && canInvite && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #262626', background: '#161616' }}>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>Anyone with this link can join this server.</div>
          {busy && !link ? (
            <div style={{ color: '#888', fontSize: 12 }}>generating…</div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                readOnly
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                style={{ flex: 1, minWidth: 0, background: '#0f0f0f', border: '1px solid #333', borderRadius: 6, padding: '5px 8px', color: '#ededed', fontSize: 12 }}
              />
              <button onClick={copy} style={{ background: '#222', color: copied ? '#6ee7b7' : '#ddd', border: '1px solid #333', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>
                {copied ? '✓' : 'copy'}
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {channels.length === 0 && <div style={{ color: '#666', fontSize: 13, padding: 8 }}>No channels yet</div>}
        {channels.map((c) => {
          const active = c.id === activeChannelId
          return (
            <Link
              key={c.id}
              href={`/${spaceId}/${c.id}`}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: 6,
                textDecoration: 'none',
                color: active ? '#fff' : '#a3a3a3',
                background: active ? '#2f2f3a' : 'transparent',
                fontSize: 14,
                marginBottom: 2,
              }}
            >
              <span style={{ opacity: 0.7, width: 16, textAlign: 'center' }}>{typeIcon[c.type] ?? '#'}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
