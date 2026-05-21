import { z } from 'zod'

export const kullaniciSchema = z.object({
  ad_soyad: z.string().min(2, 'Ad soyad en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta girilmeli'),
  telefon: z.string().optional(),
  rol: z.enum(['yonetici', 'saha_muhendisi']),
})

export type KullaniciFormData = z.infer<typeof kullaniciSchema>
