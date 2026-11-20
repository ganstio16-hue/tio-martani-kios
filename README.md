# Tio Martani Kios — V1.4.5

Aplikasi web internal mobile-first untuk mengelola katalog produk dan harga Tio Martani Kios.

## Perbaikan pada V1.4.5

- Hasil pencarian foto hanya menampilkan produk yang cocok dari katalog toko; tidak menampilkan uraian atau tebakan AI.
- Satu produk dengan kecocokan tertinggi ditampilkan pada bagian **Paling cocok**; produk lain yang sejenis ditampilkan di bawahnya.
- Pencocokan memprioritaskan merek dan varian yang benar-benar terbaca, kemudian jenis barang.
- Jika foto ambigu, Gemini dapat mengirim beberapa kandidat jenis barang yang diurutkan dari paling mungkin, misalnya gula pasir atau beras.
- Mengetuk hasil membuka **Detail Produk** terlebih dahulu. Produk tidak otomatis masuk ke keranjang.
- Harga, barcode, kategori, dan catatan detail tetap dibaca dari katalog Supabase.
- Edge Function mencatat waktu respons Gemini di Logs dan membatasi waktu tunggu hingga 35 detik.

## Perbaikan yang tetap tersedia dari V1.4.3

- Pencarian foto sekarang memiliki pilihan terpisah: **Ambil Foto dengan Kamera** dan **Pilih Foto dari Galeri**.
- Tombol kamera membuka pratinjau kamera langsung melalui izin kamera browser (`getUserMedia`), bukan membuka folder/file picker.
- Kamera belakang diutamakan pada HP; webcam digunakan pada komputer jika tersedia.
- Pengguna dapat menekan tombol **Jepret Foto**, meninjau hasilnya, lalu mengirimnya untuk analisis AI.
- Foto ditampilkan sebagai pratinjau, diperkecil di browser, lalu dikirim ke Supabase Edge Function.
- Ditambahkan tombol **Periksa Koneksi AI** untuk mengecek apakah Edge Function, API Key, dan model Gemini sudah tersambung.
- Pesan kesalahan dibuat lebih jelas untuk kasus fungsi belum di-deploy, sesi login berakhir, API Key salah, kuota habis, dan gangguan layanan.
- Model Gemini dibaca dari secret `GEMINI_VISION_MODEL`; gunakan nilai `gemini-3.1-flash-lite`. API Key tetap disimpan di secret `GEMINI_API_KEY`.
- Pengaturan batas token dan thinking model diperbaiki agar proses pengenalan foto lebih stabil.
- Harga produk tetap hanya diambil dari database Supabase. AI tidak membuat atau menebak harga dan tidak otomatis menyimpan produk.

## Fitur aplikasi yang dipertahankan

- Login pemilik.
- Pencarian produk berdasarkan nama dan barcode.
- Pemindaian barcode.
- Pencarian produk dengan foto AI.
- Detail harga dan riwayat perubahan harga.
- Pengelolaan produk dan foto produk.
- Import produk Excel/CSV.
- Ekspor data CSV/JSON.

## Penting: AI harus diaktifkan di Supabase

Kode AI berada di:

`supabase/functions/recognize-product/index.ts`

Agar fitur foto benar-benar bekerja, lakukan dua hal berikut:

1. Simpan secret `GEMINI_API_KEY` di Supabase → Edge Functions → Secrets.
2. Deploy kode `recognize-product` ke Supabase Edge Functions.

Ikuti panduan pemula di `SETUP-AI.md`. Jangan memasukkan Gemini API Key atau Supabase Secret Key ke `index.html` atau mengirimkannya melalui chat.

## Cara menguji

1. Buka aplikasi dan login.
2. Tekan tombol **Foto** di Beranda atau halaman Produk.
3. Tekan **Periksa Koneksi AI** terlebih dahulu.
4. Jika tes berhasil, tekan **Ambil Foto dengan Kamera** untuk membuka pratinjau kamera, atau **Pilih Foto dari Galeri**.
5. Jika menggunakan kamera, tekan **Jepret Foto**. Periksa pratinjau foto, lalu lanjutkan.
6. Periksa pratinjau foto, lalu tekan **Analisis Foto dengan AI**.
7. Periksa hasil pengenalan dan pilih produk yang cocok untuk melihat harga.

## Catatan kamera

- Tombol **Ambil Foto dengan Kamera** membuka kamera langsung di dalam aplikasi menggunakan izin kamera browser.
- Pada HP, aplikasi mengutamakan kamera belakang. Pada komputer, aplikasi menggunakan webcam jika tersedia.
- Kamera browser memerlukan halaman HTTPS (atau localhost saat pengembangan). Jika aplikasi dibuka sebagai file lokal, kamera tidak akan tersedia.
- Jika izin kamera ditolak, klik ikon pengaturan/gembok di sebelah alamat situs, ubah izin Kamera menjadi Izinkan, lalu muat ulang aplikasi.
- Jika kamera sedang dipakai aplikasi lain, tutup aplikasi tersebut terlebih dahulu. Pilihan galeri tetap tersedia sebagai alternatif.

## Privasi dan biaya

- Foto dikirim dari browser ke Supabase Edge Function, lalu ke Gemini untuk pengenalan.
- Gemini API Free Tier dapat digunakan sesuai ketersediaan dan batas penggunaan yang berlaku. Kuota dapat berubah dan tidak tak terbatas.
- Konten pada Free Tier dapat digunakan Google untuk meningkatkan produk. Jangan mengirim foto wajah, dokumen, struk berisi data pribadi, atau informasi sensitif.
- API Key hanya disimpan sebagai Supabase Secret. Jangan pernah menaruhnya di HTML/JavaScript frontend.
- Jangan mengaktifkan billing jika ingin tetap menggunakan Free Tier.

## Database dan keamanan

- Versi ini tidak memerlukan perubahan tabel database.
- Edge Function memeriksa sesi login pengguna.
- `verify_jwt = true` harus tetap aktif.
- RLS dan bucket foto produk tetap mengikuti pengaturan database sebelumnya.
