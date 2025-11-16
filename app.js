const chatBox = document.getElementById('chat-box');
const input = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const testBtn = document.getElementById('test-btn');
const langBtn = document.getElementById('lang-btn');

const API_URL = "/api/chat";

let conversation = [
  { role: "system", content: "당신은 친절하고 공감력 있는 심리 상담사입니다. AI임을 언급하지 않습니다." }
];

let testMode = false;
let testQuestions = [];
let currentQuestion = 0;
let answers = [];
let language = "ko";

function addMessage(role, text) {
  const el = document.createElement('p');
  el.textContent = (role==="user"?"👤 당신:":"🤖 상담사:") + text;
  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
}

langBtn.addEventListener('click', () => {
  language = language==="ko"?"zh":"ko";
  addMessage("bot", language==="ko"?"언어가 한국어로 변경되었습니다":"语言已切换为中文");
});

sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keypress', e=>{if(e.key==='Enter') sendMessage();});

async function sendMessage(){
  const text = input.value.trim();
  if(!text) return;
  addMessage("user", text);
  input.value="";

  if(testMode){
    const score = Number(text);
    if(![1,2,3,4,5].includes(score)){
      addMessage("bot","1~5 숫자로 답변해주세요!");
      return;
    }
    answers.push(score);
    currentQuestion++;
    askNextQuestion();
    return;
  }

  const res = await fetch(API_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ messages:[...conversation,{role:"user",content:text}] })
  });
  const data = await res.json();
  addMessage("bot", data.reply || "AI가 응답하지 않았습니다");
  conversation.push({role:"user",content:text});
  conversation.push({role:"assistant",content:data.reply || ""});
}

testBtn.addEventListener('click', async ()=>{
  addMessage("bot","심리 테스트 문제 생성 중...");
  const res = await fetch(API_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ messages:[...conversation,{role:"user",content:"10개의 심리 테스트 문제(JSON) 생성"}] })
  });
  const data = await res.json();
  try{
    testQuestions = JSON.parse(data.reply);
    testMode=true; currentQuestion=0; answers=[];
    addMessage("bot","테스트 시작! 1~5 점으로 답하세요.");
    askNextQuestion();
  }catch{
    addMessage("bot","문제 생성 실패, 다시 시도해주세요.");
  }
});

function askNextQuestion(){
  if(currentQuestion>=testQuestions.length){ endTest(); return; }
  const q = testQuestions[currentQuestion];
  addMessage("bot", `문제 ${currentQuestion+1}: ${q.text} (1~5점)`);
}

async function endTest(){
  testMode=false;
  addMessage("bot","테스트 완료, 분석 보고서 생성 중...");
  const reportPrompt = `심리 테스트 문제와 답변:\n${testQuestions.map((q,i)=>`${q.id}.${q.text}→${answers[i]}`).join("\n")}\n따뜻하고 구조적인 심리 분석 보고서 생성`;
  const res = await fetch(API_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ messages:[...conversation,{role:"user",content:reportPrompt}] })
  });
  const data = await res.json();
  addMessage("bot", data.reply || "보고서 생성 실패");
  conversation.push({role:"assistant", content:data.reply || ""});
}
