import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// İş günü sayısı: başlangıç-bitiş tarih aralığındaki hafta sonu (Cmt/Paz) hariç gün sayısı.
// Tek günlük (hafta sonuna denk gelse dahi) iş emirlerinde en az 1 gün sayılır.
function hesaplaIsGunuSayisi(bas: Date, bit: Date): number {
  const cursor = new Date(bas.getFullYear(), bas.getMonth(), bas.getDate())
  const son = new Date(bit.getFullYear(), bit.getMonth(), bit.getDate())
  let sayac = 0
  while (cursor <= son) {
    const haftaGunu = cursor.getDay() // 0=Pazar, 6=Cumartesi
    if (haftaGunu !== 0 && haftaGunu !== 6) sayac++
    cursor.setDate(cursor.getDate() + 1)
  }
  return Math.max(1, sayac)
}

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

    const admin = createAdminClient()

    // Adam/gün düşümü: sadece iş TAMAMLANINCA (tamamlandi/tamamlanmadi), gerçek (fiili)
    // süreye ve atanan mühendis sayısına göre hesaplanır. Diğer durumlarda düşüm sıfırlanır
    // — bütçeden yalnızca fiilen tamamlanmış iş emirleri düşer.
    let adamGunDusumu = 0
    if (durum === 'tamamlandi' || durum === 'tamamlanmadi') {
      const { data: sf } = await admin
        .from('servis_formlari')
        .select('fiili_baslangic, fiili_bitis')
        .eq('is_emri_id', isEmriId)
        .maybeSingle()

      if (sf?.fiili_baslangic && sf?.fiili_bitis) {
        const { count: muhendisSayisi } = await admin
          .from('is_emri_muhendisleri')
          .select('*', { count: 'exact', head: true })
          .eq('is_emri_id', isEmriId)

        const bas = new Date(sf.fiili_baslangic)
        const bit = new Date(sf.fiili_bitis)
        if (!isNaN(bas.getTime()) && !isNaN(bit.getTime()) && bit >= bas) {
          adamGunDusumu = hesaplaIsGunuSayisi(bas, bit) * (muhendisSayisi ?? 1)
        }
      }
    }

    // Durum güncelleme — is_emirleri_update RLS sadece yöneticiye açık, admin client kullanıyoruz
    const { error } = await admin
      .from('is_emirleri')
      .update({ durum, adam_gun_dusumu: adamGunDusumu })
      .eq('id', isEmriId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[API /is-emri/durum]', e)
    return NextResponse.json({ error: e?.message ?? 'Sunucu hatası' }, { status: 500 })
  }
}
