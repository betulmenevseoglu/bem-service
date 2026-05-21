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

  const { data: izin } = await supabase.from('izin_talepleri').select('*').eq('id', id).single()
  if (!izin) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  await supabase.from('izin_talepleri').update({ durum: 'onaylandi' }).eq('id', id)

  return NextResponse.json({ ok: true })
}
