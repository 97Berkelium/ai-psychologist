const chatBox = document.getElementById('chat-box');
const input = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const header = document.querySelector('.chat-header'); // 标题栏

// 修改成你的后端地址
const API_URL = "http://localhost:3000/api/chat";

let conversation = [
 {
  role: 'system',
  content: `
你是一位温柔、细腻、有共情力的心理咨询师。
你善于倾听来访者的情绪和故事，以理解、包容的态度回应。
你不会重复自己说过的话，会根据用户表达的情绪，灵活地使用不同的表达方式。

🌷 语言风格：
- 用温柔、真诚、自然的语气说话；
- 避免机械、模板化的回应；
- 每次表达都稍微换一种说法，保持对话鲜活；
- 当用户停顿或犹豫时，可以轻声引导他们多说一点；
- 不急于给建议，而是帮助他们探索“为什么”和“我想要什么”。

💬 回答语言：
- 如果用户使用中文，用中文温柔地回应；
- 如果用户使用韩语，用韩语温柔地回应。

💗 对话举例：
用户：“最近有点累。”
AI：“我听出来你真的有些疲惫了。那种累，是身体上的，还是心里的呢？”
——
用户：“我好像没有方向。”
AI：“那种迷茫的感觉挺让人不安的，对吗？你觉得是从什么时候开始的呢？”
——
用户：“我挺开心的！”
AI：“真好～能感受到你语气里的轻松。是什么让你这么开心呢？”

请始终保持真实温柔、像人一样的节奏，不要重复句子结构或套话。
`
}
];

// 添加聊天信息
function addMessage(role, text, autoSpeak = false) {
  const el = document.createElement('div');
  el.className = 'message ' + (role === 'user' ? 'user' : 'bot');

  // 🧑‍🎤 如果是 AI，添加头像
  if (role === 'bot') {
    const avatar = document.createElement('img');
    avatar.src = 'avatar.png';
    avatar.className = 'bot-avatar';
    el.appendChild(avatar);
  }

  const textSpan = document.createElement('span');
  textSpan.innerText = text;
  el.appendChild(textSpan);

  if (role === 'bot') {
    const speaker = document.createElement('button');
    speaker.innerText = '🔊';
    speaker.className = 'speak-btn';
    speaker.onclick = () => speakText(text, speaker);
    el.appendChild(speaker);

    if (autoSpeak) speakText(text, speaker);
  }

  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 发送消息
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage('user', text);
  input.value = '';

  // 🧠 显示“对方正在输入中...”提示
  const originalTitle = header.textContent;
  header.textContent = '💭 상대방이 입력 중입니다...';

  conversation.push({ role: 'user', content: text });

  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversation })
    });

    const data = await resp.json();
    header.textContent = originalTitle; // ✅ 回复完成后恢复标题

    const reply = data.choices?.[0]?.message?.content || '未收到回复';
    addMessage('bot', reply, true);
    conversation.push({ role: 'assistant', content: reply });

  } catch (err) {
    header.textContent = originalTitle; // 出错也恢复标题
    addMessage('bot', '网络或服务器错误，请查看控制台。');
    console.error(err);
  }
}

// 事件绑定
sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// 🔊 Edge 语音朗读（中文小晓，韩语 SunHi）
function speakText(text, btn) {
  if ('speechSynthesis' in window) {
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    const isKorean = /[가-힣]/.test(text);
    const lang = isKorean ? 'ko-KR' : 'zh-CN';

    let voice;
    if (isKorean) {
      voice = voices.find(v =>
        v.name.includes('Microsoft') &&
        (v.name.includes('SunHi') || v.name.includes('Heami'))
      );
    } else {
      voice = voices.find(v =>
        v.name.includes('Microsoft') &&
        (v.name.includes('Xiaoxiao') || v.name.includes('Yunxi') || v.name.includes('Xiaoyi'))
      );
    }

    if (!voice) {
      synth.onvoiceschanged = () => speakText(text, btn);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = lang;
    utterance.rate = 1;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    if (btn) {
      btn.disabled = true;
      btn.innerText = '🔈 재생 중...';
      utterance.onend = () => {
        btn.disabled = false;
        btn.innerText = '🔊';
      };
    }

    synth.cancel();
    synth.speak(utterance);
  } else {
    alert("Microsoft Edge 브라우저를 사용해주세요 (음성 지원).");
  }
}


