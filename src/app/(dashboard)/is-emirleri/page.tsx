import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { IS_TIPI_LABELS, IS_EMRI_DURUM_LABELS, IsEmriDurumu, IsTipi } from '@/types'
import { formatTarih } from '@/lib/tarih'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, ClipboardList, ExternalLink } from 'lucide-react'

const durumRengi: Record<IsEmriDurumu, string> = {
  atandi: 'bg-slate-100 text-slate-700',
  devam_ediyor: 'bg-blue-100 text-blue-700',
  tamamlandi: 'bg-green-100 text-green-700',
  tamamlanmadi: 'bg-red-100 text-red-700',
  iptal_edildi: 'bg-gray-100 text-gray-500',
}

export default async function IsEmirleriPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()

  let isEmriIds: string[] | null = null
  if (myProfile?.rol === 'saha_muhendisi') {
    const { data: atananlar } = await supabase
      .from('is_emri_muhendisleri')
      .select('is_emri_id')
      .eq('muhendis_id', user.id)
    isEmriIds = (atananlar ?? []).map(a => a.is_emri_id)
  }

  let query = supabase
    .from('is_emirleri')
    .select(`
      *,
      proje:projeler(ad, musteri_firma),
      muhendisler:is_emri_muhendisleri(muhendis:profiles(id, ad_soyad))
    `)
    .order('created_at', { ascending: false })

  if (isEmriIds !== null) {
    if (isEmriIds.length === 0) {
      query = query.in('id', ['00000000-0000-0000-0000-000000000000'])
    } else {
      query = query.in('id', isEmriIds)
    }
  }

  const { data: isEmirleri } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">İş Emirleri</h1>
          <p className="text-muted-foreground text-sm mt-1">{isEmirleri?.length ?? 0} iş emri</p>
        </div>
        {myProfile?.rol === 'yonetici' && (
          <Button asChild>
            <Link href="/is-emirleri/yeni"><Plus className="h-4 w-4" /> Yeni İş Emri</Link>
          </Button>
        )}
      </div>

      {(isEmirleri ?? []).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Henüz iş emri yok</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emir No</TableHead>
                    <TableHead>Proje</TableHead>
                    <TableHead>İş Tipi</TableHead>
                    <TableHead>Atanan Mühendis(ler)</TableHead>
                    <TableHead>Planlanan Tarih</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isEmirleri ?? []).map((ie: any) => {
                    const muhendisler = (ie.muhendisler ?? []).map((m: any) => m.muhendis?.ad_soyad).filter(Boolean)
                    return (
                      <TableRow key={ie.id}>
                        <TableCell>
                          <span className="font-mono text-xs font-bold text-[#1FBFB8]">
                            {ie.emir_no ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{ie.proje?.ad ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">{ie.proje?.musteri_firma}</div>
                        </TableCell>
                        <TableCell className="text-sm">{IS_TIPI_LABELS[ie.is_tipi as IsTipi]}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {muhendisler.slice(0, 2).map((ad: string) => (
                              <Badge key={ad} variant="outline" className="text-xs">{ad}</Badge>
                            ))}
                            {muhendisler.length > 2 && (
                              <Badge variant="outline" className="text-xs">+{muhendisler.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatTarih(ie.planlanan_baslangic)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${durumRengi[ie.durum as IsEmriDurumu]}`}>
                            {IS_EMRI_DURUM_LABELS[ie.durum as IsEmriDurumu]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/is-emirleri/${ie.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
