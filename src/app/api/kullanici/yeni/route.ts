import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { kullaniciSchema } from '@/lib/validations/kullanici'

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: NextRequest) {
  try {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (profile?.rol !== 'yonetici') return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json()
  const parsed = kullaniciSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { ad_soyad, email, telefon, rol } = parsed.data
  const temp_password = generatePassword()

  const admin = createAdminClient()
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: temp_password,
    email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const { error: profileError } = await admin.from('profiles').upsert({
    id: authUser.user.id,
    ad_soyad,
    email,
    telefon: telefon || null,
    rol,
    aktif: true,
    sifre_degistir_gerekli: true,
  }, { onConflict: 'id' })

  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ temp_password })
  } catch (e: any) {
    console.error('[API /kullanici/yeni]', e)
    return NextResponse.json({ error: e?.message ?? 'Sunucu hatası' }, { status: 500 })
  }
}
