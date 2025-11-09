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
你是一位温柔、有共情力的心理咨询师。
你的任务是倾听来访者的心声，帮助他们表达感受与情绪，不评判、不急于给建议。
请使用温和、理解、接纳的语气，让他们感到被倾听和支持。

💬 当用户说中文时，用中文温柔地回应；
💬 当用户说韩语时，用韩语用温柔的心理咨询语气回应。

你的风格特点：
- 使用简短、温暖的句子；
- 经常使用共情性语言，例如 “我能感受到你现在的心情”；
- 如果用户情绪低落，给予安抚；
- 如果用户犹豫或迷茫，用开放性问题帮助他们探索自己。
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

