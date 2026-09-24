import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SNESA_ACCESS_CODE = process.env.SNESA_ACCESS_CODE || "";

const SYSTEM_INSTRUCTION = `
Anda adalah SNESA AI, asisten AI untuk guru SMP Negeri 1 Ambarawa.

Konteks utama:
- Kurikulum yang digunakan adalah kurikulum terbaru yang diterapkan sekolah.
- Gunakan prinsip Pembelajaran Mendalam: berkesadaran, bermakna, dan menggembirakan.
- Perhatikan Dimensi Profil Lulusan (DPL) bila relevan.
- Jawaban harus praktis, siap digunakan guru, jelas, terstruktur, dan sesuai konteks SMP.
- Untuk dokumen pembelajaran, gunakan bahasa Indonesia formal tetapi mudah diterapkan.
- Jangan mengarang data sekolah yang tidak diberikan pengguna.
- Bila informasi belum tersedia, gunakan format yang dapat diedit guru.
`;

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
Buat dokumen pembelajaran berikut.

Jenis dokumen: ${d.jenis || "-"}
Tahun ajaran: ${d.tahun || "-"}
Sekolah: ${d.sekolah || "SMP Negeri 1 Ambarawa"}
Mata pelajaran: ${d.mapel || "-"}
Kelas: ${d.kelas || "-"}
Materi/topik: ${d.materi || "-"}
Alokasi waktu: ${d.waktu || "-"}
Model pembelajaran: ${d.model || "-"}
Dimensi Profil Lulusan: ${d.dpl || "-"}
Prinsip Pembelajaran Mendalam: ${d.prinsip || "-"}
Konteks/kondisi kelas: ${d.konteks || "-"}

Ketentuan:
1. Buat isi lengkap dan sistematis.
2. Sesuaikan dengan konteks guru SMP.
3. Utamakan aktivitas yang aktif, bermakna, dan realistis dilakukan di sekolah.
4. Sertakan tujuan pembelajaran, langkah kegiatan, asesmen, dan tindak lanjut bila sesuai dengan jenis dokumen.
5. Jangan menambahkan data faktual sekolah yang tidak diberikan.
6. Hasil harus siap disalin ke dokumen kerja guru.
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
    return json({
      error: "Gemini API belum dikonfigurasi. Masukkan GEMINI_API_KEY pada Environment Variables Netlify."
    }, 500);
  }

  try {
    const body = await req.json();
    const { mode = "chat", prompt = "", data = {}, history = [] } = body || {};

    if (mode === "chat" && !String(prompt).trim()) {
      return json({ error: "Pesan tidak boleh kosong." }, 400);
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const userPrompt = buildPrompt(mode, data, history, prompt);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 6000
      }
    });

    const text = response.text?.trim();

    if (!text) {
      return json({
        error: "Gemini tidak mengembalikan teks. Silakan coba lagi."
      }, 502);
    }

    return json({
      ok: true,
      text,
      model: GEMINI_MODEL
    });
  } catch (error) {
    console.error("Gemini error:", error);
    return json({
      error: error?.message || "Terjadi kesalahan saat menghubungi Gemini API."
    }, 500);
  }
};

export const config = {
  path: "/api/gemini"
};
