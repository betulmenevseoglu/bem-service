import { createClient } from '@/lib/supabase/server'
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
    />
  )
}
