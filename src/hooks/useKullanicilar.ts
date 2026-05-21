'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, RolTuru } from '@/types'

export function useKullanicilar(rol?: RolTuru, sadeceAktif = false) {
  const [kullanicilar, setKullanicilar] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      let query = supabase.from('profiles').select('*').order('ad_soyad')
      if (rol) query = query.eq('rol', rol)
      if (sadeceAktif) query = query.eq('aktif', true)
      const { data } = await query
      setKullanicilar(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [rol, sadeceAktif])

  return { kullanicilar, loading }
}
