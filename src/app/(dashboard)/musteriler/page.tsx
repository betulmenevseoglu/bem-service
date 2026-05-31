import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MusteriWithYetkili } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil } from 'lucide-react'

export default async function MusterilerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()

  const { data: musteriler } = await supabase
    .from('musteriler')
    .select('*, yetkilileri:musteri_yetkilileri(*), projeler(count)')
    .order('firma_adi')

  const isYonetici = myProfile?.rol === 'yonetici'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Müşteriler</h1>
          <p className="text-muted-foreground text-sm mt-1">{musteriler?.length ?? 0} müşteri</p>
        </div>
        {isYonetici && (
          <Button asChild>
            <Link href="/musteriler/yeni"><Plus className="h-4 w-4" /> Yeni Müşteri</Link>
          </Button>
        )}
      </div>

      {(!musteriler || musteriler.length === 0) ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Henüz müşteri eklenmemiş.
            {isYonetici && (
              <div className="mt-4">
                <Button asChild>
                  <Link href="/musteriler/yeni"><Plus className="h-4 w-4" /> İlk Müşteriyi Ekle</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma Adı</TableHead>
                    <TableHead>Birincil Yetkili</TableHead>
                    <TableHead>Adres</TableHead>
                    <TableHead className="text-center">Proje Sayısı</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(musteriler as MusteriWithYetkili[]).map((m) => {
                    const birincil = m.yetkilileri?.find(y => y.birincil) ?? m.yetkilileri?.[0] ?? null
                    const projeSayisi = (m as unknown as { projeler: { count: number }[] }).projeler?.[0]?.count ?? 0
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.firma_adi}</TableCell>
                        <TableCell className="text-sm">
                          {birincil ? (
                            <div>
                              <div className="font-medium">{birincil.ad_soyad}</div>
                              {birincil.telefon && (
                                <div className="text-muted-foreground text-xs">{birincil.telefon}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {m.adres ?? '—'}
                        </TableCell>
                        <TableCell className="text-center text-sm">{projeSayisi}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${m.aktif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {m.aktif ? 'Aktif' : 'Pasif'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/musteriler/${m.id}`}><Pencil className="h-4 w-4" /></Link>
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
