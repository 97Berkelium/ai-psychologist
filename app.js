// =============================
// 前端变量
// =============================
const chatBox = document.getElementById('chat-box');
const input = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const testBtn = document.getElementById('test-btn');
const langBtn = document.getElementById('lang-toggle');

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
]`
  }
];

// =============================
// 状态变量
// =============================
let testMode = false;
let testQuestions = [];
let currentQuestion = 0;
let answers = [];

let currentLang = 'zh'; // zh=中文, ko=韩文

// =============================
// 基本聊天 UI 输出
// =============================
function addMessage(role, text) {
  const el = document.createElement('p');
  el.textContent = (role === 'user' ? '👤 你：' : '🤖 咨询师：') + text;
  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// =============================
// 切换语言按钮
// =============================
langBtn.addEventListener('click', () => {
  currentLang = currentLang === 'zh' ? 'ko' : 'zh';
  langBtn.textContent = currentLang === 'zh' ? '🇨🇳' : '🇰🇷';
  addMessage('bot', `语言已切换为 ${currentLang === 'zh' ? '中文' : '韩文'}。`);
});

// =============================
// 请求 AI 生成题目
// =============================
async function generateQuestions() {
  const prompt = `请生成 10 道心理测验题，格式必须是 JSON 数组，不要添加任何解释或多余文字。
每题包括：id(数字)、text(题目内容)、dim(所属维度，如 personality/stress/emotion/selfAwareness)。
所有题目适合 1~5 分 Likert 作答。
请使用 ${currentLang === 'zh' ? '中文' : '韩文'}。`;

  const msg = [...conversation, { role: "user", content: prompt }];
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: msg })
  });
  const data = await res.json();
  const reply = data?.reply || data?.choices?.[0]?.message?.content;

  try {
    const parsed = JSON.parse(reply);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.error("AI JSON parse error", e);
  }

  addMessage("bot", currentLang === 'zh' ? "题目生成失败，请再试一次。" : "문제 생성에 실패했습니다. 다시 시도해주세요.");
  return null;
}

// =============================
// 开始心理测试
// =============================
testBtn.addEventListener('click', async () => {
  addMessage("bot", currentLang === 'zh' ? "正在为你生成心理测试题，请稍等…" : "심리 테스트 문제를 생성 중입니다…");

  const q = await generateQuestions();
  if (!q) return;

  testQuestions = q;
  testMode = true;
  currentQuestion = 0;
  answers = [];

  addMessage("bot", currentLang === 'zh' ? "测试已经开始！请用 1~5 分回答每一道题目。\n准备好了吗？我们开始 →" : "테스트가 시작되었습니다! 각 문항에 1~5점으로 답해주세요.\n준비되셨나요? 시작 →");
  askNextQuestion();
});

// =============================
// 显示下一题
// =============================
function askNextQuestion() {
  if (currentQuestion >= testQuestions.length) {
    endTest();
    return;
  }
  const q = testQuestions[currentQuestion];
  addMessage("bot", `第 ${currentQuestion + 1} 题：${q.text}\n(${currentLang === 'zh' ? "请回答 1~5 分" : "1~5점으로 답해주세요"})`);
}

// =============================
// 处理用户输入
// =============================
sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  // 测试模式下只接受 1~5
  if (testMode) {
    const score = Number(text);
    if (![1, 2, 3, 4, 5].includes(score)) {
      addMessage("bot", currentLang === 'zh' ? "请用 1~5 的数字回答喔！" : "1~5 숫자로 답해주세요!");
      return;
    }

    answers.push(score);
    currentQuestion++;
    askNextQuestion();
    return;
  }

  // 普通聊天
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

// =============================
// 测试结束 → AI 写报告
// =============================
async function endTest() {
  testMode = false;
  addMessage("bot", currentLang === 'zh' ? "题目全部完成，我正在为你撰写心理分析报告…" : "모든 문항이 완료되었습니다. 심리 분석 보고서를 작성 중…");

  const reportPrompt = `以下是用户的心理测验题与其给出的 1~5 分答案。请你生成一份温柔、不评判、结构清晰的心理分析报告，约 300 字。
请使用 ${currentLang === 'zh' ? '中文' : '韩文'}。

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
  conversation.push({ role: "assistant", content: reply });
}

