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
Jangan gunakan simbol markdown seperti tanda bintang (**), tanda pagar (#), atau backtick untuk menekankan atau menebalkan kata. Tulis jawaban dalam kalimat dan paragraf yang natural tanpa simbol pemformatan tersebut, seperti orang mengetik pesan biasa.
`;

const RPM_SCHEMA = {
  type: "object",
  properties: {
    judul: { type: "string" },
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
    pengalaman_belajar: {
      type: "array",
      items: {
        type: "object",
        properties: {
          judul_pertemuan: { type: "string" },
          kegiatan_awal: { type: "string" },
          kegiatan_inti: { type: "string" },
          kegiatan_penutup: { type: "string" }
        },
        required: ["judul_pertemuan", "kegiatan_awal", "kegiatan_inti", "kegiatan_penutup"]
      }
    },
    ringkasan_materi: { type: "string" },
    asesmen: { type: "string" },
    lkm: { type: "string" },
    bahan_bacaan: { type: "string" },
    rubrik: { type: "string" },
    glosarium_bibliografi: { type: "string" },
    pengesahan: { type: "string" }
  },
  required: [
    "judul","identifikasi_murid","identifikasi_materi","dpl",
    "capaian_pembelajaran","topik","tujuan_pembelajaran","indikator_ketercapaian",
    "praktik_pedagogis","kemitraan_pembelajaran","lingkungan_pembelajaran",
    "pemanfaatan_digital","pengalaman_belajar","ringkasan_materi","asesmen",
    "lkm","bahan_bacaan","rubrik","glosarium_bibliografi","pengesahan"
  ]
};


const SIMPLE_DOC_SCHEMAS = {
  prota: {
    type:"object",
    properties:{
      judul:{type:"string"},identitas:{type:"string"},tujuan:{type:"string"},
      distribusi:{type:"string"},catatan:{type:"string"}
    },
    required:["judul","identitas","tujuan","distribusi","catatan"]
  },
  promes: {
    type:"object",
    properties:{
      judul:{type:"string"},identitas:{type:"string"},tujuan:{type:"string"},
      distribusi:{type:"string"},evaluasi:{type:"string"},catatan:{type:"string"}
    },
    required:["judul","identitas","tujuan","distribusi","evaluasi","catatan"]
  },
  asesmen: {
    type:"object",
    properties:{
      judul:{type:"string"},identitas:{type:"string"},kisi_kisi:{type:"string"},
      soal:{type:"string"},kunci:{type:"string"},penskoran:{type:"string"}
    },
    required:["judul","identitas","kisi_kisi","soal","kunci","penskoran"]
  },
  lkpd: {
    type:"object",
    properties:{
      judul:{type:"string"},identitas:{type:"string"},tujuan:{type:"string"},
      stimulus:{type:"string"},alat_bahan:{type:"string"},langkah_kegiatan:{type:"string"},
      tabel_data:{type:"string"},pertanyaan:{type:"string"},kesimpulan_refleksi:{type:"string"},
      asesmen:{type:"string"}
    },
    required:["judul","identitas","tujuan","stimulus","alat_bahan","langkah_kegiatan","tabel_data","pertanyaan","kesimpulan_refleksi","asesmen"]
  },
  program: {
    type:"object",
    properties:{
      judul:{type:"string"},identifikasi_masalah:{type:"string"},latar_belakang:{type:"string"},
      tujuan:{type:"string"},sasaran:{type:"string"},strategi:{type:"string"},
      jadwal_kegiatan:{type:"string"},indikator_keberhasilan:{type:"string"},
      evaluasi:{type:"string"},tindak_lanjut:{type:"string"}
    },
    required:["judul","identifikasi_masalah","latar_belakang","tujuan","sasaran","strategi","jadwal_kegiatan","indikator_keberhasilan","evaluasi","tindak_lanjut"]
  }
};

function docType(jenis){
  const v=String(jenis||"").toLowerCase();
  if(v.includes("tahunan")) return "prota";
  if(v.includes("semester")) return "promes";
  if(v.includes("soal")) return "asesmen";
  if(v.includes("lkpd")) return "lkpd";
  if(v.includes("program pembelajaran")) return "program";
  return null;
}

function formatSimpleDoc(type,r){
  const titles={prota:"PROGRAM TAHUNAN (PROTA)",promes:"PROGRAM SEMESTER (PROMES)",asesmen:"PAKET SOAL EVALUASI / ASESMEN",lkpd:"LEMBAR KEGIATAN MURID (LKM/LKPD)",program:"PROGRAM PEMBELAJARAN"};
  const sections={
    prota:[["IDENTITAS",r.identitas],["TUJUAN PROGRAM",r.tujuan],["DISTRIBUSI MATERI / TP DAN ALOKASI WAKTU",r.distribusi],["CATATAN",r.catatan]],
    promes:[["IDENTITAS",r.identitas],["TUJUAN PROGRAM",r.tujuan],["DISTRIBUSI MATERI / TP PER MINGGU",r.distribusi],["EVALUASI",r.evaluasi],["CATATAN",r.catatan]],
    asesmen:[["IDENTITAS",r.identitas],["KISI-KISI",r.kisi_kisi],["SOAL",r.soal],["KUNCI JAWABAN",r.kunci],["PEDOMAN PENSKORAN",r.penskoran]],
    lkpd:[["IDENTITAS",r.identitas],["TUJUAN",r.tujuan],["STIMULUS / PEMANTIK",r.stimulus],["ALAT DAN BAHAN",r.alat_bahan],["LANGKAH KEGIATAN",r.langkah_kegiatan],["TABEL DATA / HASIL PENGAMATAN",r.tabel_data],["PERTANYAAN ANALISIS",r.pertanyaan],["KESIMPULAN DAN REFLEKSI",r.kesimpulan_refleksi],["ASESMEN",r.asesmen]],
    program:[["IDENTIFIKASI MASALAH",r.identifikasi_masalah],["LATAR BELAKANG",r.latar_belakang],["TUJUAN",r.tujuan],["SASARAN",r.sasaran],["STRATEGI / BENTUK KEGIATAN",r.strategi],["JADWAL KEGIATAN",r.jadwal_kegiatan],["INDIKATOR KEBERHASILAN",r.indikator_keberhasilan],["EVALUASI",r.evaluasi],["TINDAK LANJUT",r.tindak_lanjut]]
  };
  return "# "+titles[type]+"\n\n## "+r.judul+"\n\n"+sections[type].map(([h,v])=>"### "+h+"\n"+v).join("\n\n");
}

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
  const jenis = String(d.jenis || "");
  if (!jenis.toLowerCase().includes("rpp / modul ajar")) {
    return `
Anda membuat dokumen pendidikan untuk guru SMP berdasarkan parameter berikut.

JENIS DOKUMEN: ${jenis}
IDENTITAS:
Nama Penyusun: ${d.penyusun || "........................"}
NIP Guru: ${d.nip || "........................"}
Nama Sekolah: ${d.sekolah || "........................"}
Tahun Pelajaran: ${d.tahun || "........................"}
Mata Pelajaran: ${d.mapel || "........................"}
Fase/Kelas: ${d.kelas || "........................"}
Semester: ${d.semester || "........................"}
Materi/Topik: ${d.materi || "........................"}

PARAMETER KHUSUS:
${Object.entries(d).filter(([k]) => !["jenis","penyusun","nip","sekolah","tahun","mapel","kelas","semester","materi"].includes(k)).map(([k,v]) => `${k}: ${v || "........................"}`).join("\\n")}

ATURAN:
- Gunakan bahasa Indonesia formal, praktis, kontekstual, dan siap digunakan.
- Jangan mengarang identitas.
- Jangan mencampurkan contoh IPA jika mapelnya bukan IPA.
- Sesuaikan isi dengan jenis dokumen yang dipilih.
- Susun dengan heading yang jelas, tabel bila membantu, serta bagian yang lengkap dan siap pakai.

KHUSUS PROTA: tampilkan pembagian materi/TP sepanjang tahun, minggu efektif, JP, dan distribusi semester.
KHUSUS PROMES: tampilkan distribusi materi/TP per minggu/bulan, JP, minggu efektif, dan evaluasi.
KHUSUS ASESMEN: tampilkan kisi-kisi, soal sesuai jumlah dan tipe, kunci jawaban, serta pedoman penskoran.
KHUSUS LKPD: tampilkan tujuan, alat/bahan, keselamatan bila perlu, langkah kerja, tabel data, pertanyaan analisis, kesimpulan, refleksi, dan asesmen.
KHUSUS PROGRAM PEMBELAJARAN: tampilkan latar belakang, tujuan, sasaran, tahapan kegiatan, jadwal, indikator keberhasilan, evaluasi, dan tindak lanjut.
`;
  }

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

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}
function nl2p(s) {
  const t = String(s ?? "").trim();
  if (!t) return "<p>........................</p>";
  return t.split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
}
function identityTable(d) {
  const rows = [
    ["Nama Penyusun", d.penyusun],
    ["NIP Guru", d.nip],
    ["Nama Sekolah", d.sekolah],
    ["Tahun Pelajaran", d.tahun],
    ["Mata Pelajaran", d.mapel],
    ["Fase/Kelas", d.kelas],
    ["Semester", d.semester],
    ["Alokasi Waktu", `${d.pertemuan || "2"} Pertemuan (${d.waktu || "........................"} Menit per pertemuan)`]
  ];
  return `<table class="identitas">${rows.map(([k, v]) =>
    `<tr><td class="k">${esc(k)}</td><td class="sep">:</td><td>${esc(v || "........................")}</td></tr>`
  ).join("")}</table>`;
}

function formatRPM(r, d) {
  const meetings = Array.isArray(r.pengalaman_belajar) ? r.pengalaman_belajar : [];
  const meetingsHtml = meetings.map((m, i) => `
    <h4>Langkah-langkah Pembelajaran Pertemuan ke-${i + 1}${m.judul_pertemuan ? " (" + esc(m.judul_pertemuan) + ")" : ""}</h4>
    <table class="komponen">
      <tr><th>Tahap Kegiatan</th><th>Deskripsi Kegiatan</th></tr>
      <tr><td>a. Kegiatan Awal</td><td>${nl2p(m.kegiatan_awal)}</td></tr>
      <tr><td>b. Kegiatan Inti</td><td>${nl2p(m.kegiatan_inti)}</td></tr>
      <tr><td>c. Penutup</td><td>${nl2p(m.kegiatan_penutup)}</td></tr>
    </table>`).join("");

  return `<div class="doc">
    <h1>RENCANA<br>PEMBELAJARAN MENDALAM (RPM)</h1>
    ${identityTable(d || {})}

    <h2>A. Identifikasi</h2>
    <table class="komponen">
      <tr><th>Komponen</th><th>Deskripsi</th></tr>
      <tr><td>1. Identifikasi Murid</td><td>${nl2p(r.identifikasi_murid)}</td></tr>
      <tr><td>2. Identifikasi Materi Pelajaran</td><td>${nl2p(r.identifikasi_materi)}</td></tr>
      <tr><td>3. Dimensi Profil Lulusan Terintegrasi</td><td>${nl2p(r.dpl)}</td></tr>
    </table>

    <h2>B. Desain Pembelajaran</h2>
    <table class="komponen">
      <tr><th>Komponen</th><th>Deskripsi</th></tr>
      <tr><td>4. Capaian Pembelajaran</td><td>${nl2p(r.capaian_pembelajaran)}</td></tr>
      <tr><td>5. Topik Pembelajaran</td><td>${nl2p(r.topik)}</td></tr>
      <tr><td>6. Tujuan Pembelajaran</td><td>${nl2p(r.tujuan_pembelajaran)}</td></tr>
      <tr><td>7. Indikator Ketercapaian</td><td>${nl2p(r.indikator_ketercapaian)}</td></tr>
      <tr><td>8. Praktik Pedagogis</td><td>${nl2p(r.praktik_pedagogis)}</td></tr>
      <tr><td>9. Kemitraan Pembelajaran</td><td>${nl2p(r.kemitraan_pembelajaran)}</td></tr>
      <tr><td>10. Lingkungan Pembelajaran</td><td>${nl2p(r.lingkungan_pembelajaran)}</td></tr>
      <tr><td>11. Pemanfaatan Digital</td><td>${nl2p(r.pemanfaatan_digital)}</td></tr>
    </table>

    <h2>C. Pengalaman Belajar</h2>
    ${meetingsHtml || nl2p(r.pengalaman_belajar)}

    <h2>LAMPIRAN</h2>
    <h3>D. Ringkasan Materi Pembelajaran</h3>${nl2p(r.ringkasan_materi)}
    <h3>E. Asesmen (Penilaian)</h3>${nl2p(r.asesmen)}
    <h3>F. Lembar Kegiatan Murid (LKM)</h3>${nl2p(r.lkm)}
    <h3>G. Bahan Bacaan Guru dan Murid</h3>${nl2p(r.bahan_bacaan)}
    <h3>H. Rubrik Penilaian</h3>${nl2p(r.rubrik)}
    <h3>I. Glosarium & Bibliografi</h3>${nl2p(r.glosarium_bibliografi)}

    <hr>
    ${nl2p(r.pengesahan)}
  </div>`;
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
      maxOutputTokens: 12000
    };

    if (mode === "generate") {
      const type = docType(data?.jenis);
      if (type === "prota" || type === "promes" || type === "asesmen" || type === "lkpd" || type === "program") {
        config.responseMimeType = "application/json";
        config.responseSchema = SIMPLE_DOC_SCHEMAS[type];
      } else if (String(data?.jenis || "").toLowerCase().includes("rpp / modul ajar")) {
        config.responseMimeType = "application/json";
        config.responseSchema = RPM_SCHEMA;
      }
    }

    // Gemini 3.8 Flash dapat sementara mengembalikan 503 saat kapasitas penuh.
    // Gunakan retry singkat + fallback ke model Flash stabil lain agar generator
    // tetap dapat melayani guru tanpa perlu mengganti environment variable manual.
    const fallbackModels = [
      GEMINI_MODEL,
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite"
    ].filter((model, index, list) => model && list.indexOf(model) === index);

    const isTransientGeminiError = (error) => {
      const code = Number(error?.status ?? error?.code);
      const message = String(error?.message || "").toLowerCase();
      return [408, 429, 500, 502, 503, 504].includes(code)
        || /\b(408|429|500|502|503|504)\b/.test(message)
        || message.includes("unavailable")
        || message.includes("high demand")
        || message.includes("temporarily");
    };

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    let response;
    let usedModel = GEMINI_MODEL;
    let lastError;

    for (const [modelIndex, model] of fallbackModels.entries()) {
      const attempts = modelIndex === 0 ? 2 : 1;

      for (let attempt = 0; attempt < attempts; attempt++) {
        try {
          if (attempt > 0) {
            await sleep(1200 * attempt);
          }

          response = await ai.models.generateContent({
            model,
            contents: userPrompt,
            config
          });

          usedModel = model;
          break;
        } catch (error) {
          lastError = error;
          console.error(`Gemini model ${model} attempt ${attempt + 1} failed:`, error?.message || error);

          if (!isTransientGeminiError(error)) {
            throw error;
          }
        }
      }

      if (response) break;

      console.warn(`Gemini model ${model} unavailable; trying fallback model if available.`);
    }

    if (!response) {
      throw lastError || new Error("Semua model Gemini sedang tidak tersedia.");
    }

    let text = response.text?.trim();

    if (!text) {
      return json({ error: "Gemini tidak mengembalikan teks. Silakan coba lagi." }, 502);
    }

    if (mode === "generate") {
      const type = docType(data?.jenis);
      if (type && type !== "rpm") {
        try {
          const structured = JSON.parse(text);
          text = formatSimpleDoc(type, structured);
        } catch (parseError) {
          console.error("Structured document parse error:", parseError);
          return json({ error: "Format dokumen dari Gemini tidak valid. Silakan coba lagi." }, 502);
        }
      } else if (String(data?.jenis || "").toLowerCase().includes("rpp / modul ajar")) {
        try {
          const structured = JSON.parse(text);
          text = formatRPM(structured, data);
        } catch (parseError) {
          console.error("RPM JSON parse error:", parseError);
          return json({ error: "Format RPM dari Gemini tidak valid. Silakan coba lagi." }, 502);
        }
      }
    }

    return json({ ok: true, text, model: usedModel });
  } catch (error) {
    console.error("Gemini error:", error);
    return json({ error: error?.message || "Terjadi kesalahan saat menghubungi Gemini API." }, 500);
  }
};

export const config = {
  path: "/api/gemini"
};
