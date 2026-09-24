import type { CapacitorConfig } from '@capacitor/cli'

// Mobil uygulama, canlıdaki web uygulamasını native kabuk içinde açar.
// Uygulama Next.js sunucu tarafı (server components, API route, Supabase oturumu)
// kullandığı için statik paketlenemez; bu yüzden server.url kullanılır.
// Web tarafı güncellenince mağaza güncellemesi beklemeden mobil uygulama da güncellenir.
const config: CapacitorConfig = {
  appId: 'com.bemotomasyon.servis',
  appName: 'Bem Servis',
  webDir: 'mobile/www',
  server: {
    url: 'https://servis.bemotomasyon.com',
    cleartext: false,
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#ffffff',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DEFAULT',
    },
  },
}

export default config
