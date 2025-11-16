document.addEventListener("DOMContentLoaded", () => {

  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const testBtn = document.getElementById("test-btn");
  const langBtn = document.getElementById("lang-btn");

  let conversation = [{role:"system",content:"당신은 따뜻하고 공감적인 심리상담사입니다."}];

  let testMode = false, testQuestions = [], currentQuestion = 0, answers = [];

  function addMessage(role, text) {
    const el = document.createElement("div");
    el.className = "message " + (role === "user" ? "user" : "bot");
    el.innerText = text;
    chatBox.appendChild(el);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // 安全的 fetch 封装
  async function fetchChat(messages) {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({messages})
      });

      const contentType = res.headers.get("content-type");
      if(!contentType || !contentType.includes("application/json")){
        const text = await res.text();
        addMessage("bot","⚠ 서버 응답이 JSON이 아닙니다");
        console.error(text);
        return {reply:"서버 응답 오류"};
      }

      const data = await res.json();
      return data;

    } catch(e) {
      console.error(e);
      addMessage("bot","⚠ 서버 통신 실패");
      return {reply:"서버 오류 발생"};
    }
  }

  async function generateQuestions() {
    const prompt = `
10개의 심리 검사 문항을 JSON 배열로 생성하세요. 
각 문항은 반드시 id와 text 속성을 가져야 합니다.
예시:
[
  {"id":1,"text":"당신은 종종 스트레스를 느끼나요?"},
  {"id":2,"text":"타인과 쉽게 소통할 수 있나요?"}
]
JSON만 출력.
`;
    const data = await fetchChat([...conversation,{role:"user",content:prompt}]);
    try {
      return JSON.parse(data.reply);
    } catch(e) {
      addMessage("bot","⚠ 검사 문항 생성 실패");
      return null;
    }
  }

  testBtn.addEventListener("click", async () => {
    addMessage("bot", "검사 문항 생성중…");
    const q = await generateQuestions();
    if(!q) return;
    testQuestions = q; testMode = true; currentQuestion = 0; answers = [];
    addMessage("bot","테스트 시작! 각 문항에 1~5로 답해주세요.");
    askNextQuestion();
  });

  function askNextQuestion() {
    if(currentQuestion >= testQuestions.length) return endTest();
    const q = testQuestions[currentQuestion];
    addMessage("bot", `문항 ${currentQuestion + 1}: ${q.text} (1~5)`);
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", e => { if(e.key === "Enter") sendMessage(); });

  async function sendMessage() {
    const text = input.value.trim();
    if(!text) return;
    addMessage("user", text);
    input.value = "";

    if(testMode) {
      const score = Number(text);
      if(![1,2,3,4,5].includes(score)) {
        return addMessage("bot","1~5 숫자로 답해주세요.");
      }
      answers.push(score);
      currentQuestion++;
      return askNextQuestion();
    }

    const data = await fetchChat([...conversation,{role:"user",content:text}]);
    addMessage("bot", data.reply || "응답 없음");
    conversation.push({role:"user",content:text});
    conversation.push({role:"assistant",content:data.reply || ""});
  }

  async function endTest() {
    testMode = false;
    addMessage("bot","검사 완료. 보고서 생성중…");

    const reportPrompt = `
다음은 사용자의 심리 검사 결과입니다. 각 질문 점수를 기반으로
- 성격 유형
- 스트레스 수준
- 감정 관리 능력
- 자기 인식 수준

에 대해 분석하고 점수와 간단한 코멘트를 작성해주세요.

사용자 응답:
${testQuestions.map((q,i)=>`${q.id}. ${q.text} → ${answers[i]}`).join("\n")}
`;

    const data = await fetchChat([...conversation,{role:"user",content:reportPrompt}]);
    addMessage("bot", data.reply || "보고서 없음");
    conversation.push({role:"user",content:reportPrompt});
    conversation.push({role:"assistant",content:data.reply || ""});
  }

  langBtn.addEventListener("click", () => {
    addMessage("bot","현재 버전은 한국어만 지원합니다. 中文显示示例暂不支持。");
  });

});
