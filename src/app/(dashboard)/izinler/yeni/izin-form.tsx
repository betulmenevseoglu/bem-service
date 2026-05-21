'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { izinTalebiSchema, IzinTalebiFormData } from '@/lib/validations/izin'
import { hesaplaIzinGunu } from '@/lib/tarih'
import { createClient } from '@/lib/supabase/client'
import { IZIN_TURU_LABELS } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function YeniIzinForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<IzinTalebiFormData>({
    resolver: zodResolver(izinTalebiSchema),
    defaultValues: { izin_turu: 'yillik', baslangic_tarihi: '', bitis_tarihi: '', aciklama: '' },
  })

  const bas = watch('baslangic_tarihi')
  const bit = watch('bitis_tarihi')
  const gunSayisi = bas && bit ? hesaplaIzinGunu(new Date(bas), new Date(bit)) : 0

  async function onSubmit(data: IzinTalebiFormData) {
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Oturum bulunamadı'); setLoading(false); return }

    const { error: err } = await supabase.from('izin_talepleri').insert({
      muhendis_id: user.id,
      izin_turu: data.izin_turu,
      baslangic_tarihi: data.baslangic_tarihi,
      bitis_tarihi: data.bitis_tarihi,
      toplam_gun: gunSayisi,
      aciklama: data.aciklama || null,
      durum: 'beklemede',
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/izinler')
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/izinler" className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Yeni İzin Talebi</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">İzin Türü</label>
              <select
                {...register('izin_turu')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {Object.entries(IZIN_TURU_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              {errors.izin_turu && <p className="text-xs text-destructive">{errors.izin_turu.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Başlangıç</label>
                <Input type="date" {...register('baslangic_tarihi')} />
                {errors.baslangic_tarihi && <p className="text-xs text-destructive">{errors.baslangic_tarihi.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Bitiş</label>
                <Input type="date" {...register('bitis_tarihi')} />
                {errors.bitis_tarihi && <p className="text-xs text-destructive">{errors.bitis_tarihi.message}</p>}
              </div>
            </div>

            {gunSayisi > 0 && (
              <div className="bg-[#1FBFB8]/10 rounded-lg px-4 py-3 text-center">
                <p className="text-2xl font-bold text-[#1FBFB8]">{gunSayisi}</p>
                <p className="text-sm text-muted-foreground">iş günü (hafta sonları hariç)</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Açıklama <span className="text-muted-foreground text-xs">(opsiyonel)</span>
              </label>
              <Textarea placeholder="Ek bilgi..." rows={3} {...register('aciklama')} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" asChild className="flex-1">
                <Link href="/izinler">İptal</Link>
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? <><Loader2 className="animate-spin h-4 w-4" /> Gönderiliyor...</> : 'Talep Gönder'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
