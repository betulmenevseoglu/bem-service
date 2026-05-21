'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function YeniProjePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    ad: '', musteri_firma: '', musteri_yetkili: '',
    musteri_telefon: '', musteri_email: '', adres: '', notlar: '',
  })

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.ad.trim() || !form.musteri_firma.trim()) {
      setError('Proje adı ve müşteri firma zorunludur.')
      return
    }
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('projeler').insert({
      ...form,
      musteri_yetkili: form.musteri_yetkili || null,
      musteri_telefon: form.musteri_telefon || null,
      musteri_email: form.musteri_email || null,
      adres: form.adres || null,
      notlar: form.notlar || null,
      aktif: true,
      created_by: user?.id,
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/projeler')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projeler"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Yeni Proje</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Proje Adı <span className="text-destructive">*</span></Label>
                <Input placeholder="Acıbadem Hastanesi BMS Bakım" value={form.ad} onChange={set('ad')} required />
              </div>
              <div className="space-y-1.5">
                <Label>Müşteri Firma <span className="text-destructive">*</span></Label>
                <Input placeholder="Acıbadem Sağlık Grubu" value={form.musteri_firma} onChange={set('musteri_firma')} required />
              </div>
              <div className="space-y-1.5">
                <Label>Yetkili Kişi <span className="text-muted-foreground text-xs">(opsiyonel)</span></Label>
                <Input placeholder="Ayşe Yılmaz" value={form.musteri_yetkili} onChange={set('musteri_yetkili')} />
              </div>
              <div className="space-y-1.5">
                <Label>Müşteri Telefon <span className="text-muted-foreground text-xs">(opsiyonel)</span></Label>
                <Input placeholder="+90 212 000 00 00" value={form.musteri_telefon} onChange={set('musteri_telefon')} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Müşteri E-posta <span className="text-muted-foreground text-xs">(opsiyonel)</span></Label>
                <Input type="email" placeholder="yetkili@sirket.com" value={form.musteri_email} onChange={set('musteri_email')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tesis Adresi <span className="text-muted-foreground text-xs">(opsiyonel)</span></Label>
              <Textarea placeholder="Maslak Mah. Büyükdere Cad. No:123, Sarıyer, İstanbul" value={form.adres} onChange={set('adres')} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Notlar <span className="text-muted-foreground text-xs">(opsiyonel)</span></Label>
              <Textarea placeholder="İç notlar..." value={form.notlar} onChange={set('notlar')} rows={3} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" asChild className="flex-1">
                <Link href="/projeler">İptal</Link>
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? <><Loader2 className="animate-spin h-4 w-4" /> Oluşturuluyor...</> : 'Proje Oluştur'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
