'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ProfilPage() {
  const { profile } = useAuth()

  const [yeniSifre, setYeniSifre] = useState('')
  const [sifreTekrar, setSifreTekrar] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSifreGuncelle(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (yeniSifre.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.')
      return
    }
    if (yeniSifre !== sifreTekrar) {
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
      setSuccess(true)
      setYeniSifre('')
      setSifreTekrar('')
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profilim</h1>

      {/* Profil Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ad Soyad</p>
              <p className="text-sm font-medium">{profile?.ad_soyad ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">E-posta</p>
              <p className="text-sm font-medium">{profile?.email ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Telefon</p>
              <p className="text-sm font-medium">{profile?.telefon ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Rol</p>
              <Badge variant="outline" className="text-xs">
                {profile?.rol === 'yonetici' ? 'Yönetici' : 'Saha Mühendisi'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Şifre Değiştir */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Şifre Değiştir</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSifreGuncelle} className="space-y-4">
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
                value={sifreTekrar}
                onChange={e => setSifreTekrar(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1FBFB8]"
                placeholder="Şifrenizi tekrar girin"
              />
            </div>

            {success && (
              <Alert className="border-green-500 bg-green-50 text-green-800">
                <AlertDescription>Şifreniz başarıyla güncellendi.</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-destructive bg-destructive/10 text-destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="text-white"
              style={{ backgroundColor: '#1FBFB8' }}
            >
              {loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
