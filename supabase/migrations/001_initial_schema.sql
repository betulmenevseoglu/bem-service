-- ============================================================
-- Bem Otomasyon Saha Servis Yönetimi - Initial Schema
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type rol_turu as enum ('yonetici', 'saha_muhendisi');

create type is_tipi as enum (
  'garanti_kapsami',
  'acil_cagri',
  'spot_servis',
  'periyodik_bakim',
  'devreye_alma',
  'arizali_ekipman'
);

create type is_emri_durumu as enum (
  'atandi',
  'devam_ediyor',
  'tamamlandi',
  'tamamlanmadi',
  'iptal_edildi'
);

create type izin_turu as enum ('yillik', 'mazeret', 'raporlu');

create type izin_durumu as enum ('beklemede', 'onaylandi', 'reddedildi', 'iptal');

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Returns the rol of the currently authenticated user
create or replace function auth_rol()
returns rol_turu
language sql
security definer
stable
as $$
  select rol
  from profiles
  where id = auth.uid()
$$;

-- Returns true if the current user is assigned to the given is_emri
create or replace function is_emri_atanan(emri_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from is_emri_muhendisleri
    where is_emri_id = emri_id
      and muhendis_id = auth.uid()
  )
$$;

-- ============================================================
-- TABLES
-- ============================================================

-- profiles (extends auth.users)
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  ad_soyad      text not null,
  email         text not null unique,
  telefon       text,
  rol           rol_turu not null default 'saha_muhendisi',
  aktif         boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- projeler
create table projeler (
  id                uuid primary key default uuid_generate_v4(),
  ad                text not null,
  musteri_firma     text not null,
  musteri_yetkili   text,
  musteri_telefon   text,
  musteri_email     text,
  adres             text,
  notlar            text,
  aktif             boolean not null default true,
  created_at        timestamptz not null default now(),
  created_by        uuid references profiles(id) on delete set null
);

-- is_emirleri
create table is_emirleri (
  id                    uuid primary key default uuid_generate_v4(),
  emir_no               text unique,
  proje_id              uuid not null references projeler(id) on delete restrict,
  olusturan_id          uuid not null references profiles(id) on delete restrict,
  is_tipi               is_tipi not null,
  is_tanimi             text not null,
  planlanan_baslangic   timestamptz not null,
  planlanan_bitis       timestamptz not null,
  durum                 is_emri_durumu not null default 'atandi',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint bitis_baslangictan_sonra check (planlanan_bitis > planlanan_baslangic)
);

-- is_emri_muhendisleri (many-to-many)
create table is_emri_muhendisleri (
  is_emri_id      uuid not null references is_emirleri(id) on delete cascade,
  muhendis_id     uuid not null references profiles(id) on delete cascade,
  atanma_tarihi   timestamptz not null default now(),
  primary key (is_emri_id, muhendis_id)
);

