-- Jalankan hanya jika aplikasi menampilkan error permission denied pada tabel.
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.products to authenticated;
grant select on table public.price_history to authenticated;
