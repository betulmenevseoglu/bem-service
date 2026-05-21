'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { IzinTalepWithProfile, IzinDurumu } from '@/types'

export function useIzinler(filters?: { durum?: IzinDurumu; muhendisId?: string }) {
  const [izinler, setIzinler] = useState<IzinTalepWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchIzinler() {
    let query = supabase
      .from('izin_talepleri')
      .select('*, muhendis:profiles!muhendis_id(*), karar_veren:profiles!karar_veren_id(*)')
      .order('created_at', { ascending: false })
    if (filters?.durum) query = query.eq('durum', filters.durum)
    if (filters?.muhendisId) query = query.eq('muhendis_id', filters.muhendisId)
    const { data } = await query
    setIzinler((data ?? []) as IzinTalepWithProfile[])
    setLoading(false)
  }

  useEffect(() => { fetchIzinler() }, [filters?.durum, filters?.muhendisId])

  return { izinler, loading, refetch: fetchIzinler }
}
