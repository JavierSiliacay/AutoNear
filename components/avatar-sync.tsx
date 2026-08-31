"use client"

import { useEffect } from "react"
import { syncCurrentUserAvatar } from "@/lib/actions"
import { createClient } from "@/lib/supabase/client"
import { useSession } from "next-auth/react"

export function AvatarSync() {
  const { data: nextAuthSession } = useSession()

  useEffect(() => {
    if (nextAuthSession?.user) {
      syncCurrentUserAvatar().catch(() => {})
    }
  }, [nextAuthSession])

  useEffect(() => {
    const supabase = createClient()
    
    const sync = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await syncCurrentUserAvatar()
      }
    }

    sync()

    // Also sync on auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        sync()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}
