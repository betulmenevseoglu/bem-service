'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface YetkiliForm {
  ad_soyad: string
  unvan: string
  telefon: string
  email: string
  birincil: boolean
}

const emptyYetkili = (): YetkiliForm => ({
  ad_soyad: '',
  unvan: '',
  telefon: '',
  email: '',
  birincil: false,
})

export default function YeniMusteriPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ firma_adi: '', adres: '', notlar: '' })
  const [yetkilileri, setYetkilileri] = useState<YetkiliForm[]>([{ ...emptyYetkili(), birincil: true }])

  function setField(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  function setYetkiliField(idx: number, key: keyof YetkiliForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setYetkilileri(prev => prev.map((y, i) => i === idx ? { ...y, [key]: e.target.value } : y))
  }

  function setBirincil(idx: number, checked: boolean) {
    setYetkilileri(prev => prev.map((y, i) =>
      i === idx ? { ...y, birincil: checked } : checked ? { ...y, birincil: false } : y
    ))
  }

  function addYetkili() {
    setYetkilileri(prev => [...prev, emptyYetkili()])
  }

  function removeYetkili(idx: number) {
    setYetkilileri(prev => {
      const next = prev.filter((_, i) => i !== idx)
      // if removed was birincil and there's still at least one, make first birincil
      if (prev[idx].birincil && next.length > 0) {
        next[0] = { ...next[0], birincil: true }
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firma_adi.trim()) {
      setError('Firma adı zorunludur.')
      return
    }
    const invalidYetkili = yetkilileri.some(y => !y.ad_soyad.trim())
    if (invalidYetkili) {
      setError('Tüm yetkililerin Ad Soyad alanı zorunludur.')
      return
    }

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Oturum bulunamadı.'); setLoading(false); return }

    const { data: musteri, error: musteriErr } = await supabase
      .from('musteriler')
      .insert({
        firma_adi: form.firma_adi.trim(),
        adres: form.adres.trim() || null,
        notlar: form.notlar.trim() || null,
        aktif: true,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (musteriErr || !musteri) {
      setError(musteriErr?.message ?? 'Müşteri oluşturulamadı.')
      setLoading(false)
      return
    }

    if (yetkilileri.length > 0) {
      const { error: yetkiliErr } = await supabase.from('musteri_yetkilileri').insert(
        yetkilileri.map(y => ({
          musteri_id: musteri.id,
          ad_soyad: y.ad_soyad.trim(),
          unvan: y.unvan.trim() || null,
          telefon: y.telefon.trim() || null,
          email: y.email.trim() || null,
          birincil: y.birincil,
        }))
      )
      if (yetkiliErr) {
        setError(yetkiliErr.message)
        setLoading(false)
        return
      }
    }

    router.push('/musteriler')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/musteriler"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Yeni Müşteri</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Firma Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Firma Adı <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Acıbadem Sağlık Grubu"
                value={form.firma_adi}
                onChange={setField('firma_adi')}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Adres <span className="text-muted-foreground text-xs">(opsiyonel)</span></Label>
              <Textarea
                placeholder="Maslak Mah. Büyükdere Cad. No:123, Sarıyer, İstanbul"
                value={form.adres}
                onChange={setField('adres')}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notlar <span className="text-muted-foreground text-xs">(opsiyonel)</span></Label>
              <Textarea
                placeholder="İç notlar..."
                value={form.notlar}
                onChange={setField('notlar')}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yetkililer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {yetkilileri.map((y, idx) => (
              <div key={idx}>
                {idx > 0 && <Separator className="mb-4" />}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Yetkili {idx + 1}</span>
                    {yetkilileri.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        onClick={() => removeYetkili(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Ad Soyad <span className="text-destructive">*</span></Label>
                      <Input
                        placeholder="Ayşe Yılmaz"
                        value={y.ad_soyad}
                        onChange={setYetkiliField(idx, 'ad_soyad')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Unvan <span className="text-muted-foreground text-xs">(opsiyonel)</span></Label>
                      <Input
                        placeholder="Satın Alma Müdürü"
                        value={y.unvan}
                        onChange={setYetkiliField(idx, 'unvan')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Telefon <span className="text-muted-foreground text-xs">(opsiyonel)</span></Label>
                      <Input
                        placeholder="+90 212 000 00 00"
                        value={y.telefon}
                        onChange={setYetkiliField(idx, 'telefon')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>E-posta <span className="text-muted-foreground text-xs">(opsiyonel)</span></Label>
                      <Input
                        type="email"
                        placeholder="yetkili@sirket.com"
                        value={y.email}
                        onChange={setYetkiliField(idx, 'email')}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`birincil-${idx}`}
                      checked={y.birincil}
                      onCheckedChange={(checked) => setBirincil(idx, checked === true)}
                    />
                    <Label htmlFor={`birincil-${idx}`} className="text-sm font-normal cursor-pointer">
                      Birincil yetkili
                    </Label>
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addYetkili}
              className="w-full mt-2"
            >
              <Plus className="h-4 w-4" /> Yetkili Ekle
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild className="flex-1">
            <Link href="/musteriler">İptal</Link>
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? <><Loader2 className="animate-spin h-4 w-4" /> Oluşturuluyor...</> : 'Müşteri Oluştur'}
          </Button>
        </div>
      </form>
    </div>
  )
}
