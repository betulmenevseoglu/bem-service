import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { TakvimSayfasi } from '@/components/takvim/TakvimSayfasi'

export default async function TakvimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: myProfile } = await admin
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  const isYonetici = myProfile?.rol === 'yonetici'

  // İş emirleri — iptal edilenler hariç
  const { data: isEmirleri } = await admin
    .from('is_emirleri')
    .select('*, proje:projeler(ad, musteri_firma), muhendisler:is_emri_muhendisleri(muhendis:profiles(id, ad_soyad))')
    .neq('durum', 'iptal_edildi')
    .order('planlanan_baslangic', { ascending: true })

  // İzin talepleri
  // Yönetici: tüm izinler (beklemede + onaylı görünsün)
  // Mühendis: sadece kendi onaylı izinleri
  let izinler: any[] = []
  if (isYonetici) {
    const { data } = await admin
      .from('izin_talepleri')
      .select('*, muhendis:profiles!muhendis_id(id, ad_soyad)')
      .in('durum', ['onaylandi', 'beklemede'])
    izinler = data ?? []
  } else {
    const { data } = await admin
      .from('izin_talepleri')
      .select('*, muhendis:profiles!muhendis_id(id, ad_soyad)')
      .eq('muhendis_id', user.id)
      .eq('durum', 'onaylandi')
    izinler = data ?? []
  }

  // Mühendis listesi — yönetici filtresi için
  let muhendisler: any[] = []
  if (isYonetici) {
    const { data } = await admin
      .from('profiles')
      .select('id, ad_soyad')
      .eq('rol', 'saha_muhendisi')
      .eq('aktif', true)
      .order('ad_soyad')
    muhendisler = data ?? []
  }

  return (
    <TakvimSayfasi
      isEmirleri={isEmirleri ?? []}
      izinler={izinler}
      muhendisler={muhendisler}
      isYonetici={isYonetici}
      userId={user.id}
    />
  )
}
