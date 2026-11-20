# Panduan Mengaktifkan Foto AI — Tio Martani Kios V1.4.5

Panduan ini dibuat untuk pengguna yang tidak perlu memahami pemrograman. Ikuti langkahnya satu per satu. **Jangan mengirim API Key atau kata sandi ke siapa pun, termasuk melalui chat.**

## Yang akan diaktifkan

Setelah selesai, pengguna dapat:
1. Membuka menu Foto di Beranda atau Produk.
2. Memotret barang menggunakan kamera belakang HP.
3. Atau memilih foto barang dari galeri.
4. Memeriksa hasil pengenalan Gemini.
5. Melihat satu produk paling cocok dan daftar produk sejenis, lalu membuka detail produk sebelum mengambil tindakan berikutnya.

Harga tetap berasal dari database Supabase, bukan dari perkiraan AI.

---

## Langkah 1 — Buat Gemini API Key

1. Buka halaman Google AI Studio: https://aistudio.google.com/app/apikey
2. Login dengan akun Google.
3. Buat API Key baru atau pilih key yang sudah tersedia.
4. Salin API Key dan simpan sementara di tempat aman.
5. Jangan tempel API Key ke file `index.html`, jangan unggah ke GitHub, dan jangan kirim melalui chat.

Model yang digunakan aplikasi adalah `gemini-3.1-flash-lite`. Model ini tercantum pada Gemini API Free Tier, tetapi tetap memiliki batas pemakaian/kuota. Ketersediaan dan batasnya dapat berubah.

Referensi resmi:
- Membuat API Key: https://aistudio.google.com/app/apikey
- Harga dan Free Tier: https://ai.google.dev/gemini-api/docs/pricing
- Batas penggunaan: https://ai.google.dev/gemini-api/docs/rate-limits

## Langkah 2 — Simpan API Key di Supabase

1. Buka https://supabase.com/dashboard
2. Pilih project **Tio Martani Kios**.
3. Di menu sebelah kiri, buka **Edge Functions**.
4. Buka bagian **Secrets**.
5. Tambahkan secret baru dengan isian berikut:

   **Name**
   `GEMINI_API_KEY`

   **Value**
   Tempel API Key dari Google AI Studio.

6. Klik **Save**.

Penting:
- Nama secret harus tepat `GEMINI_API_KEY` (huruf kapital).
- Jangan menambahkan tanda kutip di awal/akhir key.
- Tambahkan atau pertahankan secret `GEMINI_VISION_MODEL` dengan nilai `gemini-3.1-flash-lite`. Jika secret tidak tersedia, fungsi menggunakan model default `gemini-3.1-flash-lite`.
- Jangan menghapus secret Supabase lain yang digunakan aplikasi.

## Langkah 3 — Pasang / perbarui fungsi AI di Supabase

1. Masih di Supabase Dashboard, buka **Edge Functions**.
2. Cari fungsi bernama `recognize-product`.
3. Jika fungsi sudah ada, buka fungsi tersebut dan pilih **Edit** atau **Deploy via Editor** sesuai tampilan Dashboard.
4. Jika belum ada, pilih **Deploy a new function** → **Via Editor**, lalu beri nama persis:

   `recognize-product`

5. Di komputer, buka folder hasil ekstrak ZIP V1.4.5.
6. Buka file:

   `supabase/functions/recognize-product/index.ts`

7. Pilih seluruh isi file, lalu salin.
8. Kembali ke editor kode fungsi di Supabase. Hapus kode lama, lalu tempel seluruh kode yang baru disalin.
9. Pastikan pengaturan **Verify JWT** atau **Enforce JWT Verification** dalam keadaan aktif/ON.
10. Klik **Deploy function** dan tunggu sampai proses deploy selesai.

Jangan membuat nama fungsi lain seperti `recognize_product`, `recognize-photo`, atau `gemini`. Nama harus persis `recognize-product` karena aplikasi memanggil nama tersebut.

## Langkah 4 — Tes koneksi dari aplikasi

1. Buka aplikasi Tio Martani Kios V1.4.5.
2. Login menggunakan akun pemilik seperti biasa.
3. Buka Beranda atau Produk.
4. Tekan tombol **Foto**.
5. Tekan **Periksa Koneksi AI**.
6. Tunggu beberapa saat.

