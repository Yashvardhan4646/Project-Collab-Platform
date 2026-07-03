import { createClient } from '@/lib/supabase/server'

// Always render fresh — this is a live connectivity check, never cached.
export const dynamic = 'force-dynamic'

export default async function HealthPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let ok = false
  let message = ''

  if (!url || !key) {
    message =
      'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Fill them into .env.local.'
  } else {
    try {
      const supabase = await createClient()
      // No tables exist yet (the schema is added later). We ping PostgREST
      // with a throwaway table name: getting a structured "does not exist"
      // response back proves the URL + anon key reach Supabase correctly.
      const { error } = await supabase.from('__healthcheck__').select('*').limit(1)
      if (!error || error.code === '42P01' || /does not exist/i.test(error.message)) {
        ok = true
        message = 'Reached Supabase — URL and anon key are wired correctly.'
      } else {
        message = `Supabase responded with an unexpected error: ${error.message}`
      }
    } catch (e) {
      message = `Could not reach Supabase: ${e instanceof Error ? e.message : String(e)}`
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem', maxWidth: 680 }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Health check</h1>
      <span
        style={{
          display: 'inline-block',
          padding: '0.4rem 0.85rem',
          borderRadius: 8,
          fontWeight: 600,
          background: ok ? '#dcfce7' : '#fee2e2',
          color: ok ? '#166534' : '#991b1b',
        }}
      >
        {ok ? '✓ Connected' : '✗ Not connected'}
      </span>
      <p style={{ color: '#555', marginTop: '1rem', lineHeight: 1.5 }}>{message}</p>
    </main>
  )
}
