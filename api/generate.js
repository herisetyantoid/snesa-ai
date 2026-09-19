import OpenAI from "openai";
const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 if(process.env.SNESA_ACCESS_CODE && req.headers["x-snesa-code"]!==process.env.SNESA_ACCESS_CODE)return res.status(401).json({error:"Kode akses SNESA AI tidak valid."});
 if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:"OPENAI_API_KEY belum dikonfigurasi."});
 try{
  const d=req.body||{},model=process.env.OPENAI_MODEL||"gpt-5.6-luna";
  const prompt=`Anda adalah SNESA AI, asisten perencanaan pembelajaran untuk guru SMP Negeri 1 Ambarawa. Buat dokumen pembelajaran yang praktis, lengkap, kontekstual, dan siap diedit. Gunakan Bahasa Indonesia.
Jenis dokumen: ${d.jenis||""}
Tahun ajaran: ${d.tahun||""}; Sekolah: ${d.sekolah||"SMP Negeri 1 Ambarawa"}; Mapel: ${d.mapel||""}; Kelas: ${d.kelas||""}; Materi: ${d.materi||""}; Alokasi: ${d.waktu||""}; Model: ${d.model||""}; DPL: ${d.dpl||""}; Prinsip PM: ${d.prinsip||""}; Kondisi kelas: ${d.konteks||""}
Untuk RPP/Modul Ajar: identitas, tujuan, pemahaman bermakna, pertanyaan pemantik, langkah pendahuluan-inti-penutup, asesmen, diferensiasi, media/sumber, refleksi. Untuk LKPD: tujuan, alat-bahan, keselamatan, langkah, tabel data, analisis, kesimpulan, refleksi. Untuk asesmen: kisi-kisi, soal, kunci/rubrik. Untuk program: tujuan, kegiatan, waktu, asesmen, tindak lanjut.`;
  const r=await client.responses.create({model,input:prompt,store:false});
  return res.status(200).json({text:r.output_text});
 }catch(e){console.error(e);return res.status(500).json({error:e?.message||"Gagal membuat dokumen."});}
}