const fetch = require("node-fetch");
const fs = require("fs");
require("dotenv").config();

// Log the token length to verify it's loaded correctly (without revealing the full token)
const token = process.env.TELEGRAM_BOT_TOKEN || "";
console.log(
  `Token loaded: ${token.length > 0 ? "Yes" : "No"}, Length: ${token.length}`
);
console.log(
  `First 5 chars: ${token.substring(0, 5)}, Last 5 chars: ${token.substring(
    token.length - 5
  )}`
);

// Remove any quotes that might be included
const cleanToken = token.replace(/["']/g, "");
console.log(`Cleaned token length: ${cleanToken.length}`);

// Test API connection with the cleaned token
async function testConnection() {
  try {
    console.log("Testing Telegram API connection...");
    const response = await fetch(
      `https://api.telegram.org/bot${cleanToken}/getMe`,
      {
        method: "GET",
        timeout: 10000, // 10 seconds timeout
      }
    );

    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("API Response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Error connecting to Telegram API:", error.message);
    console.error("Error details:", error);
    return null;
  }
}

testConnection().then((result) => {
  if (result && result.ok) {
    console.log("Connection successful!");
  } else {
    console.log("Connection failed.");
  }
});
