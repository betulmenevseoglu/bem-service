import { z } from 'zod'

export const sahaFormSchema = z.object({
  fiili_baslangic: z.string().min(1, 'Başlangıç tarihi zorunlu'),
  fiili_bitis: z.string().min(1, 'Bitiş tarihi zorunlu'),
  teknik_rapor: z.string().min(20, 'Teknik rapor en az 20 karakter olmalı'),
  is_tamamlandi: z.boolean(),
  tamamlanmama_nedeni: z.string().optional(),
  musteri_imza_atan_ad: z.string().optional(),
}).refine(d => d.is_tamamlandi || (d.tamamlanmama_nedeni && d.tamamlanmama_nedeni.length > 0), {
  message: 'Tamamlanmama nedeni belirtilmeli',
  path: ['tamamlanmama_nedeni'],
})

export type SahaFormData = z.infer<typeof sahaFormSchema>
