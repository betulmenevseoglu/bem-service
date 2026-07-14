-- Baş mühendis (usta) desteği
-- is_emri_muhendisleri tablosuna usta_mi kolonu ekleniyor
alter table is_emri_muhendisleri
  add column if not exists usta_mi boolean not null default false;
