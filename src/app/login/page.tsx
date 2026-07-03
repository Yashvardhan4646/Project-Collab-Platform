'use client'

import { useState, type CSSProperties, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function signInWithGoogle() {
    setMsg(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setMsg(error.message)
  }

  async function onEmailSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setBusy(false)
      if (error) return setMsg(error.message)
      window.location.href = '/'
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      setBusy(false)
      if (error) return setMsg(error.message)
      if (data.session) window.location.href = '/'
      else setMsg('Account created. Check your email to confirm, then sign in.')
    }
  }

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: '1.6rem', margin: 0 }}>Collab Platform</h1>
      <p style={{ color: '#666', marginTop: '0.25rem', marginBottom: '1.5rem' }}>Sign in to continue</p>

      <button onClick={signInWithGoogle} style={btnPrimary}>Continue with Google</button>

      <div style={{ textAlign: 'center', color: '#999', margin: '1rem 0', fontSize: '0.85rem' }}>or</div>

      <form onSubmit={onEmailSubmit}>
        <input type="email" required placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} style={input} />
        <input type="password" required placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} style={input} />
        <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>
          {busy ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMsg(null) }} style={link}>
        {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
      </button>

      {msg && <p style={{ color: '#b00', fontSize: '0.85rem', marginTop: '1rem' }}>{msg}</p>}
    </main>
  )
}

const wrap: CSSProperties = { maxWidth: 360, margin: '12vh auto', padding: '0 1.5rem', fontFamily: 'system-ui, sans-serif' }
const input: CSSProperties = { display: 'block', width: '100%', padding: '0.6rem 0.7rem', marginBottom: '0.6rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '0.95rem' }
const btnPrimary: CSSProperties = { display: 'block', width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #111', background: '#111', color: '#fff', cursor: 'pointer', fontSize: '0.95rem' }
const link: CSSProperties = { background: 'none', border: 'none', color: '#0366d6', cursor: 'pointer', marginTop: '1rem', fontSize: '0.85rem', padding: 0 }
