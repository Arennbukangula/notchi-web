# Plan Klaim Reward v2 — notchi-web

Repo: `Risunity/notchi-web`. Simpan di repo sebagai `plan-klaim-reward.md`.
Versi ini menggantikan plan sebelumnya (yang masih mengasumsikan Supabase dan counter unduhan real-time).

## 1. Kondisi sekarang dan keputusan

**Kondisi repo (dari README):**
- Astro (output statis) + TypeScript strict + Tailwind v4, deploy di Vercel. Tidak ada database.
- Jumlah unduhan = `download_count` aset GitHub Releases, diambil saat build. Disegarkan lewat rebuild harian (03:00 UTC) dan saat rilis baru. **Tidak real-time, tidak unik per IP.**
- Repo publik. Ada folder `api/` (cek isinya dulu sebelum menambah file).
- i18n: EN tanpa prefix, ID di bawah `/id`.
- Repo aplikasi sudah pindah ke `Risunity/Notchi`, tapi `GITHUB_OWNER` default masih `risuunava`.

**Keputusan:**
- Backend: **Vercel Functions di `api/`**. Astro tetap statis, tidak perlu mode SSR.
- Database: **Upstash Redis** (tier gratis).
- Penyimpanan gambar: **Vercel Blob** (bukan di repo, karena repo publik).
- Tanda tangan entitlement: **Ed25519**.
- Anti-bot: **Cloudflare Turnstile**.
- Klaim dibuka lewat **saklar manual**, bukan otomatis dari counter unduhan.

## 2. Alur
1. Kamu membuka klaim (`claims:open = 1`) setelah aplikasi versi baru dirilis.
2. User klik **Klaim** di web, Turnstile lolos, server mengundi background (gacha) lalu membuat kode.
3. Web menampilkan reveal dan kode (salin / unduh .txt).
4. User memasukkan kode di Settings Notchi PC. Aplikasi memanggil `/api/redeem`.
5. Server membalas entitlement bertanda tangan. Aplikasi memverifikasinya secara lokal.
6. Aplikasi mengambil dua gambar miliknya (compact dan expand) lewat `/api/assets`.

## 3. Dependensi dan variabel lingkungan
Dependensi baru: `@upstash/redis`, `@vercel/blob`.

| Variabel | Fungsi |
|---|---|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Koneksi Redis |
| `BLOB_READ_WRITE_TOKEN` | Upload gambar lewat skrip |
| `ENTITLEMENT_PRIVATE_KEY` | Kunci privat Ed25519 (PEM, base64) |
| `IP_HASH_SALT` | Garam untuk hash IP |
| `TURNSTILE_SECRET_KEY` | Verifikasi Turnstile di server |
| `PUBLIC_TURNSTILE_SITE_KEY` | Widget Turnstile di halaman |
| `GITHUB_OWNER` | **Ubah ke `Risunity`** (dan `GITHUB_REPO=Notchi`) |

Tambahkan semua nama (tanpa nilai) ke `.env.example`. Jangan commit nilai asli.
Token GitHub harus mencakup `Risunity/Notchi`, bukan hanya `risuunava/Notchi`.

Membuat kunci:
```
openssl genpkey -algorithm ed25519 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem
```
`private.pem` masuk ke env Vercel, `public.pem` ditanam di aplikasi. Hapus `private.pem` dari komputer setelah disimpan aman.

## 4. Struktur file yang ditambah
```
api/claim.ts                 POST  buat kode + gacha
api/redeem.ts                POST  tukar kode jadi entitlement
api/release-device.ts        POST  lepas satu perangkat
api/assets.ts                GET   alamat gambar (butuh entitlement)
src/lib/redis.ts             Klien Upstash
src/lib/rewards-catalog.ts   Daftar 7 background: id, nama, rarity, weight, quota
src/lib/gacha.ts             Undian berbobot + kuota
src/lib/entitlement.ts       Tanda tangan dan verifikasi Ed25519
src/lib/code.ts              Pembuat dan validator kode
src/lib/security.ts          Hash IP, rate limit, verifikasi Turnstile
src/pages/claim.astro        Halaman klaim (EN)
src/pages/id/claim.astro     Halaman klaim (ID)
src/components/ClaimCard.astro
src/i18n/                    Tambah kunci teks EN dan ID
scripts/upload-rewards.mjs   Upload gambar ke Blob + simpan URL ke Redis
rewards-src/                 Gambar sumber (WAJIB di .gitignore)
tests/                       Tes gacha, entitlement, kode, rate limit
```

