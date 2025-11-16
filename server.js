const fs = require('fs');
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) {
  console.error("请在项目根目录创建 .env 并设置 OPENAI_API_KEY");
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// 请求限流
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: '请求过多，请稍后再试' }
});
app.use(limiter);

// 测试接口
app.get('/ping', (req, res) => res.json({ ok: true }));

// =============================
// 💬 聊天接口
// =============================
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages 必须是数组' });
    }

    // 在聊天中保持心理咨询师人格
    const enhancedMessages = [
      {
        role: "system",
        content: `
你是一位温柔、细腻、富有同理心的心理咨询师。
你的目标是陪伴、理解与引导，不是解决问题。
请在对话中使用温柔、共情的语气。
禁止提及自己是 AI，不进行医学诊断或药物推荐。
`
      },
      ...messages
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: enhancedMessages
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'AI 没有回复，请检查 API 连接。';
    res.json({ reply });

  } catch (err) {
    console.error("后端异常:", err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// =============================
// 🔊 语音合成接口
// =============================
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text 字段不能为空' });

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "verse",
        input: text
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: '语音合成失败: ' + errorText });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));

  } catch (err) {
    console.error("TTS 接口异常:", err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 首页访问
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

