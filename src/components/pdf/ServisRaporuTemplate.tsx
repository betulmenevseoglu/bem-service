import React from 'react'
import path from 'path'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'
import { IS_TIPI_LABELS, IsTipi } from '@/types'
import { formatTarihSaat } from '@/lib/tarih'

Font.register({
  family: 'Arial',
  fonts: [
    { src: path.join(process.cwd(), 'public/fonts/arial-400.ttf'), fontWeight: 400 },
    { src: path.join(process.cwd(), 'public/fonts/arial-700.ttf'), fontWeight: 700 },
  ],
})

const LOGO_PATH = path.join(process.cwd(), 'public/logo-bem.png')
const BEM_TURKUAZ = '#1FBFB8'
const SIRKET_ADI = 'Bem Otomasyon Yazılım Hiz. Tic. Ltd. Şti.'

const s = StyleSheet.create({
  page: { fontFamily: 'Arial', fontSize: 9, padding: 36, paddingBottom: 52, color: '#1a1a1a' },

  /* ── Başlık ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    paddingBottom: 12,
    borderBottom: `2 solid ${BEM_TURKUAZ}`,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoImg: { width: 124, height: 36, objectFit: 'contain' },
  logoDivider: { width: 1, alignSelf: 'stretch', backgroundColor: '#bbb' },
  companyInfo: { fontSize: 7, color: '#555', lineHeight: 1.75 },

  headerRight: { alignItems: 'flex-end' },
  formTitleText: { fontSize: 15, fontWeight: 700, color: BEM_TURKUAZ },
  emirNo: { fontSize: 9, color: '#888', marginTop: 3 },

  /* ── Bölümler ── */
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: BEM_TURKUAZ,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: '1 solid #1a1a1a',
  },

  /* ── Satır / Alan ── */
  row: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' },
  label: { width: 110, color: '#1a1a1a', fontSize: 8.5, fontWeight: 700, paddingTop: 0.5 },
  value: { flex: 1, fontSize: 8.5 },
  textBlock: {
    backgroundColor: '#f8f9fa',
    padding: 9,
    borderRadius: 4,
    lineHeight: 1.65,
    fontSize: 8.5,
    border: '1 solid #e5e7eb',
  },

  /* ── Sonuç ── */
  sonucBox: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  sonucItem: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    border: '1 solid #e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 9,
  },
  sonucItemTamamlandi: { backgroundColor: `${BEM_TURKUAZ}18`, borderColor: BEM_TURKUAZ },
  sonucItemTamamlanmadi: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },

  /* ── İmzalar ── */
  imzaGrid: { flexDirection: 'row', gap: 14 },
  imzaBox: { flex: 1, border: '1 solid #e5e7eb', borderRadius: 6, padding: 10 },
  imzaLabel: { fontSize: 7, color: '#888', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  imzaName: { fontWeight: 700, fontSize: 9, marginBottom: 8 },
  imzaImg: { width: '100%', height: 58, objectFit: 'contain', backgroundColor: '#fafafa', borderRadius: 3 },
  imzaLine: { borderTop: '1 solid #ddd', marginTop: 6, paddingTop: 3 },
  imzaDate: { fontSize: 7, color: '#999' },

  /* ── Fotoğraflar ── */
  fotoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fotoItem: { width: '47.5%' },
  fotoImg: { width: '100%', height: 130, objectFit: 'cover', borderRadius: 4, backgroundColor: '#f0f0f0' },
  fotoCaption: { fontSize: 7, color: '#666', marginTop: 3, lineHeight: 1.4 },

  /* ── Footer ── */
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 5,
  },
  footerText: { fontSize: 7, color: '#aaa' },
})

interface Props {
  isEmri: any
  servisFormu: any
  muhendisler: any[]
  fotograflar: any[]
  fotoUrller: Record<string, string>
  imzaUrller: Record<string, string>
  musteriImzaBase64: string
}

/* Ortak başlık bileşeni */
function PageHeader({ isEmri, showAddress }: { isEmri: any; showAddress: boolean }) {
  return (
    <View style={s.header}>
      <View style={s.headerLeft}>
        <Image style={s.logoImg} src={LOGO_PATH} />
        {showAddress && (
          <>
            <View style={s.logoDivider} />
            <Text style={s.companyInfo}>
              {'Marmara Kule, Esentepe Mah. Kelebek Sk.\n'}
              {'No: 2A D:21 Kartal/İstanbul\n'}
              {'+90 (216) 766 51 90\n'}
              {'www.bemotomasyon.com'}
            </Text>
          </>
        )}
      </View>
      <View style={s.headerRight}>
        <Text style={s.formTitleText}>SERVİS FORMU</Text>
        <Text style={s.emirNo}>{isEmri.emir_no ?? '—'}</Text>
      </View>
    </View>
  )
}

