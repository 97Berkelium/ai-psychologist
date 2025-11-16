// Updated app.js with AI-generated test questions and a separate "Start Test" button
// NOTE: This is a scaffold. You'll need to integrate with your existing HTML/CSS.

/*
====================================================
  UI: Add a "开始心理测试" button next to the chat box
====================================================
  <div class="controls">
    <button id="test-btn">🧪 开始心理测试</button>
  </div>
====================================================
*/

const chatBox = document.getElementById('chat-box');
const input = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const testBtn = document.getElementById('test-btn');

const API_URL = "/api/chat";

let conversation = [
  {
    role: "system",
    content: `你是一位温柔、专业、有共情力的心理咨询师。
你可以在需要时「自动生成心理测试题」，每道题需为 1~5 分量表题。
当你生成题目时，格式必须为严格的 JSON：
[
  {
    "id": 1,
    "text": "问题内容",
    "dim": "维度名称"
  }, ...
]
`
  }
];

//-----------------------------------------------------
// 状态：测试模式
//-----------------------------------------------------
let testMode = false;
let testQuestions = []; // AI 自动生成
let currentQuestion = 0;
let answers = [];

//-----------------------------------------------------
// 基本聊天 UI 输出
//-----------------------------------------------------
function addMessage(role, text) {
  const el = document.createElement('div');
  el.className = 'message ' + (role === 'user' ? 'user' : 'bot');
  el.innerText = text;
  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
}

//-----------------------------------------------------
// 请求 AI 生成题目
//-----------------------------------------------------
async function generateQuestions() {
  const prompt = `请生成 10 道心理测验题，格式必须是 JSON 数组，不要添加任何解释或多余文字。
每题包括：id(数字)、text(题目内容)、dim(所属维度，如 personality/stress/emotion/selfAwareness)。
所有题目必须适合 1~5 分 Likert 作答。只返回 JSON。`;

  const msg = [...conversation, { role: "user", content: prompt }];
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: msg })
  });
  const data = await res.json();
  const reply = data?.reply || data?.choices?.[0]?.message?.content;

  // 尝试解析 JSON
  try {
    const parsed = JSON.parse(reply);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.error("AI JSON parse error", e);
  }

  addMessage("bot", "题目生成失败，请再试一次。");
  return null;
}

//-----------------------------------------------------
// 开始测试
//-----------------------------------------------------
testBtn.addEventListener('click', async () => {
  addMessage("bot", "正在为你生成心理测试题，请稍等…");

  const q = await generateQuestions();
  if (!q) return;

  testQuestions = q;
  testMode = true;
  currentQuestion = 0;
  answers = [];

  addMessage("bot", "测试已经开始！请用 1~5 分回答每一道题目。\n准备好了吗？我们开始 →");
  askNextQuestion();
});

//-----------------------------------------------------
// 显示下一题
//-----------------------------------------------------
function askNextQuestion() {
  if (currentQuestion >= testQuestions.length) {
    endTest();
    return;
  }
  const q = testQuestions[currentQuestion];
  addMessage("bot", `第 ${currentQuestion + 1} 题：${q.text}\n(请回答 1~5 分)`);
}

//-----------------------------------------------------
// 处理用户发言
//-----------------------------------------------------
sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  // 如果在测试模式 → 只接受 1~5
  if (testMode) {
    const score = Number(text);
    if (![1, 2, 3, 4, 5].includes(score)) {
      addMessage("bot", "请用 1~5 的数字回答喔！");
      return;
    }

    answers.push(score);
    currentQuestion++;
    askNextQuestion();
    return;
  }

  // ----------------- 普通 AI 对话 -----------------
  const messages = [...conversation, { role: "user", content: text }];

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages })
  });
  const data = await res.json();

  const reply = data?.reply || data?.choices?.[0]?.message?.content;
  addMessage("bot", reply);

  conversation.push({ role: "user", content: text });
  conversation.push({ role: "assistant", content: reply });
}

//-----------------------------------------------------
// 测试结束 → 请求 AI 写报告
//-----------------------------------------------------
async function endTest() {
  testMode = false;
  addMessage("bot", "题目全部完成，我正在为你撰写心理分析报告…");

  const reportPrompt = `以下是用户的心理测验题与其给出的 1~5 分答案。请你生成一份温柔、不评判、结构清晰的心理分析报告，约 300 字。

题目与回答：
${testQuestions.map((q, i) => `${q.id}. ${q.text} → ${answers[i]}`).join('\n')}`;

  const msg = [...conversation, { role: "user", content: reportPrompt }];
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: msg })
  });

  const data = await res.json();
  const reply = data?.reply || data?.choices?.[0]?.message?.content;

  addMessage("bot", reply);

  // 报告也加入 conversation
  conversation.push({ role: "assistant", content: reply });
}
