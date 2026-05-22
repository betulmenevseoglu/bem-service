import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { DashboardContent } from './dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // Fetch work orders (all for yonetici, only assigned for saha_muhendisi)
  let isEmriQuery = supabase
    .from('is_emirleri')
    .select('*, proje:projeler(ad, musteri_firma), muhendisler:is_emri_muhendisleri(muhendis:profiles(id, ad_soyad))')
    .order('created_at', { ascending: false })
    .limit(10)

  if (profile.rol === 'saha_muhendisi') {
    const { data: atananlar } = await supabase
      .from('is_emri_muhendisleri')
      .select('is_emri_id')
      .eq('muhendis_id', user.id)
    const ids = (atananlar ?? []).map((a: { is_emri_id: string }) => a.is_emri_id)
    if (ids.length > 0) {
      isEmriQuery = isEmriQuery.in('id', ids)
    }
  }

  const { data: isEmirleri } = await isEmriQuery

  const { count: toplamCount } = await supabase
    .from('is_emirleri')
    .select('*', { count: 'exact', head: true })

  const { count: tamamlananCount } = await supabase
    .from('is_emirleri')
    .select('*', { count: 'exact', head: true })
    .eq('durum', 'tamamlandi')

  const { count: bekleyenCount } = await supabase
    .from('is_emirleri')
    .select('*', { count: 'exact', head: true })
    .in('durum', ['atandi', 'devam_ediyor'])

  const { count: muhendisCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('rol', 'saha_muhendisi')
    .eq('aktif', true)

  // ── Bugünün etkinlikleri ────────────────────────────────
  const admin = createAdminClient()
  const todayStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // Planlanan aralığı bugünü kapsayan iş emirleri
  let bugunIsEmriQuery = admin
    .from('is_emirleri')
    .select('id, durum, proje:projeler(ad), muhendisler:is_emri_muhendisleri(muhendis:profiles(ad_soyad))')
    .lte('planlanan_baslangic', `${todayStr}T23:59:59`)
    .gte('planlanan_bitis', `${todayStr}T00:00:00`)
    .neq('durum', 'iptal_edildi')

  if (profile.rol === 'saha_muhendisi') {
    const { data: atananlar } = await admin
      .from('is_emri_muhendisleri')
      .select('is_emri_id')
      .eq('muhendis_id', user.id)
    const ids = (atananlar ?? []).map((a: any) => a.is_emri_id)
    if (ids.length > 0) bugunIsEmriQuery = bugunIsEmriQuery.in('id', ids)
    else bugunIsEmriQuery = bugunIsEmriQuery.in('id', ['_']) // boş sonuç
  }

  const { data: bugunIsEmirleri } = await bugunIsEmriQuery

  // Bugünü kapsayan onaylı izinler
  let bugunIzinQuery = admin
    .from('izin_talepleri')
    .select('id, izin_turu, muhendis:profiles!muhendis_id(ad_soyad)')
    .lte('baslangic_tarihi', todayStr)
    .gte('bitis_tarihi', todayStr)
    .eq('durum', 'onaylandi')

  if (profile.rol === 'saha_muhendisi') {
    bugunIzinQuery = bugunIzinQuery.eq('muhendis_id', user.id)
  }

  const { data: bugunIzinler } = await bugunIzinQuery

  return (
    <DashboardContent
      profile={profile}
      isEmirleri={(isEmirleri ?? []) as any[]}
      kpi={{
        toplam: toplamCount ?? 0,
        tamamlanan: tamamlananCount ?? 0,
        bekleyen: bekleyenCount ?? 0,
        aktiveMuhendis: muhendisCount ?? 0,
      }}
      bugunIsEmirleri={(bugunIsEmirleri ?? []) as any[]}
      bugunIzinler={(bugunIzinler ?? []) as any[]}
    />
  )
}
