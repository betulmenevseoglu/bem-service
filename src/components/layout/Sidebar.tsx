'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LayoutDashboard, ClipboardList, Building2, Calendar, CalendarDays, BarChart3, Users, LogOut, X, UserCircle } from 'lucide-react'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const navItems = [
  { href: '/',             label: 'Ana Panel',    icon: LayoutDashboard, roles: ['yonetici', 'saha_muhendisi'] },
  { href: '/is-emirleri',  label: 'İş Emirleri',  icon: ClipboardList,   roles: ['yonetici', 'saha_muhendisi'] },
  { href: '/takvim',       label: 'Takvim',       icon: CalendarDays,    roles: ['yonetici', 'saha_muhendisi'] },
  { href: '/musteriler',   label: 'Müşteriler',   icon: Users,           roles: ['yonetici'] },
  { href: '/projeler',     label: 'Projeler',     icon: Building2,       roles: ['yonetici'] },
  { href: '/izinler',      label: 'İzinler',      icon: Calendar,        roles: ['yonetici', 'saha_muhendisi'] },
  { href: '/raporlar',     label: 'Raporlar',     icon: BarChart3,       roles: ['yonetici'] },
  { href: '/kullanicilar', label: 'Kullanıcılar', icon: Users,           roles: ['yonetici'] },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const supabase = createClient()
  const [bekleyenIzin, setBekleyenIzin] = useState(0)

  // Bekleyen izin sayısını çek — sadece yönetici için
  useEffect(() => {
    if (profile?.rol !== 'yonetici') return

    async function fetchBekleyen() {
      const { count } = await supabase
        .from('izin_talepleri')
        .select('*', { count: 'exact', head: true })
        .eq('durum', 'beklemede')
      setBekleyenIzin(count ?? 0)
    }

    fetchBekleyen()

    // Realtime: yeni izin talebi gelince otomatik güncelle
    const channel = supabase
      .channel('izin-bildirimleri')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'izin_talepleri' },
        () => { fetchBekleyen() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile?.rol]) // eslint-disable-line react-hooks/exhaustive-deps

  const visibleItems = navItems.filter(item =>
    profile?.rol ? item.roles.includes(profile.rol) : false
  )

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const showIzinBadge = (href: string) =>
    href === '/izinler' && profile?.rol === 'yonetici' && bekleyenIzin > 0

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border flex flex-col transition-transform duration-200 ease-in-out',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <img src="/logo-bem.png" alt="Bem Otomasyon" className="w-8 h-8 object-contain" />
            <div>
              <div className="font-bold text-sm leading-tight">Bem Otomasyon</div>
              <div className="text-xs text-muted-foreground">Saha Servis</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visibleItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-[#1FBFB8] text-white'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {showIzinBadge(item.href) && (
                <span className={cn(
                  'h-5 min-w-5 rounded-full text-xs font-bold flex items-center justify-center px-1.5 leading-none',
                  isActive(item.href)
                    ? 'bg-white text-[#1FBFB8]'
                    : 'bg-red-500 text-white'
                )}>
                  {bekleyenIzin > 9 ? '9+' : bekleyenIzin}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 mb-2">
            <div className="font-medium text-sm truncate">{profile?.ad_soyad}</div>
            <Badge variant="outline" className="text-xs mt-1">
              {profile?.rol === 'yonetici' ? 'Yönetici' : 'Saha Mühendisi'}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-foreground"
            asChild
          >
            <Link href="/profil">
              <UserCircle className="h-4 w-4 mr-2" />
              Profilim
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Çıkış Yap
          </Button>
        </div>
      </aside>
    </>
  )
}
