-- ============================================================
-- Devreye alma projeleri için malzeme listesi + sevkiyat (irsaliye) takibi
-- ============================================================

-- proje_malzemeleri: projeye tanımlanan malzeme kalemleri (planlanan miktar)
create table if not exists proje_malzemeleri (
  id                uuid primary key default uuid_generate_v4(),
  proje_id          uuid not null references projeler(id) on delete cascade,
  malzeme_adi       text not null,
  birim             text not null default 'Adet',
  planlanan_miktar  numeric(10,2) not null default 0,
  created_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now()
);

-- proje_sevkiyatlari: irsaliye başlıkları (irsaliye no elle girilir)
create table if not exists proje_sevkiyatlari (
  id            uuid primary key default uuid_generate_v4(),
  proje_id      uuid not null references projeler(id) on delete cascade,
  irsaliye_no   text not null,
  sevk_tarihi   date not null default current_date,
  notlar        text,
  created_by    uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- proje_sevkiyat_satirlari: irsaliye satırları (hangi malzemeden ne kadar)
create table if not exists proje_sevkiyat_satirlari (
  id            uuid primary key default uuid_generate_v4(),
  sevkiyat_id   uuid not null references proje_sevkiyatlari(id) on delete cascade,
  malzeme_id    uuid not null references proje_malzemeleri(id) on delete restrict,
  miktar        numeric(10,2) not null
);

create index if not exists idx_proje_malzemeleri_proje       on proje_malzemeleri(proje_id);
create index if not exists idx_proje_sevkiyatlari_proje      on proje_sevkiyatlari(proje_id);
create index if not exists idx_sevkiyat_satirlari_sevkiyat   on proje_sevkiyat_satirlari(sevkiyat_id);
create index if not exists idx_sevkiyat_satirlari_malzeme    on proje_sevkiyat_satirlari(malzeme_id);

-- RLS
alter table proje_malzemeleri       enable row level security;
alter table proje_sevkiyatlari      enable row level security;
alter table proje_sevkiyat_satirlari enable row level security;

create policy "proje_malzemeleri_select" on proje_malzemeleri for select to authenticated using (true);
create policy "proje_malzemeleri_insert" on proje_malzemeleri for insert to authenticated with check (auth_rol() = 'yonetici');
create policy "proje_malzemeleri_update" on proje_malzemeleri for update to authenticated using (auth_rol() = 'yonetici');
create policy "proje_malzemeleri_delete" on proje_malzemeleri for delete to authenticated using (auth_rol() = 'yonetici');

create policy "proje_sevkiyatlari_select" on proje_sevkiyatlari for select to authenticated using (true);
create policy "proje_sevkiyatlari_insert" on proje_sevkiyatlari for insert to authenticated with check (auth_rol() = 'yonetici');
create policy "proje_sevkiyatlari_update" on proje_sevkiyatlari for update to authenticated using (auth_rol() = 'yonetici');
create policy "proje_sevkiyatlari_delete" on proje_sevkiyatlari for delete to authenticated using (auth_rol() = 'yonetici');

create policy "sevkiyat_satirlari_select" on proje_sevkiyat_satirlari for select to authenticated using (true);
create policy "sevkiyat_satirlari_insert" on proje_sevkiyat_satirlari for insert to authenticated with check (auth_rol() = 'yonetici');
create policy "sevkiyat_satirlari_update" on proje_sevkiyat_satirlari for update to authenticated using (auth_rol() = 'yonetici');
create policy "sevkiyat_satirlari_delete" on proje_sevkiyat_satirlari for delete to authenticated using (auth_rol() = 'yonetici');
