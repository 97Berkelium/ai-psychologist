import fetch from "node-fetch";

export default async function handler(req,res){
  if(req.method !== "POST") return res.status(405).json({error:"Method not allowed"});

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if(!OPENAI_KEY) return res.status(500).json({error:"Missing OPENAI_API_KEY"});

  const {messages} = req.body;
  if(!messages || !Array.isArray(messages)) return res.status(400).json({error:"Invalid body"});

  const enhancedMessages = [
    {role:"system", content:"당신은 따뜻한 심리상담사입니다. 부드럽게 응답하세요."},
    ...messages
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST",
      headers: {
        "Content-Type":"application/json",
        "Authorization":`Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({model:"gpt-4o-mini", messages: enhancedMessages})
    });

    const data = await response.json();
    if(data.error) return res.status(500).json({error:data.error.message});

    res.status(200).json({reply: data.choices?.[0]?.message?.content || ""});

  } catch(e) {
    console.error(e);
    res.status(500).json({error:"Server error"});
  }
}
