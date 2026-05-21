'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SifreDegistirPage() {
  const router = useRouter()
  const [yeniSifre, setYeniSifre] = useState('')
  const [sifroTekrar, setSifreTekrar] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (yeniSifre.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.')
      return
    }
    if (yeniSifre !== sifroTekrar) {
      setError('Şifreler eşleşmiyor.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/profil/sifre-guncelle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yeni_sifre: yeniSifre }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Bir hata oluştu.')
        return
      }
      // Tam sayfa yenileme — useAuth'un taze profil çekmesi için zorunlu
      window.location.href = '/'
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold" style={{ color: '#1FBFB8' }}>
            Şifrenizi Yenileyin
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Güvenliğiniz için ilk girişte şifrenizi yenilemeniz gerekmektedir.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label htmlFor="yeni-sifre" className="text-sm font-medium">
                Yeni Şifre
              </label>
              <input
                id="yeni-sifre"
                type="password"
                required
                minLength={8}
                value={yeniSifre}
                onChange={e => setYeniSifre(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1FBFB8]"
                placeholder="En az 8 karakter"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="sifre-tekrar" className="text-sm font-medium">
                Şifre Tekrar
              </label>
              <input
                id="sifre-tekrar"
                type="password"
                required
                minLength={8}
                value={sifroTekrar}
                onChange={e => setSifreTekrar(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1FBFB8]"
                placeholder="Şifrenizi tekrar girin"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full text-white"
              style={{ backgroundColor: '#1FBFB8' }}
            >
              {loading ? 'Kaydediliyor...' : 'Şifremi Değiştir'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
