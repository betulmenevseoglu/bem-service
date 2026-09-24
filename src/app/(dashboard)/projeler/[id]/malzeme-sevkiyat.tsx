'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProjeMalzeme, ProjeSevkiyatWithSatirlar } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Trash2, Pencil, Loader2, AlertTriangle, Package, Truck } from 'lucide-react'

interface Props {
  projeId: string
}

interface SevkSatiri {
  malzeme_id: string
  miktar: string
}

const BOS_SEVKIYAT_FORM = {
  irsaliyeNo: '',
  sevkTarihi: new Date().toISOString().split('T')[0],
  notlar: '',
  satirlar: [{ malzeme_id: '', miktar: '' }] as SevkSatiri[],
}

export function MalzemeSevkiyat({ projeId }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [malzemeler, setMalzemeler] = useState<ProjeMalzeme[]>([])
  const [sevkiyatlar, setSevkiyatlar] = useState<ProjeSevkiyatWithSatirlar[]>([])
  const [listeError, setListeError] = useState<string | null>(null)

  // Malzeme ekle/düzenle
  const [malzemeDialogOpen, setMalzemeDialogOpen] = useState(false)
  const [malzemeDuzenlenen, setMalzemeDuzenlenen] = useState<ProjeMalzeme | null>(null)
  const [malzemeAdi, setMalzemeAdi] = useState('')
  const [birim, setBirim] = useState('Adet')
  const [planlananMiktar, setPlanlananMiktar] = useState('')
  const [malzemeSaving, setMalzemeSaving] = useState(false)
  const [malzemeError, setMalzemeError] = useState<string | null>(null)

  // Sevkiyat ekle/düzenle
  const [sevkiyatDialogOpen, setSevkiyatDialogOpen] = useState(false)
  const [sevkiyatDuzenlenen, setSevkiyatDuzenlenen] = useState<ProjeSevkiyatWithSatirlar | null>(null)
  const [irsaliyeNo, setIrsaliyeNo] = useState(BOS_SEVKIYAT_FORM.irsaliyeNo)
  const [sevkTarihi, setSevkTarihi] = useState(BOS_SEVKIYAT_FORM.sevkTarihi)
  const [notlar, setNotlar] = useState(BOS_SEVKIYAT_FORM.notlar)
  const [satirlar, setSatirlar] = useState<SevkSatiri[]>(BOS_SEVKIYAT_FORM.satirlar)
  const [sevkiyatSaving, setSevkiyatSaving] = useState(false)
  const [sevkiyatError, setSevkiyatError] = useState<string | null>(null)

  async function fetchData() {
    const { data: malzemeData } = await supabase
      .from('proje_malzemeleri')
      .select('*')
      .eq('proje_id', projeId)
      .order('created_at')
    const { data: sevkiyatData } = await supabase
      .from('proje_sevkiyatlari')
      .select('*, satirlar:proje_sevkiyat_satirlari(*, malzeme:proje_malzemeleri(*))')
      .eq('proje_id', projeId)
      .order('sevk_tarihi', { ascending: false })
      .order('created_at', { ascending: false })
    setMalzemeler((malzemeData ?? []) as ProjeMalzeme[])
    setSevkiyatlar((sevkiyatData ?? []) as any[])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projeId])

  function sevkEdilenMiktar(malzemeId: string, sevkiyatIdHaric?: string) {
    return sevkiyatlar.reduce((toplam, s) => {
      if (s.id === sevkiyatIdHaric) return toplam
      const satirToplam = s.satirlar
        .filter(sat => sat.malzeme_id === malzemeId)
        .reduce((sum, sat) => sum + Number(sat.miktar), 0)
      return toplam + satirToplam
    }, 0)
  }

  // ── Malzeme: ekle / düzenle ────────────────────────────
  function openMalzemeDialog(m?: ProjeMalzeme) {
    setListeError(null)
    setMalzemeError(null)
    if (m) {
      setMalzemeDuzenlenen(m)
      setMalzemeAdi(m.malzeme_adi)
      setBirim(m.birim)
      setPlanlananMiktar(String(m.planlanan_miktar))
    } else {
      setMalzemeDuzenlenen(null)
      setMalzemeAdi('')
      setBirim('Adet')
      setPlanlananMiktar('')
    }
    setMalzemeDialogOpen(true)
  }

  async function handleMalzemeKaydet(e: React.FormEvent) {
    e.preventDefault()
    if (!malzemeAdi.trim()) { setMalzemeError('Malzeme adı zorunludur.'); return }
    setMalzemeSaving(true)
    setMalzemeError(null)

    const payload = {
      malzeme_adi: malzemeAdi.trim(),
      birim: birim.trim() || 'Adet',
      planlanan_miktar: parseFloat(planlananMiktar) || 0,
    }

    if (malzemeDuzenlenen) {
      const { error } = await supabase.from('proje_malzemeleri').update(payload).eq('id', malzemeDuzenlenen.id)
      if (error) { setMalzemeError(error.message); setMalzemeSaving(false); return }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('proje_malzemeleri').insert({ proje_id: projeId, created_by: user?.id, ...payload })
      if (error) { setMalzemeError(error.message); setMalzemeSaving(false); return }
    }

    setMalzemeSaving(false)
    setMalzemeDialogOpen(false)
    fetchData()
  }

  async function handleMalzemeSil(m: ProjeMalzeme) {
    setListeError(null)
    const { error } = await supabase.from('proje_malzemeleri').delete().eq('id', m.id)
    if (error) {
      setListeError('Bu malzeme sevkiyatlarda kullanıldığı için silinemiyor. Önce ilgili sevkiyat satırlarını kaldırın.')
      return
    }
    fetchData()
  }

  // ── Sevkiyat: ekle / düzenle ────────────────────────────
  function openSevkiyatDialog(s?: ProjeSevkiyatWithSatirlar) {
    setSevkiyatError(null)
    if (s) {
      setSevkiyatDuzenlenen(s)
      setIrsaliyeNo(s.irsaliye_no)
      setSevkTarihi(s.sevk_tarihi)
      setNotlar(s.notlar ?? '')
      setSatirlar(s.satirlar.length > 0
        ? s.satirlar.map(sat => ({ malzeme_id: sat.malzeme_id, miktar: String(sat.miktar) }))
        : [{ malzeme_id: '', miktar: '' }])
    } else {
      setSevkiyatDuzenlenen(null)
      setIrsaliyeNo(BOS_SEVKIYAT_FORM.irsaliyeNo)
      setSevkTarihi(new Date().toISOString().split('T')[0])
      setNotlar(BOS_SEVKIYAT_FORM.notlar)
      setSatirlar([{ malzeme_id: '', miktar: '' }])
    }
    setSevkiyatDialogOpen(true)
  }

  function satirGuncelle(index: number, patch: Partial<SevkSatiri>) {
    setSatirlar(rows => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function satirEkle() {
    setSatirlar(rows => [...rows, { malzeme_id: '', miktar: '' }])
  }

  function satirSil(index: number) {
    setSatirlar(rows => rows.filter((_, i) => i !== index))
  }

  function satirKalanUyarisi(row: SevkSatiri): string | null {
    if (!row.malzeme_id || !row.miktar) return null
    const m = malzemeler.find(m => m.id === row.malzeme_id)
    if (!m) return null
    // Düzenleme modundaysak, düzenlenen sevkiyatın kendi eski miktarını hesaba katma
    const mevcutKalan = m.planlanan_miktar - sevkEdilenMiktar(m.id, sevkiyatDuzenlenen?.id)
    const yeniKalan = mevcutKalan - (parseFloat(row.miktar) || 0)
    if (yeniKalan < 0) {
      return `Uyarı: stok eksiye düşüyor (kalan: ${yeniKalan} ${m.birim})`
    }
    return null
  }

  async function handleSevkiyatKaydet(e: React.FormEvent) {
    e.preventDefault()
    const gecerliSatirlar = satirlar.filter(s => s.malzeme_id && parseFloat(s.miktar) > 0)
    if (!irsaliyeNo.trim()) { setSevkiyatError('İrsaliye numarası zorunludur.'); return }
    if (gecerliSatirlar.length === 0) { setSevkiyatError('En az bir malzeme satırı ekleyin.'); return }

    setSevkiyatSaving(true)
    setSevkiyatError(null)
    const { data: { user } } = await supabase.auth.getUser()

    let sevkiyatId: string

    if (sevkiyatDuzenlenen) {
      const { error: hataBaslik } = await supabase.from('proje_sevkiyatlari').update({
        irsaliye_no: irsaliyeNo.trim(),
        sevk_tarihi: sevkTarihi,
        notlar: notlar.trim() || null,
      }).eq('id', sevkiyatDuzenlenen.id)
      if (hataBaslik) { setSevkiyatError(hataBaslik.message); setSevkiyatSaving(false); return }
      sevkiyatId = sevkiyatDuzenlenen.id

      // Eski satırları kaldırıp yenilerini yaz (basit ve tutarlı bir güncelleme yöntemi)
      const { error: hataSil } = await supabase.from('proje_sevkiyat_satirlari').delete().eq('sevkiyat_id', sevkiyatId)
      if (hataSil) { setSevkiyatError(hataSil.message); setSevkiyatSaving(false); return }
    } else {
      const { data: sevkiyat, error: hataBaslik } = await supabase.from('proje_sevkiyatlari').insert({
        proje_id: projeId,
        irsaliye_no: irsaliyeNo.trim(),
        sevk_tarihi: sevkTarihi,
        notlar: notlar.trim() || null,
        created_by: user?.id,
      }).select().single()
      if (hataBaslik || !sevkiyat) { setSevkiyatError(hataBaslik?.message ?? 'Sevkiyat oluşturulamadı.'); setSevkiyatSaving(false); return }
      sevkiyatId = sevkiyat.id
    }

    const satirRows = gecerliSatirlar.map(s => ({
      sevkiyat_id: sevkiyatId,
      malzeme_id: s.malzeme_id,
      miktar: parseFloat(s.miktar),
    }))
    const { error: hataSatir } = await supabase.from('proje_sevkiyat_satirlari').insert(satirRows)

    if (hataSatir) {
      if (!sevkiyatDuzenlenen) {
        // Yeni kayıtta satırlar eklenemediyse yetim başlığı geri al
        await supabase.from('proje_sevkiyatlari').delete().eq('id', sevkiyatId)
      }
      setSevkiyatError(hataSatir.message)
      setSevkiyatSaving(false)
      return
    }

    setSevkiyatSaving(false)
    setSevkiyatDialogOpen(false)
    fetchData()
  }

  async function handleSevkiyatSil(s: ProjeSevkiyatWithSatirlar) {
    setListeError(null)
    const { error } = await supabase.from('proje_sevkiyatlari').delete().eq('id', s.id)
    if (error) { setListeError(error.message); return }
    fetchData()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-24"><Loader2 className="animate-spin h-5 w-5 text-[#1FBFB8]" /></div>
  }

  return (
    <div className="space-y-6">
      {listeError && <Alert variant="destructive"><AlertDescription>{listeError}</AlertDescription></Alert>}

      {/* Malzeme Listesi */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-[#1FBFB8]" /> Malzeme Listesi
          </CardTitle>
          <Dialog open={malzemeDialogOpen} onOpenChange={setMalzemeDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => openMalzemeDialog()}><Plus className="h-4 w-4" /> Malzeme Ekle</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{malzemeDuzenlenen ? 'Malzeme Düzenle' : 'Yeni Malzeme'}</DialogTitle>
                <DialogDescription>Projeye ait malzeme kalemini {malzemeDuzenlenen ? 'güncelleyin' : 'ekleyin'}.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleMalzemeKaydet} className="space-y-4">
                {malzemeError && <Alert variant="destructive"><AlertDescription>{malzemeError}</AlertDescription></Alert>}
                <div className="space-y-1.5">
                  <Label>Malzeme Adı <span className="text-destructive">*</span></Label>
                  <Input value={malzemeAdi} onChange={e => setMalzemeAdi(e.target.value)} placeholder="Örn. Yangın Alarm Dedektörü" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Birim</Label>
                    <Input value={birim} onChange={e => setBirim(e.target.value)} placeholder="Adet, Metre, Kg..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Planlanan Miktar</Label>
                    <Input type="number" min="0" step="0.01" value={planlananMiktar} onChange={e => setPlanlananMiktar(e.target.value)} placeholder="0" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={malzemeSaving}>
                    {malzemeSaving ? <><Loader2 className="animate-spin h-4 w-4" /> Kaydediliyor...</> : (malzemeDuzenlenen ? 'Güncelle' : 'Ekle')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {malzemeler.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Henüz malzeme eklenmedi.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Malzeme</TableHead>
                    <TableHead>Birim</TableHead>
                    <TableHead className="text-right">Planlanan</TableHead>
                    <TableHead className="text-right">Sevk Edilen</TableHead>
                    <TableHead className="text-right">Kalan</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {malzemeler.map(m => {
                    const sevkEdilen = sevkEdilenMiktar(m.id)
                    const kalan = m.planlanan_miktar - sevkEdilen
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium text-sm">{m.malzeme_adi}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.birim}</TableCell>
                        <TableCell className="text-right text-sm">{m.planlanan_miktar}</TableCell>
                        <TableCell className="text-right text-sm">{sevkEdilen}</TableCell>
                        <TableCell className={`text-right text-sm font-medium ${kalan < 0 ? 'text-red-600' : ''}`}>
                          {kalan < 0 && <AlertTriangle className="h-3 w-3 inline mr-1 -mt-0.5" />}
                          {kalan}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openMalzemeDialog(m)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMalzemeSil(m)}>
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sevkiyatlar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-[#1FBFB8]" /> Sevkiyatlar (İrsaliyeler)
          </CardTitle>
          <Dialog open={sevkiyatDialogOpen} onOpenChange={setSevkiyatDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={malzemeler.length === 0} onClick={() => openSevkiyatDialog()}><Plus className="h-4 w-4" /> Yeni Sevkiyat</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{sevkiyatDuzenlenen ? `Sevkiyat Düzenle — ${sevkiyatDuzenlenen.irsaliye_no}` : 'Yeni Sevkiyat / İrsaliye'}</DialogTitle>
                <DialogDescription>İrsaliye bilgilerini ve gönderilen malzeme satırlarını girin.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSevkiyatKaydet} className="space-y-4">
                {sevkiyatError && <Alert variant="destructive"><AlertDescription>{sevkiyatError}</AlertDescription></Alert>}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>İrsaliye No <span className="text-destructive">*</span></Label>
                    <Input value={irsaliyeNo} onChange={e => setIrsaliyeNo(e.target.value)} placeholder="Örn. 2026000123" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sevk Tarihi</Label>
                    <Input type="date" value={sevkTarihi} onChange={e => setSevkTarihi(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Not <span className="text-muted-foreground text-xs">(opsiyonel)</span></Label>
                  <Input value={notlar} onChange={e => setNotlar(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Malzeme Satırları</Label>
                  {satirlar.map((row, i) => {
                    const uyari = satirKalanUyarisi(row)
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex gap-2">
                          <select
                            value={row.malzeme_id}
                            onChange={e => satirGuncelle(i, { malzeme_id: e.target.value })}
                            className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value="">Malzeme seçin...</option>
                            {malzemeler.map(m => (
                              <option key={m.id} value={m.id}>{m.malzeme_adi} ({m.birim})</option>
                            ))}
                          </select>
                          <Input
                            type="number" min="0" step="0.01" placeholder="Miktar"
                            className="w-28"
                            value={row.miktar}
                            onChange={e => satirGuncelle(i, { miktar: e.target.value })}
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => satirSil(i)} disabled={satirlar.length === 1}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                        {uyari && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> {uyari}
                          </p>
                        )}
                      </div>
                    )
                  })}
                  <Button type="button" variant="outline" size="sm" onClick={satirEkle}>
                    <Plus className="h-3 w-3" /> Satır Ekle
                  </Button>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={sevkiyatSaving}>
                    {sevkiyatSaving ? <><Loader2 className="animate-spin h-4 w-4" /> Kaydediliyor...</> : (sevkiyatDuzenlenen ? 'Güncelle' : 'Sevkiyatı Kaydet')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {sevkiyatlar.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Henüz sevkiyat kaydı yok.</p>
          ) : (
            <div className="divide-y">
              {sevkiyatlar.map(s => (
                <details key={s.id} className="group px-4 py-3">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <div>
                      <span className="font-medium text-sm">İrsaliye: {s.irsaliye_no}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(s.sevk_tarihi).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground mr-2">{s.satirlar.length} kalem</span>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openSevkiyatDialog(s) }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSevkiyatSil(s) }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </summary>
                  <div className="mt-2 pl-2 space-y-1">
                    {s.notlar && <p className="text-xs text-muted-foreground italic">{s.notlar}</p>}
                    {s.satirlar.map(sat => (
                      <div key={sat.id} className="flex justify-between text-sm">
                        <span>{sat.malzeme?.malzeme_adi ?? '—'}</span>
                        <span className="text-muted-foreground">{sat.miktar} {sat.malzeme?.birim}</span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
