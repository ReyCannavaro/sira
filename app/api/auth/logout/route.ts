import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ok, serverError } from '@/lib/api/response'

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('signOut error:', error)
    return serverError('Gagal logout. Coba lagi.')
  }

  return ok(null, 'Logout berhasil')
}