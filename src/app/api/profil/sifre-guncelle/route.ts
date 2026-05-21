import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    // getUser() — sunucudan doğrulanmış kullanıcı bilgisi
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const body = await req.json()
    const { yeni_sifre } = body

    if (!yeni_sifre || typeof yeni_sifre !== 'string' || yeni_sifre.length < 8) {
      return NextResponse.json({ error: 'Şifre en az 8 karakter olmalıdır.' }, { status: 400 })
    }

    // Şifreyi güncelle (user client — kendi session'ı)
    const { error: updateError } = await supabase.auth.updateUser({ password: yeni_sifre })
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

    // Bayrağı sıfırla — profiles_update RLS sadece yöneticiye izin verdiği için admin client kullanıyoruz
    const admin = createAdminClient()
    const { error: profileError } = await admin
      .from('profiles')
      .update({ sifre_degistir_gerekli: false })
      .eq('id', user.id)
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[API /profil/sifre-guncelle]', e)
    return NextResponse.json({ error: e?.message ?? 'Sunucu hatası' }, { status: 500 })
  }
}
