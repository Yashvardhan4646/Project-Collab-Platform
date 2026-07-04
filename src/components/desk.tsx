'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createServer } from '@/app/(main)/actions'

export type Team = { id: string; name: string; members: number; openTasks: number; unread: number }
export type WaitingTask = { id: string; title: string; spaceId: string; spaceName: string; due: string | null; status: string }
export type DeskDm = { id: string; name: string; avatar: string | null; unread: number }

function initials(name: string) {
  return (name || '?').trim().slice(0, 2).toUpperCase() || '?'
}

// "in 3h", "2d ago", "today" — small, forgiving relative label for due dates.
function dueLabel(iso: string | null): { text: string; overdue: boolean } | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  const now = Date.now()
  const diff = then - now
  const overdue = diff < 0
  const mins = Math.round(Math.abs(diff) / 60000)
  const hrs = Math.round(mins / 60)
  const days = Math.round(hrs / 24)
  let mag: string
  if (mins < 60) mag = `${Math.max(mins, 1)}m`
  else if (hrs < 24) mag = `${hrs}h`
  else mag = `${days}d`
  return { text: overdue ? `${mag} overdue` : `due in ${mag}`, overdue }
}

const card: React.CSSProperties = {
  background: '#141414',
  border: '1px solid #262626',
  borderRadius: 12,
}

function Badge({ n }: { n: number }) {
  if (n <= 0) return null
  return (
    <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: '#4f46e5', color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {n > 99 ? '99+' : n}
    </span>
  )
}

export function Desk({
  displayName,
  teams,
  waiting,
  dms,
}: {
  displayName: string
  teams: Team[]
  waiting: WaitingTask[]
  dms: DeskDm[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [dmFilter, setDmFilter] = useState<'all' | 'unread'>('all')

  const blockedCount = waiting.length
  const shownDms = dmFilter === 'unread' ? dms.filter((d) => d.unread > 0) : dms

  async function onCreate() {
    const name = window.prompt('New team name')
    if (!name || !name.trim()) return
    setBusy(true)
    try {
      const id = await createServer(name.trim())
      router.push(`/${id}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not create team')
      setBusy(false)
    }
  }

  return (
    <div style={{ flex: 1, minWidth: 0, height: '100%', overflowY: 'auto', background: '#0a0a0a', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 28px 64px' }}>
        <header style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Your desk</div>
          <div style={{ fontSize: 14, color: '#8a8a8a', marginTop: 4 }}>
            Welcome back, {displayName}. Here&apos;s what needs you.
          </div>
        </header>

        {/* WAITING ON YOU ---------------------------------------------------- */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9a9a', margin: 0 }}>Waiting on you</h2>
            {blockedCount > 0 && <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>{blockedCount} open</span>}
          </div>
          {waiting.length === 0 ? (
            <div style={{ ...card, padding: '18px 20px', color: '#6a6a6a', fontSize: 14 }}>
              Nothing is blocked on you. Clean slate. 🌱
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {waiting.map((t) => {
                const due = dueLabel(t.due)
                return (
                  <Link
                    key={t.id}
                    href={`/${t.spaceId}`}
                    style={{ ...card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', borderLeft: `3px solid ${due?.overdue ? '#ef4444' : '#4f46e5'}` }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: due?.overdue ? '#ef4444' : '#4f46e5', flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', color: '#ededed', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                      <span style={{ display: 'block', color: '#777', fontSize: 12, marginTop: 2 }}>{t.spaceName}</span>
                    </span>
                    {due && <span style={{ fontSize: 12, fontWeight: 600, color: due.overdue ? '#f87171' : '#9a9a9a', flexShrink: 0 }}>{due.text}</span>}
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* YOUR TEAMS -------------------------------------------------------- */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9a9a', margin: 0 }}>Your teams</h2>
            <button onClick={onCreate} disabled={busy} style={{ background: 'none', border: '1px solid #333', color: '#6ee7b7', borderRadius: 8, padding: '5px 12px', fontSize: 13, cursor: 'pointer' }}>
              + New team
            </button>
          </div>
          {teams.length === 0 ? (
            <div style={{ ...card, padding: '18px 20px', color: '#6a6a6a', fontSize: 14 }}>
              You&apos;re not in any teams yet. Create one or accept an invite.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {teams.map((tm) => (
                <div key={tm.id} style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 40, height: 40, borderRadius: 10, background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                      {initials(tm.name)}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tm.name}</div>
                      <div style={{ color: '#777', fontSize: 12 }}>{tm.members} {tm.members === 1 ? 'member' : 'members'}</div>
                    </div>
                    <Badge n={tm.unread} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: tm.openTasks > 0 ? '#d1d5db' : '#666' }}>
                      {tm.openTasks > 0 ? `${tm.openTasks} open ${tm.openTasks === 1 ? 'task' : 'tasks'}` : 'no open tasks'}
                    </span>
                    <Link href={`/${tm.id}`} style={{ background: '#232338', color: '#c7c9ff', textDecoration: 'none', borderRadius: 7, padding: '5px 14px', fontSize: 13, fontWeight: 600 }}>
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* DIRECT MESSAGES --------------------------------------------------- */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9a9a', margin: 0 }}>Direct messages</h2>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'unread'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setDmFilter(f)}
                  style={{ background: dmFilter === f ? '#232338' : 'transparent', color: dmFilter === f ? '#c7c9ff' : '#777', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ ...card, overflow: 'hidden' }}>
            {shownDms.length === 0 ? (
              <div style={{ padding: '18px 20px', color: '#6a6a6a', fontSize: 14 }}>
                {dmFilter === 'unread' ? 'No unread messages.' : 'No conversations yet.'}
              </div>
            ) : (
              shownDms.map((d, i) => (
                <Link
                  key={d.id}
                  href={`/${d.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none', borderTop: i === 0 ? 'none' : '1px solid #202020' }}
                >
                  {d.avatar ? (
                    <img src={d.avatar} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <span style={{ width: 38, height: 38, borderRadius: '50%', background: '#333', color: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                      {initials(d.name)}
                    </span>
                  )}
                  <span style={{ flex: 1, minWidth: 0, color: d.unread > 0 ? '#fff' : '#c7c7c7', fontSize: 14, fontWeight: d.unread > 0 ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.name}
                  </span>
                  <Badge n={d.unread} />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
