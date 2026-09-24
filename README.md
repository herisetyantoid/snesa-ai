# SNESA AI

**Platform Pembelajaran Pintar SMP Negeri 1 Ambarawa**

SNESA AI membantu guru menyiapkan pembelajaran, LKPD, asesmen, program pembelajaran, numerasi, literasi, dan konsultasi melalui AI.

Repository: https://github.com/herisetyantoid/snesa-ai

## Status
Deploy trigger SNESA AI diperbarui pada 24 September 2026 agar Netlify mengambil commit terbaru dari branch main.

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

Repository `herisetyantoid/snesa-ai` terhubung ke Netlify. Setiap commit baru pada branch `main` akan menjadi pemicu deploy otomatis jika pengaturan continuous deployment Netlify aktif.

## Environment Variables

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `SNESA_ACCESS_CODE`

Jangan memasukkan API key ke `public/index.html` atau ke repository.

## Fitur

- Dashboard SNESA AI
- SNESA Numerasi
- SNESA Literasi
- Generator RPP / Modul Ajar
- Generator LKPD
- Generator asesmen
- Generator program pembelajaran
- Guru SNESA chatbot
- Koneksi Gemini melalui Netlify Function
- Kode akses guru
- Copy hasil
- Cetak / PDF
