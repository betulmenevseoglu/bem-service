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
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function YeniIsEmriPage() {
  const router = useRouter()
  const supabase = createClient()
  const [projeler, setProjeler] = useState<Proje[]>([])
  const [muhendisler, setMuhendisler] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  }, [])

  const selectedMuhendisIds = form.watch('muhendis_ids')

  function toggleMuhendis(id: string) {
    const current = form.getValues('muhendis_ids')
    form.setValue(
      'muhendis_ids',
      current.includes(id) ? current.filter(x => x !== id) : [...current, id],
      { shouldValidate: true }
    )
  }

  async function onSubmit(data: IsEmriFormData) {
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

    const muhendisRows = data.muhendis_ids.map(mid => ({
      is_emri_id: ie.id,
      muhendis_id: mid,
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

              <FormField control={form.control} name="muhendis_ids" render={() => (
                <FormItem>
                  <FormLabel>Atanan Mühendis(ler) <span className="text-destructive">*</span></FormLabel>
                  <div className="space-y-2 mt-2">
                    {muhendisler.map(m => (
                      <label key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMuhendisIds.includes(m.id)}
                          onChange={() => toggleMuhendis(m.id)}
                          className="h-4 w-4 rounded border-gray-300 accent-[#1FBFB8] cursor-pointer"
                        />
                        <span className="text-sm font-medium">{m.ad_soyad}</span>
                        {m.telefon && <span className="text-xs text-muted-foreground">{m.telefon}</span>}
                      </label>
                    ))}
                    {muhendisler.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">Aktif mühendis bulunamadı.</p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

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
