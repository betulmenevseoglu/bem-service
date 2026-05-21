import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Proje } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Building2 } from 'lucide-react'

export default async function ProjelerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  const { data: projeler } = await supabase.from('projeler').select('*').order('ad')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projeler</h1>
          <p className="text-muted-foreground text-sm mt-1">{projeler?.length ?? 0} proje</p>
        </div>
        {myProfile?.rol === 'yonetici' && (
          <Button asChild>
            <Link href="/projeler/yeni"><Plus className="h-4 w-4" /> Yeni Proje</Link>
          </Button>
        )}
      </div>

      {(projeler ?? []).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Henüz proje yok</p>
          {myProfile?.rol === 'yonetici' && (
            <Button asChild className="mt-4">
              <Link href="/projeler/yeni">İlk Projeyi Ekle</Link>
            </Button>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proje Adı</TableHead>
                    <TableHead>Müşteri Firma</TableHead>
                    <TableHead>Yetkili Kişi</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Durum</TableHead>
                    {myProfile?.rol === 'yonetici' && <TableHead className="w-16"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(projeler ?? []).map((p: Proje) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/projeler/${p.id}`} className="font-medium hover:text-[#1FBFB8] hover:underline">
                          {p.ad}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{p.musteri_firma}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.musteri_yetkili ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.musteri_telefon ?? '—'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.aktif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {p.aktif ? 'Aktif' : 'Pasif'}
                        </span>
                      </TableCell>
                      {myProfile?.rol === 'yonetici' && (
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/projeler/${p.id}`}><Pencil className="h-4 w-4" /></Link>
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
