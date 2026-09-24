import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Proje, ProjeTipi, PROJE_TIPI_LABELS } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type KategoriFiltre = 'tumu' | ProjeTipi

const TAB_SIRASI: KategoriFiltre[] = ['tumu', 'devreye_alma', 'bakim', 'spot_servis']

const TAB_LABELS: Record<KategoriFiltre, string> = {
  tumu: 'Tümü',
  ...PROJE_TIPI_LABELS,
}

const PROJE_TIPI_BADGE: Record<ProjeTipi, string> = {
  devreye_alma: 'bg-purple-100 text-purple-700',
  bakim: 'bg-blue-100 text-blue-700',
  spot_servis: 'bg-amber-100 text-amber-700',
}

export default async function ProjelerPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>
}) {
  const { kategori } = await searchParams
  const aktifTab: KategoriFiltre =
    kategori === 'bakim' || kategori === 'devreye_alma' || kategori === 'spot_servis' ? kategori : 'tumu'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  const { data: hepsi } = await supabase.from('projeler').select('*').order('ad')
  const tumProjeler = (hepsi ?? []) as Proje[]

  const projeler = tumProjeler.filter(p => aktifTab === 'tumu' || p.proje_tipi === aktifTab)

  const sayilar: Record<KategoriFiltre, number> = {
    tumu: tumProjeler.length,
    devreye_alma: tumProjeler.filter(p => p.proje_tipi === 'devreye_alma').length,
    bakim: tumProjeler.filter(p => p.proje_tipi === 'bakim').length,
    spot_servis: tumProjeler.filter(p => p.proje_tipi === 'spot_servis').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projeler</h1>
          <p className="text-muted-foreground text-sm mt-1">{tumProjeler.length} proje</p>
        </div>
        {myProfile?.rol === 'yonetici' && (
          <Button asChild>
            <Link href="/projeler/yeni"><Plus className="h-4 w-4" /> Yeni Proje</Link>
          </Button>
        )}
      </div>

      {/* Kategori sekmeleri */}
      <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground flex-wrap">
        {TAB_SIRASI.map(tab => (
          <Link
            key={tab}
            href={tab === 'tumu' ? '/projeler' : `/projeler?kategori=${tab}`}
            className={cn(
              'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all',
              aktifTab === tab ? 'bg-background text-foreground shadow' : 'hover:text-foreground'
            )}
          >
            {TAB_LABELS[tab]}
            <span className="ml-1.5 text-xs opacity-70">{sayilar[tab]}</span>
          </Link>
        ))}
      </div>

      {projeler.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">
            {aktifTab === 'tumu' ? 'Henüz proje yok' : 'Bu kategoride proje yok'}
          </p>
          {myProfile?.rol === 'yonetici' && aktifTab === 'tumu' && (
            <Button asChild className="mt-4">
              <Link href="/projeler/yeni">İlk Projeyi Ekle</Link>
            </Button>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proje Adı</TableHead>
                    <TableHead>Müşteri Firma</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Yetkili Kişi</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Durum</TableHead>
                    {myProfile?.rol === 'yonetici' && <TableHead className="w-16"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projeler.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/projeler/${p.id}`} className="font-medium hover:text-[#1FBFB8] hover:underline">
                          {p.ad}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{p.musteri_firma}</TableCell>
                      <TableCell>
                        {p.proje_tipi ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PROJE_TIPI_BADGE[p.proje_tipi]}`}>
                            {PROJE_TIPI_LABELS[p.proje_tipi]}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
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

            {/* Mobil kart görünümü */}
            <div className="md:hidden divide-y">
              {projeler.map((p) => (
                <Link key={p.id} href={`/projeler/${p.id}`} className="block p-4 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-sm">{p.ad}</span>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.aktif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.aktif ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{p.musteri_firma}</div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {p.proje_tipi && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${PROJE_TIPI_BADGE[p.proje_tipi]}`}>
                        {PROJE_TIPI_LABELS[p.proje_tipi]}
                      </span>
                    )}
                    {p.musteri_yetkili && <span>{p.musteri_yetkili}</span>}
                    {p.musteri_telefon && <span>{p.musteri_telefon}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
