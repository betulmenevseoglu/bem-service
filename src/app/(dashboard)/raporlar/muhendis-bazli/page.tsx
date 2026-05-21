import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMuhendisRaporu } from '@/lib/rapor'
import { IS_TIPI_LABELS } from '@/types'
import { formatTarih, formatSure } from '@/lib/tarih'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft } from 'lucide-react'

export default async function MuhendisBazliRaporPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (myProfile?.rol !== 'yonetici') redirect('/')

  const baslangic = new Date()
  baslangic.setMonth(baslangic.getMonth() - 3)

  const rapor = await getMuhendisRaporu({
    baslangic: baslangic.toISOString(),
    bitis: new Date().toISOString(),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/raporlar"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Mühendis Bazlı Rapor</h1>
          <p className="text-muted-foreground text-sm">Son 3 ay</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mühendis</TableHead>
                  <TableHead className="text-right">Toplam İş</TableHead>
                  <TableHead className="text-right">Tamamlanan</TableHead>
                  <TableHead className="text-right">Tamamlanmayan</TableHead>
                  <TableHead className="text-right">Devam Eden</TableHead>
                  <TableHead className="text-right">Toplam Saha Günü</TableHead>
                  <TableHead className="text-right">Ort. İş Süresi</TableHead>
                  <TableHead className="text-right">Son İş Tarihi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rapor.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Bu dönemde veri yok.
                    </TableCell>
                  </TableRow>
                ) : rapor.sort((a, b) => b.toplam_saha_gunu - a.toplam_saha_gunu).map(r => (
                  <TableRow key={r.muhendis_id}>
                    <TableCell className="font-medium">{r.ad_soyad}</TableCell>
                    <TableCell className="text-right">{r.toplam_is}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-green-600 font-medium">{r.tamamlanan}</span>
                      {r.toplam_is > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (%{Math.round((r.tamamlanan / r.toplam_is) * 100)})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-red-600">{r.tamamlanmayan}</TableCell>
                    <TableCell className="text-right text-blue-600">{r.devam_eden}</TableCell>
                    <TableCell className="text-right font-bold text-[#1FBFB8]">{formatSure(r.toplam_saha_gunu)}</TableCell>
                    <TableCell className="text-right">{formatSure(r.ortalama_is_suresi)}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {r.son_is_tarihi ? formatTarih(r.son_is_tarihi) : '—'}
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
