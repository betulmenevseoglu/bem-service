'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, CalendarDays, Briefcase, UmbrellaOff,
} from 'lucide-react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday,
  parseISO, addMonths, subMonths,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { IS_EMRI_DURUM_LABELS, IZIN_TURU_LABELS, IzinTuru } from '@/types'

/* ── Tipler ─────────────────────────────────────────── */
type Etkinlik = {
  id: string
  tip: 'is_emri' | 'izin'
  baslik: string
  altBaslik: string
  baslangic: Date
  bitis: Date
  durumKey: string   // renk haritası için
  durumLabel: string // gösterim için
  href: string
}

/* ── Renk haritası ──────────────────────────────────── */
const RENK: Record<string, { bg: string; text: string; border: string }> = {
  atandi:           { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200' },
  devam_ediyor:     { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200'  },
  tamamlandi:       { bg: 'bg-teal-50',    text: 'text-[#1FBFB8]',  border: 'border-teal-200'  },
  tamamlanmadi:     { bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-200'   },
  iptal_edildi:     { bg: 'bg-gray-100',   text: 'text-gray-400',   border: 'border-gray-200'  },
  izin_onaylandi:   { bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200'},
  izin_beklemede:   { bg: 'bg-gray-100',   text: 'text-gray-500',   border: 'border-gray-200'  },
  izin_reddedildi:  { bg: 'bg-red-50',     text: 'text-red-400',    border: 'border-red-100'   },
}

const GUNLER = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

function renkSinif(durumKey: string) {
  const r = RENK[durumKey] ?? { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' }
  return `${r.bg} ${r.text} ${r.border}`
}

/* ── Props ──────────────────────────────────────────── */
interface Props {
  isEmirleri: any[]
  izinler: any[]
  muhendisler: any[]   // yönetici için filtre listesi
  isYonetici: boolean
  userId: string
}

/* ── Ana bileşen ────────────────────────────────────── */
export function TakvimSayfasi({ isEmirleri, izinler, muhendisler, isYonetici, userId }: Props) {
  const [aktifAy, setAktifAy]               = useState(new Date())
  const [filtreMuhendis, setFiltreMuhendis] = useState('hepsi')
  const [secilenGun, setSecilenGun]         = useState<Date | null>(null)
  const [aySeciciAcik, setAySeciciAcik]     = useState(false)
  const [seciciYil, setSeciciYil]           = useState(new Date().getFullYear())

  /* ── Etkinlikleri hazırla ── */
  const tumEtkinlikler = useMemo<Etkinlik[]>(() => {
    const liste: Etkinlik[] = []

    for (const ie of isEmirleri) {
      if (!ie.planlanan_baslangic || !ie.planlanan_bitis) continue
      const muhendisIdler: string[] = (ie.muhendisler ?? [])
        .map((m: any) => m.muhendis?.id)
        .filter(Boolean)

      if (filtreMuhendis !== 'hepsi' && !muhendisIdler.includes(filtreMuhendis)) continue

      const muhendisAdi = (ie.muhendisler ?? [])
        .map((m: any) => m.muhendis?.ad_soyad)
        .filter(Boolean)
        .join(', ')

      liste.push({
        id: ie.id,
        tip: 'is_emri',
        baslik: ie.proje?.ad ?? ie.is_tanimi,
        altBaslik: muhendisAdi || '—',
        baslangic: parseISO(ie.planlanan_baslangic),
        bitis: parseISO(ie.planlanan_bitis),
        durumKey: ie.durum,
        durumLabel: IS_EMRI_DURUM_LABELS[ie.durum as keyof typeof IS_EMRI_DURUM_LABELS] ?? ie.durum,
        href: `/is-emirleri/${ie.id}`,
      })
    }

    for (const iz of izinler) {
      if (!iz.baslangic_tarihi || !iz.bitis_tarihi) continue
      if (filtreMuhendis !== 'hepsi' && iz.muhendis_id !== filtreMuhendis) continue

      liste.push({
        id: iz.id,
        tip: 'izin',
        baslik: iz.muhendis?.ad_soyad ?? 'İzin',
        altBaslik: IZIN_TURU_LABELS[iz.izin_turu as IzinTuru] ?? iz.izin_turu,
        baslangic: parseISO(iz.baslangic_tarihi),
        bitis: parseISO(iz.bitis_tarihi),
        durumKey: `izin_${iz.durum}`,
        durumLabel: iz.durum === 'onaylandi' ? 'Onaylı İzin'
          : iz.durum === 'beklemede' ? 'Beklemede'
          : 'Reddedildi',
        href: '/izinler',
      })
    }

    return liste
  }, [isEmirleri, izinler, filtreMuhendis])

  /* ── Takvim günleri (6 hafta, Pzt başlangıç) ── */
  const takvimGunleri = useMemo(() => {
    const ayBas = startOfMonth(aktifAy)
    const ayBit = endOfMonth(aktifAy)
    return eachDayOfInterval({
      start: startOfWeek(ayBas, { weekStartsOn: 1 }),
      end:   endOfWeek(ayBit,   { weekStartsOn: 1 }),
    })
  }, [aktifAy])

  /* ── Gün etkinlikleri ── */
  function gunEtkinlikleri(gun: Date): Etkinlik[] {
    const gs = new Date(gun); gs.setHours(0, 0, 0, 0)
    const ge = new Date(gun); ge.setHours(23, 59, 59, 999)
    return tumEtkinlikler.filter(e => e.baslangic <= ge && e.bitis >= gs)
  }

  const secilenGunEtkinlikleri = secilenGun ? gunEtkinlikleri(secilenGun) : []

  /* ── Render ── */
  return (
    <div className="space-y-4">

      {/* ── Üst bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => setAktifAy(d => subMonths(d, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Tıklanabilir ay/yıl başlığı */}
          <Popover open={aySeciciAcik} onOpenChange={open => {
            setAySeciciAcik(open)
            if (open) setSeciciYil(aktifAy.getFullYear())
          }}>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-8 px-3 font-bold text-base capitalize min-w-[160px]">
                {format(aktifAy, 'MMMM yyyy', { locale: tr })}
                <ChevronLeft className="h-3 w-3 ml-1.5 rotate-[-90deg] opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="center">
              {/* Yıl navigasyonu */}
              <div className="flex items-center justify-between mb-3">
                <Button variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => setSeciciYil(y => y - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="font-semibold text-sm">{seciciYil}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => setSeciciYil(y => y + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              {/* Ay grid */}
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 12 }, (_, i) => {
                  const ayTarihi = new Date(seciciYil, i, 1)
                  const aktifMi  = aktifAy.getFullYear() === seciciYil && aktifAy.getMonth() === i
                  return (
                    <Button
                      key={i}
                      variant={aktifMi ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'h-8 text-xs capitalize',
                        aktifMi && 'bg-[#1FBFB8] hover:bg-[#1FBFB8]/90 text-white',
                      )}
                      onClick={() => {
                        setAktifAy(ayTarihi)
                        setAySeciciAcik(false)
                      }}
                    >
                      {format(ayTarihi, 'MMM', { locale: tr })}
                    </Button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => setAktifAy(d => addMonths(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs"
            onClick={() => { setAktifAy(new Date()); setSecilenGun(new Date()) }}>
            Bugün
          </Button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Açıklama */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground">
            {[
              { key: 'atandi',       label: 'Atandı'      },
              { key: 'devam_ediyor', label: 'Devam'        },
              { key: 'tamamlandi',   label: 'Tamamlandı'  },
              { key: 'tamamlanmadi', label: 'Tamamlanmadı'},
              { key: 'izin_onaylandi', label: 'İzin'       },
            ].map(({ key, label }) => {
              const r = RENK[key]
              return (
                <span key={key} className="flex items-center gap-1">
                  <span className={cn('w-2.5 h-2.5 rounded-sm border inline-block', r.bg, r.border)} />
                  {label}
                </span>
              )
            })}
          </div>

          {/* Mühendis filtresi — yalnızca yönetici */}
          {isYonetici && muhendisler.length > 0 && (
            <Select value={filtreMuhendis} onValueChange={setFiltreMuhendis}>
              <SelectTrigger className="h-8 w-48 text-sm">
                <SelectValue placeholder="Tüm Mühendisler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hepsi">Tüm Mühendisler</SelectItem>
                {muhendisler.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.ad_soyad}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* ── Takvim ── */}
      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
        {/* Gün başlıkları */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-border">
          {GUNLER.map((g, i) => (
            <div key={g} className={cn(
              'py-2.5 text-center text-xs font-semibold uppercase tracking-wide',
              i >= 5 ? 'text-muted-foreground/50' : 'text-muted-foreground'
            )}>
              {g}
            </div>
          ))}
        </div>

        {/* Hücreler */}
        <div className="grid grid-cols-7">
          {takvimGunleri.map((gun, idx) => {
            const etkinlikler   = gunEtkinlikleri(gun)
            const buAyMi        = isSameMonth(gun, aktifAy)
            const bugunMu       = isToday(gun)
            const secilenMi     = secilenGun ? isSameDay(gun, secilenGun) : false
            const haftaSonu     = idx % 7 >= 5
            const sonSutun      = idx % 7 === 6
            const MAX           = 2
            const fazla         = Math.max(0, etkinlikler.length - MAX)

            return (
              <div
                key={idx}
                onClick={() => setSecilenGun(p => p && isSameDay(p, gun) ? null : gun)}
                className={cn(
                  'min-h-[88px] p-1.5 border-b border-r border-border cursor-pointer transition-colors select-none',
                  !sonSutun ? '' : 'border-r-0',
                  haftaSonu && !buAyMi  && 'bg-gray-50/80',
                  haftaSonu && buAyMi   && 'bg-gray-50/40',
                  !haftaSonu && !buAyMi && 'bg-gray-50/30',
                  secilenMi  && 'bg-[#1FBFB8]/5 ring-1 ring-inset ring-[#1FBFB8]/40',
                  !secilenMi && 'hover:bg-accent/40',
                )}
              >
                {/* Gün numarası */}
                <div className="flex justify-end mb-1">
                  <span className={cn(
                    'text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full leading-none',
                    bugunMu  && 'bg-[#1FBFB8] text-white font-bold',
                    !bugunMu && buAyMi   && 'text-foreground',
                    !bugunMu && !buAyMi  && 'text-muted-foreground/40',
                  )}>
                    {format(gun, 'd')}
                  </span>
                </div>

                {/* Etkinlik çipleri */}
                <div className="space-y-0.5">
                  {etkinlikler.slice(0, MAX).map(e => (
                    <div
                      key={e.id}
                      className={cn(
                        'text-[10px] leading-snug px-1.5 py-0.5 rounded border truncate font-medium',
                        renkSinif(e.durumKey),
                      )}
                    >
                      {e.baslik}
                    </div>
                  ))}
                  {fazla > 0 && (
                    <p className="text-[10px] text-muted-foreground pl-1">+{fazla} daha</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Seçili gün detayı ── */}
      {secilenGun && (
        <Card className="border-[#1FBFB8]/25 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <CalendarDays className="h-4 w-4 text-[#1FBFB8]" />
              <span className="capitalize">
                {format(secilenGun, 'd MMMM yyyy, EEEE', { locale: tr })}
              </span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {secilenGunEtkinlikleri.length} etkinlik
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {secilenGunEtkinlikleri.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Bu gün için planlanmış etkinlik yok.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {secilenGunEtkinlikleri.map(e => (
                  <Link key={e.id} href={e.href}>
                    <div className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border transition-opacity hover:opacity-75',
                      renkSinif(e.durumKey),
                    )}>
                      <div className="mt-0.5 shrink-0">
                        {e.tip === 'is_emri'
                          ? <Briefcase className="h-3.5 w-3.5" />
                          : <UmbrellaOff className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-snug truncate">{e.baslik}</p>
                        <p className="text-xs opacity-70 mt-0.5 truncate">{e.altBaslik}</p>
                        <p className="text-xs opacity-55 mt-1">
                          {format(e.baslangic, 'dd.MM')} – {format(e.bitis, 'dd.MM.yyyy')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 border-current whitespace-nowrap">
                        {e.durumLabel}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
