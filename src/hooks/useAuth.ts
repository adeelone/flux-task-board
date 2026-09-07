import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session?.user) {
          if (mounted) {
            setUser(sessionData.session.user)
            setLoading(false)
          }
          return
        }

        const { data, error: signInError } = await supabase.auth.signInAnonymously()
        if (signInError) throw signInError
        if (mounted) {
          setUser(data.user)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to start guest session')
          setLoading(false)
        }
      }
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return { user, loading, error }
}
