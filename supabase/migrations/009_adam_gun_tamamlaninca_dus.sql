-- Adam/gün artık iş emri OLUŞTURULDUĞUNDA değil, TAMAMLANDIĞINDA
-- (gerçek fiili tarihlere göre) düşülüyor. Bu yüzden:
-- 1) Oluşturma anındaki bütçe-aşım engelleyici trigger kaldırılıyor
--    (uygulama artık deduksiyonu tamamlanma anında, gerçek süreye göre
--    /api/is-emri/[id]/durum route'unda hesaplayıp yazıyor).
-- 2) Bütçenin eksiye düşmesi artık kasıtlı olarak serbest — engellenmiyor.

drop trigger if exists trg_kontrol_adam_gun_butcesi on is_emirleri;
drop function if exists kontrol_adam_gun_butcesi();
