import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { badRequest, ok, unauthorized, serverError } from '@/lib/api/response'
import { parseBody, getAuthUser } from '@/lib/api/auth'

interface HeroClassBody {
  hero_class: 'logic_warrior' | 'web_mage' | 'data_ranger'
}

export async function POST(request: NextRequest) {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const { body, error: parseError } = await parseBody<HeroClassBody>(request)
  if (parseError || !body) return badRequest(parseError ?? 'Body tidak valid')

  const validClasses = ['logic_warrior', 'web_mage', 'data_ranger']
  if (!validClasses.includes(body.hero_class)) {
    return badRequest('Hero class tidak valid')
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('profiles')
    .update({ hero_class: body.hero_class })
    .eq('id', user!.id)

  if (error) {
    console.error('update hero_class error:', error)
    return serverError('Gagal menyimpan hero class. Coba lagi.')
  }

  return ok({ hero_class: body.hero_class }, 'Hero class berhasil dipilih')
}