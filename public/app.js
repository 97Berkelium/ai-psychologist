document.addEventListener("DOMContentLoaded", () => {

  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");

  let conversation = [{role:"system", content:"당신은 따뜻하고 공감적인 심리상담사입니다."}];

  function addMessage(role, text) {
    const el = document.createElement("div");
    el.className = "message " + (role === "user" ? "user" : "bot");
    el.innerText = text;
    chatBox.appendChild(el);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

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

  async function sendMessage() {
    const text = input.value.trim();
    if(!text) return;
    addMessage("user", text);
    input.value = "";

    const data = await fetchChat([...conversation, {role:"user", content:text}]);
    addMessage("bot", data.reply || "응답 없음");
    conversation.push({role:"user", content:text});
    conversation.push({role:"assistant", content:data.reply || ""});
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", e => { if(e.key === "Enter") sendMessage(); });

});
