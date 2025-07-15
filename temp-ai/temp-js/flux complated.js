const apiKey = "AIzaSyDu3aSpT2NRASQAkTg78LfXLKL_P0i23RU";

// Ví dụ body đầy đủ với systemInstruction

// Hàm chatRes cải tiến với systemMessage
async function chatResWithSystem(userMessage, systemMessage = "") {
  const body = {
    contents: [
      {
        parts: [{ text: userMessage }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemMessage }],
    },
  };

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
// Test với systemMessage
chatResWithSystem(
  "Bạn là ai, bạn có phải là một chuyên gia công nghệ không?",
  "Bạn là 1 chuyên gia công nghệ, hãy trả lời chuyên nghiệp nhưng thân thiện"
)
  .then((response) => console.log("With system:", response))
  .catch((error) => console.error(error));
