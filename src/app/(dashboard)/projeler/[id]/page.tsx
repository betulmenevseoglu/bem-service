'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Proje, ProjeTipi, PROJE_TIPI_LABELS } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Loader2, ArrowLeft, Gauge } from 'lucide-react'
import Link from 'next/link'
import { MalzemeSevkiyat } from './malzeme-sevkiyat'

export default function ProjeDuzenlePage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [proje, setProje] = useState<Proje | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [harcananAdamGun, setHarcananAdamGun] = useState(0)
  const [form, setForm] = useState({
    ad: '', musteri_firma: '', musteri_yetkili: '',
    musteri_telefon: '', musteri_email: '', adres: '', notlar: '',
  })
  const [projeTipi, setProjeTipi] = useState<ProjeTipi | ''>('')
  const [adamGunButcesi, setAdamGunButcesi] = useState<string>('')

  async function fetchProje() {
    const { data } = await supabase.from('projeler').select('*').eq('id', id).single()
    if (data) {
      setProje(data)
      setForm({
        ad: data.ad,
        musteri_firma: data.musteri_firma,
        musteri_yetkili: data.musteri_yetkili ?? '',
        musteri_telefon: data.musteri_telefon ?? '',
        musteri_email: data.musteri_email ?? '',
        adres: data.adres ?? '',
        notlar: data.notlar ?? '',
      })
      setProjeTipi(data.proje_tipi ?? '')
      setAdamGunButcesi(data.adam_gun_butcesi != null ? String(data.adam_gun_butcesi) : '')

      // Adam/gün sadece TAMAMLANMIŞ iş emirlerinden düşer (gerçek süreye göre) —
      // atandı/devam ediyor durumundaki iş emirleri bütçeyi etkilemez.
      const { data: isEmirleri } = await supabase
        .from('is_emirleri')
        .select('adam_gun_dusumu, durum')
        .eq('proje_id', id)
        .in('durum', ['tamamlandi', 'tamamlanmadi'])
      const toplam = (isEmirleri ?? []).reduce((sum, ie) => sum + Number(ie.adam_gun_dusumu ?? 0), 0)
      setHarcananAdamGun(toplam)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProje()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSave() {
    if (!projeTipi) {
      setError('Proje kategorisi seçilmelidir.')
      return
    }
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('projeler').update({
      ...form,
      musteri_yetkili: form.musteri_yetkili || null,
      musteri_telefon: form.musteri_telefon || null,
      musteri_email: form.musteri_email || null,
      adres: form.adres || null,
      notlar: form.notlar || null,
      proje_tipi: projeTipi || null,
      adam_gun_butcesi: adamGunButcesi ? parseFloat(adamGunButcesi) : null,
    }).eq('id', id)
    if (err) { setError(err.message); setSaving(false); return }
    setSuccess(true)
    setSaving(false)
    fetchProje()
    setTimeout(() => setSuccess(false), 3000)
  }

  async function toggleAktif() {
    if (!proje) return
    const { error: err } = await supabase.from('projeler').update({ aktif: !proje.aktif }).eq('id', id)
    if (!err) setProje({ ...proje, aktif: !proje.aktif })
  }

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin h-6 w-6 text-[#1FBFB8]" /></div>
  if (!proje) return <div className="text-center py-16 text-muted-foreground">Proje bulunamadı.</div>

  const butce = proje.adam_gun_butcesi
  const kalan = butce != null ? butce - harcananAdamGun : null
  const yuzde = butce != null && butce > 0 ? Math.min(100, Math.round((harcananAdamGun / butce) * 100)) : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projeler"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Proje Düzenle</h1>
          <p className="text-muted-foreground text-sm">{proje.ad}</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert><AlertDescription className="text-green-600 font-medium">Kaydedildi.</AlertDescription></Alert>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Proje Kategorisi <span className="text-destructive">*</span></Label>
              <select
                value={projeTipi}
                onChange={(e) => setProjeTipi(e.target.value as ProjeTipi | '')}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="" disabled>Kategori seçin...</option>
                {(Object.entries(PROJE_TIPI_LABELS) as [ProjeTipi, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Adam/Gün Bütçesi <span className="text-muted-foreground text-xs">(opsiyonel)</span></Label>
              <Input
                type="number" min="0" step="0.5"
                value={adamGunButcesi}
                onChange={(e) => setAdamGunButcesi(e.target.value)}
                placeholder="Sınırsız (boş bırakılabilir)"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Proje Adı</Label>
              <Input value={form.ad} onChange={set('ad')} />
            </div>
            <div className="space-y-1.5">
              <Label>Müşteri Firma</Label>
              <Input value={form.musteri_firma} onChange={set('musteri_firma')} />
            </div>
            <div className="space-y-1.5">
              <Label>Yetkili Kişi</Label>
              <Input value={form.musteri_yetkili} onChange={set('musteri_yetkili')} />
            </div>
            <div className="space-y-1.5">
              <Label>Müşteri Telefon</Label>
              <Input value={form.musteri_telefon} onChange={set('musteri_telefon')} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Müşteri E-posta</Label>
              <Input type="email" value={form.musteri_email} onChange={set('musteri_email')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tesis Adresi</Label>
            <Textarea value={form.adres} onChange={set('adres')} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Notlar</Label>
            <Textarea value={form.notlar} onChange={set('notlar')} rows={3} />
          </div>

          <div className="flex items-center justify-between py-3 border-t">
            <div>
              <Label>Proje Durumu</Label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${proje.aktif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {proje.aktif ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={toggleAktif}>
              {proje.aktif ? 'Pasif Et' : 'Aktif Et'}
            </Button>
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="animate-spin h-4 w-4" /> Kaydediliyor...</> : 'Kaydet'}
          </Button>
        </CardContent>
      </Card>

      {/* Adam/Gün Takibi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[#1FBFB8]" /> Adam/Gün Takibi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Adam/gün, iş emri oluşturulduğunda değil, <strong>tamamlandığında</strong> gerçek (fiili) süreye göre düşer. İptal edilen veya henüz tamamlanmamış iş emirleri bütçeyi etkilemez.
          </p>
          {butce == null ? (
            <p className="text-sm text-muted-foreground">
              Bütçe tanımlanmadı — bu proje için adam/gün sınırı takip edilmiyor.
              Harcanan: <span className="font-medium text-foreground">{harcananAdamGun} adam/gün</span>
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Harcanan: <span className="font-medium text-foreground">{harcananAdamGun}</span></span>
                <span className="text-muted-foreground">Bütçe: <span className="font-medium text-foreground">{butce}</span></span>
              </div>
              <Progress value={yuzde} className={kalan != null && kalan < 0 ? '[&>div]:bg-red-500' : ''} />
              <p className={`text-sm font-medium ${kalan != null && kalan < 0 ? 'text-red-600' : 'text-[#1FBFB8]'}`}>
                Kalan: {kalan} adam/gün{kalan != null && kalan < 0 ? ' (bütçe aşıldı)' : ''}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Malzeme & Sevkiyat — sadece Devreye Alma projeleri için */}
      {projeTipi === 'devreye_alma' && <MalzemeSevkiyat projeId={id} />}
    </div>
  )
}
