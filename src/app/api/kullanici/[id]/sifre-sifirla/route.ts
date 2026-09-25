import { NextRequest, NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
  return Array.from({ length: 12 }, () => chars[randomInt(chars.length)]).join('')
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Kimlik doğrulama ve rol kontrolü — user client
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
    if (profile?.rol !== 'yonetici') return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

    if (id === user.id) {
      return NextResponse.json({ error: 'Kendi şifrenizi Profilim sayfasından değiştirebilirsiniz.' }, { status: 400 })
    }

    // Veri işlemleri — admin client (auth.users ve profiles update RLS'i aşmak için)
    const admin = createAdminClient()
    const { data: hedef } = await admin.from('profiles').select('id').eq('id', id).maybeSingle()
    if (!hedef) return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 })

    const temp_password = generatePassword()

    const { error: authError } = await admin.auth.admin.updateUserById(id, { password: temp_password })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    // Kullanıcı bir sonraki girişte şifresini değiştirmek zorunda kalır
    const { error: profileError } = await admin
      .from('profiles')
      .update({ sifre_degistir_gerekli: true })
      .eq('id', id)
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

    return NextResponse.json({ temp_password })
  } catch (e: any) {
    console.error('[API /kullanici/sifre-sifirla]', e)
    return NextResponse.json({ error: e?.message ?? 'Sunucu hatası' }, { status: 500 })
  }
}
