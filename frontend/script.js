let currentConversationId = Date.now().toString()
let questionCount = 0

function addMessage(text,type){

const chat=document.getElementById("chat-box")

const msg=document.createElement("div")

msg.className="message "+type

const avatar=document.createElement("div")

avatar.className="avatar"

avatar.innerHTML = type==="bot" ? "🤖" : "🧑"

const content=document.createElement("div")

content.className="text"

msg.appendChild(avatar)
msg.appendChild(content)

chat.appendChild(msg)

chat.scrollTop=chat.scrollHeight

// STREAMING EFFECT

let i=0
function typeWriter(){

if(i<text.length){
content.innerHTML+=text.charAt(i)
i++
setTimeout(typeWriter,15)
}

}

typeWriter()

}

function showTyping(){

const chat=document.getElementById("chat-box")

const div=document.createElement("div")

div.className="typing"

div.innerHTML="<span></span><span></span><span></span>"

chat.appendChild(div)

chat.scrollTop=chat.scrollHeight

return div

}

async function askAI(){

const input=document.getElementById("question")

const question=input.value.trim()

if(!question) return

addMessage(question,"user")

input.value=""

questionCount++

document.getElementById("questionCount").innerText=
"Questions: "+questionCount

const typing=showTyping()

const res=await fetch("https://ai-study-assistant-fx5n.onrender.com/ask",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
question,
conversationId:currentConversationId
})

})

const data=await res.json()

typing.remove()

addMessage(data.answer,"bot")

loadHistory()

}

async function summarizePDF(){

const res=await fetch("https://ai-study-assistant-fx5n.onrender.com/summary")

const data=await res.json()

addMessage(data.answer,"bot")

}

async function generateQuiz(){

const res=await fetch("https://ai-study-assistant-fx5n.onrender.com/quiz")

const data=await res.json()

addMessage(data.answer,"bot")

}

async function uploadPDF(){

const file=document.getElementById("pdfFile").files[0]

const formData=new FormData()

formData.append("pdf",file)

await fetch("https://ai-study-assistant-fx5n.onrender.com/upload-pdf",{
method:"POST",
body:formData
})

addMessage("PDF uploaded successfully","bot")

}

async function newChat(){

currentConversationId=Date.now().toString()

await fetch("https://ai-study-assistant-fx5n.onrender.com/reset",{method:"POST"})

document.getElementById("chat-box").innerHTML=""

}

function startVoice(){

const recognition=new webkitSpeechRecognition()

recognition.lang="en-IN"

recognition.start()

recognition.onresult=function(event){

document.getElementById("question").value=
event.results[0][0].transcript

}

}

async function loadHistory(){

const res=await fetch("https://ai-study-assistant-fx5n.onrender.com/history")

const data=await res.json()

const history=document.getElementById("history")

history.innerHTML=""

data.forEach(item=>{

const li=document.createElement("li")

li.innerText=item.question

li.onclick=function(){
openConversation(item._id)
}

history.appendChild(li)

})

}

async function openConversation(id){

currentConversationId=id

const res=await fetch("https://ai-study-assistant-fx5n.onrender.com/conversation/"+id)

const data=await res.json()

const chat=document.getElementById("chat-box")

chat.innerHTML=""

data.forEach(msg=>{

addMessage(msg.question,"user")
addMessage(msg.answer,"bot")

})

}

function toggleTheme(){

document.body.classList.toggle("dark")

}

document.getElementById("question").addEventListener("keypress",function(e){

if(e.key==="Enter") askAI()

})

loadHistory()

addMessage(
"Hello 👋 I am your AI Study Assistant.\nUpload PDFs or ask me anything.",
"bot"

)
