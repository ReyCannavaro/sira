import { createSupabaseServerClient } from '@/lib/supabase/server'
import { unauthorized } from './response'

export async function getAuthUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, error: unauthorized('Kamu harus login terlebih dahulu') }
  }
  return { user, error: null }
}

export async function parseBody<T>(
  request: Request
): Promise<{ body: T | null; error: string | null }> {
  try {
    const body = await request.json() as T
    return { body, error: null }
  } catch {
    return { body: null, error: 'Request body harus berupa JSON yang valid' }
  }
}