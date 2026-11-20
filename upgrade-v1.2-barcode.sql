-- Tio Martani Kios V1.2: dukungan barcode produk.
-- Jalankan satu kali di Supabase Dashboard > SQL Editor sebelum menggunakan V1.2.
-- Perubahan ini hanya menambah kolom dan indeks; data produk lama tetap dipertahankan.

alter table public.products
  add column if not exists barcode text;

-- Barcode tidak wajib, tetapi jika diisi harus unik untuk setiap pemilik toko.
create unique index if not exists products_owner_barcode_unique_idx
  on public.products(owner_id, barcode)
  where barcode is not null and btrim(barcode) <> '';
