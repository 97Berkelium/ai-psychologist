import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages))
      return res.status(400).json({ error: "messages 必须是数组" });

    const enhancedMessages = [
      {
        role: "system",
        content: `
당신은 따뜻하고 공감적인 심리 상담사입니다.
사용자가 요청하면 1~5점 척도의 심리 검사 문항을 JSON 형식으로 생성할 수 있습니다.
`
      },
      ...messages
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: enhancedMessages
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "AI가 응답하지 않았습니다.";
    res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
}
