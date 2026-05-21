'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { kullaniciSchema, KullaniciFormData } from '@/lib/validations/kullanici'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Copy, Check } from 'lucide-react'
import Link from 'next/link'

export default function YeniKullaniciPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<KullaniciFormData>({
    resolver: zodResolver(kullaniciSchema),
    defaultValues: { ad_soyad: '', email: '', telefon: '', rol: 'saha_muhendisi' },
  })

  async function onSubmit(data: KullaniciFormData) {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/kullanici/yeni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Hata oluştu'); setLoading(false); return }
    setTempPassword(json.temp_password)
    setLoading(false)
  }

  function copyPassword() {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (tempPassword) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Kullanıcı Oluşturuldu ✓</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Geçici şifreyi kullanıcıya güvenli bir kanaldan iletin. Bu şifre yalnızca şimdi görünür.
              </AlertDescription>
            </Alert>
            <div className="bg-slate-50 rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground mb-2">Geçici Şifre</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono font-bold tracking-wider">{tempPassword}</code>
                <Button variant="outline" size="icon" onClick={copyPassword}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" asChild className="flex-1">
                <Link href="/kullanicilar">Kullanıcı Listesi</Link>
              </Button>
              <Button onClick={() => { setTempPassword(null); form.reset() }} className="flex-1">
                Yeni Kullanıcı Ekle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/kullanicilar"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Yeni Kullanıcı</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="ad_soyad" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Soyad</FormLabel>
                  <FormControl><Input placeholder="Ahmet Yılmaz" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>E-posta</FormLabel>
                  <FormControl><Input type="email" placeholder="ahmet@bemotomasyon.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="telefon" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon <span className="text-muted-foreground text-xs">(opsiyonel)</span></FormLabel>
                  <FormControl><Input placeholder="+90 555 000 00 00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="rol" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <FormControl>
                    <select {...field} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                      <option value="saha_muhendisi">Saha Mühendisi</option>
                      <option value="yonetici">Yönetici</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="animate-spin h-4 w-4" /> Oluşturuluyor...</> : 'Kullanıcı Oluştur'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
