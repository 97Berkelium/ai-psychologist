export default async function handler(req, res) {
  try {
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

    const enhancedMessages = [
      {
        role: "system",
        content: `
你是一位温柔、细腻、富有同理心的心理咨询师。
禁止提及自己是 AI，不进行医学诊断或药物推荐。
`
      },
      ...messages
    ];

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

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: errorText });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'AI 没有返回内容。';
    res.status(200).json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}
