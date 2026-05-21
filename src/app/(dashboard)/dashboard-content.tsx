'use client'
import Link from 'next/link'
import { Profile, IsEmriWithDetails, IS_TIPI_LABELS, IS_EMRI_DURUM_LABELS, IsEmriDurumu } from '@/types'
import { formatTarih } from '@/lib/tarih'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Briefcase, CheckCircle2, Clock, Plus, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Props {
  profile: Profile
  isEmirleri: any[]
  kpi: { toplam: number; tamamlanan: number; bekleyen: number; aktiveMuhendis: number }
}

const durumRengi: Record<IsEmriDurumu, string> = {
  atandi: 'bg-slate-100 text-slate-700',
  devam_ediyor: 'bg-blue-100 text-blue-700',
  tamamlandi: 'bg-green-100 text-green-700',
  tamamlanmadi: 'bg-red-100 text-red-700',
  iptal_edildi: 'bg-gray-100 text-gray-500',
}

export function DashboardContent({ profile, isEmirleri, kpi }: Props) {
  const bugun = format(new Date(), "d MMMM yyyy, EEEE", { locale: tr })
  const isYonetici = profile.rol === 'yonetici'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hoş geldin, {profile.ad_soyad.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">{bugun}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam İş Emri</p>
                <p className="text-3xl font-bold mt-1">{kpi.toplam}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tamamlanan</p>
                <p className="text-3xl font-bold mt-1">{kpi.tamamlanan}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
            {kpi.toplam > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                %{Math.round((kpi.tamamlanan / kpi.toplam) * 100)} tamamlanma oranı
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bekleyen</p>
                <p className="text-3xl font-bold mt-1">{kpi.bekleyen}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Quick Actions */}
      {isYonetici && (
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/is-emirleri/yeni">
              <Plus className="h-4 w-4 mr-1" />
              Yeni İş Emri
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/kullanicilar/yeni">
              <Plus className="h-4 w-4 mr-1" />
              Yeni Kullanıcı
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/projeler/yeni">
              <Plus className="h-4 w-4 mr-1" />
              Yeni Proje
            </Link>
          </Button>
        </div>
      )}

      {/* Recent Work Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {isYonetici ? 'Son İş Emirleri' : 'Aktif İş Emirlerim'}
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/is-emirleri">
              Tümünü gör
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isEmirleri.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Henüz iş emri yok</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emir No</TableHead>
                    <TableHead>Proje</TableHead>
                    <TableHead>İş Tipi</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isEmirleri.map((ie: any) => (
                    <TableRow key={ie.id} className="cursor-pointer hover:bg-accent">
                      <TableCell>
                        <Link
                          href={`/is-emirleri/${ie.id}`}
                          className="font-mono text-xs font-medium text-[#1FBFB8] hover:underline"
                        >
                          {ie.emir_no ?? '—'}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{ie.proje?.ad ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{ie.proje?.musteri_firma}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {IS_TIPI_LABELS[ie.is_tipi as keyof typeof IS_TIPI_LABELS]}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${durumRengi[ie.durum as IsEmriDurumu]}`}
                        >
                          {IS_EMRI_DURUM_LABELS[ie.durum as IsEmriDurumu]}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTarih(ie.planlanan_baslangic)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
