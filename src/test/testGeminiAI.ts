import GeminiAI from "../class/GeminiHandler";

async function testGeminiAI() {
  // Khởi tạo với API key từ env
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found in environment variables");
    return;
  }

  try {
    const gemini = new GeminiAI(apiKey);
    console.log("✅ GeminiAI instance created successfully");

    // Test 1: Validate API key
    console.log("\n🔑 Testing API key validation...");
    const isValid = await gemini.validateApiKey();
    console.log(`API Key valid: ${isValid ? "✅ Yes" : "❌ No"}`);

    if (!isValid) {
      console.error(
        "❌ API key validation failed. Please check your GEMINI_API_KEY"
      );
      return;
    }

    // Test 2: Simple chat
    console.log("\n💬 Testing simple chat...");
    const response1 = await gemini.chat(
      "Hello! Please respond with just 'Hi there!'"
    );
    console.log("Response:", response1);

    // Test 3: Chat with system message
    console.log("\n🤖 Testing chat with system message...");
    const response2 = await gemini.chat(
      "What is 2+2?",
      "You are a math teacher. Always explain your answers clearly."
    );
    console.log("Math Response:", response2);

    // Test 4: List available models
    console.log("\n📋 Available models:");
    const models = await gemini.listModels();
    console.log(models);

    // Test 5: Change model
    console.log("\n🔄 Testing model change...");
    gemini.setDefaultModel("gemini-1.5-flash");
    console.log("Current model:", gemini.getDefaultModel());

    console.log("\n🎉 All tests completed successfully!");
  } catch (error: any) {
    console.error("\n❌ Test failed:");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
  }
}

// Chạy test nếu file được gọi trực tiếp
if (require.main === module) {
  testGeminiAI();
}

export { testGeminiAI };
