// Enums
export type RolTuru = 'yonetici' | 'saha_muhendisi'
export type IsTipi = 'garanti_kapsami' | 'acil_cagri' | 'spot_servis' | 'periyodik_bakim' | 'devreye_alma' | 'arizali_ekipman'
export type IsEmriDurumu = 'atandi' | 'devam_ediyor' | 'tamamlandi' | 'tamamlanmadi' | 'iptal_edildi'
export type IzinTuru = 'yillik' | 'mazeret' | 'raporlu'
export type IzinDurumu = 'beklemede' | 'onaylandi' | 'reddedildi' | 'iptal'

// Tables
export interface Profile { id: string; ad_soyad: string; email: string; telefon: string | null; rol: RolTuru; aktif: boolean; sifre_degistir_gerekli: boolean; created_at: string; updated_at: string }
export interface Proje { id: string; ad: string; musteri_firma: string; musteri_yetkili: string | null; musteri_telefon: string | null; musteri_email: string | null; adres: string | null; notlar: string | null; aktif: boolean; created_at: string; created_by: string | null; musteri_id: string | null }
export interface IsEmri { id: string; emir_no: string | null; proje_id: string; olusturan_id: string; is_tipi: IsTipi; is_tanimi: string; planlanan_baslangic: string; planlanan_bitis: string; durum: IsEmriDurumu; created_at: string; updated_at: string }
export interface IsEmriMuhendis { is_emri_id: string; muhendis_id: string; atanma_tarihi: string }
export interface ServisFormu { id: string; is_emri_id: string; fiili_baslangic: string; fiili_bitis: string; teknik_rapor: string; is_tamamlandi: boolean; tamamlanmama_nedeni: string | null; musteri_imza_url: string | null; musteri_imza_atan_ad: string | null; musteri_imza_tarihi: string | null; son_kaydeden_id: string | null; created_at: string; updated_at: string }
export interface ServisFormuImza { servis_formu_id: string; muhendis_id: string; imza_url: string; imza_tarihi: string }
export interface ServisFotograf { id: string; servis_formu_id: string; storage_path: string; aciklama: string | null; sira: number; dosya_boyutu_kb: number | null; yukleyen_id: string | null; created_at: string }
export interface IzinBakiye { id: string; muhendis_id: string; izin_turu: IzinTuru; yil: number; toplam_gun: number; created_at: string; updated_at: string }
export interface IzinTalep { id: string; muhendis_id: string; izin_turu: IzinTuru; baslangic_tarihi: string; bitis_tarihi: string; toplam_gun: number; aciklama: string | null; durum: IzinDurumu; karar_veren_id: string | null; karar_tarihi: string | null; karar_notu: string | null; created_at: string }

export interface Musteri { id: string; firma_adi: string; adres: string | null; notlar: string | null; aktif: boolean; created_by: string | null; created_at: string; updated_at: string }
export interface MusteriYetkili { id: string; musteri_id: string; ad_soyad: string; unvan: string | null; telefon: string | null; email: string | null; birincil: boolean; created_at: string }
export interface MusteriWithYetkili extends Musteri { yetkilileri: MusteriYetkili[]; proje_sayisi?: number }

// Joined/extended types for UI
export interface IsEmriWithDetails extends IsEmri { proje: Proje; muhendisler: Profile[]; servis_formu?: ServisFormu | null }
export interface ServisFormuWithDetails extends ServisFormu { is_emri: IsEmriWithDetails; fotograflar: ServisFotograf[]; imzalar: ServisFormuImza[]; muhendis_profilleri: Profile[] }
export interface IzinTalepWithProfile extends IzinTalep { muhendis: Profile; karar_veren?: Profile | null }

// Label maps
export const IS_TIPI_LABELS: Record<IsTipi, string> = { garanti_kapsami: 'Garanti Kapsamı', acil_cagri: 'Acil Çağrı', spot_servis: 'Spot Servis', periyodik_bakim: 'Periyodik Bakım', devreye_alma: 'Devreye Alma', arizali_ekipman: 'Arızalı Ekipman' }
export const IS_EMRI_DURUM_LABELS: Record<IsEmriDurumu, string> = { atandi: 'Atandı', devam_ediyor: 'Devam Ediyor', tamamlandi: 'Tamamlandı', tamamlanmadi: 'Tamamlanmadı', iptal_edildi: 'İptal Edildi' }
export const IZIN_TURU_LABELS: Record<IzinTuru, string> = { yillik: 'Yıllık İzin', mazeret: 'Mazeret İzni', raporlu: 'Raporlu İzin' }
export const IZIN_DURUM_LABELS: Record<IzinDurumu, string> = { beklemede: 'Beklemede', onaylandi: 'Onaylandı', reddedildi: 'Reddedildi', iptal: 'İptal' }

// Rapor types
export interface RaporFiltre { baslangic?: string; bitis?: string; muhendisIds?: string[]; projeIds?: string[]; isTipleri?: IsTipi[]; durumlar?: IsEmriDurumu[] }
export interface MuhendisRaporSatiri { muhendis_id: string; ad_soyad: string; toplam_is: number; tamamlanan: number; tamamlanmayan: number; devam_eden: number; toplam_saha_gunu: number; ortalama_is_suresi: number; aktif_proje_sayisi: number; son_is_tarihi: string | null }
export interface ProjeRaporSatiri { proje_id: string; proje_ad: string; musteri_firma: string; is_emri_sayisi: number; tamamlanan: number; toplam_saha_gunu: number; muhendis_sayisi: number; is_tipi_cesitliligi: number; son_servis_tarihi: string | null; bekleyen_is: number }
export interface IsTipiOzet { is_tipi: IsTipi; is_adedi: number; toplam_saha_gunu: number; ortalama_sure: number; tamamlanma_orani: number }
export interface KPIOzet { toplam_is_emri: number; tamamlanan: number; tamamlanma_orani: number; toplam_saha_gunu: number; aktif_muhendis: number; onceki_donem_toplam: number; onceki_donem_tamamlanan: number }
