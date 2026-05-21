import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { IS_TIPI_LABELS, IS_EMRI_DURUM_LABELS, IsEmriDurumu, IsTipi } from '@/types'
import { formatTarihSaat } from '@/lib/tarih'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, FileText, Download, Calendar, MapPin, User, Wrench } from 'lucide-react'

const durumRengi: Record<IsEmriDurumu, string> = {
  atandi: 'bg-slate-100 text-slate-700',
  devam_ediyor: 'bg-blue-100 text-blue-700',
  tamamlandi: 'bg-green-100 text-green-700',
  tamamlanmadi: 'bg-red-100 text-red-700',
  iptal_edildi: 'bg-gray-100 text-gray-500',
}

export default async function IsEmriDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()

  const { data: ie } = await supabase
    .from('is_emirleri')
    .select(`
      *,
      proje:projeler(*),
      olusturan:profiles!olusturan_id(ad_soyad),
      muhendisler:is_emri_muhendisleri(muhendis:profiles(*))
    `)
    .eq('id', id)
    .single()

  if (!ie) notFound()

  const muhendisler = (ie.muhendisler as any[]).map((m: any) => m.muhendis).filter(Boolean)
  const isAtanan = muhendisler.some((m: any) => m.id === user.id)
  const canViewForm = myProfile?.rol === 'yonetici' || isAtanan

  const { data: servisFormu } = await supabase
    .from('servis_formlari')
    .select('*, fotograflar:servis_fotograflari(id)')
    .eq('is_emri_id', id)
    .single()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/is-emirleri"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-bold text-[#1FBFB8]">{ie.emir_no ?? '—'}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${durumRengi[ie.durum as IsEmriDurumu]}`}>
              {IS_EMRI_DURUM_LABELS[ie.durum as IsEmriDurumu]}
            </span>
          </div>
          <h1 className="text-xl font-bold mt-0.5 truncate">{ie.proje?.ad}</h1>
        </div>
        {canViewForm && (
          <Button asChild>
            <Link href={`/is-emirleri/${id}/form`}>
              <FileText className="h-4 w-4" /> Saha Formu
            </Link>
          </Button>
        )}
      </div>

      {/* İş Detayı */}
      <Card>
        <CardHeader><CardTitle className="text-base">İş Detayı</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Müşteri / Tesis</p>
                <p className="font-medium text-sm">{ie.proje?.musteri_firma}</p>
                {ie.proje?.adres && <p className="text-xs text-muted-foreground mt-0.5">{ie.proje.adres}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Wrench className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">İş Tipi</p>
                <p className="font-medium text-sm">{IS_TIPI_LABELS[ie.is_tipi as IsTipi]}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Planlanan Tarih</p>
                <p className="font-medium text-sm">{formatTarihSaat(ie.planlanan_baslangic)}</p>
                <p className="text-xs text-muted-foreground">– {formatTarihSaat(ie.planlanan_bitis)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Oluşturan</p>
                <p className="font-medium text-sm">{(ie.olusturan as any)?.ad_soyad ?? '—'}</p>
              </div>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">İş Tanımı</p>
            <p className="text-sm whitespace-pre-wrap">{ie.is_tanimi}</p>
          </div>
        </CardContent>
      </Card>

      {/* Atanan Mühendisler */}
      <Card>
        <CardHeader><CardTitle className="text-base">Atanan Mühendis(ler)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {muhendisler.map((m: any) => (
              <div key={m.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <div className="h-7 w-7 rounded-full bg-[#1FBFB8]/20 flex items-center justify-center text-[#1FBFB8] text-xs font-bold">
                  {m.ad_soyad.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <span className="text-sm font-medium">{m.ad_soyad}</span>
                {m.id === user.id && <Badge variant="outline" className="text-xs">Siz</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Servis Formu Durumu */}
      {canViewForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Saha Servis Formu</CardTitle></CardHeader>
          <CardContent>
            {servisFormu ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {servisFormu.is_tamamlandi ? '✓ İş tamamlandı' : '✗ İş tamamlanmadı'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(servisFormu.fotograflar as any[])?.length ?? 0} fotoğraf •
                    {servisFormu.musteri_imza_url ? ' Müşteri imzası alındı' : ' Müşteri imzası bekleniyor'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/is-emirleri/${id}/form`}>Formu Görüntüle</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/api/pdf/${id}`} target="_blank" rel="noopener">
                      <Download className="h-4 w-4" /> PDF
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Form henüz doldurulmadı.</p>
                {isAtanan && (
                  <Button asChild size="sm">
                    <Link href={`/is-emirleri/${id}/form`}>Formu Doldur</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
