'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function KullaniciDuzenlePage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ ad_soyad: '', telefon: '', rol: 'saha_muhendisi' as Profile['rol'] })

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setProfile(data)
        setForm({ ad_soyad: data.ad_soyad, telefon: data.telefon ?? '', rol: data.rol })
      }
      setLoading(false)
    })
  }, [id])

  async function handleSave() {
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('profiles').update({
      ad_soyad: form.ad_soyad,
      telefon: form.telefon || null,
      rol: form.rol,
    }).eq('id', id)
    if (err) { setError(err.message); setSaving(false); return }
    setSuccess(true)
    setSaving(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  async function toggleAktif() {
    if (!profile) return
    const yeni = !profile.aktif
    const { error: err } = await supabase.from('profiles').update({ aktif: yeni }).eq('id', id)
    if (!err) setProfile({ ...profile, aktif: yeni })
  }

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin h-6 w-6 text-[#1FBFB8]" /></div>
  if (!profile) return <div className="text-center py-16 text-muted-foreground">Kullanıcı bulunamadı.</div>

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/kullanicilar"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Kullanıcı Düzenle</h1>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert><AlertDescription className="text-green-600 font-medium">Değişiklikler kaydedildi.</AlertDescription></Alert>}

          <div className="space-y-1.5">
            <Label>E-posta <span className="text-xs text-muted-foreground">(değiştirilemez)</span></Label>
            <Input value={profile.email} disabled className="bg-slate-50" />
          </div>
          <div className="space-y-1.5">
            <Label>Ad Soyad</Label>
            <Input value={form.ad_soyad} onChange={e => setForm(f => ({ ...f, ad_soyad: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Telefon</Label>
            <Input value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))} placeholder="+90 555 000 00 00" />
          </div>
          <div className="space-y-1.5">
            <Label>Rol</Label>
            <select
              value={form.rol}
              onChange={e => setForm(f => ({ ...f, rol: e.target.value as Profile['rol'] }))}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="saha_muhendisi">Saha Mühendisi</option>
              <option value="yonetici">Yönetici</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div>
              <Label>Hesap Durumu</Label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${profile.aktif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {profile.aktif ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={toggleAktif}>
              {profile.aktif ? 'Pasif Et' : 'Aktif Et'}
            </Button>
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="animate-spin h-4 w-4" /> Kaydediliyor...</> : 'Kaydet'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
