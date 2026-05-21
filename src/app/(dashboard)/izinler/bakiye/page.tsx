import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IzinBakiyeEditor } from './bakiye-editor'

export default async function IzinBakiyePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (myProfile?.rol !== 'yonetici') redirect('/izinler')

  const yil = new Date().getFullYear()
  const { data: muhendisler } = await supabase
    .from('profiles')
    .select('*')
    .eq('rol', 'saha_muhendisi')
    .eq('aktif', true)
    .order('ad_soyad')

  const { data: bakiyeler } = await supabase
    .from('izin_bakiyeleri')
    .select('*')
    .eq('yil', yil)

  return <IzinBakiyeEditor muhendisler={muhendisler ?? []} bakiyeler={bakiyeler ?? []} yil={yil} />
}
