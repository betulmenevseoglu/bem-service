'use client'
import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Eraser, Check } from 'lucide-react'

interface ImzaAlaniProps {
  onSave: (dataUrl: string) => void
  disabled?: boolean
  mevcutImzaUrl?: string | null
  label?: string
}

export function ImzaAlani({ onSave, disabled, mevcutImzaUrl, label }: ImzaAlaniProps) {
  const sigRef = useRef<SignatureCanvas>(null)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    if (!sigRef.current || sigRef.current.isEmpty()) return
    const dataUrl = sigRef.current.toDataURL('image/png')
    onSave(dataUrl)
    setSaved(true)
  }

  function handleClear() {
    sigRef.current?.clear()
    setSaved(false)
  }

  if (mevcutImzaUrl) {
    return (
      <div className="space-y-2">
        {label && <p className="text-sm font-medium">{label}</p>}
        <div className="border rounded-lg overflow-hidden bg-white">
          <img src={mevcutImzaUrl} alt="İmza" className="w-full h-28 object-contain" />
        </div>
        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
          <Check className="h-3 w-3" /> İmzalandı
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className={`border-2 border-dashed rounded-lg overflow-hidden bg-white ${disabled ? 'opacity-50 pointer-events-none' : 'border-[#1FBFB8]/50 hover:border-[#1FBFB8]'}`}>
        <SignatureCanvas
          ref={sigRef}
          penColor="#1a1a1a"
          canvasProps={{
            className: 'w-full',
            style: { height: '120px', display: 'block' },
          }}
        />
      </div>
      {!disabled && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleClear}>
            <Eraser className="h-3 w-3" /> Temizle
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saved}>
            <Check className="h-3 w-3" /> {saved ? 'Kaydedildi' : 'İmzayı Kaydet'}
          </Button>
        </div>
      )}
    </div>
  )
}
