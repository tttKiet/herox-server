const apiKey = "sk-57303afb6ae943e9b1ab0d38b974d4dc";
const prompt = "Tôi là ai";

const systemMessage = `
Your tone is always:
- Positive, open-minded, slightly geeky  
- Never robotic, never promotional  
`;
const body = {
  messages: [
    { role: "system", content: systemMessage },
    { role: "user", content: prompt },
  ],
  stream: false,
  model: "deepseek-chat",
};

async function fetchAI() {
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "Application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const resp = await res.json();
      const chatResp = resp.choices[0].message.content;
      console.log("resp: ", resp);

      return chatResp;
    } else {
      console.log("chatResp: ", chatResp);
      throw new Error("Đã có lỗi xảy ra gọi AI");
    }
  } catch (error) {
    console.log(error);
    throw new Error("Đã có lỗi xảy ra gọi AI: " + error?.message);
  }
}
