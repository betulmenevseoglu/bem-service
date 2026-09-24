-- ============================================================
-- Proje kategorisi (Bakım / Devreye Alma) + Adam/Gün bütçe takibi
-- ============================================================

-- Proje kategorisi enum
create type proje_tipi as enum ('bakim', 'devreye_alma');

-- projeler: kategori (nullable — mevcut projeler kategorisiz kalır, elle atanır)
alter table projeler
  add column if not exists proje_tipi proje_tipi;

-- projeler: adam/gün bütçesi (nullable — girilmezse takip edilmez, sınırsız kabul edilir)
alter table projeler
  add column if not exists adam_gun_butcesi numeric(6,1);

-- is_emirleri: oluşturulduğu anda hesaplanıp donan adam/gün düşümü
-- (planlanan gün sayısı × atanan mühendis sayısı — iş emri oluşturulurken hesaplanır)
alter table is_emirleri
  add column if not exists adam_gun_dusumu numeric(6,1) not null default 0;

-- Bütçe aşımını engelleyen trigger:
-- Proje için bütçe tanımlıysa (adam_gun_butcesi not null), yeni iş emrinin düşümü
-- + iptal edilmemiş diğer iş emirlerinin toplam düşümü bütçeyi aşamaz.
create or replace function kontrol_adam_gun_butcesi()
returns trigger
language plpgsql
as $$
declare
  v_butce    numeric(6,1);
  v_harcanan numeric(6,1);
begin
  if new.adam_gun_dusumu is null or new.adam_gun_dusumu <= 0 then
    return new;
  end if;

  select adam_gun_butcesi into v_butce from projeler where id = new.proje_id;
  if v_butce is null then
    return new; -- bütçe tanımlanmamış proje için sınır yok
  end if;

  select coalesce(sum(adam_gun_dusumu), 0) into v_harcanan
  from is_emirleri
  where proje_id = new.proje_id
    and durum <> 'iptal_edildi'
    and id is distinct from new.id;

  if v_harcanan + new.adam_gun_dusumu > v_butce then
    raise exception 'Adam/gün bütçesi yetersiz: kalan % adam/gün, istenen % adam/gün',
      (v_butce - v_harcanan), new.adam_gun_dusumu;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_kontrol_adam_gun_butcesi on is_emirleri;
create trigger trg_kontrol_adam_gun_butcesi
  before insert on is_emirleri
  for each row execute function kontrol_adam_gun_butcesi();
