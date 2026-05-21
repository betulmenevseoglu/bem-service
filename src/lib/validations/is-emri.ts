import { z } from 'zod'

export const isEmriSchema = z.object({
  proje_id: z.string().uuid('Proje seçilmeli'),
  muhendis_ids: z.array(z.string().uuid()).min(1, 'En az bir mühendis seçilmeli'),
  is_tipi: z.enum(['garanti_kapsami', 'acil_cagri', 'spot_servis', 'periyodik_bakim', 'devreye_alma', 'arizali_ekipman']),
  is_tanimi: z.string().min(10, 'İş tanımı en az 10 karakter olmalı'),
  planlanan_baslangic: z.string().min(1, 'Başlangıç tarihi zorunlu'),
  planlanan_bitis: z.string().min(1, 'Bitiş tarihi zorunlu'),
}).refine(d => d.planlanan_bitis > d.planlanan_baslangic, {
  message: 'Bitiş tarihi başlangıçtan sonra olmalı',
  path: ['planlanan_bitis'],
})

export type IsEmriFormData = z.infer<typeof isEmriSchema>
