import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getIsTipiDagilim } from '@/lib/rapor'
import { IS_TIPI_LABELS, IsTipi } from '@/types'
import { formatSure } from '@/lib/tarih'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft } from 'lucide-react'

export default async function IsTipiDagilimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (myProfile?.rol !== 'yonetici') redirect('/')

  const rapor = await getIsTipiDagilim({})

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/raporlar"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">İş Tipi Dağılımı</h1>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İş Tipi</TableHead>
                  <TableHead className="text-right">İş Adedi</TableHead>
                  <TableHead className="text-right">Toplam Saha Günü</TableHead>
                  <TableHead className="text-right">Ortalama Süre</TableHead>
                  <TableHead className="text-right">Tamamlanma Oranı</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rapor.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Veri yok.</TableCell>
                  </TableRow>
                ) : rapor.sort((a, b) => b.is_adedi - a.is_adedi).map(r => (
                  <TableRow key={r.is_tipi}>
                    <TableCell className="font-medium">{IS_TIPI_LABELS[r.is_tipi as IsTipi]}</TableCell>
                    <TableCell className="text-right">{r.is_adedi}</TableCell>
                    <TableCell className="text-right font-bold text-[#1FBFB8]">{formatSure(r.toplam_saha_gunu)}</TableCell>
                    <TableCell className="text-right">{formatSure(r.ortalama_sure)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#1FBFB8]"
                            style={{ width: `${r.tamamlanma_orani}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">%{r.tamamlanma_orani}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
