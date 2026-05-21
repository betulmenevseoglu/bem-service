'use client'
import { useRef, useState } from 'react'
import { ServisFotograf } from '@/types'
import { sikistirVeYukle, MAX_FOTO_SAYISI } from '@/lib/fotograf'
import { FotografKarti } from './FotografKarti'
import { Button } from '@/components/ui/button'
import { Camera, ImagePlus, Loader2 } from 'lucide-react'

interface FotografYuklemeProps {
  fotograflar: ServisFotograf[]
  setFotograflar: (fn: (prev: ServisFotograf[]) => ServisFotograf[]) => void
  isEmriId: string
  servisFormuId: string | null
  ensureServisFormuId: () => Promise<string>
  yukleyenId: string
  canUpload: boolean
}

export function FotografYukleme({
  fotograflar,
  setFotograflar,
  isEmriId,
  servisFormuId,
  ensureServisFormuId,
  yukleyenId,
  canUpload,
}: FotografYuklemeProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const kalan = MAX_FOTO_SAYISI - fotograflar.length
    const yuklenecek = Array.from(files).slice(0, kalan)
    if (yuklenecek.length === 0) return

    setUploading(true)
    setProgress(0)

    // Servis formu henüz oluşturulmadıysa otomatik oluştur
    const sfId = servisFormuId ?? await ensureServisFormuId()

    for (let i = 0; i < yuklenecek.length; i++) {
      const file = yuklenecek[i]
      const sira = fotograflar.length + i
      try {
        const { path, boyutKb } = await sikistirVeYukle(file, isEmriId, sfId, yukleyenId, sira)
        const newFoto: ServisFotograf = {
          id: crypto.randomUUID(),
          servis_formu_id: sfId,
          storage_path: path,
          aciklama: null,
          sira,
          dosya_boyutu_kb: boyutKb,
          yukleyen_id: yukleyenId,
          created_at: new Date().toISOString(),
        }
        setFotograflar(prev => [...prev, newFoto])
      } catch (err) {
        console.error('Fotoğraf yükleme hatası:', err)
      }
      setProgress(Math.round(((i + 1) / yuklenecek.length) * 100))
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  function handleDelete(id: string) {
    setFotograflar(prev => prev.filter(f => f.id !== id))
  }

  const dolu = fotograflar.length >= MAX_FOTO_SAYISI

  return (
    <div className="space-y-4">
      {canUpload && !dolu && (
        <div className="flex gap-3 flex-wrap">
          <Button type="button" variant="outline" onClick={() => cameraRef.current?.click()} disabled={uploading}>
            <Camera className="h-4 w-4" /> Kamera
          </Button>
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <ImagePlus className="h-4 w-4" /> Galeriden Seç
          </Button>
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Yükleniyor %{progress}...
            </div>
          )}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
        </div>
      )}

      {fotograflar.length === 0 && !uploading && (
        <div className="border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground">
          <ImagePlus className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Henüz fotoğraf yok</p>
          {canUpload && <p className="text-xs mt-1">Maks. {MAX_FOTO_SAYISI} fotoğraf</p>}
        </div>
      )}

      {fotograflar.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {fotograflar.map(foto => (
              <FotografKarti
                key={foto.id}
                fotograf={foto}
                onDelete={handleDelete}
                canDelete={canUpload && (foto.yukleyen_id === yukleyenId)}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {fotograflar.length} / {MAX_FOTO_SAYISI} fotoğraf
          </p>
        </>
      )}
    </div>
  )
}
