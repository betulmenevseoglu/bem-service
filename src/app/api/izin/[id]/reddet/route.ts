import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (profile?.rol !== 'yonetici') return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  await supabase.from('izin_talepleri').update({ durum: 'reddedildi' }).eq('id', id)

  return NextResponse.json({ ok: true })
}