Jika berhasil, akan muncul pesan:

`Koneksi AI berhasil. Model aktif: gemini-3.1-flash-lite.`

Jika belum berhasil, baca bagian pemecahan masalah di bawah.

## Langkah 5 — Coba memotret barang

1. Di jendela Foto AI, tekan **Ambil Foto dengan Kamera**.
2. Jika browser meminta izin kamera, pilih **Izinkan / Allow**.
3. Tunggu sampai pratinjau kamera muncul di dalam aplikasi.
4. Arahkan kamera ke satu barang dan pastikan tulisan/kemasan terlihat jelas.
5. Tekan **Jepret Foto**.
6. Aplikasi menampilkan pratinjau hasil foto. Jika sudah jelas, tekan **Analisis Foto dengan AI**.
7. Setelah hasil muncul, periksa nama barang dan daftar produk yang cocok.
8. Tekan produk yang benar untuk melihat detail harga.

Jika ingin menggunakan gambar yang sudah ada, tekan **Pilih Foto dari Galeri**.

---

## Jika belum berhasil, lihat pesan yang muncul

| Pesan di aplikasi | Artinya | Yang perlu dilakukan |
|---|---|---|
| Fungsi AI belum terpasang di Supabase | Fungsi `recognize-product` belum ada atau belum berhasil di-deploy | Ulangi Langkah 3 |
| Kunci Gemini belum dipasang | Secret belum tersimpan atau namanya salah | Ulangi Langkah 2 dan pastikan namanya `GEMINI_API_KEY` |
| Google menolak API Key Gemini | Key salah, tidak aktif, atau akses Gemini API tidak tersedia | Buat/periksa key di Google AI Studio, lalu perbarui nilai secret |
| Kuota atau batas permintaan Gemini tercapai | Batas penggunaan sedang tercapai | Tunggu kuota pulih, lalu coba lagi |
| Sesi login tidak valid | Sesi login aplikasi sudah berakhir | Keluar dari aplikasi, kemudian login kembali |
| Foto tidak dapat dibuka oleh browser | Format foto tidak didukung browser atau file rusak | Ambil foto ulang atau pilih JPG/PNG |
| Kamera tidak terbuka | Browser belum mendapat izin atau halaman tidak menggunakan HTTPS | Izinkan kamera di pengaturan browser; jika tetap gagal, gunakan galeri |

## Hal yang perlu diperhatikan tentang kamera

- V1.4.5 menggunakan kamera langsung di dalam halaman aplikasi, bukan jendela pemilih file.
- Fitur ini bekerja pada HP yang memiliki kamera dan komputer yang memiliki webcam.
- Browser mungkin meminta izin kamera pada penggunaan pertama. Jika izin pernah ditolak, ubah izin Kamera menjadi Izinkan melalui pengaturan situs di sebelah alamat web, lalu muat ulang aplikasi.
- Kamera langsung memerlukan alamat HTTPS (atau localhost saat pengembangan). Jika `index.html` dibuka langsung dari folder komputer, kamera dapat diblokir.
- Jika kamera sedang digunakan Zoom, Meet, aplikasi Kamera, atau aplikasi lain, tutup aplikasi tersebut lalu coba lagi.
- Tombol galeri tetap tersedia sebagai alternatif.

## Keamanan

- Jangan pernah menempel Gemini API Key di file HTML.
- Jangan mengirim Gemini API Key, Supabase Secret Key, service-role key, email, atau kata sandi melalui chat.
- Jangan mematikan RLS.
- Jangan mematikan Verify JWT untuk fungsi ini.
- Foto yang dikirim ke Gemini sebaiknya hanya foto barang dagangan, bukan wajah, dokumen, atau data pribadi.

## Jika masih gagal dan perlu bantuan

Kirim screenshot **pesan error yang muncul di aplikasi** dan, jika diperlukan, screenshot halaman Supabase yang menunjukkan:
- nama fungsi `recognize-product` dan status deploy; serta
- nama secret `GEMINI_API_KEY` pada daftar Secrets.

Sebelum mengirim screenshot, pastikan nilai API Key, tombol untuk menampilkan key, email akun, dan informasi rahasia lainnya tidak terlihat.
