'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const pasifHata = searchParams.get('error') === 'pasif'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('E-posta veya şifre hatalı.')
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="relative">
      {/* Animasyonlu loading bar */}
      {loading && (
        <div className="h-1 bg-[#1FBFB8] animate-pulse rounded-full mb-4" />
      )}

      {pasifHata && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Hesabınız pasif edilmiştir. Yöneticinize başvurun.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            type="email"
            placeholder="ornek@bemotomasyon.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Şifre</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Giriş yapılıyor...</>
            : 'Giriş Yap'}
        </Button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm shadow-lg overflow-hidden">
      <CardHeader className="text-center space-y-2 pt-8 pb-5">
        <div className="flex justify-center">
          <img src="/logo-bem.png" alt="Bem Otomasyon" className="w-56 h-auto object-contain" />
        </div>
        <CardDescription className="text-sm text-muted-foreground pt-1">
          Saha Servis Yönetim Sistemi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
