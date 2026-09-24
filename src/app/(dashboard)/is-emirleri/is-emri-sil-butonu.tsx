'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

interface Props {
  isEmriId: string
  emirNo?: string | null
  variant?: 'icon' | 'default'
  /** Verilirse silme sonrası buraya yönlendirilir (örn. detay sayfasından listeye dönüş). Verilmezse mevcut sayfa tazelenir. */
  redirectTo?: string
}

export function IsEmriSilButonu({ isEmriId, emirNo, variant = 'icon', redirectTo }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSil() {
    setDeleting(true)
    setError(null)
    const { error: err } = await supabase.from('is_emirleri').delete().eq('id', isEmriId)
    setDeleting(false)

    if (err) {
      setError(err.message)
      return
    }

    setOpen(false)
    if (redirectTo) router.push(redirectTo)
    else router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(null) }}>
      <DialogTrigger asChild>
        {variant === 'icon' ? (
          <Button variant="ghost" size="icon" title="İş emrini sil" aria-label="İş emrini sil">
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        ) : (
          <Button
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" /> İş Emrini Sil
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto sm:mx-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mb-1">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <DialogTitle>{emirNo ?? 'Bu iş emrini'} silinsin mi?</DialogTitle>
          <DialogDescription>
            Bu işlem geri alınamaz; ilişkili saha servis formu, fotoğraflar ve imzalar da birlikte silinir.
            İş emri, atanan mühendis(ler)in listesinden de otomatik olarak kaldırılır.
          </DialogDescription>
        </DialogHeader>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
            İptal
          </Button>
          <Button variant="destructive" onClick={handleSil} disabled={deleting}>
            {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Siliniyor...</> : 'Evet, Sil'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
