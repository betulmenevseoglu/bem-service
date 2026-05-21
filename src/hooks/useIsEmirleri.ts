'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { IsEmriWithDetails, IsEmriDurumu, IsTipi } from '@/types'

export function useIsEmirleri(filters?: {
  durum?: IsEmriDurumu[]
  muhendisId?: string
  projeId?: string
  isTipi?: IsTipi[]
}) {
  const [isEmirleri, setIsEmirleri] = useState<IsEmriWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function fetchIsEmirleri() {
    setLoading(true)
    let query = supabase
      .from('is_emirleri')
      .select(`
        *,
        proje:projeler(*),
        muhendisler:is_emri_muhendisleri(muhendis:profiles(*)),
        servis_formu:servis_formlari(*)
      `)
      .order('created_at', { ascending: false })

    if (filters?.durum?.length) query = query.in('durum', filters.durum)
    if (filters?.isTipi?.length) query = query.in('is_tipi', filters.isTipi)

    const { data, error: err } = await query
    if (err) { setError(err.message); setLoading(false); return }

    const mapped = (data ?? []).map(ie => ({
      ...ie,
      proje: ie.proje,
      muhendisler: (ie.muhendisler as any[]).map((m: any) => m.muhendis).filter(Boolean),
      servis_formu: ie.servis_formu?.[0] ?? null,
    }))

    const filtered = filters?.muhendisId
      ? mapped.filter(ie => ie.muhendisler.some((m: any) => m.id === filters.muhendisId))
      : mapped

    setIsEmirleri(filtered as IsEmriWithDetails[])
    setLoading(false)
  }

  useEffect(() => { fetchIsEmirleri() }, [])

  return { isEmirleri, loading, error, refetch: fetchIsEmirleri }
}
