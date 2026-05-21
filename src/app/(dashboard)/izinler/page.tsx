import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { IZIN_TURU_LABELS, IzinTuru } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Settings2 } from 'lucide-react' // Plus: saha mühendisi butonu için
import { IzinTablo } from './izin-tablo'

export default async function IzinlerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  const isYonetici = myProfile?.rol === 'yonetici'

  let query = supabase
    .from('izin_talepleri')
    .select('*, muhendis:profiles!muhendis_id(ad_soyad, email)')
    .order('created_at', { ascending: false })

  if (!isYonetici) query = query.eq('muhendis_id', user.id)

  const { data: izinler } = await query

  const bekleyenler = (izinler ?? []).filter((i: any) => i.durum === 'beklemede')
  const diger = (izinler ?? []).filter((i: any) => i.durum !== 'beklemede')

  const yil = new Date().getFullYear()

  const { data: bakiyeler } = await supabase
    .from('izin_bakiyeleri')
    .select('*')
    .eq('muhendis_id', user.id)
    .eq('yil', yil)

  const { data: onayliIzinler } = await supabase
    .from('izin_talepleri')
    .select('izin_turu, toplam_gun')
    .eq('muhendis_id', user.id)
    .eq('durum', 'onaylandi')

  const getBakiye = (tur: IzinTuru) => {
    const toplam = bakiyeler?.find((b: any) => b.izin_turu === tur)?.toplam_gun ?? 0
    const kullanilan = (onayliIzinler ?? [])
      .filter((i: any) => i.izin_turu === tur)
      .reduce((sum: number, i: any) => sum + (i.toplam_gun ?? 0), 0)
    return Math.max(0, toplam - kullanilan)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">İzinler</h1>
        <div className="flex gap-2">
          {isYonetici ? (
            <Button variant="outline" asChild>
              <Link href="/izinler/bakiye">
                <Settings2 className="h-4 w-4" />
                Bakiye Yönetimi
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/izinler/yeni">
                <Plus className="h-4 w-4" />
                Yeni İzin Talebi
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Bakiye kartları — mühendis görünümü */}
      {!isYonetici && (
        <div className="grid grid-cols-3 gap-4">
          {(['yillik', 'mazeret', 'raporlu'] as IzinTuru[]).map(tur => (
            <Card key={tur}>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground">{IZIN_TURU_LABELS[tur]}</p>
                <p className="text-3xl font-bold mt-1">{getBakiye(tur)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">gün kalan</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bekleyen talepler — yönetici */}
      {isYonetici && bekleyenler.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Bekleyen Talepler ({bekleyenler.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <IzinTablo izinler={bekleyenler} isYonetici={true} showActions={true} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isYonetici ? 'Tüm İzin Talepleri' : 'İzin Taleplerim'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <IzinTablo
            izinler={isYonetici ? diger : (izinler ?? [])}
            isYonetici={isYonetici}
            showActions={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
