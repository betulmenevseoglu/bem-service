import { createClient } from '@/lib/supabase/server'
import { RaporFiltre, MuhendisRaporSatiri, ProjeRaporSatiri, IsTipiOzet, KPIOzet, IsTipi } from '@/types'

export async function getMuhendisRaporu(filtreler: RaporFiltre): Promise<MuhendisRaporSatiri[]> {
  const supabase = await createClient()
  let query = supabase.from('v_muhendis_is_ozeti').select('*')
  if (filtreler.baslangic) query = query.gte('planlanan_baslangic', filtreler.baslangic)
  if (filtreler.bitis) query = query.lte('planlanan_baslangic', filtreler.bitis)
  if (filtreler.muhendisIds?.length) query = query.in('muhendis_id', filtreler.muhendisIds)
  if (filtreler.projeIds?.length) query = query.in('proje_id', filtreler.projeIds)
  if (filtreler.isTipleri?.length) query = query.in('is_tipi', filtreler.isTipleri)
  if (filtreler.durumlar?.length) query = query.in('durum', filtreler.durumlar)

  const { data, error } = await query
  if (error) throw error

  const map = new Map<string, MuhendisRaporSatiri>()
  for (const row of data ?? []) {
    const existing = map.get(row.muhendis_id)
    const sahaGunu = row.saha_gunu ?? 0
    if (!existing) {
      map.set(row.muhendis_id, {
        muhendis_id: row.muhendis_id,
        ad_soyad: row.ad_soyad,
        toplam_is: 1,
        tamamlanan: row.durum === 'tamamlandi' ? 1 : 0,
        tamamlanmayan: row.durum === 'tamamlanmadi' ? 1 : 0,
        devam_eden: row.durum === 'devam_ediyor' ? 1 : 0,
        toplam_saha_gunu: sahaGunu,
        ortalama_is_suresi: sahaGunu,
        aktif_proje_sayisi: 1,
        son_is_tarihi: row.fiili_bitis ?? null,
      })
    } else {
      existing.toplam_is++
      if (row.durum === 'tamamlandi') existing.tamamlanan++
      if (row.durum === 'tamamlanmadi') existing.tamamlanmayan++
      if (row.durum === 'devam_ediyor') existing.devam_eden++
      existing.toplam_saha_gunu += sahaGunu
      if (row.fiili_bitis && (!existing.son_is_tarihi || row.fiili_bitis > existing.son_is_tarihi)) {
        existing.son_is_tarihi = row.fiili_bitis
      }
    }
  }

  const result = Array.from(map.values())
  result.forEach(r => {
    r.ortalama_is_suresi = r.toplam_is > 0 ? Math.round((r.toplam_saha_gunu / r.toplam_is) * 10) / 10 : 0
  })
  return result
}

export async function getProjeRaporu(filtreler: RaporFiltre): Promise<ProjeRaporSatiri[]> {
  const supabase = await createClient()
  let query = supabase.from('v_proje_is_ozeti').select('*')
  if (filtreler.baslangic) query = query.gte('planlanan_baslangic', filtreler.baslangic)
  if (filtreler.bitis) query = query.lte('planlanan_baslangic', filtreler.bitis)
  if (filtreler.projeIds?.length) query = query.in('proje_id', filtreler.projeIds)
  if (filtreler.isTipleri?.length) query = query.in('is_tipi', filtreler.isTipleri)

  const { data, error } = await query
  if (error) throw error

  const map = new Map<string, ProjeRaporSatiri>()
  for (const row of data ?? []) {
    const existing = map.get(row.proje_id)
    const sahaGunu = row.saha_gunu ?? 0
    if (!existing) {
      map.set(row.proje_id, {
        proje_id: row.proje_id,
        proje_ad: row.proje_ad,
        musteri_firma: row.musteri_firma,
        is_emri_sayisi: 1,
        tamamlanan: row.durum === 'tamamlandi' ? 1 : 0,
        toplam_saha_gunu: sahaGunu,
        muhendis_sayisi: row.muhendis_sayisi ?? 0,
        is_tipi_cesitliligi: 1,
        son_servis_tarihi: row.fiili_bitis ?? null,
        bekleyen_is: ['atandi', 'devam_ediyor'].includes(row.durum) ? 1 : 0,
      })
    } else {
      existing.is_emri_sayisi++
      if (row.durum === 'tamamlandi') existing.tamamlanan++
      if (['atandi', 'devam_ediyor'].includes(row.durum)) existing.bekleyen_is++
      existing.toplam_saha_gunu += sahaGunu
      if (row.fiili_bitis && (!existing.son_servis_tarihi || row.fiili_bitis > existing.son_servis_tarihi)) {
        existing.son_servis_tarihi = row.fiili_bitis
      }
    }
  }
  return Array.from(map.values())
}

export async function getIsTipiDagilim(filtreler: RaporFiltre): Promise<IsTipiOzet[]> {
  const supabase = await createClient()
  let query = supabase.from('v_muhendis_is_ozeti').select('is_tipi, durum, saha_gunu')
  if (filtreler.baslangic) query = query.gte('planlanan_baslangic', filtreler.baslangic)
  if (filtreler.bitis) query = query.lte('planlanan_baslangic', filtreler.bitis)

  const { data, error } = await query
  if (error) throw error

  const map = new Map<string, { adedi: number; tamamlanan: number; sahaGunu: number }>()
  for (const row of data ?? []) {
    const k = row.is_tipi as IsTipi
    const existing = map.get(k) ?? { adedi: 0, tamamlanan: 0, sahaGunu: 0 }
    existing.adedi++
    if (row.durum === 'tamamlandi') existing.tamamlanan++
    existing.sahaGunu += row.saha_gunu ?? 0
    map.set(k, existing)
  }

  return Array.from(map.entries()).map(([is_tipi, v]) => ({
    is_tipi: is_tipi as IsTipi,
    is_adedi: v.adedi,
    toplam_saha_gunu: v.sahaGunu,
    ortalama_sure: v.adedi > 0 ? Math.round((v.sahaGunu / v.adedi) * 10) / 10 : 0,
    tamamlanma_orani: v.adedi > 0 ? Math.round((v.tamamlanan / v.adedi) * 100) : 0,
  }))
}

export async function getKPIOzet(filtreler: RaporFiltre): Promise<KPIOzet> {
  const supabase = await createClient()
  let query = supabase.from('is_emirleri').select('durum, planlanan_baslangic')
  if (filtreler.baslangic) query = query.gte('planlanan_baslangic', filtreler.baslangic)
  if (filtreler.bitis) query = query.lte('planlanan_baslangic', filtreler.bitis)

  const { data, error } = await query
  if (error) throw error

  const rows = data ?? []
  const tamamlanan = rows.filter(r => r.durum === 'tamamlandi').length
  const toplam = rows.length

  const { data: muhendisData } = await supabase
    .from('v_muhendis_is_ozeti')
    .select('muhendis_id, saha_gunu')

  const sahaGunuToplam = (muhendisData ?? []).reduce((sum, r) => sum + (r.saha_gunu ?? 0), 0)
  const aktifMuhendis = new Set((muhendisData ?? []).map(r => r.muhendis_id)).size

  return {
    toplam_is_emri: toplam,
    tamamlanan,
    tamamlanma_orani: toplam > 0 ? Math.round((tamamlanan / toplam) * 100) : 0,
    toplam_saha_gunu: Math.round(sahaGunuToplam * 10) / 10,
    aktif_muhendis: aktifMuhendis,
    onceki_donem_toplam: 0,
    onceki_donem_tamamlanan: 0,
  }
}
