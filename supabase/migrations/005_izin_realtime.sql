-- İzin taleplerinde realtime aboneliğini etkinleştir
-- Sidebar'daki bekleyen izin rozetinin postgres_changes olaylarını alabilmesi için gerekli.
-- (Idempotent: tablo zaten publication'a eklenmişse hata vermeden geçer.)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'izin_talepleri'
  ) then
    alter publication supabase_realtime add table izin_talepleri;
  end if;
end $$;
