# Tio Martani Kios — V1.0 Development

Aplikasi web internal, mobile-first, untuk pemilik toko. Versi ini masih untuk pengembangan dan pengujian lokal; belum dipublikasikan.

## Isi folder
- `index.html` — aplikasi yang terhubung ke proyek Supabase toko.
- `supabase.sql` — struktur database, RLS, trigger riwayat harga, dan aturan penyimpanan foto.
- `grant-access.sql` — pemberian hak akses tabel untuk pengguna yang sudah login (jalankan hanya bila dibutuhkan).

## Fitur V1.0 Development
- Login pemilik toko.
- Dashboard ringkasan jumlah produk, kategori, dan harga yang perlu dicek.
- Pencarian harga cepat dari dashboard.
- Tambah, edit, dan hapus produk.
- Kategori dan satuan yang bisa diketik sendiri.
- Harga jual dan harga modal.
- Foto produk dengan pratinjau (JPG/PNG/WEBP, maksimal 5 MB).
- Pencarian berdasarkan nama, kategori, satuan, dan catatan.
- Filter kategori dan pengurutan daftar produk.
- Riwayat perubahan harga jual.
- Ekspor CSV dan JSON (metadata produk; file foto tetap tersimpan di Supabase Storage).
- Tampilan responsif untuk HP dan laptop.

## Cara membuka untuk pengujian lokal
1. Ekstrak ZIP.
2. Buka folder `tio-martani-kios`.
3. Klik dua kali `index.html`.
4. Login menggunakan akun pemilik yang sudah dibuat di Supabase.

## Catatan database
- Database yang sudah dibuat sebelumnya tidak perlu dibuat ulang.
- `supabase.sql` adalah skrip setup awal, bukan untuk dijalankan ulang sembarangan pada database berisi data.
- `grant-access.sql` hanya perlu dijalankan bila muncul error izin akses tabel dan sesuai arahan.

## Catatan keamanan sebelum rilis
- Aplikasi hanya memakai Supabase Project URL dan Publishable Key. Jangan pernah memasukkan Secret Key atau service-role key ke HTML/JavaScript browser.
- Pastikan RLS aktif pada tabel `products` dan `price_history` serta Storage bucket `product-photos` bersifat private.
- Pastikan pendaftaran akun publik dimatikan di pengaturan Supabase Authentication; akun pemilik dibuat manual.
- Secret Key yang pernah terlihat di screenshot sebaiknya dirotasi sebelum aplikasi dipublikasikan. Jangan kirim Secret Key melalui chat.
- Uji akses dengan akun pemilik dan pastikan akun lain tidak dapat membaca data pemilik.

## Belum termasuk
- Import Excel.
- Pemindaian barcode.
- Cetak label harga.
- Manajemen stok dan transaksi kasir.
