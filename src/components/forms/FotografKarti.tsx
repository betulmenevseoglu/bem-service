'use client'
import { useState, useEffect } from 'react'
import { ServisFotograf } from '@/types'
import { getSignedUrl, fotografSil } from '@/lib/fotograf'
import { createClient } from '@/lib/supabase/client'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Trash2, ImageIcon, Loader2 } from 'lucide-react'

interface FotografKartiProps {
  fotograf: ServisFotograf
  onDelete: (id: string) => void
  canDelete: boolean
}

export function FotografKarti({ fotograf, onDelete, canDelete }: FotografKartiProps) {
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [aciklama, setAciklama] = useState(fotograf.aciklama ?? '')
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    getSignedUrl(fotograf.storage_path).then(setImgUrl).catch(() => {})
  }, [fotograf.storage_path])

  async function handleAciklamaBlur() {
    if (aciklama === (fotograf.aciklama ?? '')) return
    setSaving(true)
    await supabase.from('servis_fotograflari').update({ aciklama: aciklama || null }).eq('id', fotograf.id)
    setSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await fotografSil(fotograf.storage_path, fotograf.id)
    onDelete(fotograf.id)
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-slate-100">
        {imgUrl ? (
          <img src={imgUrl} alt={aciklama || `Fotoğraf ${fotograf.sira + 1}`} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="h-8 w-8 text-slate-300" />
          </div>
        )}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="absolute top-2 right-2 h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition-colors"
          >
            {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          </button>
        )}
        {fotograf.dosya_boyutu_kb && (
          <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
            {fotograf.dosya_boyutu_kb} KB
          </span>
        )}
      </div>
      <div className="p-2">
        <div className="relative">
          <Textarea
            value={aciklama}
            onChange={e => setAciklama(e.target.value)}
            onBlur={handleAciklamaBlur}
            placeholder="Açıklama ekle... (opsiyonel)"
            className="text-xs resize-none min-h-[56px] pr-6"
            rows={2}
          />
          {saving && (
            <Loader2 className="h-3 w-3 animate-spin absolute bottom-2 right-2 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  )
}
