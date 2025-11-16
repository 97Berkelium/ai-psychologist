const chatBox = document.getElementById('chat-box');
const input = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const testBtn = document.getElementById('test-btn');
const langBtn = document.getElementById('lang-btn');

const API_URL = "/api/chat";

let conversation = [
  { role: "system", content: "你是一位温柔、有共情力的心理咨询师，禁止提及自己是AI。" }
];

let testMode = false;
let testQuestions = [];
let currentQuestion = 0;
let answers = [];
let language = "zh"; // zh 或 ko

function addMessage(role, text) {
  const el = document.createElement('p');
  el.textContent = (role === "user" ? "👤 你：" : "🤖 咨询师：") + text;
  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 切换语言
langBtn.addEventListener('click', () => {
  language = language === "zh" ? "ko" : "zh";
  addMessage("bot", language === "zh" ? "已切换为中文" : "한국어로 전환되었습니다");
});

// 发送消息
sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keypress', e => { if(e.key==='Enter') sendMessage(); });

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  addMessage("user", text);
  input.value = "";

  if (testMode) {
    const score = Number(text);
    if (![1,2,3,4,5].includes(score)) {
      addMessage("bot","请用 1~5 的数字回答喔！");
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
    body: JSON.stringify({ messages: [...conversation,{role:"user",content:text}] })
  });

  const data = await res.json();
  const reply = data?.reply || "AI 没有回复";
  addMessage("bot", reply);
  conversation.push({role:"user", content:text});
  conversation.push({role:"assistant", content:reply});
}

// 测试逻辑
testBtn.addEventListener('click', async () => {
  addMessage("bot","正在生成心理测试题…");
  const res = await fetch(API_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ messages: [...conversation,{role:"user",content:"生成10道心理测试题(JSON)"}] })
  });
  const data = await res.json();
  try {
    testQuestions = JSON.parse(data.reply);
    testMode = true; currentQuestion=0; answers=[];
    addMessage("bot","测试开始！请用1~5分作答。");
    askNextQuestion();
  } catch {
    addMessage("bot","题目生成失败，请重试");
  }
});

function askNextQuestion() {
  if(currentQuestion>=testQuestions.length){endTest(); return;}
  const q = testQuestions[currentQuestion];
  addMessage("bot",`第${currentQuestion+1}题：${q.text} (1~5分)`);
}

async function endTest() {
  testMode = false;
  addMessage("bot","测试完成，正在生成分析报告…");
  const reportPrompt = `心理测验题与答案：\n${testQuestions.map((q,i)=>`${q.id}.${q.text}→${answers[i]}`).join("\n")}\n请生成温柔、结构清晰的心理分析报告`;
  const res = await fetch(API_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ messages: [...conversation,{role:"user",content:reportPrompt}] })
  });
  const data = await res.json();
  addMessage("bot", data.reply || "报告生成失败");
  conversation.push({role:"assistant", content:data.reply || ""});
}
