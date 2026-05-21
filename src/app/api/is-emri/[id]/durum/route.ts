import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: isEmriId } = await params

    // Kimlik doğrulama — user client
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const body = await req.json()
    const { durum } = body

    const gecerliDurumlar = ['tamamlandi', 'tamamlanmadi', 'devam_ediyor', 'atandi']
    if (!gecerliDurumlar.includes(durum)) {
      return NextResponse.json({ error: 'Geçersiz durum.' }, { status: 400 })
    }

    // Kullanıcının bu iş emrine atanmış olduğunu doğrula
    const { data: atama } = await supabase
      .from('is_emri_muhendisleri')
      .select('muhendis_id')
      .eq('is_emri_id', isEmriId)
      .eq('muhendis_id', user.id)
      .maybeSingle()

    // Atanmış mühendis veya yönetici olmalı
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!atama && profile?.rol !== 'yonetici') {
      return NextResponse.json({ error: 'Bu iş emrini güncelleme yetkiniz yok.' }, { status: 403 })
    }

    // Durum güncelleme — is_emirleri_update RLS sadece yöneticiye açık, admin client kullanıyoruz
    const admin = createAdminClient()
    const { error } = await admin
      .from('is_emirleri')
      .update({ durum })
      .eq('id', isEmriId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[API /is-emri/durum]', e)
    return NextResponse.json({ error: e?.message ?? 'Sunucu hatası' }, { status: 500 })
  }
}
