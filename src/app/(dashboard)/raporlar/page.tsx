import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart3, Users, Building2, Layers } from 'lucide-react'

export default async function RaporlarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (myProfile?.rol !== 'yonetici') redirect('/')

  const [
    { count: toplam },
    { count: tamamlanan },
    { count: muhendis },
    { count: proje },
  ] = await Promise.all([
    supabase.from('is_emirleri').select('*', { count: 'exact', head: true }),
    supabase.from('is_emirleri').select('*', { count: 'exact', head: true }).eq('durum', 'tamamlandi'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('rol', 'saha_muhendisi').eq('aktif', true),
    supabase.from('projeler').select('*', { count: 'exact', head: true }).eq('aktif', true),
  ])

  const tamamlanmaOrani = toplam ? Math.round(((tamamlanan ?? 0) / toplam) * 100) : 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Raporlar</h1>

      {/* Özet KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Toplam İş Emri</p>
            <p className="text-3xl font-bold mt-1">{toplam ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Tamamlanan</p>
            <p className="text-3xl font-bold mt-1">{tamamlanan ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">%{tamamlanmaOrani} tamamlanma</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Aktif Mühendis</p>
            <p className="text-3xl font-bold mt-1">{muhendis ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Aktif Proje</p>
            <p className="text-3xl font-bold mt-1">{proje ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Rapor sayfaları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/raporlar/muhendis-bazli" className="group">
          <Card className="h-full hover:border-[#1FBFB8] transition-colors cursor-pointer">
            <CardHeader>
              <div className="h-10 w-10 rounded-xl bg-[#1FBFB8]/10 flex items-center justify-center mb-2 group-hover:bg-[#1FBFB8]/20 transition-colors">
                <Users className="h-5 w-5 text-[#1FBFB8]" />
              </div>
              <CardTitle className="text-base">Mühendis Bazlı</CardTitle>
              <CardDescription>Mühendis başına iş yükü, saha günü ve tamamlanma oranı</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/raporlar/proje-bazli" className="group">
          <Card className="h-full hover:border-[#1FBFB8] transition-colors cursor-pointer">
            <CardHeader>
              <div className="h-10 w-10 rounded-xl bg-[#1FBFB8]/10 flex items-center justify-center mb-2 group-hover:bg-[#1FBFB8]/20 transition-colors">
                <Building2 className="h-5 w-5 text-[#1FBFB8]" />
              </div>
              <CardTitle className="text-base">Proje Bazlı</CardTitle>
              <CardDescription>Proje başına servis geçmişi, müşteri ve iş emri dağılımı</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/raporlar/is-tipi-dagilim" className="group">
          <Card className="h-full hover:border-[#1FBFB8] transition-colors cursor-pointer">
            <CardHeader>
              <div className="h-10 w-10 rounded-xl bg-[#1FBFB8]/10 flex items-center justify-center mb-2 group-hover:bg-[#1FBFB8]/20 transition-colors">
                <Layers className="h-5 w-5 text-[#1FBFB8]" />
              </div>
              <CardTitle className="text-base">İş Tipi Dağılımı</CardTitle>
              <CardDescription>Garanti, acil çağrı, periyodik bakım vb. dağılım analizi</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
