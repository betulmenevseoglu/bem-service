import { z } from 'zod'

export const izinTalebiSchema = z.object({
  izin_turu: z.enum(['yillik', 'mazeret', 'raporlu']),
  baslangic_tarihi: z.string().min(1, 'Başlangıç tarihi zorunlu'),
  bitis_tarihi: z.string().min(1, 'Bitiş tarihi zorunlu'),
  aciklama: z.string().optional(),
}).refine(d => d.bitis_tarihi >= d.baslangic_tarihi, {
  message: 'Bitiş tarihi başlangıçtan önce olamaz',
  path: ['bitis_tarihi'],
})

export type IzinTalebiFormData = z.infer<typeof izinTalebiSchema>