-- servis_formlari
create table servis_formlari (
  id                      uuid primary key default uuid_generate_v4(),
  is_emri_id              uuid not null unique references is_emirleri(id) on delete cascade,
  fiili_baslangic         timestamptz not null,
  fiili_bitis             timestamptz not null,
  teknik_rapor            text not null,
  is_tamamlandi           boolean not null default false,
  tamamlanmama_nedeni     text,
  musteri_imza_url        text,
  musteri_imza_atan_ad    text,
  musteri_imza_tarihi     timestamptz,
  son_kaydeden_id         uuid references profiles(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint bitis_baslangictan_sonra check (fiili_bitis >= fiili_baslangic)
);

-- servis_formu_imzalari (mühendis imzaları)
create table servis_formu_imzalari (
  servis_formu_id   uuid not null references servis_formlari(id) on delete cascade,
  muhendis_id       uuid not null references profiles(id) on delete cascade,
  imza_url          text not null,
  imza_tarihi       timestamptz not null default now(),
  primary key (servis_formu_id, muhendis_id)
);

-- servis_fotograflari
create table servis_fotograflari (
  id                uuid primary key default uuid_generate_v4(),
  servis_formu_id   uuid not null references servis_formlari(id) on delete cascade,
  storage_path      text not null,
  aciklama          text,
  sira              integer not null default 0,
  dosya_boyutu_kb   integer,
  yukleyen_id       uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now()
);

-- izin_bakiyeleri
create table izin_bakiyeleri (
  id              uuid primary key default uuid_generate_v4(),
  muhendis_id     uuid not null references profiles(id) on delete cascade,
  izin_turu       izin_turu not null,
  yil             integer not null,
  toplam_gun      numeric(5,1) not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (muhendis_id, izin_turu, yil)
);

-- izin_talepleri
create table izin_talepleri (
  id                uuid primary key default uuid_generate_v4(),
  muhendis_id       uuid not null references profiles(id) on delete cascade,
  izin_turu         izin_turu not null,
  baslangic_tarihi  date not null,
  bitis_tarihi      date not null,
  toplam_gun        integer not null,
  aciklama          text,
  durum             izin_durumu not null default 'beklemede',
  karar_veren_id    uuid references profiles(id) on delete set null,
  karar_tarihi      timestamptz,
  karar_notu        text,
  created_at        timestamptz not null default now(),
  constraint bitis_baslangictan_sonra check (bitis_tarihi >= baslangic_tarihi)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_is_emirleri_proje_id       on is_emirleri(proje_id);
create index idx_is_emirleri_olusturan_id   on is_emirleri(olusturan_id);
create index idx_is_emirleri_durum          on is_emirleri(durum);
create index idx_is_emirleri_planlanan_bas  on is_emirleri(planlanan_baslangic);
create index idx_is_emirleri_planlanan_bit  on is_emirleri(planlanan_bitis);
create index idx_is_emri_muh_muhendis_id    on is_emri_muhendisleri(muhendis_id);
create index idx_servis_formlari_is_emri    on servis_formlari(is_emri_id);
create index idx_servis_fotograflari_form   on servis_fotograflari(servis_formu_id);
create index idx_servis_fotograflari_sira   on servis_fotograflari(servis_formu_id, sira);
create index idx_izin_bakiyeleri_muhendis   on izin_bakiyeleri(muhendis_id);
create index idx_izin_talepleri_muhendis    on izin_talepleri(muhendis_id);
create index idx_izin_talepleri_durum       on izin_talepleri(durum);
create index idx_projeler_aktif             on projeler(aktif);
create index idx_profiles_rol              on profiles(rol);
create index idx_profiles_aktif            on profiles(aktif);

-- ============================================================
-- TRIGGER FUNCTIONS
-- ============================================================

-- Generic updated_at setter
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Auto-generate emir_no in format BEM-YYYY-NNNN
create or replace function uret_emir_no()
returns trigger
language plpgsql
as $$
declare
  yil       text;
  sira      bigint;
  yeni_no   text;
begin
  yil := to_char(now(), 'YYYY');
  select count(*) + 1
  into sira
  from is_emirleri
  where to_char(created_at, 'YYYY') = yil;

  yeni_no := 'BEM-' || yil || '-' || lpad(sira::text, 4, '0');
  new.emir_no := yeni_no;
  return new;
end;
$$;

-- Auto-update is_emri durum when servis_formu is saved
create or replace function guncelle_is_emri_durumu()
returns trigger
language plpgsql
as $$
begin
  if new.is_tamamlandi then
    update is_emirleri
    set durum = 'tamamlandi', updated_at = now()
    where id = new.is_emri_id;
  else
    update is_emirleri
    set durum = 'tamamlanmadi', updated_at = now()
    where id = new.is_emri_id;
  end if;
  return new;
end;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger trg_is_emirleri_updated_at
  before update on is_emirleri
  for each row execute function set_updated_at();

create trigger trg_servis_formlari_updated_at
  before update on servis_formlari
  for each row execute function set_updated_at();

create trigger trg_izin_bakiyeleri_updated_at
  before update on izin_bakiyeleri
  for each row execute function set_updated_at();

create trigger trg_uret_emir_no
  before insert on is_emirleri
  for each row
  when (new.emir_no is null)
  execute function uret_emir_no();

create trigger trg_guncelle_is_emri_durumu
  after insert or update on servis_formlari
  for each row execute function guncelle_is_emri_durumu();

-- ============================================================
-- VIEWS
-- ============================================================

-- v_muhendis_is_ozeti: one row per (engineer, work-order, service-form)
create or replace view v_muhendis_is_ozeti as
select
  iem.muhendis_id,
  p.ad_soyad,
  ie.id               as is_emri_id,
  ie.emir_no,
  ie.proje_id,
  pr.ad               as proje_ad,
  ie.is_tipi,
  ie.durum,
  ie.planlanan_baslangic,
  ie.planlanan_bitis,
  sf.fiili_baslangic,
  sf.fiili_bitis,
  case
    when sf.fiili_baslangic is not null and sf.fiili_bitis is not null
    then extract(epoch from (sf.fiili_bitis - sf.fiili_baslangic)) / 86400.0
    else null
  end                 as saha_gunu
from is_emri_muhendisleri iem
join profiles p           on p.id        = iem.muhendis_id
join is_emirleri ie       on ie.id       = iem.is_emri_id
join projeler pr          on pr.id       = ie.proje_id
left join servis_formlari sf on sf.is_emri_id = ie.id;

-- v_proje_is_ozeti: one row per (project, work-order, service-form)
create or replace view v_proje_is_ozeti as
select
  ie.proje_id,
  pr.ad               as proje_ad,
  pr.musteri_firma,
  ie.id               as is_emri_id,
  ie.emir_no,
  ie.is_tipi,
  ie.durum,
  ie.planlanan_baslangic,
  ie.planlanan_bitis,
  sf.fiili_baslangic,
  sf.fiili_bitis,
  case
    when sf.fiili_baslangic is not null and sf.fiili_bitis is not null
    then extract(epoch from (sf.fiili_bitis - sf.fiili_baslangic)) / 86400.0
    else null
  end                 as saha_gunu,
  (
    select count(*)
    from is_emri_muhendisleri iem2
    where iem2.is_emri_id = ie.id
  )                   as muhendis_sayisi
from is_emirleri ie
join projeler pr          on pr.id       = ie.proje_id
left join servis_formlari sf on sf.is_emri_id = ie.id;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles             enable row level security;
alter table projeler             enable row level security;
alter table is_emirleri          enable row level security;
alter table is_emri_muhendisleri enable row level security;
alter table servis_formlari      enable row level security;
alter table servis_formu_imzalari enable row level security;
alter table servis_fotograflari  enable row level security;
alter table izin_bakiyeleri      enable row level security;
alter table izin_talepleri       enable row level security;

-- ---- profiles ----
-- Users can read their own profile; yonetici can read all
create policy "profiles_select"
  on profiles for select
  using (
    auth.uid() = id
    or auth_rol() = 'yonetici'
  );

-- Only yonetici can insert/update/delete profiles
create policy "profiles_insert"
  on profiles for insert
  with check (auth_rol() = 'yonetici');

create policy "profiles_update"
  on profiles for update
  using (auth_rol() = 'yonetici');

create policy "profiles_delete"
  on profiles for delete
  using (auth_rol() = 'yonetici');

-- ---- projeler ----
-- All authenticated users can read active projects
create policy "projeler_select"
  on projeler for select
  using (auth.uid() is not null);

-- Only yonetici can manage projects
create policy "projeler_insert"
  on projeler for insert
  with check (auth_rol() = 'yonetici');

create policy "projeler_update"
  on projeler for update
  using (auth_rol() = 'yonetici');

create policy "projeler_delete"
  on projeler for delete
  using (auth_rol() = 'yonetici');

-- ---- is_emirleri ----
-- Yonetici sees all; saha_muhendisi sees only their assigned ones
create policy "is_emirleri_select"
  on is_emirleri for select
  using (
    auth_rol() = 'yonetici'
    or is_emri_atanan(id)
  );

-- Only yonetici can create/update/delete work orders
create policy "is_emirleri_insert"
  on is_emirleri for insert
  with check (auth_rol() = 'yonetici');

create policy "is_emirleri_update"
  on is_emirleri for update
  using (auth_rol() = 'yonetici');

create policy "is_emirleri_delete"
  on is_emirleri for delete
  using (auth_rol() = 'yonetici');

-- ---- is_emri_muhendisleri ----
create policy "is_emri_muh_select"
  on is_emri_muhendisleri for select
  using (
    auth_rol() = 'yonetici'
    or muhendis_id = auth.uid()
    or is_emri_atanan(is_emri_id)
  );

create policy "is_emri_muh_insert"
  on is_emri_muhendisleri for insert
  with check (auth_rol() = 'yonetici');

create policy "is_emri_muh_delete"
  on is_emri_muhendisleri for delete
  using (auth_rol() = 'yonetici');

-- ---- servis_formlari ----
-- Yonetici sees all; atanan mühendisler see their own
create policy "servis_formlari_select"
  on servis_formlari for select
  using (
    auth_rol() = 'yonetici'
    or is_emri_atanan(is_emri_id)
  );

-- Atanan mühendisler can create and update their service forms
create policy "servis_formlari_insert"
  on servis_formlari for insert
  with check (
    auth_rol() = 'yonetici'
    or is_emri_atanan(is_emri_id)
  );

create policy "servis_formlari_update"
  on servis_formlari for update
  using (
    auth_rol() = 'yonetici'
    or is_emri_atanan(is_emri_id)
  );

create policy "servis_formlari_delete"
  on servis_formlari for delete
  using (auth_rol() = 'yonetici');

-- ---- servis_formu_imzalari ----
create policy "imzalar_select"
  on servis_formu_imzalari for select
  using (
    auth_rol() = 'yonetici'
    or muhendis_id = auth.uid()
    or exists (
      select 1 from servis_formlari sf
      where sf.id = servis_formu_id
        and is_emri_atanan(sf.is_emri_id)
    )
  );

create policy "imzalar_insert"
  on servis_formu_imzalari for insert
  with check (
    muhendis_id = auth.uid()
    or auth_rol() = 'yonetici'
  );

create policy "imzalar_delete"
  on servis_formu_imzalari for delete
  using (
    muhendis_id = auth.uid()
    or auth_rol() = 'yonetici'
  );

-- ---- servis_fotograflari ----
create policy "fotograflar_select"
  on servis_fotograflari for select
  using (
    auth_rol() = 'yonetici'
    or exists (
      select 1 from servis_formlari sf
      where sf.id = servis_formu_id
        and is_emri_atanan(sf.is_emri_id)
    )
  );

create policy "fotograflar_insert"
  on servis_fotograflari for insert
  with check (
    auth_rol() = 'yonetici'
    or exists (
      select 1 from servis_formlari sf
      where sf.id = servis_formu_id
        and is_emri_atanan(sf.is_emri_id)
    )
  );

create policy "fotograflar_update"
  on servis_fotograflari for update
  using (
    auth_rol() = 'yonetici'
    or yukleyen_id = auth.uid()
  );

create policy "fotograflar_delete"
  on servis_fotograflari for delete
  using (
    auth_rol() = 'yonetici'
    or yukleyen_id = auth.uid()
  );

-- ---- izin_bakiyeleri ----
-- Mühendisler see their own; yonetici sees all
create policy "izin_bakiye_select"
  on izin_bakiyeleri for select
  using (
    auth_rol() = 'yonetici'
    or muhendis_id = auth.uid()
  );

create policy "izin_bakiye_insert"
  on izin_bakiyeleri for insert
  with check (auth_rol() = 'yonetici');

create policy "izin_bakiye_update"
  on izin_bakiyeleri for update
  using (auth_rol() = 'yonetici');

create policy "izin_bakiye_delete"
  on izin_bakiyeleri for delete
  using (auth_rol() = 'yonetici');

-- ---- izin_talepleri ----
-- Mühendisler see their own; yonetici sees all
create policy "izin_talep_select"
  on izin_talepleri for select
  using (
    auth_rol() = 'yonetici'
    or muhendis_id = auth.uid()
  );

-- Mühendisler can create their own leave requests
create policy "izin_talep_insert"
  on izin_talepleri for insert
  with check (muhendis_id = auth.uid());

-- Mühendisler can cancel (update durum to 'iptal') their own pending requests;
-- yonetici can update anything
create policy "izin_talep_update"
  on izin_talepleri for update
  using (
    auth_rol() = 'yonetici'
    or (muhendis_id = auth.uid() and durum = 'beklemede')
  );

create policy "izin_talep_delete"
  on izin_talepleri for delete
  using (auth_rol() = 'yonetici');

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (id, ad_soyad, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'ad_soyad', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'rol')::rol_turu, 'saha_muhendisi')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
