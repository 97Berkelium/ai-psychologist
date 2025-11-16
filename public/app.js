const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const testBtn = document.getElementById("test-btn");
const langBtn = document.getElementById("lang-btn");

let conversation = [
  {
    role:"system",
    content:`당신은 따뜻하고 공감적인 전문 심리상담사입니다. 필요시 1~5점 척도 심리검사 문항을 JSON으로 생성할 수 있습니다.`
  }
];

let testMode=false, testQuestions=[], currentQuestion=0, answers=[];

function addMessage(role,text){
  const el=document.createElement("div");
  el.className="message "+(role==="user"?"user":"bot");
  el.innerText=text;
  chatBox.appendChild(el);
  chatBox.scrollTop=chatBox.scrollHeight;
}

async function generateQuestions(){
  const prompt=`10개의 1~5점 심리 검사 문항을 JSON 배열로 생성하세요. 설명 없이 JSON만 출력. 각 문항: id, text, dim(personality/stress/emotion/selfAwareness)`;
  const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[...conversation,{role:"user",content:prompt}]})});
  const data=await res.json();
  try{return JSON.parse(data.reply);}catch(e){addMessage("bot","⚠ 검사 문항 생성 실패");return null;}
}

testBtn.addEventListener("click",async ()=>{
  addMessage("bot","검사 문항 생성중…");
  const q=await generateQuestions();
  if(!q)return;
  testQuestions=q; testMode=true; currentQuestion=0; answers=[];
  addMessage("bot","테스트 시작! 각 문항에 1~5로 답해주세요.");
  askNextQuestion();
});

function askNextQuestion(){
  if(currentQuestion>=testQuestions.length)return endTest();
  const q=testQuestions[currentQuestion];
  addMessage("bot",`문항 ${currentQuestion+1}: ${q.text}\n(1~5로 답해주세요)`);
}

sendBtn.addEventListener("click",sendMessage);
input.addEventListener("keypress",e=>{if(e.key==="Enter")sendMessage();});

async function sendMessage(){
  const text=input.value.trim();
  if(!text)return;
  addMessage("user",text);
  input.value="";
  if(testMode){
    const score=Number(text);
    if(![1,2,3,4,5].includes(score))return addMessage("bot","1~5 숫자로 답해주세요.");
    answers.push(score);
    currentQuestion++;
    return askNextQuestion();
  }
  const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[...conversation,{role:"user",content:text}]})});
  const data=await res.json();
  const reply=data.reply||"응답 없음";
  addMessage("bot",reply);
  conversation.push({role:"user",content:text});
  conversation.push({role:"assistant",content:reply});
}

async function endTest(){
  testMode=false;
  addMessage("bot","검사 완료. 분석 보고서를 생성중…");
  const reportPrompt=`사용자 심리 검사 응답: ${testQuestions.map((q,i)=>`${q.id}. ${q.text} → ${answers[i]}`).join("\n")}`;
  const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[...conversation,{role:"user",content:reportPrompt}]})});
  const data=await res.json();
  addMessage("bot",data.reply||"보고서 없음");
}

langBtn.addEventListener("click",()=>{addMessage("bot","현재 버전은 한국어만 지원합니다.");});
