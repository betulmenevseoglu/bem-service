import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderToBuffer } from '@react-pdf/renderer'
import { ServisRaporuTemplate } from '@/components/pdf/ServisRaporuTemplate'
import React from 'react'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ isEmriId: string }> }
) {
  const { isEmriId } = await params

  // Auth kontrolü user client ile — kimlik doğrulama
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  // Veri çekimi admin client ile — profiles RLS tüm mühendisleri filtreler, admin bunu atlar
  const admin = createAdminClient()

  const { data: ie } = await admin
    .from('is_emirleri')
    .select('*, proje:projeler(*), muhendisler:is_emri_muhendisleri(muhendis:profiles(*))')
    .eq('id', isEmriId)
    .single()

  if (!ie) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const { data: sf } = await admin
    .from('servis_formlari')
    .select('*')
    .eq('is_emri_id', isEmriId)
    .maybeSingle()

  const { data: fotograflar } = sf
    ? await admin.from('servis_fotograflari').select('*').eq('servis_formu_id', sf.id).order('sira')
    : { data: [] }

  const { data: imzalar } = sf
    ? await admin.from('servis_formu_imzalari').select('*').eq('servis_formu_id', sf.id)
    : { data: [] }

  const muhendisler = (ie.muhendisler as any[]).map((m: any) => m.muhendis).filter(Boolean)

  // Fiili tarihler NULL ise planlanan tarihlerle doldur — form kilitliyken güncelleme yapılamaz
  const sfWithDates = sf ? {
    ...sf,
    fiili_baslangic: sf.fiili_baslangic ?? ie.planlanan_baslangic ?? new Date().toISOString(),
    fiili_bitis: sf.fiili_bitis ?? ie.planlanan_bitis ?? new Date().toISOString(),
  } : sf

  const imgCache: Record<string, string> = {}
  async function getBase64(storagePath: string, bucket: string): Promise<string> {
    if (imgCache[storagePath]) return imgCache[storagePath]
    const { data } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 300)
    if (!data?.signedUrl) return ''
    const res = await fetch(data.signedUrl)
    const buf = await res.arrayBuffer()
    const b64 = Buffer.from(buf).toString('base64')
    const mime = res.headers.get('content-type') ?? 'image/jpeg'
    const result = `data:${mime};base64,${b64}`
    imgCache[storagePath] = result
    return result
  }

  const fotoUrller: Record<string, string> = {}
  for (const f of fotograflar ?? []) {
    try { fotoUrller[f.id] = await getBase64(f.storage_path, 'servis-fotograflari') } catch {}
  }

  const imzaUrller: Record<string, string> = {}
  for (const im of imzalar ?? []) {
    try { imzaUrller[im.muhendis_id] = await getBase64(im.imza_url, 'imzalar') } catch {}
  }

  let musteriImzaBase64 = ''
  if (sf?.musteri_imza_url) {
    try { musteriImzaBase64 = await getBase64(sf.musteri_imza_url, 'imzalar') } catch {}
  }

  const element = React.createElement(ServisRaporuTemplate, {
    isEmri: ie,
    servisFormu: sfWithDates,
    muhendisler,
    fotograflar: fotograflar ?? [],
    fotoUrller,
    imzaUrller,
    musteriImzaBase64,
  }) as unknown as React.ReactElement<{ title?: string }>

  const pdfBuffer = await renderToBuffer(element as any)

  return new Response(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="servis-raporu-${ie.emir_no ?? isEmriId}.pdf"`,
    },
  })
}
