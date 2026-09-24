# SNESA AI

**Platform Pembelajaran Pintar SMP Negeri 1 Ambarawa**

SNESA AI membantu guru menyiapkan pembelajaran, LKPD, asesmen, program pembelajaran, numerasi, dan konsultasi melalui AI.

Repository: https://github.com/herisetyantoid/snesa-ai

## Arsitektur

Versi ini sudah disiapkan khusus untuk **Netlify**.

- Frontend: `public/index.html`
- Netlify Functions: `netlify/functions/`
- AI: Google Gemini API melalui `@google/genai`
- Endpoint AI: `POST /api/gemini`
- Health check: `GET /api/health`
- Konfigurasi Netlify: `netlify.toml`

API Key Gemini **tidak disimpan di HTML** dan tidak dikirim ke browser. API key dibaca oleh Netlify Function dari environment variable `GEMINI_API_KEY`.

## Deploy ke Netlify

### 1. Pastikan repository sudah di GitHub

Repository yang digunakan:

`herisetyantoid/snesa-ai`

### 2. Hubungkan repository ke Netlify

Di Netlify:

1. Pilih **Add new project / Import an existing project**.
2. Pilih **GitHub**.
3. Pilih repository `herisetyantoid/snesa-ai`.
4. Deploy.

File `netlify.toml` sudah mengatur:

- Publish directory: `public`
- Functions directory: `netlify/functions`
- Bundler: `esbuild`

Jadi tidak perlu menjalankan `server.js` sebagai web server di Netlify.

### 3. Isi Environment Variables

Di pengaturan project Netlify, tambahkan:

`GEMINI_API_KEY` = API key dari Google AI Studio

`GEMINI_MODEL` = model Gemini yang tersedia pada akun/API key Bapak

`SNESA_ACCESS_CODE` = kode akses guru SNESA AI

**Jangan memasukkan API key ke `public/index.html` atau ke repository.**

Setelah mengubah environment variable, lakukan deploy baru agar nilainya digunakan oleh Functions.

### 4. Tes setelah deploy

Buka:

`https://NAMA-SITE-BAPAK.netlify.app/`

Tes health check:

`https://NAMA-SITE-BAPAK.netlify.app/api/health`

Tes utama dilakukan dari halaman SNESA AI dengan:

- Generator RPP / Modul Ajar
- Generator LKPD
- Generator asesmen
- Guru SNESA / chatbot
- Fitur SNESA Numerasi yang membutuhkan AI

## Menjalankan secara lokal

Untuk pengembangan lokal, `server.js` tetap dipertahankan.

### 1. Install dependency

```bash
npm install
```

### 2. Buat file .env

Salin `.env.example` menjadi `.env`.

Windows:

```bash
copy .env.example .env
```

Mac/Linux:

```bash
cp .env.example .env
```

Isi:

```env
GEMINI_API_KEY=API_KEY_GEMINI_BAPAK
GEMINI_MODEL=gemini-3.8-flash
SNESA_ACCESS_CODE=kode_rahasia_guru
PORT=3000
```

### 3. Jalankan

```bash
npm start
```

Buka:

`http://localhost:3000`

## Endpoint Gemini

Frontend mengirim request ke:

`POST /api/gemini`

Header:

`Content-Type: application/json`

`x-snesa-code: KODE_AKSES`

Mode generator:

```json
{
  "mode": "generate",
  "data": {
    "jenis": "RPP / Modul Ajar",
    "tahun": "2026/2027",
    "sekolah": "SMP Negeri 1 Ambarawa",
    "mapel": "IPA",
    "kelas": "VIII",
    "materi": "Tekanan zat",
    "waktu": "2 JP",
    "model": "PBL",
    "dpl": "Penalaran kritis",
    "prinsip": "Berkesadaran, bermakna, menggembirakan",
    "konteks": "Kemampuan awal siswa beragam"
  }
}
```

Mode Guru SNESA:

```json
{
  "mode": "chat",
  "prompt": "Buatkan ide praktikum sederhana tentang tekanan zat.",
  "history": []
}
```

## Fitur

- Dashboard SNESA AI
- SNESA Numerasi
- Diagnostik numerasi dasar
- Materi penjumlahan, pengurangan, perkalian, pembagian
- Latihan kontekstual
- Latihan model TKA
- Generator RPP / Modul Ajar
- Generator LKPD
- Generator asesmen
- Generator program pembelajaran
- Guru SNESA chatbot
- Koneksi Gemini melalui Netlify Function
- Kode akses guru
- Copy hasil
- Cetak / PDF

## Keamanan

- `.env` masuk `.gitignore`.
- Gemini API key hanya berada di environment variable server/Netlify.
- Browser hanya memanggil endpoint `/api/gemini`.
- Kode akses guru diverifikasi oleh Netlify Function jika `SNESA_ACCESS_CODE` diaktifkan.