/* Ortak footer bileşeni */
function PageFooter() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{SIRKET_ADI}</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`} />
    </View>
  )
}

export function ServisRaporuTemplate({ isEmri, servisFormu: sf, muhendisler, fotograflar, fotoUrller, imzaUrller, musteriImzaBase64 }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PageHeader isEmri={isEmri} showAddress />

        {/* İş Detayı */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>İş Detayı</Text>
          <View style={s.row}><Text style={s.label}>Proje</Text><Text style={s.value}>{isEmri.proje?.ad ?? '—'}</Text></View>
          <View style={s.row}><Text style={s.label}>Müşteri</Text><Text style={s.value}>{isEmri.proje?.musteri_firma ?? '—'}</Text></View>
          {isEmri.proje?.adres && (
            <View style={s.row}><Text style={s.label}>Tesis Lokasyonu</Text><Text style={s.value}>{isEmri.proje.adres}</Text></View>
          )}
          <View style={s.row}><Text style={s.label}>İş Tipi</Text><Text style={s.value}>{IS_TIPI_LABELS[isEmri.is_tipi as IsTipi]}</Text></View>
          <View style={s.row}><Text style={s.label}>İş Tanımı</Text><Text style={s.value}>{isEmri.is_tanimi}</Text></View>
          {sf && <>
            <View style={s.row}><Text style={s.label}>Başlama Tarihi</Text><Text style={s.value}>{sf.fiili_baslangic ? formatTarihSaat(sf.fiili_baslangic) : '—'}</Text></View>
            <View style={s.row}><Text style={s.label}>Bitiş Tarihi</Text><Text style={s.value}>{sf.fiili_bitis ? formatTarihSaat(sf.fiili_bitis) : '—'}</Text></View>
          </>}
        </View>

        {/* Teknik Rapor */}
        {sf && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Teknik Rapor</Text>
            <Text style={s.textBlock}>{sf.teknik_rapor}</Text>
          </View>
        )}

        {/* Saha Fotoğrafları — teknik raporun hemen altında, taşarsa sonraki sayfaya geçer */}
        {fotograflar.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Saha Fotoğrafları</Text>
            <View style={s.fotoGrid}>
              {fotograflar.map((foto: any, idx: number) => (
                <View key={foto.id} style={s.fotoItem} wrap={false}>
                  {fotoUrller[foto.id] ? (
                    <Image style={s.fotoImg} src={fotoUrller[foto.id]} />
                  ) : (
                    <View style={s.fotoImg} />
                  )}
                  <Text style={s.fotoCaption}>
                    Foto {idx + 1}{foto.aciklama ? `: ${foto.aciklama}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sonuç */}
        {sf && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Sonuç</Text>
            <View style={s.sonucBox}>
              <View style={[s.sonucItem, sf.is_tamamlandi ? s.sonucItemTamamlandi : {}]}>
                <Text>{sf.is_tamamlandi ? '☑  İş Tamamlandı' : '☐  İş Tamamlandı'}</Text>
              </View>
              <View style={[s.sonucItem, !sf.is_tamamlandi ? s.sonucItemTamamlanmadi : {}]}>
                <Text>{!sf.is_tamamlandi ? '☑  Tamamlanmadı' : '☐  Tamamlanmadı'}</Text>
              </View>
            </View>
            {!sf.is_tamamlandi && sf.tamamlanmama_nedeni && (
              <Text style={s.textBlock}>{sf.tamamlanmama_nedeni}</Text>
            )}
          </View>
        )}

        {/* İmzalar */}
        <View style={s.section} wrap={false}>
          <Text style={s.sectionTitle}>İmzalar</Text>
          <View style={s.imzaGrid}>
            {muhendisler.map((m: any) => (
              <View key={m.id} style={s.imzaBox}>
                <Text style={s.imzaLabel}>Saha Mühendisi</Text>
                <Text style={s.imzaName}>{m.ad_soyad}</Text>
                {imzaUrller[m.id] ? (
                  <Image style={s.imzaImg} src={imzaUrller[m.id]} />
                ) : (
                  <View style={{ ...s.imzaImg, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#ccc', fontSize: 8 }}>İmza bekleniyor</Text>
                  </View>
                )}
                <View style={s.imzaLine}>
                  <Text style={s.imzaDate}>{sf?.fiili_bitis ? formatTarihSaat(sf.fiili_bitis) : '—'}</Text>
                </View>
              </View>
            ))}
            <View style={s.imzaBox}>
              <Text style={s.imzaLabel}>Müşteri Onayı</Text>
              <Text style={s.imzaName}>{sf?.musteri_imza_atan_ad ?? '—'}</Text>
              {musteriImzaBase64 ? (
                <Image style={s.imzaImg} src={musteriImzaBase64} />
              ) : (
                <View style={{ ...s.imzaImg, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#ccc', fontSize: 8 }}>İmza bekleniyor</Text>
                </View>
              )}
              <View style={s.imzaLine}>
                <Text style={s.imzaDate}>{sf?.musteri_imza_tarihi ? formatTarihSaat(sf.musteri_imza_tarihi) : '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  )
}