## 5. Model data Redis
| Key | Tipe | Isi |
|---|---|---|
| `claims:open` | string | `"1"` terbuka, `"0"` tertutup. Kamu ubah lewat Data Browser di dashboard Upstash |
| `claim:counter` | string (angka) | `INCR` untuk nomor klaim |
| `claim:{code}` | hash | `claim_number`, `bg_id`, `badge_id`, `rarity`, `created_at`, `ip_hash` |
| `claim:{code}:devices` | set | `device_hash` yang aktif (maks 3) |
| `bg:{id}:count` | string (angka) | Jumlah yang sudah mendapat item ini (untuk kuota) |
| `bg:{id}` | hash | `url_expand`, `url_compact` (alamat Blob, diisi skrip upload) |
| `rl:claim:{ip_hash}` | string + TTL 24 jam | Penghitung klaim per IP |
| `rl:redeem:{ip_hash}` | string + TTL 1 jam | Penghitung redeem per IP |

Hanya hash IP yang disimpan, bukan IP mentah.

## 6. Endpoint
**`POST /api/claim`** — body `{ turnstileToken }`
1. Tolak jika `claims:open` bukan `"1"`.
2. Verifikasi Turnstile.
3. Rate limit per IP (usul: maks 3 klaim per hari).
4. Undi `bg_id` (bagian 7). Ambil `claim_number` dengan `INCR`. Buat kode dan simpan dengan cek bentrok (`HSETNX` atau ulang jika kode sudah ada).
5. Balas `{ code, claimNumber, bg: { id, name, rarity, previewUrl } }`.
6. Jika langkah simpan gagal, kembalikan hitungan kuota (`DECR`).

**`POST /api/redeem`** — body `{ code, deviceHash }`
1. Validasi format kode dan hash. Rate limit per IP (usul: 30 per jam) untuk mencegah tebak kode.
2. Jika kode tidak ada, balas error generik yang sama untuk semua kegagalan.
3. Jika `deviceHash` sudah terdaftar, lanjut. Jika belum dan jumlah perangkat sudah 3, balas `device_limit`. Selain itu `SADD`.
4. Balas `{ entitlement, claimNumber, rarity, bgId }`.

**`POST /api/release-device`** — body `{ code, deviceHash }` → `SREM`.

**`GET /api/assets`** — header `Authorization: Bearer <entitlement>`
- Verifikasi tanda tangan, baca `bg:{bg_id}`, balas `{ expand, compact }` (alamat Blob).
- Rate limit per IP.

## 7. Gacha
- Katalog di `src/lib/rewards-catalog.ts`. Contoh bobot: 3 umum (≈25% tiap item), 2 langka (≈8%), 1 epik (≈3%), 1 legendaris (≈1%). Normalisasikan dari `weight`.
- Undian dengan `crypto.randomInt`, bukan `Math.random`.
- Kuota (opsional per item): setelah memilih item, `INCR bg:{id}:count`. Jika hasil melebihi kuota, `DECR`, keluarkan item itu dari daftar, dan undi ulang dari sisanya.
- Satu hasil per kode. Tidak ada endpoint reroll.
- Tampilkan peluang di halaman klaim secara transparan.

## 8. Entitlement
- Format: `base64url(payload) + "." + base64url(signature)`.
- Payload: `{ v:1, code, claim_number, bg_id, badge_id, rarity, device_hash, issued_at }`.
- Tanda tangan dengan `crypto.sign(null, data, privateKey)` (modul `node:crypto`).
- Token tidak kedaluwarsa, supaya reward tetap jalan offline. Konsekuensinya, token yang sudah terbit tidak bisa dicabut dari jauh. Untuk item kosmetik ini bisa diterima.
- Jika aplikasi memakai .NET dan kamu tidak mau menambah pustaka Ed25519, alternatifnya ECDSA P-256 (`dsaEncoding: 'ieee-p1363'` di Node). Putuskan setelah stack aplikasi terbaca.

## 9. Halaman klaim (Astro)
- Halaman statis `claim.astro` (EN) dan `id/claim.astro`, dengan skrip klien yang memanggil `/api/claim`.
- Tampilkan progres unduhan dari data build yang sudah ada (mis. 77/100). Angkanya ikut jadwal rebuild, jadi beri keterangan "diperbarui harian".
- Jika `claims:open` tertutup, tampilkan keadaan "Segera hadir". Status itu bisa diminta lewat endpoint kecil `GET /api/claim-status` atau disematkan saat klik.
- Alur: klik Klaim → Turnstile → animasi reveal → nama background, rarity, nomor klaim → kode.
- Tombol **Salin** dan **Unduh .txt**. Peringatan: "Simpan kode ini. Tanpa login, kode adalah satu-satunya cara memulihkan reward."
- Simpan kode di localStorage dan tampilkan lagi saat halaman dibuka di browser yang sama.
- Bagian "Cara redeem" berisi 3 langkah singkat dengan screenshot Settings.
- Gambar reveal memakai `previewUrl` dari respons `/api/claim`, jadi tidak ada gambar reward di folder `public/`.

