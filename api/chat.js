export default async function handler(req,res){
  try{
    if(req.method!=="POST"){
      res.setHeader("Allow","POST");
      return res.status(405).json({error:"Method not allowed"});
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if(!OPENAI_KEY) return res.status(500).json({error:"Missing OPENAI_API_KEY"});

    const {messages} = req.body;
    if(!messages || !Array.isArray(messages)) return res.status(400).json({error:"Invalid request body"});

    const enhancedMessages = [
      {role:"system", content:"你是一位温柔、有共情力的心理咨询师，禁止提及自己是AI。"},
      ...messages
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${OPENAI_KEY}`
      },
      body:JSON.stringify({model:"gpt-4o-mini", messages:enhancedMessages})
    });

    if(!response.ok){
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return res.status(500).json({error:errorText});
    }

    const data = await response.json();
    res.status(200).json({reply:data.choices?.[0]?.message?.content || "AI 没有返回内容"});
  } catch(err){
    console.error("Server error:", err);
    res.status(500).json({error:err.message});
  }
}
