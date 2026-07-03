'use client'

import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
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
      .update({ display_name: name.trim(), ...(avatar_url ? { avatar_url } : {}) })
      .eq('id', userId)
    setBusy(false)
    if (error) {
      setMsg(error.message)
      return
    }
    window.location.href = '/'
  }

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>One quick thing</h1>
      <p style={{ color: '#888', marginTop: '0.25rem', marginBottom: '1.5rem' }}>Set your display name.</p>

      <form onSubmit={onSubmit}>
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
