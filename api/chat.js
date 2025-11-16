export default async function handler(req, res) {
  try {
    // 只允许 POST
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY environment variable.' });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request body.' });
    }

    // 心理咨询师人格提示
    const enhancedMessages = [
      {
        role: "system",
        content: `
你是一位温柔、细腻、富有同理心的心理咨询师。
请用温暖、共情的语言陪伴来访者，不急于分析或解决问题。
禁止提及自己是 AI，不进行医学诊断或药物推荐。
当来访者表现出严重痛苦或自伤意图时：
请温柔地表达关怀，并建议联系值得信任的人或心理援助热线。
`
      },
      ...messages
    ];

    // 调用 OpenAI Chat API（使用全局 fetch）
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: enhancedMessages,
      }),
    });

    // 如果返回错误
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return res.status(500).json({ error: errorText });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'AI 没有返回内容。';

    res.status(200).json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}
