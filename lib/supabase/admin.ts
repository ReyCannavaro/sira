import { createClient } from '@supabase/supabase-js'

export function createSupabaseAdminClient() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!svcKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local')

  return createClient(url, svcKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}