## 10. Anti-abuse
- Turnstile di tombol klaim.
- Rate limit klaim dan redeem per hash IP. Perhatikan IP bersama (kampus, warnet): batas 3 per hari mungkin perlu dilonggarkan.
- Maks 3 perangkat per kode.
- Karena unduhan tidak unik per IP, milestone 100 tidak bisa dibuktikan ketat. Itu sebabnya klaim dibuka manual.
- Kuota perintah Redis gratis terbatas (sekitar 500 ribu per bulan). Rate limit dan Turnstile juga melindungi kuota itu.

## 11. Aset gambar (Vercel Blob)
Dua file per item:
- `bg_XX_expand.webp` ≈ 1100×400
- `bg_XX_compact.webp` ≈ 800×200

Aturan desain: tanpa sudut membulat di gambar (aplikasi yang memotong), detail utama di kanan, sisi kiri gelap atau polos, hindari detail halus di compact.

Aturan akses:
- Cek di dokumentasi Vercel Blob apakah akses **private** tersedia di akunmu dan pakai jika ada.
- Jika tidak, gunakan URL dengan akhiran acak (`addRandomSuffix: true`) yang hanya dikirim API setelah entitlement valid. Ini lebih lemah, tetapi cukup untuk item kosmetik.
- Gambar sumber disimpan di `rewards-src/` yang masuk `.gitignore`. **Jangan commit gambar ke repo ini.**

## 12. Tahapan kerja
- [ ] Ubah `GITHUB_OWNER`/`GITHUB_REPO` dan token GitHub ke `Risunity/Notchi`
- [ ] Buat database Upstash Redis, simpan URL dan token ke Vercel
- [ ] Buat akun Cloudflare Turnstile, simpan kuncinya
- [ ] Buat pasangan kunci Ed25519, simpan privat di Vercel
- [ ] Aktifkan Vercel Blob dan simpan tokennya
- [ ] Tambah dependensi dan `.env.example`
- [ ] `src/lib/*` (redis, catalog, gacha, entitlement, code, security)
- [ ] `api/claim.ts`, `api/redeem.ts`, `api/release-device.ts`, `api/assets.ts`
- [ ] Halaman klaim EN dan ID + teks i18n
- [ ] `scripts/upload-rewards.mjs`
- [ ] Tes Vitest (bagian 13)
- [ ] Uji di Preview Deployment sebelum ke Production
- [ ] Rilis aplikasi versi baru dulu, baru buka klaim

## 13. Pengujian
- Gacha: jalankan 10.000 undian pada data uji dan cocokkan dengan bobot. Uji kuota: tidak pernah melebihi batas, termasuk klaim bersamaan.
- Entitlement: tanda tangan valid, token dimodifikasi ditolak, kunci salah ditolak.
- Kode: format, tidak ada karakter ambigu, bentrok ditangani.
- Redeem: kode benar, kode salah, perangkat ke-4, perangkat yang sama dua kali, setelah release-device.
- Rate limit: klaim dan redeem melewati batas.
- Alur penuh di Preview: klaim → kode → redeem dari aplikasi → unduh gambar.

## 14. Operasional
- Membuka klaim: ubah `claims:open` ke `"1"` di Data Browser Upstash.
- Menutup klaim: ubah ke `"0"`.
- Pantau pemakaian perintah di dashboard Upstash. Jangan memasang kartu kredit jika tidak ingin otomatis berpindah ke tier berbayar.
- Perbarui halaman privasi: hash IP dan hash perangkat disimpan untuk membatasi klaim dan perangkat.

## 15. Jika ilustrasi WebP sudah jadi
1. **Periksa tiap file:** expand 1100×400 dan compact 800×200, WebP, 60–120 KB, tanpa sudut membulat. Ilustrasi utama di kanan dan di tengah vertikal, kiri gelap atau polos.
2. **Konversi bila perlu:** `cwebp -q 80 input.png -o bg_01_expand.webp`.
3. **Penamaan:** `bg_01_expand.webp`, `bg_01_compact.webp`, dst. sampai `bg_07`. Taruh di `rewards-src/`.
4. **Uji di aplikasi dulu** dengan menaruh file langsung di `%APPDATA%\Notchi\rewards\` (flag debug), lihat compact dan expand.
5. **Isi `src/lib/rewards-catalog.ts`:** id, nama, rarity, weight, quota untuk tiap item.
6. **Jalankan `scripts/upload-rewards.mjs`:** upload ke Vercel Blob, lalu simpan `url_expand` dan `url_compact` ke `bg:{id}` di Redis.
7. **Uji `/api/assets`** dengan entitlement valid, token rusak, dan tanpa token.
8. **Uji sebaran gacha** di Preview sebelum Production.