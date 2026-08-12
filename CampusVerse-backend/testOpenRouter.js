import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY;
console.log("Key found:", apiKey ? `${apiKey.slice(0, 15)}...` : "None");

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function test() {
  const model = "openrouter/free";
  try {
    console.log(`Sending test request to OpenRouter using ${model}...`);
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: model,
        messages: [{ role: "user", content: "Hello" }]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "CampusVerse Test Script",
        },
        timeout: 15000
      }
    );
    console.log("✅ Success! Response data:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Error response:", error.response?.data || error.message);
  }
}

test();
