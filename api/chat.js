export default async function handler(req, res) {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return res.status(500).json({ error: "OPENAI_API_KEY 미설정" });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages))
    return res.status(400).json({ error: "Invalid request body" });

  const enhancedMessages = [
    { role: "system", content: "친절하고 공감력 있는 심리 상담사입니다. AI임을 언급하지 않습니다." },
    ...messages
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: enhancedMessages })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("OpenAI API error:", text);
    return res.status(500).json({ error: text });
  }

  const data = await response.json();
  res.status(200).json({ reply: data.choices?.[0]?.message?.content || "AI가 응답하지 않았습니다" });
}
