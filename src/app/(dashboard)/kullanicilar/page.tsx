import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Profile } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil } from 'lucide-react'

export default async function KullanicilarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (myProfile?.rol !== 'yonetici') redirect('/')

  const { data: kullanicilar } = await supabase.from('profiles').select('*').order('ad_soyad')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kullanıcılar</h1>
          <p className="text-muted-foreground text-sm mt-1">{kullanicilar?.length ?? 0} kullanıcı</p>
        </div>
        <Button asChild>
          <Link href="/kullanicilar/yeni"><Plus className="h-4 w-4" /> Yeni Kullanıcı</Link>
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(kullanicilar ?? []).map((k: Profile) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.ad_soyad}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{k.email}</TableCell>
                    <TableCell className="text-sm">{k.telefon ?? '—'}</TableCell>
                    <TableCell>
                      {k.rol === 'yonetici' ? (
                        <Badge className="bg-[#1FBFB8] text-white hover:bg-[#1FBFB8]/90">Yönetici</Badge>
                      ) : (
                        <Badge variant="secondary">Saha Mühendisi</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${k.aktif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {k.aktif ? 'Aktif' : 'Pasif'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/kullanicilar/${k.id}`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
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
