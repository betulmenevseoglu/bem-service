import { format, differenceInCalendarDays, isWeekend, addDays, parseISO, isValid } from 'date-fns'
import { tr } from 'date-fns/locale'

export function formatTarih(date: string | Date, fmt = 'dd.MM.yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '-'
  return format(d, fmt, { locale: tr })
}

/**
 * Tarih + saat formatlar.
 *
 * Veritabanında datetime-local girişleri timezone bilgisi olmadan kaydedildiğinden
 * (kullanıcının yerel saati UTC olarak tutulur), formatlamayı her ortamda (UTC veya
 * Istanbul timezone'lu Mac) tutarlı kılmak için Intl.DateTimeFormat ile UTC kullanıyoruz.
 * Bu sayede kullanıcının girdiği saat birebir görünür.
 */
export function formatTarihSaat(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d).replace(', ', ' ')
}

/** 1 iş günü = 8,5 saat */
const MESAI_SAATI = 8.5

/**
 * Gün cinsinden ondalıklı süreyi iş günü bazında okunabilir formata çevirir.
 * 1 iş günü = 8,5 saat kabul edilir.
 * Örnek: 0.4333 (≈10.4 sa) → "1 gün 1 sa 54 dk"
 *        0.375  (= 9 sa)   → "1 gün 30 dk"
 *        0.177  (≈ 4.25 sa) → "4 sa 15 dk"
 */
export function formatSure(gunCinsinden: number): string {
  if (!gunCinsinden || gunCinsinden <= 0) return '—'
  const toplamDakika = Math.round(gunCinsinden * 24 * 60)
  if (toplamDakika === 0) return '< 1 dk'

  const mesaiDakika = MESAI_SAATI * 60           // 510 dk
  const gun = Math.floor(toplamDakika / mesaiDakika)
  const kalanDakika = toplamDakika % mesaiDakika
  const saat = Math.floor(kalanDakika / 60)
  const dakika = kalanDakika % 60

  const parcalar: string[] = []
  if (gun > 0) parcalar.push(`${gun} gün`)
  if (saat > 0) parcalar.push(`${saat} sa`)
  return parcalar.join(' ')
}

export function hesaplaIzinGunu(baslangic: Date, bitis: Date): number {
  let count = 0
  let current = new Date(baslangic)
  while (current <= bitis) {
    if (!isWeekend(current)) count++
    current = addDays(current, 1)
  }
  return count
}

export function hesaplaSahaGunu(baslangic: string, bitis: string): number {
  const b = parseISO(baslangic)
  const e = parseISO(bitis)
  if (!isValid(b) || !isValid(e)) return 0
  const diffSec = (e.getTime() - b.getTime()) / 1000
  const raw = diffSec / 86400
  return Math.round(raw * 2) / 2
}

export function gunFarki(tarih: string): number {
  return differenceInCalendarDays(new Date(), parseISO(tarih))
}

export function hizliTarihAraliklari() {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOf3Month = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  return {
    bu_hafta: { baslangic: startOfWeek, bitis: now },
    bu_ay: { baslangic: startOfMonth, bitis: now },
    son_3_ay: { baslangic: startOf3Month, bitis: now },
    bu_yil: { baslangic: startOfYear, bitis: now },
  }
}
