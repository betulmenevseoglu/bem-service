-- musteriler table
create table if not exists musteriler (
  id          uuid primary key default uuid_generate_v4(),
  firma_adi   text not null,
  adres       text,
  notlar      text,
  aktif       boolean not null default true,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- musteri_yetkilileri table (multiple contacts per customer)
create table if not exists musteri_yetkilileri (
  id          uuid primary key default uuid_generate_v4(),
  musteri_id  uuid not null references musteriler(id) on delete cascade,
  ad_soyad    text not null,
  unvan       text,
  telefon     text,
  email       text,
  birincil    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- add musteri_id FK to projeler (nullable for backward compat)
alter table projeler
  add column if not exists musteri_id uuid references musteriler(id) on delete set null;

-- RLS
alter table musteriler enable row level security;
alter table musteri_yetkilileri enable row level security;

create policy "musteriler_select" on musteriler for select to authenticated using (true);
create policy "musteriler_insert" on musteriler for insert to authenticated with check (auth_rol() = 'yonetici');
create policy "musteriler_update" on musteriler for update to authenticated using (auth_rol() = 'yonetici');
create policy "musteriler_delete" on musteriler for delete to authenticated using (auth_rol() = 'yonetici');

create policy "musteri_yetkilileri_select" on musteri_yetkilileri for select to authenticated using (true);
create policy "musteri_yetkilileri_insert" on musteri_yetkilileri for insert to authenticated with check (auth_rol() = 'yonetici');
create policy "musteri_yetkilileri_update" on musteri_yetkilileri for update to authenticated using (auth_rol() = 'yonetici');
create policy "musteri_yetkilileri_delete" on musteri_yetkilileri for delete to authenticated using (auth_rol() = 'yonetici');
