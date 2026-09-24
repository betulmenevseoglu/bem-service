-- Proje kategorisine "Spot Servis" seçeneği ekleniyor.
-- (enum'a değer eklemek geri alınamaz ama idempotent — tekrar çalıştırmak güvenli.)
alter type proje_tipi add value if not exists 'spot_servis';
