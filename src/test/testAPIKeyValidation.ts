import {
  checkAPIKeyProvider,
  isDeepSeekAPIKey,
  isGeminiAPIKey,
  getAPIKeyProvider,
  AIProvider,
} from "../utils/functions/index";

function testAPIKeyValidation() {
  console.log("🧪 Testing API Key Validation Functions\n");

  // Test cases
  const testCases = [
    // DeepSeek keys
    {
      key: "sk-1234567890abcdef",
      expected: AIProvider.DEEPSEEK,
      description: "Valid DeepSeek key",
    },
    {
      key: "sk-abcdefghijklmnopqrstuvwxyz123456",
      expected: AIProvider.DEEPSEEK,
      description: "Long DeepSeek key",
    },
    {
      key: "sk-123",
      expected: AIProvider.DEEPSEEK,
      description: "Short DeepSeek key (invalid)",
    },

    // Gemini keys
    {
      key: "AIzaSyDu3aSpT2NRASQAkTg78LfXLKL_P0i23RU",
      expected: AIProvider.GEMINI,
      description: "Valid Gemini key (39 chars)",
    },
    {
      key: "AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567",
      expected: AIProvider.GEMINI,
      description: "Valid Gemini key format",
    },
    {
      key: "AIzaSyTooShort",
      expected: AIProvider.GEMINI,
      description: "Short Gemini key (invalid)",
    },
    {
      key: "AIzaSyTooLongTooLongTooLongTooLongTooLong",
      expected: AIProvider.GEMINI,
      description: "Long Gemini key (invalid)",
    },

    // Invalid/Unknown keys
    {
      key: "",
      expected: AIProvider.UNKNOWN,
      description: "Empty key",
    },
    {
      key: "invalid-key-format",
      expected: AIProvider.UNKNOWN,
      description: "Unknown format",
    },
    {
      key: "openai-sk-1234567890",
      expected: AIProvider.UNKNOWN,
      description: "OpenAI-like key",
    },
  ];

  // Chạy test cases
  testCases.forEach((testCase, index) => {
    console.log(`📋 Test ${index + 1}: ${testCase.description}`);
    console.log(`Key: "${testCase.key}"`);

    const result = checkAPIKeyProvider(testCase.key);
    console.log(`Result: ${JSON.stringify(result, null, 2)}`);

    // Check specific functions
    console.log(`isDeepSeekAPIKey: ${isDeepSeekAPIKey(testCase.key)}`);
    console.log(`isGeminiAPIKey: ${isGeminiAPIKey(testCase.key)}`);
    console.log(`getAPIKeyProvider: ${getAPIKeyProvider(testCase.key)}`);

    // Validate result
    const isCorrect = result.provider === testCase.expected;
    console.log(`✅ Test ${isCorrect ? "PASSED" : "FAILED"}`);
    console.log("---\n");
  });

  // Test edge cases
  console.log("🔍 Testing Edge Cases:");

  console.log("1. Null/undefined:");
  try {
    console.log(checkAPIKeyProvider(null as any));
    console.log(checkAPIKeyProvider(undefined as any));
  } catch (error) {
    console.log("Error:", error);
  }

  console.log("\n2. Non-string types:");
  try {
    console.log(checkAPIKeyProvider(123 as any));
    console.log(checkAPIKeyProvider({} as any));
  } catch (error) {
    console.log("Error:", error);
  }

  console.log("\n3. Whitespace handling:");
  console.log(checkAPIKeyProvider("  sk-1234567890abcdef  "));
  console.log(
    checkAPIKeyProvider("  AIzaSyDu3aSpT2NRASQAkTg78LfXLKL_P0i23RU  ")
  );

  console.log("\n🎉 API Key validation tests completed!");
}

// Usage examples
function showUsageExamples() {
  console.log("\n📚 Usage Examples:\n");

  const deepseekKey = "sk-1234567890abcdefghijklmnopqrstuvwxyz";
  const geminiKey = "AIzaSyDu3aSpT2NRASQAkTg78LfXLKL_P0i23RU";

  console.log("// Example 1: Check API key provider");
  console.log(`const result = checkAPIKeyProvider("${deepseekKey}");`);
  console.log("Result:", checkAPIKeyProvider(deepseekKey));

  console.log("\n// Example 2: Quick boolean checks");
  console.log(
    `isDeepSeekAPIKey("${deepseekKey}"):`,
    isDeepSeekAPIKey(deepseekKey)
  );
  console.log(`isGeminiAPIKey("${geminiKey}"):`, isGeminiAPIKey(geminiKey));

  console.log("\n// Example 3: Get provider name");
  console.log(
    `getAPIKeyProvider("${deepseekKey}"):`,
    getAPIKeyProvider(deepseekKey)
  );
  console.log(
    `getAPIKeyProvider("${geminiKey}"):`,
    getAPIKeyProvider(geminiKey)
  );

  console.log("\n// Example 4: Use in API handler");
  console.log(`
app.post('/api/chat', (req, res) => {
  const { apiKey, message } = req.body;
  
  const keyCheck = checkAPIKeyProvider(apiKey);
  
  if (!keyCheck.isValid) {
    return res.status(400).json({
      error: keyCheck.message
    });
  }
  
  switch (keyCheck.provider) {
    case AIProvider.DEEPSEEK:
      // Use DeepSeek API
      break;
    case AIProvider.GEMINI:
      // Use Gemini API  
      break;
    default:
      return res.status(400).json({
        error: 'Unsupported AI provider'
      });
  }
});`);
}

// Chạy tests nếu file được gọi trực tiếp
if (require.main === module) {
  testAPIKeyValidation();
  showUsageExamples();
}

export { testAPIKeyValidation, showUsageExamples };
