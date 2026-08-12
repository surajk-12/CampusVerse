import axios from "axios";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Calls OpenRouter completions endpoint.
 * Bypasses key validation if a key isn't set (provides mock fallback response for testing).
 * 
 * @param {Array} messages - Chat context message history.
 * @param {string} responseFormat - "text" or "json".
 */
export const askAI = async (messages, responseFormat = "text") => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey.startsWith("sk-or-v1-your-actual-api-key")) {
    console.warn("⚠️  [AI] OPENROUTER_API_KEY is missing or using placeholder. Returning mock response.");
    
    // Simulate a smart assistant mock response
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    
    if (responseFormat === "json") {
      // Mock navigation classification logic
      let matchedRoute = "/dashboard";
      let explanation = "Returning to dashboard.";
      
      const cmd = lastUserMessage.toLowerCase();
      if (cmd.includes("note") || cmd.includes("book") || cmd.includes("pdf") || cmd.includes("study")) {
        matchedRoute = "/notes";
        explanation = "Redirected to study notes repository.";
      } else if (cmd.includes("market") || cmd.includes("buy") || cmd.includes("sell") || cmd.includes("price") || cmd.includes("trade")) {
        matchedRoute = "/marketplace";
        explanation = "Navigated to campus peer trade marketplace.";
      } else if (cmd.includes("query") || cmd.includes("doubt") || cmd.includes("ask") || cmd.includes("question") || cmd.includes("answer")) {
        matchedRoute = "/queries";
        explanation = "Navigated to peer Q&A platform.";
      } else if (cmd.includes("chat") || cmd.includes("message") || cmd.includes("friend")) {
        matchedRoute = "/chat";
        explanation = "Navigated to messages chat screen.";
      } else if (cmd.includes("connection") || cmd.includes("peer") || cmd.includes("request")) {
        matchedRoute = "/connections";
        explanation = "Redirected to student connections directory.";
      } else if (cmd.includes("profile") || cmd.includes("setting") || cmd.includes("me")) {
        matchedRoute = "/profile";
        explanation = "Opened your profile settings page.";
      } else if (cmd.includes("event") || cmd.includes("seminar") || cmd.includes("workshop")) {
        matchedRoute = "/events";
        explanation = "Opened upcoming campus events directory.";
      }
      
      return JSON.stringify({
        route: matchedRoute,
        explanation: `[MOCK AI] ${explanation}`
      });
    } else {
      return `[MOCK AI] You asked: "${lastUserMessage}". Setup your OPENROUTER_API_KEY in backend .env to interact with real Llama-3/Gemma AI models!`;
    }
  }

  // Try candidate free models sequentially in case one is offline/404
  const candidateModels = [
    "openrouter/free",
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "openai/gpt-oss-20b:free",
    "meta-llama/llama-3-8b-instruct:free"
  ];

  let lastErr = null;
  for (const model of candidateModels) {
    try {
      console.log(`🤖  [AI] Querying model candidate: ${model}`);
      const response = await axios.post(
        OPENROUTER_URL,
        {
          model: model,
          messages: messages,
          response_format: responseFormat === "json" ? { type: "json_object" } : undefined
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "CampusVerse Platform",
          },
          timeout: 10000 // 10s timeout
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (content) {
        console.log(`✅  [AI] Success with model: ${model}`);
        return content;
      }
    } catch (error) {
      lastErr = error.response?.data || error.message;
      console.warn(`⚠️  [AI] Model ${model} failed:`, lastErr);
    }
  }

  console.error("❌  [AI] All OpenRouter model candidates failed. Last error:", lastErr);
  throw new Error("Failed to process request with AI service.");
};
