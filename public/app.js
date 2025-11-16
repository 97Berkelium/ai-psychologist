const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const testBtn = document.getElementById("test-btn");
const langBtn = document.getElementById("lang-btn");

let currentLang = "ko";
const API_URL = "/api/chat";

let conversation = [
  { role: "system", content: "당신은 따뜻하고 공감적인 심리 상담사입니다." }
];

let testMode = false;
let testQuestions = [];
let currentQuestion = 0;
let answers = [];

function addMessage(role, text) {
  const el = document.createElement("div");
  el.className = "message " + (role==="user"?"user":"bot");
  el.innerText = text;
  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function generateQuestions() {
  const prompt = `10개의 1~5점 심리 검사 문항을 JSON 배열로 생성하세요. 각 문항: id, text, dim(personality/stress/emotion/selfAwareness)`;
  const msg = [...conversation, {role:"user", content:prompt}];
  const res = await fetch(API_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({messages:msg})
  });
  const data = await res.json();
  try { return JSON.parse(data.reply); }
  catch { addMessage("bot","⚠ 검사 문항 생성 실패"); return null; }
}

testBtn.addEventListener("click", async () => {
  addMessage("bot","검사 문항 생성중…");
  const q = await generateQuestions();
  if(!q) return;
  testQuestions = q;
  testMode = true; currentQuestion=0; answers=[];
  addMessage("bot","테스트 시작! 1~5로 답해주세요.");
  askNextQuestion();
});

function askNextQuestion() {
  if(currentQuestion>=testQuestions.length) return endTest();
  const q = testQuestions[currentQuestion];
  addMessage("bot",`문항 ${currentQuestion+1}: ${q.text} (1~5)`);
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", e=>{if(e.key==="Enter") sendMessage();});

async function sendMessage() {
  const text = input.value.trim(); if(!text) return;
  addMessage("user", text); input.value="";
  if(testMode){
    const score = Number(text);
    if(![1,2,3,4,5].includes(score)) return addMessage("bot","1~5 사이 숫자로 답해주세요.");
    answers.push(score); currentQuestion++; askNextQuestion(); return;
  }
  const msg = [...conversation,{role:"user",content:text}];
  const res = await fetch(API_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({messages:msg})
  });
  const data = await res.json();
  addMessage("bot",data.reply || "AI가 응답하지 않았습니다.");
  conversation.push({role:"user",content:text});
  conversation.push({role:"assistant",content:data.reply || ""});
}

async function endTest(){
  testMode=false;
  addMessage("bot","검사가 완료되었습니다. 보고서를 생성합니다…");
  const reportPrompt = testQuestions.map((q,i)=>`${q.id}. ${q.text} → ${answers[i]}`).join("\n");
  const msg = [...conversation,{role:"user",content:"사용자 심리 검사 응답:\n"+reportPrompt}];
  const res = await fetch(API_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({messages:msg})
  });
  const data = await res.json();
  addMessage("bot",data.reply || "AI 보고서를 생성하지 못했습니다.");
}

langBtn.addEventListener("click",()=>addMessage("bot","현재 버전은 한국어만 지원합니다."));
