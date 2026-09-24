# SNESA AI

**Platform Pembelajaran Pintar SMP Negeri 1 Ambarawa**

SNESA AI membantu guru menyiapkan pembelajaran, LKPD, asesmen, program pembelajaran, numerasi, dan konsultasi melalui AI.

Repository: https://github.com/herisetyantoid/snesa-ai

## Arsitektur

SNESA AI menggunakan:

- Frontend: `public/index.html`
- Backend: `server.js`
- AI: Google Gemini API melalui `@google/genai`
- Endpoint utama: `POST /api/gemini`
- Health check: `GET /api/health`

**API Key Gemini tidak disimpan di HTML dan tidak dikirim ke browser.** API key dibaca oleh backend dari environment variable `GEMINI_API_KEY`.

Google merekomendasikan Google GenAI SDK untuk JavaScript/Node.js dan penggunaan environment variable untuk API key. Node.js 18+ didukung oleh SDK. 

## Menjalankan di komputer

### 1. Clone repository

```bash
git clone https://github.com/herisetyantoid/snesa-ai.git
cd snesa-ai
```

### 2. Install dependency

```bash
npm install
```

### 3. Buat file .env

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

Jangan pernah memasukkan API key ke `public/index.html` atau meng-commit file `.env`.

### 4. Jalankan

```bash
npm start
```

Buka:

http://localhost:3000

Health check:

http://localhost:3000/api/health

## Endpoint Gemini

Frontend mengirim request ke:

```
POST /api/gemini
```

Header:

```
Content-Type: application/json
x-snesa-code: KODE_AKSES
```

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

Respons:

```json
{
  "ok": true,
  "text": "hasil dari Gemini",
  "model": "gemini-3.8-flash"
}
```

## Deploy

### Opsi yang cocok untuk struktur ini: Render

1. Pastikan kode sudah ada di GitHub.
2. Buat **Web Service** baru dari repository `herisetyantoid/snesa-ai`.
3. Build Command:

```bash
npm install
```

4. Start Command:

```bash
npm start
```

5. Tambahkan Environment Variables:

```
GEMINI_API_KEY=API_KEY_GEMINI_BAPAK
GEMINI_MODEL=gemini-3.8-flash
SNESA_ACCESS_CODE=kode_rahasia_guru
```

6. Deploy.
7. Buka alamat website yang diberikan platform.

> Catatan: struktur sekarang memakai Express + `server.js`, sehingga deployment harus menggunakan platform yang menjalankan Node.js server. Jangan memasukkan Gemini API key ke file frontend.

## Alur SNESA AI

```
Guru
  ↓
public/index.html
  ↓
POST /api/gemini
  ↓
server.js
  ↓
Google Gemini API
  ↓
hasil AI
  ↓
SNESA AI
```

## Fitur yang sudah disiapkan

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
- Koneksi Gemini melalui backend
- Kode akses guru
- Copy hasil
- Cetak / PDF

## Keamanan

- `.env` masuk `.gitignore`.
- Gemini API key hanya berada di server.
- Frontend hanya memanggil endpoint `/api/gemini`.
- Kode akses guru diverifikasi oleh backend jika `SNESA_ACCESS_CODE` diaktifkan.

Untuk mendapatkan API key Gemini, gunakan Google AI Studio dan simpan key sebagai environment variable, bukan di source code.

