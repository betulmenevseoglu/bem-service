import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'

const MAX_FOTO_SAYISI = 20

export { MAX_FOTO_SAYISI }

export async function sikistirVeYukle(
  file: File,
  isEmriId: string,
  servisFormuId: string,
  yukleyenId: string,
  sira: number,
): Promise<{ path: string; boyutKb: number }> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
  })

  const uuid = crypto.randomUUID()
  const path = `servis-fotograflari/${isEmriId}/${uuid}.jpg`

  const supabase = createClient()
  const { error } = await supabase.storage
    .from('servis-fotograflari')
    .upload(path, compressed, { contentType: 'image/jpeg', upsert: false })

  if (error) throw error

  const boyutKb = Math.round(compressed.size / 1024)

  await supabase.from('servis_fotograflari').insert({
    servis_formu_id: servisFormuId,
    storage_path: path,
    aciklama: null,
    sira,
    dosya_boyutu_kb: boyutKb,
    yukleyen_id: yukleyenId,
  })

  return { path, boyutKb }
}

export async function getSignedUrl(path: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('servis-fotograflari')
    .createSignedUrl(path, 3600)
  if (error || !data) throw error ?? new Error('URL alınamadı')
  return data.signedUrl
}

export async function getImzaSignedUrl(path: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('imzalar')
    .createSignedUrl(path, 3600)
  if (error || !data) throw error ?? new Error('URL alınamadı')
  return data.signedUrl
}

export async function fotografSil(
  path: string,
  fotografId: string,
): Promise<void> {
  const supabase = createClient()
  await supabase.storage.from('servis-fotograflari').remove([path])
  await supabase.from('servis_fotograflari').delete().eq('id', fotografId)
}
