'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IZIN_TURU_LABELS, IZIN_DURUM_LABELS, IzinDurumu } from '@/types'
import { Check, X, Loader2 } from 'lucide-react'

interface IzinRow {
  id: string
  izin_turu: string
  baslangic_tarihi: string
  bitis_tarihi: string
  toplam_gun: number
  durum: IzinDurumu
  aciklama?: string | null
  muhendis?: { ad_soyad: string; email: string } | null
}

interface Props {
  izinler: IzinRow[]
  isYonetici: boolean
  showActions: boolean
}

const DURUM_BADGE: Record<IzinDurumu, string> = {
  beklemede: 'bg-amber-100 text-amber-700',
  onaylandi: 'bg-green-100 text-green-700',
  reddedildi: 'bg-red-100 text-red-700',
  iptal: 'bg-slate-100 text-slate-600',
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function IzinTablo({ izinler, isYonetici, showActions }: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleAction(id: string, action: 'onayla' | 'reddet') {
    setLoadingId(id)
    await fetch(`/api/izin/${id}/${action}`, { method: 'POST' })
    setLoadingId(null)
    router.refresh()
  }

  if (izinler.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Kayıt bulunamadı.</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {isYonetici && <TableHead>Mühendis</TableHead>}
            <TableHead>İzin Türü</TableHead>
            <TableHead>Tarih Aralığı</TableHead>
            <TableHead className="text-center">Gün</TableHead>
            <TableHead>Durum</TableHead>
            {showActions && <TableHead className="text-right">İşlem</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {izinler.map(izin => (
            <TableRow key={izin.id}>
              {isYonetici && (
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{izin.muhendis?.ad_soyad ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{izin.muhendis?.email}</p>
                  </div>
                </TableCell>
              )}
              <TableCell className="text-sm">{IZIN_TURU_LABELS[izin.izin_turu as keyof typeof IZIN_TURU_LABELS] ?? izin.izin_turu}</TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {fmt(izin.baslangic_tarihi)} – {fmt(izin.bitis_tarihi)}
              </TableCell>
              <TableCell className="text-center font-medium">{izin.toplam_gun}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${DURUM_BADGE[izin.durum]}`}>
                  {IZIN_DURUM_LABELS[izin.durum]}
                </span>
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                      disabled={loadingId === izin.id}
                      onClick={() => handleAction(izin.id, 'onayla')}
                    >
                      {loadingId === izin.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Onayla
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={loadingId === izin.id}
                      onClick={() => handleAction(izin.id, 'reddet')}
                    >
                      {loadingId === izin.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                      Reddet
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
