import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SNESA_ACCESS_CODE = process.env.SNESA_ACCESS_CODE || "";

const SYSTEM_INSTRUCTION = `
Anda adalah SNESA AI, asisten AI untuk guru SMP.
Untuk dokumen RPM, gunakan TEMPLATE RPM SNESA sebagai struktur baku.
Template berlaku untuk SEMUA mata pelajaran, bukan hanya IPA.
Gunakan bahasa Indonesia formal, praktis, kontekstual, dan siap digunakan.
Gunakan prinsip Pembelajaran Mendalam: berkesadaran, bermakna, dan menggembirakan.
Gunakan Dimensi Profil Lulusan sesuai input guru.
Jangan mengarang data identitas guru/sekolah. Jika kosong, gunakan tanda "........................".
Jangan menghilangkan bagian template. Jika suatu bagian tidak relevan, tetap isi dengan penyesuaian yang masuk akal.
`;

const RPM_SCHEMA = {
  type: "object",
  properties: {
    judul: { type: "string" },
    identitas: { type: "string" },
    identifikasi_murid: { type: "string" },
    identifikasi_materi: { type: "string" },
    dpl: { type: "string" },
    capaian_pembelajaran: { type: "string" },
    topik: { type: "string" },
    tujuan_pembelajaran: { type: "string" },
    indikator_ketercapaian: { type: "string" },
    praktik_pedagogis: { type: "string" },
    kemitraan_pembelajaran: { type: "string" },
    lingkungan_pembelajaran: { type: "string" },
    pemanfaatan_digital: { type: "string" },
    pengalaman_belajar: { type: "string" },
    ringkasan_materi: { type: "string" },
    asesmen: { type: "string" },
    lkm: { type: "string" },
    bahan_bacaan: { type: "string" },
    rubrik: { type: "string" },
    glosarium_bibliografi: { type: "string" },
    pengesahan: { type: "string" }
  },
  required: [
    "judul","identitas","identifikasi_murid","identifikasi_materi","dpl",
    "capaian_pembelajaran","topik","tujuan_pembelajaran","indikator_ketercapaian",
    "praktik_pedagogis","kemitraan_pembelajaran","lingkungan_pembelajaran",
    "pemanfaatan_digital","pengalaman_belajar","ringkasan_materi","asesmen",
    "lkm","bahan_bacaan","rubrik","glosarium_bibliografi","pengesahan"
  ]
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

function buildPrompt(mode, data, history = [], prompt = "") {
  if (mode === "chat") {
    const recentHistory = Array.isArray(history)
      ? history.slice(-10).map((item) => {
          const role = item.role === "assistant" ? "Asisten" : "Guru";
          return `${role}: ${String(item.content || "")}`;
        }).join("\n")
      : "";

    return `
Percakapan sebelumnya:
${recentHistory || "(belum ada)"}

Pertanyaan/perintah guru:
${prompt}

Berikan jawaban yang langsung membantu dan dapat diterapkan.
`;
  }

  const d = data || {};
  return `
Buat RENCANA PEMBELAJARAN MENDALAM (RPM) lengkap berdasarkan data berikut.

IDENTITAS:
Nama Penyusun: ${d.penyusun || "........................"}
NIP Guru: ${d.nip || "........................"}
Nama Sekolah: ${d.sekolah || "........................"}
Tahun Pelajaran: ${d.tahun || "........................"}
Mata Pelajaran: ${d.mapel || "........................"}
Fase/Kelas: ${d.kelas || "........................"}
Semester: ${d.semester || "........................"}
Alokasi Waktu: ${d.waktu || "........................"}
Jumlah Pertemuan: ${d.pertemuan || "2"}

KONTEN:
Materi/Topik: ${d.materi || "........................"}
Model Pembelajaran: ${d.model || "........................"}
Dimensi Profil Lulusan: ${d.dpl || "........................"}
Prinsip Pembelajaran Mendalam: ${d.prinsip || "Berkesadaran, bermakna, menggembirakan"}
Konteks/Kondisi Kelas: ${d.konteks || "........................"}

TEMPLATE WAJIB:
1. Judul: RENCANA PEMBELAJARAN MENDALAM (RPM)
2. Identitas dokumen.
3. A. IDENTIFIKASI
   - 1. Identifikasi Murid
   - 2. Identifikasi Materi Pelajaran
   - 3. Dimensi Profil Lulusan Terintegrasi
4. B. DESAIN PEMBELAJARAN
   - 4. Capaian Pembelajaran
   - 5. Topik Pembelajaran
   - 6. Tujuan Pembelajaran
   - 7. Indikator Ketercapaian
   - 8. Praktik Pedagogis
   - 9. Kemitraan Pembelajaran
   - 10. Lingkungan Pembelajaran
   - 11. Pemanfaatan Digital
5. C. PENGALAMAN BELAJAR
   - Skenario setiap pertemuan.
   - Kegiatan Awal, Inti, Penutup.
   - Jika model PBL, terapkan sintak PBL secara nyata di kegiatan inti.
   - Waktu harus realistis dan total sesuai alokasi.
6. LAMPIRAN
   - D. Ringkasan Materi Pembelajaran
   - E. Asesmen (awal, proses, akhir; soal dan kunci/pedoman penskoran yang sesuai)
   - F. Lembar Kegiatan Murid (LKM)
   - G. Bahan Bacaan Guru dan Murid
   - H. Rubrik Penilaian
   - I. Glosarium & Bibliografi
   - Pengesahan Kepala Sekolah dan Guru

ATURAN:
- Struktur dan urutan di atas WAJIB dipertahankan.
- Isi harus sesuai mata pelajaran dan materi yang diminta, sehingga dapat digunakan untuk semua mapel.
- Jangan memasukkan contoh IPA jika mapelnya bukan IPA.
- Tujuan, kegiatan, asesmen, LKM, dan rubrik harus saling selaras.
- Gunakan istilah "Murid" dan "Guru".
- Untuk asesmen akhir, sesuaikan bentuk soal dengan karakter mapel. Jangan memaksakan PG kompleks/menjodohkan jika tidak sesuai; tetapi tetap sediakan variasi asesmen yang relevan.
- Untuk rubrik, minimal nilai 4 tingkat: Mahir, Cakap, Layak, Baru Berkembang.
- Untuk bibliografi, jangan membuat sumber palsu. Jika sumber spesifik tidak diketahui, gunakan rujukan umum yang dapat diverifikasi atau beri placeholder.
- Output setiap field harus berisi isi siap pakai, bukan instruksi kepada guru.
`;
}

function formatRPM(r) {
  return `# RENCANA PEMBELAJARAN MENDALAM (RPM)

## IDENTITAS

${r.identitas}

### A. IDENTIFIKASI

#### 1. Identifikasi Murid
${r.identifikasi_murid}

#### 2. Identifikasi Materi Pelajaran
${r.identifikasi_materi}

#### 3. Dimensi Profil Lulusan Terintegrasi
${r.dpl}

### B. DESAIN PEMBELAJARAN

#### 4. Capaian Pembelajaran
${r.capaian_pembelajaran}

#### 5. Topik Pembelajaran
${r.topik}

#### 6. Tujuan Pembelajaran
${r.tujuan_pembelajaran}

#### 7. Indikator Ketercapaian
${r.indikator_ketercapaian}

#### 8. Praktik Pedagogis
${r.praktik_pedagogis}

#### 9. Kemitraan Pembelajaran
${r.kemitraan_pembelajaran}

#### 10. Lingkungan Pembelajaran
${r.lingkungan_pembelajaran}

#### 11. Pemanfaatan Digital
${r.pemanfaatan_digital}

### C. PENGALAMAN BELAJAR

${r.pengalaman_belajar}

## LAMPIRAN

### D. Ringkasan Materi Pembelajaran
${r.ringkasan_materi}

### E. Asesmen (Penilaian)
${r.asesmen}

### F. Lembar Kegiatan Murid (LKM)
${r.lkm}

### G. Bahan Bacaan Guru dan Murid
${r.bahan_bacaan}

### H. Rubrik Penilaian
${r.rubrik}

### I. Glosarium & Bibliografi
${r.glosarium_bibliografi}

---

${r.pengesahan}
`;
}

export default async (req) => {
  if (req.method === "GET") {
    return json({
      ok: true,
      service: "SNESA AI",
      endpoint: "/api/gemini",
      geminiConfigured: Boolean(GEMINI_API_KEY),
      model: GEMINI_MODEL
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method tidak didukung." }, 405);
  }

  if (SNESA_ACCESS_CODE) {
    const supplied = req.headers.get("x-snesa-code") || "";
    if (!supplied || supplied !== SNESA_ACCESS_CODE) {
      return json({ error: "Kode akses SNESA AI tidak valid." }, 401);
    }
  }

  if (!GEMINI_API_KEY) {
    return json({ error: "Gemini API belum dikonfigurasi." }, 500);
  }

  try {
    const body = await req.json();
    const { mode = "chat", prompt = "", data = {}, history = [] } = body || {};

    if (mode === "chat" && !String(prompt).trim()) {
      return json({ error: "Pesan tidak boleh kosong." }, 400);
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const userPrompt = buildPrompt(mode, data, history, prompt);

    const config = {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      maxOutputTokens: 12000
    };

    if (mode === "generate" && String(data?.jenis || "").toLowerCase().includes("rpp / modul ajar")) {
      config.responseMimeType = "application/json";
      config.responseSchema = RPM_SCHEMA;
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config
    });

    let text = response.text?.trim();

    if (!text) {
      return json({ error: "Gemini tidak mengembalikan teks. Silakan coba lagi." }, 502);
    }

    if (mode === "generate" && String(data?.jenis || "").toLowerCase().includes("rpp / modul ajar")) {
      try {
        const structured = JSON.parse(text);
        text = formatRPM(structured);
      } catch (parseError) {
        console.error("RPM JSON parse error:", parseError);
        return json({ error: "Format RPM dari Gemini tidak valid. Silakan coba lagi." }, 502);
      }
    }

    return json({ ok: true, text, model: GEMINI_MODEL });
  } catch (error) {
    console.error("Gemini error:", error);
    return json({ error: error?.message || "Terjadi kesalahan saat menghubungi Gemini API." }, 500);
  }
};

export const config = {
  path: "/api/gemini"
};
