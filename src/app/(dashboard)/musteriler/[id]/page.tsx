'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { MusteriYetkili } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, ArrowLeft, Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import Link from 'next/link'

interface ProjeOzet { id: string; ad: string; aktif: boolean; musteri_firma: string }

interface MusteriData {
  id: string
  firma_adi: string
  adres: string | null
  notlar: string | null
  aktif: boolean
  created_at: string
  updated_at: string
}

interface EditingYetkili {
  id: string | null // null = new
  ad_soyad: string
  unvan: string
  telefon: string
  email: string
  birincil: boolean
}

export default function MusteriDuzenlePage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const { profile } = useAuth()
  const isYonetici = profile?.rol === 'yonetici'

  const [musteri, setMusteri] = useState<MusteriData | null>(null)
  const [yetkilileri, setYetkilileri] = useState<MusteriYetkili[]>([])
  const [projeler, setProjeler] = useState<ProjeOzet[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [infoForm, setInfoForm] = useState({ firma_adi: '', adres: '', notlar: '' })
  const [editingYetkili, setEditingYetkili] = useState<EditingYetkili | null>(null)
  const [yetkiliLoading, setYetkiliLoading] = useState(false)
  const [yetkiliError, setYetkiliError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [musteriRes, yetkiliRes, projeRes] = await Promise.all([
        supabase.from('musteriler').select('*').eq('id', id).single(),
        supabase.from('musteri_yetkilileri').select('*').eq('musteri_id', id).order('birincil', { ascending: false }),
        supabase.from('projeler').select('id, ad, aktif, musteri_firma').eq('musteri_id', id).order('ad'),
      ])
      if (musteriRes.data) {
        setMusteri(musteriRes.data)
        setInfoForm({
          firma_adi: musteriRes.data.firma_adi,
          adres: musteriRes.data.adres ?? '',
          notlar: musteriRes.data.notlar ?? '',
        })
      }
      setYetkilileri(yetkiliRes.data ?? [])
      setProjeler(projeRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  function setField(key: keyof typeof infoForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setInfoForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSave() {
    if (!infoForm.firma_adi.trim()) { setError('Firma adı zorunludur.'); return }
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('musteriler').update({
      firma_adi: infoForm.firma_adi.trim(),
      adres: infoForm.adres.trim() || null,
      notlar: infoForm.notlar.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (err) { setError(err.message); setSaving(false); return }
    setMusteri(prev => prev ? { ...prev, firma_adi: infoForm.firma_adi.trim(), adres: infoForm.adres.trim() || null, notlar: infoForm.notlar.trim() || null } : prev)
    setSuccess(true)
    setSaving(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  async function toggleAktif() {
    if (!musteri) return
    const { error: err } = await supabase.from('musteriler').update({ aktif: !musteri.aktif, updated_at: new Date().toISOString() }).eq('id', id)
    if (!err) setMusteri(prev => prev ? { ...prev, aktif: !prev.aktif } : prev)
  }

  function startNewYetkili() {
    setEditingYetkili({ id: null, ad_soyad: '', unvan: '', telefon: '', email: '', birincil: false })
    setYetkiliError(null)
  }

  function startEditYetkili(y: MusteriYetkili) {
    setEditingYetkili({ id: y.id, ad_soyad: y.ad_soyad, unvan: y.unvan ?? '', telefon: y.telefon ?? '', email: y.email ?? '', birincil: y.birincil })
    setYetkiliError(null)
  }

  function cancelEditYetkili() {
    setEditingYetkili(null)
    setYetkiliError(null)
  }

  async function saveYetkili() {
    if (!editingYetkili) return
    if (!editingYetkili.ad_soyad.trim()) { setYetkiliError('Ad Soyad zorunludur.'); return }
    setYetkiliLoading(true)
    setYetkiliError(null)

    const payload = {
      musteri_id: id,
      ad_soyad: editingYetkili.ad_soyad.trim(),
      unvan: editingYetkili.unvan.trim() || null,
      telefon: editingYetkili.telefon.trim() || null,
      email: editingYetkili.email.trim() || null,
      birincil: editingYetkili.birincil,
    }

    if (editingYetkili.birincil) {
      // unset other birincil first
      await supabase.from('musteri_yetkilileri').update({ birincil: false }).eq('musteri_id', id)
    }

    if (editingYetkili.id) {
      const { error: err } = await supabase.from('musteri_yetkilileri').update(payload).eq('id', editingYetkili.id)
      if (err) { setYetkiliError(err.message); setYetkiliLoading(false); return }
      setYetkilileri(prev => prev.map(y => {
        if (y.id === editingYetkili.id) return { ...y, ...payload }
        if (editingYetkili.birincil) return { ...y, birincil: false }
        return y
      }))
    } else {
      const { data, error: err } = await supabase.from('musteri_yetkilileri').insert(payload).select('*').single()
      if (err || !data) { setYetkiliError(err?.message ?? 'Hata'); setYetkiliLoading(false); return }
      setYetkilileri(prev => {
        const updated = editingYetkili.birincil ? prev.map(y => ({ ...y, birincil: false })) : prev
        return [data, ...updated]
      })
    }

    setEditingYetkili(null)
    setYetkiliLoading(false)
  }

  async function deleteYetkili(yetkiliId: string) {
    const { error: err } = await supabase.from('musteri_yetkilileri').delete().eq('id', yetkiliId)
    if (!err) setYetkilileri(prev => prev.filter(y => y.id !== yetkiliId))
  }

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin h-6 w-6 text-[#1FBFB8]" /></div>
  if (!musteri) return <div className="text-center py-16 text-muted-foreground">Müşteri bulunamadı.</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/musteriler"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Müşteri Düzenle</h1>
          <p className="text-muted-foreground text-sm">{musteri.firma_adi}</p>
        </div>
      </div>

      {/* Firma Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Firma Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert><AlertDescription className="text-green-600 font-medium">Kaydedildi.</AlertDescription></Alert>}

          <div className="space-y-1.5">
            <Label>Firma Adı</Label>
            <Input value={infoForm.firma_adi} onChange={setField('firma_adi')} disabled={!isYonetici} />
          </div>
          <div className="space-y-1.5">
            <Label>Adres</Label>
            <Textarea value={infoForm.adres} onChange={setField('adres')} rows={2} disabled={!isYonetici} />
          </div>
          <div className="space-y-1.5">
            <Label>Notlar</Label>
            <Textarea value={infoForm.notlar} onChange={setField('notlar')} rows={3} disabled={!isYonetici} />
          </div>

          {isYonetici && (
            <>
              <div className="flex items-center justify-between py-3 border-t">
                <div>
                  <Label>Durum</Label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${musteri.aktif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {musteri.aktif ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={toggleAktif}>
                  {musteri.aktif ? 'Pasife Al' : 'Aktife Al'}
                </Button>
              </div>

              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="animate-spin h-4 w-4" /> Kaydediliyor...</> : 'Kaydet'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Yetkililer */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Yetkililer</CardTitle>
          {isYonetici && !editingYetkili && (
            <Button variant="outline" size="sm" onClick={startNewYetkili}>
              <Plus className="h-4 w-4" /> Yetkili Ekle
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {yetkiliError && <Alert variant="destructive"><AlertDescription>{yetkiliError}</AlertDescription></Alert>}

          {editingYetkili && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <p className="text-sm font-medium">{editingYetkili.id ? 'Yetkili Düzenle' : 'Yeni Yetkili'}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Ad Soyad <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Ayşe Yılmaz"
                    value={editingYetkili.ad_soyad}
                    onChange={e => setEditingYetkili(prev => prev ? { ...prev, ad_soyad: e.target.value } : prev)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Unvan</Label>
                  <Input
                    placeholder="Satın Alma Müdürü"
                    value={editingYetkili.unvan}
                    onChange={e => setEditingYetkili(prev => prev ? { ...prev, unvan: e.target.value } : prev)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefon</Label>
                  <Input
                    placeholder="+90 212 000 00 00"
                    value={editingYetkili.telefon}
                    onChange={e => setEditingYetkili(prev => prev ? { ...prev, telefon: e.target.value } : prev)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>E-posta</Label>
                  <Input
                    type="email"
                    placeholder="yetkili@sirket.com"
                    value={editingYetkili.email}
                    onChange={e => setEditingYetkili(prev => prev ? { ...prev, email: e.target.value } : prev)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-birincil"
                  checked={editingYetkili.birincil}
                  onCheckedChange={checked => setEditingYetkili(prev => prev ? { ...prev, birincil: checked === true } : prev)}
                />
                <Label htmlFor="edit-birincil" className="text-sm font-normal cursor-pointer">Birincil yetkili</Label>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={saveYetkili} disabled={yetkiliLoading}>
                  {yetkiliLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4" />}
                  Kaydet
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEditYetkili}>
                  <X className="h-4 w-4" /> İptal
                </Button>
              </div>
            </div>
          )}

          {yetkilileri.length === 0 && !editingYetkili && (
            <p className="text-sm text-muted-foreground text-center py-4">Henüz yetkili eklenmemiş.</p>
          )}

          {yetkilileri.map((y, idx) => (
            <div key={y.id}>
              {idx > 0 && <Separator />}
              <div className="flex items-start justify-between py-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{y.ad_soyad}</span>
                    {y.birincil && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[#1FBFB8]/10 text-[#1FBFB8]">
                        Birincil
                      </span>
                    )}
                  </div>
                  {y.unvan && <p className="text-xs text-muted-foreground">{y.unvan}</p>}
                  {y.telefon && <p className="text-xs text-muted-foreground">{y.telefon}</p>}
                  {y.email && <p className="text-xs text-muted-foreground">{y.email}</p>}
                </div>
                {isYonetici && !editingYetkili && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditYetkili(y)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteYetkili(y.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bağlı Projeler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bağlı Projeler</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {projeler.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 px-4">Bu müşteriye bağlı proje bulunmuyor.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proje Adı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projeler.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-sm">{p.ad}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.aktif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.aktif ? 'Aktif' : 'Pasif'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                        <Link href={`/projeler/${p.id}`}><Pencil className="h-3.5 w-3.5" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
