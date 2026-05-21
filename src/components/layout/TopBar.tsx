'use client'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopBarProps {
  onMenuClick: () => void
  title?: string
}

export function TopBar({ onMenuClick, title }: TopBarProps) {
  return (
    <header className="h-16 border-b border-border bg-white flex items-center px-4 gap-4 sticky top-0 z-30">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>
      {title && <h1 className="font-semibold text-lg">{title}</h1>}
    </header>
  )
}
