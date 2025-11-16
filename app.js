// ------------------ 基础元素 ------------------
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const testBtn = document.getElementById("test-btn");
const langBtn = document.getElementById("lang-btn");

let currentLang = "ko";

const API_URL = "/api/chat";

let conversation = [
  {
    role: "system",
    content: `
당신은 따뜻하고 공감적인 전문 심리상담사입니다.
사용자가 요청하면 1~5점 척도의 심리 검사 문항을 JSON 형식으로 생성할 수 있습니다.
JSON 예시:
[
  {"id":1, "text":"질문", "dim":"personality"},
  ...
]
`
  }
];

// ------------------ 测试状态 ------------------
let testMode = false;
let testQuestions = [];
let currentQuestion = 0;
let answers = [];

// ------------------ UI 渲染 ------------------
function addMessage(role, text) {
  const el = document.createElement("div");
  el.className = "message " + (role === "user" ? "user" : "bot");
  el.innerText = text;
  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ------------------ 生成测试题 ------------------
async function generateQuestions() {
  const prompt = `
10개의 1~5점 심리 검사 문항을 JSON 배열로 생성하세요.
설명 없이 오직 JSON만 출력하세요.
각 문항: id, text, dim(personality/stress/emotion/selfAwareness)
`;

  const msg = [...conversation, { role: "user", content: prompt }];
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: msg })
  });

  const data = await res.json();
  const reply = data.reply || data.choices?.[0]?.message?.content;

  try {
    return JSON.parse(reply);
  } catch {
    addMessage("bot", "⚠ 검사 문항 생성에 실패했습니다. 다시 시도해주세요.");
    return null;
  }
}

// ------------------ 开始测试 ------------------
testBtn.addEventListener("click", async () => {
  addMessage("bot", "심리 검사 문항을 생성하고 있습니다…");

  const q = await generateQuestions();
  if (!q) return;

  testQuestions = q;
  testMode = true;
  currentQuestion = 0;
  answers = [];

  addMessage("bot", "테스트를 시작합니다! 각 문항에 1~5로 답해주세요.");
  askNextQuestion();
});

// ------------------ 显示下一题 ------------------
function askNextQuestion() {
  if (currentQuestion >= testQuestions.length) return endTest();

  const q = testQuestions[currentQuestion];
  addMessage("bot", `문항 ${currentQuestion + 1}: ${q.text}\n(1~5로 답해주세요)`);
}

// ------------------ 发送消息 ------------------
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  if (testMode) {
    const score = Number(text);

    if (![1,2,3,4,5].includes(score)) {
      return addMessage("bot", "1~5 사이의 숫자로 답해주세요.");
    }

    answers.push(score);
    currentQuestion++;
    return askNextQuestion();
  }

  // Chat API
  const msg = [...conversation, { role: "user", content: text }];
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ messages: msg })
  });

  const data = await res.json();
  const reply = data.reply || data.choices?.[0]?.message?.content;
  addMessage("bot", reply);

  conversation.push({ role: "user", content: text });
  conversation.push({ role: "assistant", content: reply });
}

// ------------------ 测试结束：生成报告 ------------------
async function endTest() {
  testMode = false;

  addMessage("bot", "검사가 완료되었습니다. 분석 보고서를 생성합니다…");

  const reportPrompt = `
다음은 사용자의 심리 검사 응답입니다.
1~5점 척도이며, 부드럽고 비판적이지 않은 분석 보고서를 300자 내외로 생성하세요:

${testQuestions.map((q, i)=>`${q.id}. ${q.text} → ${answers[i]}`).join("\n")}
`;

  const msg = [...conversation, { role:"user", content: reportPrompt }];
  const res = await fetch(API_URL, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ messages: msg })
  });

  const data = await res.json();
  addMessage("bot", data.reply || data.choices?.[0]?.message?.content);
}

// ------------------ 语言按钮（预留，可扩展） ------------------
langBtn.addEventListener("click", () => {
  addMessage("bot", "현재 버전에서는 한국어만 지원합니다.");
});
