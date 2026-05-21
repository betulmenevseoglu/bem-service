'use client'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function SifreDegistirGuard() {
  const { profile, loading } = useAuth()

  useEffect(() => {
    // Profil tam yüklenene kadar bekle — stale veriyle yanlış yönlendirmeyi önler
    if (!loading && profile?.sifre_degistir_gerekli === true) {
      window.location.href = '/sifre-degistir'
    }
  }, [profile, loading])

  return null
}
