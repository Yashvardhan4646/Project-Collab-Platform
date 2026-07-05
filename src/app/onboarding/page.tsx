'use client'

import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export default function OnboardingPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = '/login'
        return
      }
      setUserId(data.user.id)
    })
  }, [supabase])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!userId) return
    if (!USERNAME_RE.test(username)) {
      setMsg('Username must be 3 to 20 characters: lowercase letters, numbers, underscore.')
      return
    }
    if (!name.trim()) {
      setMsg('Please enter a display name.')
      return
    }
    setBusy(true)
    setMsg(null)

    let avatar_url: string | null = null
    if (file) {
      const path = `${userId}/${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (upErr) {
        setBusy(false)
        setMsg(`Avatar upload failed: ${upErr.message}`)
        return
      }
      avatar_url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username, display_name: name.trim(), ...(avatar_url ? { avatar_url } : {}) })
      .eq('id', userId)
    setBusy(false)
    if (error) {
      const taken = error.code === '23505' || /duplicate|unique/i.test(error.message)
      setMsg(taken ? 'That username is taken. Try another.' : error.message)
      return
    }
    window.location.href = '/'
  }

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>One quick thing</h1>
      <p style={{ color: '#888', marginTop: '0.25rem', marginBottom: '1.5rem' }}>Pick a username and a display name.</p>

      <form onSubmit={onSubmit}>
        <label style={label}>Username</label>
        <div style={{ display: 'flex', alignItems: 'center', background: '#141414', border: '1px solid #333', borderRadius: 8, paddingLeft: '0.7rem', marginBottom: '1rem' }}>
          <span style={{ color: '#666', fontSize: '0.95rem' }}>@</span>
          <input
            required
            placeholder="arsh"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            maxLength={20}
            style={{ ...input, background: 'transparent', border: 'none', paddingLeft: '0.3rem', marginBottom: 0 }}
          />
        </div>
        <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '-0.6rem', marginBottom: '1rem' }}>Lowercase letters, numbers, underscore. People find you by this.</p>

        <label style={label}>Display name</label>
        <input required placeholder="e.g. Arsh" value={name} onChange={(e) => setName(e.target.value)} style={input} />

        <label style={label}>Avatar (optional)</label>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ marginBottom: '1rem', color: '#aaa' }} />

        <button type="submit" disabled={busy} style={{ ...btn, opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </form>

      {msg && <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '1rem' }}>{msg}</p>}
    </main>
  )
}

const wrap: CSSProperties = { maxWidth: 380, margin: '12vh auto', padding: '0 1.5rem', fontFamily: 'system-ui, sans-serif' }
const label: CSSProperties = { display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.35rem' }
const input: CSSProperties = { display: 'block', width: '100%', padding: '0.6rem 0.7rem', marginBottom: '1rem', background: '#141414', border: '1px solid #333', borderRadius: 8, fontSize: '0.95rem', color: '#ededed' }
const btn: CSSProperties = { display: 'block', width: '100%', padding: '0.65rem', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '0.95rem' }
