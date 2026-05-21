'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, IzinBakiye, IzinTuru, IZIN_TURU_LABELS } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface Props {
  muhendisler: Profile[]
  bakiyeler: IzinBakiye[]
  yil: number
}

const IZIN_TURLERI: IzinTuru[] = ['yillik', 'mazeret', 'raporlu']

export function IzinBakiyeEditor({ muhendisler, bakiyeler, yil }: Props) {
  const supabase = createClient()

  const initialState: Record<string, Record<IzinTuru, number>> = {}
  muhendisler.forEach(m => {
    initialState[m.id] = { yillik: 0, mazeret: 0, raporlu: 0 }
    IZIN_TURLERI.forEach(tur => {
      const b = bakiyeler.find(b => b.muhendis_id === m.id && b.izin_turu === tur)
      if (b) initialState[m.id][tur] = b.toplam_gun
    })
  })

  const [values, setValues] = useState(initialState)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function setValue(muhendisId: string, tur: IzinTuru, val: number) {
    setValues(prev => ({ ...prev, [muhendisId]: { ...prev[muhendisId], [tur]: val } }))
  }

  async function handleSave() {
    setSaving(true)
    for (const m of muhendisler) {
      for (const tur of IZIN_TURLERI) {
        await supabase.from('izin_bakiyeleri').upsert({
          muhendis_id: m.id,
          izin_turu: tur,
          yil,
          toplam_gun: values[m.id]?.[tur] ?? 0,
        }, { onConflict: 'muhendis_id,izin_turu,yil' })
      }
    }
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/izinler"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">İzin Bakiye Yönetimi</h1>
            <p className="text-muted-foreground text-sm">{yil} yılı</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Kaydediliyor...' : <><Save className="h-4 w-4" /> Tümünü Kaydet</>}
        </Button>
      </div>
      {saved && <p className="text-green-600 text-sm font-medium">Bakiyeler kaydedildi.</p>}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mühendis</TableHead>
                  {IZIN_TURLERI.map(tur => (
                    <TableHead key={tur}>{IZIN_TURU_LABELS[tur]} (gün)</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {muhendisler.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.ad_soyad}</TableCell>
                    {IZIN_TURLERI.map(tur => (
                      <TableCell key={tur}>
                        <Input
                          type="number"
                          min={0}
                          max={365}
                          step={0.5}
                          value={values[m.id]?.[tur] ?? 0}
                          onChange={e => setValue(m.id, tur, parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                    ))}
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
