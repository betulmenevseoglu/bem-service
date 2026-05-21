'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getImzaSignedUrl } from '@/lib/fotograf'
import { IS_TIPI_LABELS, IsTipi, ServisFotograf } from '@/types'
import { formatTarihSaat } from '@/lib/tarih'
import { ImzaAlani } from '@/components/forms/ImzaAlani'
import { FotografYukleme } from '@/components/forms/FotografYukleme'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Loader2, ArrowLeft, Save, CheckCircle, Download, Lock } from 'lucide-react'
import Link from 'next/link'

export default function SahaServisFormuPage() {
  const { id: isEmriId } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isEmri, setIsEmri] = useState<any>(null)
  const [servisFormuId, setServisFormuId] = useState<string | null>(null)
  const [formTamamlandi, setFormTamamlandi] = useState(false)
  const [fotograflar, setFotograflar] = useState<ServisFotograf[]>([])
  const [imzalar, setImzalar] = useState<Record<string, string>>({})
  const [muhendisImzaUrller, setMuhendisImzaUrller] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    fiili_baslangic: '',
    fiili_bitis: '',
    teknik_rapor: '',
    is_tamamlandi: true,
    tamamlanmama_nedeni: '',
    musteri_imza_atan_ad: '',
  })
  const [musteriImzaDataUrl, setMusteriImzaDataUrl] = useState<string | null>(null)
  const [musteriImzaUrl, setMusteriImzaUrl] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/login'); return }
      setUser(u)

      const { data: ie } = await supabase
        .from('is_emirleri')
        .select('*, proje:projeler(*), muhendisler:is_emri_muhendisleri(muhendis:profiles(*))')
        .eq('id', isEmriId)
        .single()

      if (!ie) { router.push('/is-emirleri'); return }
      setIsEmri(ie)

      const { data: sf } = await supabase
        .from('servis_formlari')
        .select('*')
        .eq('is_emri_id', isEmriId)
        .maybeSingle()

      const now = new Date()
      const nowStr = now.toISOString().slice(0, 16)
      const planStr = ie.planlanan_baslangic ? ie.planlanan_baslangic.slice(0, 16) : nowStr

      if (sf) {
        setServisFormuId(sf.id)
        setForm({
          fiili_baslangic: sf.fiili_baslangic?.slice(0, 16) ?? planStr,
          fiili_bitis: sf.fiili_bitis?.slice(0, 16) ?? nowStr,
          teknik_rapor: sf.teknik_rapor ?? '',
          is_tamamlandi: sf.is_tamamlandi ?? true,
          tamamlanmama_nedeni: sf.tamamlanmama_nedeni ?? '',
          musteri_imza_atan_ad: sf.musteri_imza_atan_ad ?? '',
        })
        if (sf.musteri_imza_url) {
          try {
            const signedUrl = await getImzaSignedUrl(sf.musteri_imza_url)
            setMusteriImzaUrl(signedUrl)
          } catch {
            setMusteriImzaUrl(sf.musteri_imza_url)
          }
          setFormTamamlandi(true) // Müşteri imzası varsa form kilitli
        }

        const { data: fotos } = await supabase
          .from('servis_fotograflari')
          .select('*')
          .eq('servis_formu_id', sf.id)
          .order('sira')
        setFotograflar(fotos ?? [])

        const { data: imzaRows } = await supabase
          .from('servis_formu_imzalari')
          .select('*')
          .eq('servis_formu_id', sf.id)

        const urlMap: Record<string, string> = {}
        for (const imza of imzaRows ?? []) {
          try {
            const url = await getImzaSignedUrl(imza.imza_url)
            urlMap[imza.muhendis_id] = url
          } catch {}
        }
        setMuhendisImzaUrller(urlMap)
      } else {
        setForm(f => ({ ...f, fiili_baslangic: planStr, fiili_bitis: nowStr }))
      }

      setLoading(false)
    }
    load()
  }, [isEmriId])

  async function ensureServisFormu(): Promise<string> {
    if (servisFormuId) return servisFormuId
    // Boş string Supabase timestamptz kolonunda null'a dönüşür — koruma ekle
    const now = new Date().toISOString().slice(0, 16)
    const { data: sf, error: err } = await supabase.from('servis_formlari').insert({
      is_emri_id: isEmriId,
      fiili_baslangic: form.fiili_baslangic || now,
      fiili_bitis: form.fiili_bitis || now,
      teknik_rapor: form.teknik_rapor,
      is_tamamlandi: form.is_tamamlandi,
      tamamlanmama_nedeni: form.is_tamamlandi ? null : form.tamamlanmama_nedeni,
      son_kaydeden_id: user.id,
    }).select().single()
    if (err || !sf) throw new Error(err?.message ?? 'Form oluşturulamadı')
    setServisFormuId(sf.id)
    return sf.id
  }

  async function uploadImza(dataUrl: string, isMusteri: boolean, muhendisId?: string): Promise<string> {
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const suffix = isMusteri ? 'musteri' : muhendisId
    const path = `imzalar/${isEmriId}/${suffix}.png`
    const { error } = await supabase.storage.from('imzalar').upload(path, blob, { contentType: 'image/png', upsert: true })
    if (error) throw error
    return path
  }

  // Form tamamlandıktan sonra yalnızca kendi imzasını ekleyen mühendis için
  async function handleSadecImzaKaydet() {
    if (!servisFormuId || !imzalar[user.id]) return
    setSaving(true)
    setError(null)
    try {
      const imzaPath = await uploadImza(imzalar[user.id], false, user.id)
      await supabase.from('servis_formu_imzalari').upsert({
        servis_formu_id: servisFormuId,
        muhendis_id: user.id,
        imza_url: imzaPath,
        imza_tarihi: new Date().toISOString(),
      }, { onConflict: 'servis_formu_id,muhendis_id' })
      const signedUrl = await getImzaSignedUrl(imzaPath)
      setMuhendisImzaUrller(prev => ({ ...prev, [user.id]: signedUrl }))
      setImzalar(prev => { const n = { ...prev }; delete n[user.id]; return n })
      setSuccess('İmzanız başarıyla kaydedildi.')
      setTimeout(() => setSuccess(null), 4000)
    } catch (err: any) {
      setError(err.message)
    }
    setSaving(false)
  }

  async function handleKaydet(tamamla = false) {
    setSaving(true)
    setError(null)

    if (tamamla) {
      if (!form.teknik_rapor || form.teknik_rapor.length < 20) {
        setError('Teknik rapor en az 20 karakter olmalıdır.')
        setSaving(false)
        return
      }
      if (!form.is_tamamlandi && !form.tamamlanmama_nedeni) {
        setError('Tamamlanmama nedeni zorunludur.')
        setSaving(false)
        return
      }
      if (!form.musteri_imza_atan_ad || !musteriImzaDataUrl) {
        setError('Müşteri imzası ve yetkili adı zorunludur.')
        setSaving(false)
        return
      }
    }

    try {
      const sfId = await ensureServisFormu()

      let musteriImzaPath = musteriImzaUrl
      if (musteriImzaDataUrl) {
        musteriImzaPath = await uploadImza(musteriImzaDataUrl, true)
      }

      const now = new Date().toISOString().slice(0, 16)
      const { error: updateErr } = await supabase.from('servis_formlari').update({
        fiili_baslangic: form.fiili_baslangic || now,
        fiili_bitis: form.fiili_bitis || now,
        teknik_rapor: form.teknik_rapor,
        is_tamamlandi: form.is_tamamlandi,
        tamamlanmama_nedeni: form.is_tamamlandi ? null : form.tamamlanmama_nedeni,
        musteri_imza_url: musteriImzaPath,
        musteri_imza_atan_ad: form.musteri_imza_atan_ad || null,
        musteri_imza_tarihi: musteriImzaPath ? new Date().toISOString() : null,
        son_kaydeden_id: user.id,
      }).eq('id', sfId)

      if (updateErr) throw new Error(updateErr.message)

      for (const [muhendisId, dataUrl] of Object.entries(imzalar)) {
        const imzaPath = await uploadImza(dataUrl, false, muhendisId)
        await supabase.from('servis_formu_imzalari').upsert({
          servis_formu_id: sfId,
          muhendis_id: muhendisId,
          imza_url: imzaPath,
          imza_tarihi: new Date().toISOString(),
        }, { onConflict: 'servis_formu_id,muhendis_id' })
      }

      if (tamamla) {
        // İş emri durumunu güncelle — RLS kısıtlaması nedeniyle API üzerinden
        const yeniDurum = form.is_tamamlandi ? 'tamamlandi' : 'tamamlanmadi'
        await fetch(`/api/is-emri/${isEmriId}/durum`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ durum: yeniDurum }),
        })
        router.push(`/is-emirleri/${isEmriId}`)
      } else {
        // Taslak kaydedildi → iş emri "devam ediyor" durumuna geçsin
        await fetch(`/api/is-emri/${isEmriId}/durum`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ durum: 'devam_ediyor' }),
        })
        setSuccess('Taslak kaydedildi.')
        setTimeout(() => setSuccess(null), 4000)
      }
    } catch (err: any) {
      setError(err.message)
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin h-8 w-8 text-[#1FBFB8]" />
    </div>
  )

  if (!isEmri) return null

  const muhendisler = (isEmri.muhendisler ?? []).map((m: any) => m.muhendis).filter(Boolean)
  const isAtanan = muhendisler.some((m: any) => m.id === user?.id)
  // Düzenlenebilir mi? Atanan mühendis + form henüz tamamlanmamış olmalı
  const canEdit = isAtanan && !formTamamlandi
  // İmza atabilir mi? Form tamamlansa bile henüz imzalamamış atanan mühendis imza atabilir
  const benImzaladimMi = !!muhendisImzaUrller[user?.id]
  const canSign = isAtanan && !benImzaladimMi && !!servisFormuId

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/is-emirleri/${isEmriId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <p className="text-xs font-mono font-bold text-[#1FBFB8]">{isEmri.emir_no ?? '—'}</p>
          <h1 className="text-xl font-bold">Saha Servis Formu</h1>
        </div>
        {servisFormuId && (
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/pdf/${isEmriId}`} target="_blank" rel="noopener">
              <Download className="h-4 w-4" /> PDF
            </a>
          </Button>
        )}
      </div>

      {/* Form tamamlandı banner */}
      {formTamamlandi && (
        <Alert className={canSign ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}>
          <Lock className={`h-4 w-4 ${canSign ? 'text-amber-600' : 'text-green-600'}`} />
          <AlertDescription className={`font-medium ${canSign ? 'text-amber-700' : 'text-green-700'}`}>
            {canSign
              ? 'Bu form tamamlanmıştır ancak henüz imzalamadınız. Aşağıdan imzanızı ekleyebilirsiniz.'
              : 'Bu form müşteri tarafından imzalanmış ve tamamlanmıştır. Düzenleme yapılamaz.'}
          </AlertDescription>
        </Alert>
      )}

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><AlertDescription className="text-green-600 font-medium flex items-center gap-2"><CheckCircle className="h-4 w-4" />{success}</AlertDescription></Alert>}

      {/* Bölüm 1: İş Emri Özeti */}
      <Card>
        <CardHeader><CardTitle className="text-base">İş Emri Özeti</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div><span className="text-muted-foreground">Proje:</span> <span className="font-medium">{isEmri.proje?.ad}</span></div>
            <div><span className="text-muted-foreground">Müşteri:</span> <span className="font-medium">{isEmri.proje?.musteri_firma}</span></div>
            <div><span className="text-muted-foreground">İş Tipi:</span> <span className="font-medium">{IS_TIPI_LABELS[isEmri.is_tipi as IsTipi]}</span></div>
            <div><span className="text-muted-foreground">Planlanan:</span> <span className="font-medium">{formatTarihSaat(isEmri.planlanan_baslangic)}</span></div>
          </div>
          {isEmri.proje?.adres && (
            <div><span className="text-muted-foreground">Tesis Adresi:</span> <span className="font-medium">{isEmri.proje.adres}</span></div>
          )}
          <div><span className="text-muted-foreground">İş Tanımı:</span> <span className="font-medium">{isEmri.is_tanimi}</span></div>
        </CardContent>
      </Card>

      {/* Bölüm 2: Fiili Çalışma */}
      <Card>
        <CardHeader><CardTitle className="text-base">Fiili Çalışma Süresi</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Fiili Başlangıç</Label>
              <Input
                type="datetime-local"
                value={form.fiili_baslangic}
                onChange={e => setForm(f => ({ ...f, fiili_baslangic: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fiili Bitiş</Label>
              <Input
                type="datetime-local"
                value={form.fiili_bitis}
                onChange={e => setForm(f => ({ ...f, fiili_bitis: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bölüm 3: Teknik Rapor */}
      <Card>
        <CardHeader><CardTitle className="text-base">Teknik Rapor</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            placeholder="Yapılan işlerin detaylı teknik açıklaması... (min 20 karakter)"
            value={form.teknik_rapor}
            onChange={e => setForm(f => ({ ...f, teknik_rapor: e.target.value }))}
            disabled={!canEdit}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{form.teknik_rapor.length} karakter</p>
        </CardContent>
      </Card>

      {/* Bölüm 4: Fotoğraflar — taslak kaydı beklenmez */}
      <Card>
        <CardHeader><CardTitle className="text-base">Saha Fotoğrafları</CardTitle></CardHeader>
        <CardContent>
          <FotografYukleme
            fotograflar={fotograflar}
            setFotograflar={setFotograflar}
            isEmriId={isEmriId}
            servisFormuId={servisFormuId}
            ensureServisFormuId={ensureServisFormu}
            yukleyenId={user?.id ?? ''}
            canUpload={canEdit}
          />
        </CardContent>
      </Card>

      {/* Bölüm 5: Sonuç */}
      <Card>
        <CardHeader><CardTitle className="text-base">Sonuç</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <label className={`flex items-center gap-2 cursor-pointer px-4 py-3 rounded-lg border-2 flex-1 transition-colors ${form.is_tamamlandi ? 'border-green-500 bg-green-50' : 'border-border'}`}>
              <input
                type="radio"
                checked={form.is_tamamlandi}
                onChange={() => setForm(f => ({ ...f, is_tamamlandi: true }))}
                disabled={!canEdit}
                className="accent-green-500"
              />
              <span className="font-medium text-sm">İş Tamamlandı ✓</span>
            </label>
            <label className={`flex items-center gap-2 cursor-pointer px-4 py-3 rounded-lg border-2 flex-1 transition-colors ${!form.is_tamamlandi ? 'border-red-500 bg-red-50' : 'border-border'}`}>
              <input
                type="radio"
                checked={!form.is_tamamlandi}
                onChange={() => setForm(f => ({ ...f, is_tamamlandi: false }))}
                disabled={!canEdit}
                className="accent-red-500"
              />
              <span className="font-medium text-sm">Tamamlanmadı ✗</span>
            </label>
          </div>
          {!form.is_tamamlandi && (
            <div className="space-y-1.5">
              <Label>Tamamlanmama Nedeni <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Neden tamamlanamadığını açıklayın..."
                value={form.tamamlanmama_nedeni}
                onChange={e => setForm(f => ({ ...f, tamamlanmama_nedeni: e.target.value }))}
                disabled={!canEdit}
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bölüm 6: İmzalar */}
      <Card>
        <CardHeader><CardTitle className="text-base">İmzalar</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Saha Mühendisi İmzaları</p>
            {muhendisler.map((m: any) => {
              const isMe = m.id === user?.id
              const mevcutUrl = muhendisImzaUrller[m.id] ?? null
              return (
                <div key={m.id}>
                  <p className="text-sm font-medium mb-2">{m.ad_soyad}{isMe && <span className="text-xs text-[#1FBFB8] ml-2">(Siz)</span>}</p>
                  {isMe ? (
                    <ImzaAlani
                      mevcutImzaUrl={mevcutUrl}
                      onSave={dataUrl => setImzalar(prev => ({ ...prev, [m.id]: dataUrl }))}
                      disabled={!canEdit && !canSign}
                    />
                  ) : mevcutUrl ? (
                    <ImzaAlani mevcutImzaUrl={mevcutUrl} onSave={() => {}} disabled />
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground text-sm">
                      Mühendis henüz imzalamadı
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Müşteri Onayı</p>
            <div className="space-y-1.5">
              <Label>Yetkili Adı <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Müşteri yetkili kişisinin adı soyadı"
                value={form.musteri_imza_atan_ad}
                onChange={e => setForm(f => ({ ...f, musteri_imza_atan_ad: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
            <ImzaAlani
              label="Müşteri İmzası"
              mevcutImzaUrl={musteriImzaUrl}
              onSave={setMusteriImzaDataUrl}
              disabled={!canEdit}
            />
          </div>
        </CardContent>
      </Card>

      {/* Kaydet butonları — form düzenlenebilir */}
      {canEdit && (
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => handleKaydet(false)} disabled={saving}>
            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            Taslak Kaydet
          </Button>
          <Button className="flex-1" onClick={() => handleKaydet(true)} disabled={saving}>
            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            İmzala ve Tamamla
          </Button>
        </div>
      )}

      {/* Form tamamlandı ama mühendis henüz imzalamamış — sadece imza kaydet */}
      {!canEdit && canSign && (
        <Button
          className="w-full"
          onClick={handleSadecImzaKaydet}
          disabled={saving || !imzalar[user?.id]}
        >
          {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          İmzamı Kaydet
        </Button>
      )}
    </div>
  )
}
