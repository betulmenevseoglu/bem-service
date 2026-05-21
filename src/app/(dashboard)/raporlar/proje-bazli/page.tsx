import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProjeRaporu } from '@/lib/rapor'
import { formatTarih, formatSure } from '@/lib/tarih'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft } from 'lucide-react'

export default async function ProjeBazliRaporPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (myProfile?.rol !== 'yonetici') redirect('/')

  const rapor = await getProjeRaporu({})

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/raporlar"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Proje Bazlı Rapor</h1>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proje</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="text-right">İş Emri</TableHead>
                  <TableHead className="text-right">Tamamlanan</TableHead>
                  <TableHead className="text-right">Bekleyen</TableHead>
                  <TableHead className="text-right">Toplam Saha Günü</TableHead>
                  <TableHead className="text-right">Son Servis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rapor.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Veri yok.</TableCell>
                  </TableRow>
                ) : rapor.sort((a, b) => b.is_emri_sayisi - a.is_emri_sayisi).map(r => (
                  <TableRow key={r.proje_id}>
                    <TableCell className="font-medium">{r.proje_ad}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.musteri_firma}</TableCell>
                    <TableCell className="text-right">{r.is_emri_sayisi}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">{r.tamamlanan}</TableCell>
                    <TableCell className="text-right text-amber-600">{r.bekleyen_is}</TableCell>
                    <TableCell className="text-right font-bold text-[#1FBFB8]">{formatSure(r.toplam_saha_gunu)}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {r.son_servis_tarihi ? formatTarih(r.son_servis_tarihi) : '—'}
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
