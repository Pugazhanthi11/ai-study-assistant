require("dotenv").config()

const express=require("express")
const cors=require("cors")
const Groq=require("groq-sdk")
const multer=require("multer")
const pdf=require("pdf-parse")
const fs=require("fs")
const dns = require("dns");
dns.setServers(["1.1.1.1","8.8.8.8"]);

const app=express()

app.use(cors())
app.use(express.json())

const groq=new Groq({
apiKey:process.env.GROQ_API_KEY
})

/* DATABASE */
const mongoose=require("mongoose")
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB Atlas Connected"))
.catch(err => console.log(err))

const chatSchema=new mongoose.Schema({

conversationId:String,
question:String,
answer:String,
date:{type:Date,default:Date.now}

})

const Chat=mongoose.model("Chat",chatSchema)

/* PDF */

let pdfText=""

const storage=multer.diskStorage({

destination:"uploads/",
filename:(req,file,cb)=>{
cb(null,Date.now()+"-"+file.originalname)
}

})

const upload=multer({storage})

/* UPLOAD PDF */

app.post("/upload-pdf",upload.single("pdf"),async(req,res)=>{

const buffer=fs.readFileSync(req.file.path)

const data=await pdf(buffer)

pdfText=data.text

res.json({message:"PDF uploaded"})

})

/* ASK AI */

app.post("/ask",async(req,res)=>{

const {question,conversationId}=req.body

let prompt=question

if(pdfText && question.toLowerCase().includes("pdf")){
prompt=`Use this document to answer:

${pdfText}

Question:
${question}`
}

const completion=await groq.chat.completions.create({

messages:[
{role:"user",content:prompt}
],

model:"llama-3.3-70b-versatile"

})

const answer=completion.choices[0].message.content

await Chat.create({

conversationId,
question,
answer

})

res.json({answer})

})

/* PDF SUMMARY */

app.get("/summary",async(req,res)=>{

const prompt=`Summarize this document in bullet points:

${pdfText}`

const completion=await groq.chat.completions.create({

messages:[{role:"user",content:prompt}],
model:"llama-3.3-70b-versatile"

})

res.json({answer:completion.choices[0].message.content})

})

/* QUIZ */

app.get("/quiz",async(req,res)=>{

const prompt=`Create 5 quiz questions with answers from this document:

${pdfText}`

const completion=await groq.chat.completions.create({

messages:[{role:"user",content:prompt}],
model:"llama-3.3-70b-versatile"

})

res.json({answer:completion.choices[0].message.content})

})

/* HISTORY */

app.get("/history",async(req,res)=>{

const history=await Chat.aggregate([
{$group:{_id:"$conversationId",question:{$first:"$question"}}},
{$sort:{_id:-1}},
{$limit:20}
])

res.json(history)

})

/* CONVERSATION */

app.get("/conversation/:id",async(req,res)=>{

const msgs=await Chat.find({conversationId:req.params.id}).sort({date:1})

res.json(msgs)

})

/* RESET */

app.post("/reset",(req,res)=>{

pdfText=""

res.json({message:"reset"})

})

app.listen(5000,()=>{
console.log("Server running on port 5000")
})