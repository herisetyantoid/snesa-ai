import OpenAI from "openai";
const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 if(process.env.SNESA_ACCESS_CODE && req.headers["x-snesa-code"]!==process.env.SNESA_ACCESS_CODE)return res.status(401).json({error:"Kode akses SNESA AI tidak valid."});
 if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:"OPENAI_API_KEY belum dikonfigurasi."});
 try{
  const {message,history=[]}=req.body||{},model=process.env.OPENAI_MODEL||"gpt-5.6-luna";
  const input=[{role:"developer",content:"Anda adalah Guru SNESA, asisten AI untuk guru SMP Negeri 1 Ambarawa. Jawab praktis dalam Bahasa Indonesia dan bantu pembelajaran, asesmen, LKPD, diferensiasi, literasi, numerasi, dan administrasi."},...history.slice(-8).map(x=>({role:x.role==="assistant"?"assistant":"user",content:String(x.content||"")})),{role:"user",content:String(message||"")}];
  const r=await client.responses.create({model,input,store:false});
  return res.status(200).json({text:r.output_text});
 }catch(e){console.error(e);return res.status(500).json({error:e?.message||"Chat gagal diproses."});}
}