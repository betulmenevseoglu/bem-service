'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isEmriSchema, IsEmriFormData } from '@/lib/validations/is-emri'
import { createClient } from '@/lib/supabase/client'
import { Proje, Profile, IS_TIPI_LABELS } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Star } from 'lucide-react'
import Link from 'next/link'

export default function YeniIsEmriPage() {
  const router = useRouter()
  const supabase = createClient()
  const [projeler, setProjeler] = useState<Proje[]>([])
  const [muhendisler, setMuhendisler] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ustaMuhendisId, setUstaMuhendisId] = useState<string>('')
  const [harcananAdamGun, setHarcananAdamGun] = useState(0)

  const form = useForm<IsEmriFormData>({
    resolver: zodResolver(isEmriSchema),
    defaultValues: {
      proje_id: '',
      muhendis_ids: [],
      is_tipi: 'spot_servis',
      is_tanimi: '',
      planlanan_baslangic: '',
      planlanan_bitis: '',
    },
  })

  useEffect(() => {
    supabase.from('projeler').select('*').eq('aktif', true).order('ad').then(({ data }) => setProjeler(data ?? []))
    supabase.from('profiles').select('*').eq('rol', 'saha_muhendisi').eq('aktif', true).order('ad_soyad').then(({ data }) => setMuhendisler(data ?? []))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedMuhendisIds = form.watch('muhendis_ids')
  const secilenProjeId = form.watch('proje_id')
  const planlananBaslangic = form.watch('planlanan_baslangic')
  const planlananBitis = form.watch('planlanan_bitis')
  const secilenProje = projeler.find(p => p.id === secilenProjeId) ?? null

  // Seçilen projenin harcanan adam/gün toplamını çek — sadece TAMAMLANMIŞ iş emirleri
  // bütçeyi etkiler (gerçek süreye göre); atandı/devam eden iş emirleri sayılmaz.
  useEffect(() => {
    if (!secilenProjeId) { setHarcananAdamGun(0); return }
    supabase
      .from('is_emirleri')
      .select('adam_gun_dusumu')
      .eq('proje_id', secilenProjeId)
      .in('durum', ['tamamlandi', 'tamamlanmadi'])
      .then(({ data }) => {
        setHarcananAdamGun((data ?? []).reduce((sum, r) => sum + Number(r.adam_gun_dusumu ?? 0), 0))
      })
  }, [secilenProjeId]) // eslint-disable-line react-hooks/exhaustive-deps

  // İş günü sayısı: başlangıç-bitiş tarih aralığındaki hafta sonu (Cmt/Paz) hariç gün sayısı.
  // Tek günlük (hafta sonuna denk gelse dahi) iş emirlerinde en az 1 gün sayılır.
  function hesaplaIsGunuSayisi(bas: Date, bit: Date): number {
    const cursor = new Date(bas.getFullYear(), bas.getMonth(), bas.getDate())
    const son = new Date(bit.getFullYear(), bit.getMonth(), bit.getDate())
    let sayac = 0
    while (cursor <= son) {
      const haftaGunu = cursor.getDay() // 0=Pazar, 6=Cumartesi
      if (haftaGunu !== 0 && haftaGunu !== 6) sayac++
      cursor.setDate(cursor.getDate() + 1)
    }
    return Math.max(1, sayac)
  }

  // Bu iş emri için TAHMİNİ adam/gün (bilgi amaçlı): planlanan iş günü sayısı × atanan mühendis sayısı.
  // Gerçek düşüm bütçeden ancak iş TAMAMLANDIĞINDA, fiili süreye göre yapılır — burada sadece öngörü gösterilir.
  function hesaplaTahminiAdamGun(): number {
    if (!planlananBaslangic || !planlananBitis || selectedMuhendisIds.length === 0) return 0
    const bas = new Date(planlananBaslangic)
    const bit = new Date(planlananBitis)
    if (isNaN(bas.getTime()) || isNaN(bit.getTime()) || bit <= bas) return 0
    return hesaplaIsGunuSayisi(bas, bit) * selectedMuhendisIds.length
  }

  const tahminiAdamGun = hesaplaTahminiAdamGun()
  const projeButcesi = secilenProje?.adam_gun_butcesi ?? null
  const kalanButce = projeButcesi != null ? projeButcesi - harcananAdamGun : null

  function toggleMuhendis(id: string) {
    const current = form.getValues('muhendis_ids')
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id]
    form.setValue('muhendis_ids', next, { shouldValidate: true })

    // Baş mühendisi otomatik yönet
    if (next.length === 0) {
      setUstaMuhendisId('')
    } else if (next.length === 1) {
      setUstaMuhendisId(next[0])
    } else if (!next.includes(ustaMuhendisId)) {
      // Seçili usta kaldırıldıysa ilk mühendise ata
      setUstaMuhendisId(next[0])
    }
  }

  async function onSubmit(data: IsEmriFormData) {
    // Birden fazla mühendis varsa usta seçilmiş olmalı
    if (data.muhendis_ids.length >= 2 && !ustaMuhendisId) {
      setError('Lütfen baş mühendisi seçin.')
      return
    }

    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: ie, error: ieErr } = await supabase.from('is_emirleri').insert({
      proje_id: data.proje_id,
      olusturan_id: user!.id,
      is_tipi: data.is_tipi,
      is_tanimi: data.is_tanimi,
      planlanan_baslangic: data.planlanan_baslangic,
      planlanan_bitis: data.planlanan_bitis,
      durum: 'atandi',
    }).select().single()

    if (ieErr || !ie) { setError(ieErr?.message ?? 'Hata'); setLoading(false); return }

    // Tek mühendis varsa otomatik baş mühendis
    const ustaMid = data.muhendis_ids.length === 1 ? data.muhendis_ids[0] : ustaMuhendisId

    const muhendisRows = data.muhendis_ids.map(mid => ({
      is_emri_id: ie.id,
      muhendis_id: mid,
      usta_mi: mid === ustaMid,
    }))
    const { error: mErr } = await supabase.from('is_emri_muhendisleri').insert(muhendisRows)
    if (mErr) { setError(mErr.message); setLoading(false); return }

    router.push(`/is-emirleri/${ie.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/is-emirleri"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Yeni İş Emri</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="proje_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Proje <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <select {...field} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                      <option value="">Proje seçin...</option>
                      {projeler.map(p => (
                        <option key={p.id} value={p.id}>{p.ad} — {p.musteri_firma}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="is_tipi" render={({ field }) => (
                <FormItem>
                  <FormLabel>İş Tipi <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <select {...field} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                      {Object.entries(IS_TIPI_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="is_tanimi" render={({ field }) => (
                <FormItem>
                  <FormLabel>İş Tanımı <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="Yapılacak işin detaylı açıklaması..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="planlanan_baslangic" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planlanan Başlangıç <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="planlanan_bitis" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planlanan Bitiş <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Mühendis seçimi */}
              <FormField control={form.control} name="muhendis_ids" render={() => (
                <FormItem>
                  <FormLabel>Atanan Mühendis(ler) <span className="text-destructive">*</span></FormLabel>
                  <div className="space-y-2 mt-2">
                    {muhendisler.map(m => {
                      const secili = selectedMuhendisIds.includes(m.id)
                      const isUsta = ustaMuhendisId === m.id
                      return (
                        <label key={m.id} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors ${secili ? 'bg-accent/50' : ''}`}>
                          <input
                            type="checkbox"
                            checked={secili}
                            onChange={() => toggleMuhendis(m.id)}
                            className="h-4 w-4 rounded border-gray-300 accent-[#1FBFB8] cursor-pointer"
                          />
                          <span className="text-sm font-medium flex-1">{m.ad_soyad}</span>
                          {m.telefon && <span className="text-xs text-muted-foreground">{m.telefon}</span>}
                          {secili && isUsta && selectedMuhendisIds.length >= 2 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-[#1FBFB8]/10 text-[#1FBFB8]">
                              <Star className="h-3 w-3 fill-current" /> Baş
                            </span>
                          )}
                        </label>
                      )
                    })}
                    {muhendisler.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">Aktif mühendis bulunamadı.</p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Adam/gün bilgisi — sadece tahmin, iş tamamlanınca gerçek süreye göre düşer */}
              {tahminiAdamGun > 0 && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
                  <p>
                    Tahmini adam/gün: <span className="font-semibold">{tahminiAdamGun}</span>
                    <span className="text-muted-foreground"> (planlanan tarihlere göre — iş tamamlandığında gerçek süreye göre düşülecek)</span>
                  </p>
                  {projeButcesi != null && (
                    <p className="text-muted-foreground">
                      Proje bütçesi: {projeButcesi} · Tamamlanan işlerden harcanan: {harcananAdamGun} · Kalan: {kalanButce} adam/gün
                    </p>
                  )}
                </div>
              )}

              {/* Baş mühendis seçimi — 2+ mühendis seçilince görünür */}
              {selectedMuhendisIds.length >= 2 && (
                <div className="rounded-lg border border-[#1FBFB8]/30 bg-[#1FBFB8]/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-[#1FBFB8] fill-current" />
                    <p className="text-sm font-medium text-[#1FBFB8]">Yetkili Mühendis</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formu dolduracak, imzalayacak ve müşteri onayını alacak kişiyi seçin.
                  </p>
                  <div className="space-y-2">
                    {selectedMuhendisIds.map(id => {
                      const m = muhendisler.find(m => m.id === id)
                      if (!m) return null
                      return (
                        <label key={id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${ustaMuhendisId === id ? 'bg-[#1FBFB8]/10' : 'hover:bg-accent'}`}>
                          <input
                            type="radio"
                            name="usta_muhendis"
                            value={id}
                            checked={ustaMuhendisId === id}
                            onChange={() => setUstaMuhendisId(id)}
                            className="h-4 w-4 accent-[#1FBFB8]"
                          />
                          <span className="text-sm font-medium">{m.ad_soyad}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" asChild className="flex-1">
                  <Link href="/is-emirleri">İptal</Link>
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <><Loader2 className="animate-spin h-4 w-4" /> Oluşturuluyor...</> : 'İş Emri Oluştur'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
