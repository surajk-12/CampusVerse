import express from "express";
import asyncHandler from "express-async-handler";
import axios from "axios";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Local Rule-Based Keyword Matcher Fallback
function localFilterFallback(query, type, data) {
  const q = query.toLowerCase().trim();
  let filteredIds = [];
  let explanation = "";

  if (type === "market") {
    // Attempt to extract maximum price (e.g. "under $50" or "under 50" or "less than 30")
    let maxPrice = null;
    const underMatch = q.match(/(?:under|less than|below|\<\s*)\s*\$?(\d+)/i);
    if (underMatch) {
      maxPrice = parseFloat(underMatch[1]);
    }

    // Keyword categories matching
    const keywords = {
      textbooks: ["book", "textbook", "notes", "copy", "pdf"],
      bedding: ["mattress", "bed", "pillow", "sheet", "bedding"],
      gear: ["coat", "lab", "gear", "goggle", "glasses", "kit"],
      transport: ["cycle", "transport", "bike", "scooter", "ride"],
      electronics: ["laptop", "phone", "charger", "earphone", "mouse", "electronics"],
    };

    let targetCategory = null;
    for (const [cat, words] of Object.entries(keywords)) {
      if (words.some(word => q.includes(word))) {
        targetCategory = cat;
        break;
      }
    }

    filteredIds = data.filter(item => {
      let match = true;
      if (maxPrice !== null && item.price > maxPrice) {
        match = false;
      }
      if (targetCategory) {
        const itemCat = item.category?.toLowerCase() || "";
        const itemTitle = item.title?.toLowerCase() || "";
        const itemDesc = item.description?.toLowerCase() || "";

        // Check if item category or title/desc matches category keywords
        const catWords = keywords[targetCategory];
        const matchesCategory = itemCat.includes(targetCategory) || 
          catWords.some(w => itemTitle.includes(w) || itemDesc.includes(w));
        
        if (!matchesCategory) match = false;
      }
      // General textual search if not matched to category or just as addition
      if (!targetCategory && !maxPrice) {
        const searchTerms = q.split(/\s+/);
        const itemText = `${item.title} ${item.description} ${item.location} ${item.category}`.toLowerCase();
        match = searchTerms.every(term => itemText.includes(term));
      }
      return match;
    }).map(item => item.id);

    explanation = `[Local Search Fallback] Found ${filteredIds.length} items matching "${query}". Add your GEMINI_API_KEY to the .env file for smart AI understanding!`;

  } else if (type === "notes") {
    // Match department and year keywords
    const deptKeywords = {
      "Computer Science": ["cs", "cse", "computer", "coding", "programming"],
      "Information Technology": ["it", "information", "web"],
      "Mechanical": ["mech", "mechanical", "cad"],
      "Electrical": ["eee", "electrical", "power"],
      "Electronics": ["ece", "electronics", "circuit"],
      "Civil": ["civil", "concrete", "drawing"],
      "Management": ["mba", "management", "bba"],
      "Science & Arts": ["physics", "chemistry", "math", "arts", "science"],
    };

    let matchedDept = null;
    for (const [dept, keywords] of Object.entries(deptKeywords)) {
      if (keywords.some(k => q.includes(k)) || q.includes(dept.toLowerCase())) {
        matchedDept = dept;
        break;
      }
    }

    let matchedYear = null;
    if (q.includes("1st") || q.includes("first") || q.includes("year 1")) matchedYear = "1st Year";
    else if (q.includes("2nd") || q.includes("second") || q.includes("year 2")) matchedYear = "2nd Year";
    else if (q.includes("3rd") || q.includes("third") || q.includes("year 3")) matchedYear = "3rd Year";
    else if (q.includes("4th") || q.includes("fourth") || q.includes("year 4")) matchedYear = "4th Year";

    filteredIds = data.filter(res => {
      let match = true;
      if (matchedDept && res.department !== matchedDept) match = false;
      if (matchedYear && res.year !== matchedYear) match = false;
      if (!matchedDept && !matchedYear) {
        const searchTerms = q.split(/\s+/);
        const resText = `${res.title} ${res.description} ${res.tags}`.toLowerCase();
        match = searchTerms.every(term => resText.includes(term));
      }
      return match;
    }).map(res => res.id);

    explanation = `[Local Search Fallback] Found ${filteredIds.length} academic notes matching "${query}". Add your GEMINI_API_KEY to the .env file for smart AI understanding!`;

  } else if (type === "qna" || type === "queries") {
    const searchTerms = q.split(/\s+/);
    filteredIds = data.filter(item => {
      const itemText = `${item.title} ${item.description} ${item.tags?.join(" ")}`.toLowerCase();
      return searchTerms.every(term => itemText.includes(term));
    }).map(item => item.id || item._id);
    explanation = `[Local Search Fallback] Found ${filteredIds.length} discussions matching "${query}".`;
  } else if (type === "dashboard") {
    const searchTerms = q.split(/\s+/);
    filteredIds = data.filter(item => {
      const itemText = `${item.collegeName || item.name} ${item.city} ${item.state}`.toLowerCase();
      return searchTerms.every(term => itemText.includes(term));
    }).map(item => item.id || item._id);
    explanation = `[Local Search Fallback] Found ${filteredIds.length} campuses matching "${query}".`;
  } else if (type === "events") {
    const searchTerms = q.split(/\s+/);
    filteredIds = data.filter(item => {
      const itemText = `${item.title} ${item.description} ${item.location} ${item.category}`.toLowerCase();
      return searchTerms.every(term => itemText.includes(term));
    }).map(item => item.id || item._id);
    explanation = `[Local Search Fallback] Found ${filteredIds.length} events matching "${query}".`;
  } else if (type === "connections") {
    const searchTerms = q.split(/\s+/);
    filteredIds = data.filter(item => {
      const itemText = `${item.firstName} ${item.lastName} ${item.course} ${item.branch} ${item.email}`.toLowerCase();
      return searchTerms.every(term => itemText.includes(term));
    }).map(item => item.id || item._id);
    explanation = `[Local Search Fallback] Found ${filteredIds.length} connections matching "${query}".`;
  } else if (type === "chat") {
    const searchTerms = q.split(/\s+/);
    filteredIds = data.filter(item => {
      const itemText = `${item.firstName} ${item.lastName} ${item.course} ${item.branch}`.toLowerCase();
      return searchTerms.every(term => itemText.includes(term));
    }).map(item => item.id || item._id);
    explanation = `[Local Search Fallback] Found ${filteredIds.length} chats matching "${query}".`;
  } else {
    // Feed search fallback
    const searchTerms = q.split(/\s+/);
    filteredIds = data.filter(post => {
      const postText = `${post.title} ${post.content}`.toLowerCase();
      return searchTerms.every(term => postText.includes(term));
    }).map(post => post.id || post._id);

    explanation = `[Local Search Fallback] Found ${filteredIds.length} feed posts matching "${query}".`;
  }

  return { filteredIds, response: explanation };
}

// AI Copilot POST Endpoint
router.post(
  "/copilot",
  protect,
  asyncHandler(async (req, res) => {
    const { query, type, data } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Search query is required." });
    }

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ message: "No data context provided for filtering." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback directly to local rule-based match if API Key isn't configured
      const fallbackResult = localFilterFallback(query, type, data);
      return res.json(fallbackResult);
    }

    // Format data explanation and prompts depending on context type
    let systemInstruction = "";
    if (type === "market") {
      systemInstruction = "You are a campus marketplace shopping assistant. Filter the items based on what the user wants. Understand categories, price constraints (like 'under $25' or 'around $10'), locations, and conditions. Return a JSON object with 'filteredIds' (matching item IDs) and 'response' (a brief, helpful conversational reply under 2 sentences).";
    } else if (type === "notes") {
      systemInstruction = "You are a campus study notes/resource assistant. Filter the academic documents/notes by year, subject, department, or description terms. Return a JSON object with 'filteredIds' (matching note/resource IDs) and 'response' (a brief, helpful conversational reply under 2 sentences).";
    } else if (type === "feed") {
      systemInstruction = "You are a campus feed assistant. Filter posts by topics, content, or general interest. Return a JSON object with 'filteredIds' (matching post IDs) and 'response' (a brief, helpful conversational reply under 2 sentences).";
    } else if (type === "qna" || type === "queries") {
      systemInstruction = "You are a campus discussions Q&A forum assistant. Filter the questions by title, description, or tags according to what the user wants. Return a JSON object with 'filteredIds' (matching discussion IDs) and 'response' (a brief, helpful conversational reply under 2 sentences).";
    } else if (type === "dashboard") {
      systemInstruction = "You are a campus directory selector. Filter the colleges by collegeName, city, or location description terms. Return a JSON object with 'filteredIds' (matching college IDs) and 'response' (a brief, helpful conversational reply under 2 sentences).";
    } else if (type === "events") {
      systemInstruction = "You are a campus events coordinator. Filter the events list by title, description, location, or category according to the search query. Return a JSON object with 'filteredIds' (matching event IDs) and 'response' (a brief, helpful conversational reply under 2 sentences).";
    } else if (type === "connections") {
      systemInstruction = "You are a campus network assistant. Filter the friends list by firstName, lastName, course, branch, or email attributes. Return a JSON object with 'filteredIds' (matching classmate IDs) and 'response' (a brief, helpful conversational reply under 2 sentences).";
    } else if (type === "chat") {
      systemInstruction = "You are a campus messaging contact filter assistant. Filter the active chat contacts by participant firstName, lastName, course, or branch description terms. Return a JSON object with 'filteredIds' (matching user/friend IDs) and 'response' (a brief, helpful conversational reply under 2 sentences).";
    } else {
      systemInstruction = "You are a campus helper assistant. Filter the list items by match content keywords. Return a JSON object with 'filteredIds' (matching IDs) and 'response' (a brief conversational reply under 2 sentences).";
    }

    const promptText = `
System Guideline: ${systemInstruction}
Make sure you ONLY return a JSON object containing:
1. "filteredIds": array of strings (must be exact ID strings from the items list)
2. "response": string (brief, natural response telling the user what was found or offering helpful context)

Items List (JSON):
${JSON.stringify(data)}

User Query: "${query}"

Output (Return ONLY JSON, no markdown code block backticks):
`;

    try {
      // Direct axios call to Google Gemini 1.5 Flash API
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await axios.post(
        geminiUrl,
        {
          contents: [
            {
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        },
        { timeout: 8000 }
      );

      const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini API");
      }

      // Parse JSON
      const resultJson = JSON.parse(responseText.trim());
      res.json({
        filteredIds: resultJson.filteredIds || [],
        response: resultJson.response || "Here is what I found based on your request.",
      });

    } catch (err) {
      console.error("Gemini API call failed or returned invalid JSON. Falling back to local filter...", err.message);
      // Fallback to local matching logic if Gemini fails
      const fallbackResult = localFilterFallback(query, type, data);
      res.json(fallbackResult);
    }
  })
);

// AI Global Navigator POST Endpoint
router.post(
  "/global",
  protect,
  asyncHandler(async (req, res) => {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Command query is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Rule-based parsing fallback
      const q = query.toLowerCase().trim();
      let result = { action: "chat", reply: "I'm not sure how to help with that. Try typing 'go to marketplace', 'show notes', or 'logout'." };

      if (q.includes("logout") || q.includes("log out") || q.includes("sign out") || q.includes("exit")) {
        result = { action: "logout", reply: "Logging you out now. Goodbye!" };
      } else if (q.includes("feed") || q.includes("posts") || q.includes("announcement")) {
        result = { action: "navigate", path: "/feed", reply: "Navigating to your Campus Feed." };
      } else if (q.includes("market") || q.includes("shop") || q.includes("buy") || q.includes("sell") || q.includes("textbook") || q.includes("cycle")) {
        let searchQuery = "";
        const searchWords = ["find", "search", "show me", "get"];
        for (const word of searchWords) {
          if (q.startsWith(word)) {
            searchQuery = q.replace(word, "").trim();
            break;
          }
        }
        result = { 
          action: searchQuery ? "search" : "navigate", 
          path: "/marketplace", 
          searchQuery, 
          reply: searchQuery ? `Searching the marketplace for "${searchQuery}".` : "Opening the Campus Marketplace." 
        };
      } else if (q.includes("note") || q.includes("syllabus") || q.includes("question paper") || q.includes("resource")) {
        let searchQuery = "";
        const searchWords = ["find", "search", "show me", "get"];
        for (const word of searchWords) {
          if (q.startsWith(word)) {
            searchQuery = q.replace(word, "").trim();
            break;
          }
        }
        result = { 
          action: searchQuery ? "search" : "navigate", 
          path: "/notes", 
          searchQuery, 
          reply: searchQuery ? `Searching notes for "${searchQuery}".` : "Opening class notes and resources." 
        };
      } else if (q.includes("chat") || q.includes("message") || q.includes("inbox") || q.includes("messenger")) {
        result = { action: "navigate", path: "/chat", reply: "Opening your chat messenger." };
      } else if (q.includes("connection") || q.includes("friend") || q.includes("classmate")) {
        result = { action: "navigate", path: "/connections", reply: "Opening your classmate connections directory." };
      } else if (q.includes("notification") || q.includes("alert")) {
        result = { action: "navigate", path: "/notifications", reply: "Opening your notifications alerts." };
      } else if (q.includes("profile") || q.includes("my account") || q.includes("credentials")) {
        result = { action: "navigate", path: "/profile", reply: "Opening your profile dashboard." };
      } else if (q.includes("dashboard") || q.includes("home") || q.includes("stats")) {
        result = { action: "navigate", path: "/dashboard", reply: "Opening the main campus stats dashboard." };
      }

      return res.json(result);
    }

    // Gemini API Global Controller Prompt
    const promptText = `
You are the overall system AI controller for CampusVerse, a university campus application.
Your goal is to parse the user's natural language command and map it to an application action.
The available actions are:
1. "navigate": go to a page. Path values must be: "/dashboard", "/feed", "/marketplace", "/notes", "/chat", "/connections", "/notifications", "/profile".
2. "logout": log out the user from the application.
3. "search": go to a page and perform search. Path must be "/marketplace" or "/notes", and "searchQuery" must be set to the extracted item/topic to search (e.g. "cycles", "math notes").
4. "chat": when the user is just conversing, greeting, asking questions about the system, or typing commands not mapped above.

You must return a JSON object with:
- "action": string ("navigate", "logout", "search", "chat")
- "path": string (if action is navigate or search)
- "searchQuery": string (if action is search)
- "reply": string (brief, natural conversational reply explaining what you are doing or answering their message)

User Command: "${query}"

Return ONLY the JSON format, no backticks or markdown:
`;

    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await axios.post(
        geminiUrl,
        {
          contents: [
            {
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        },
        { timeout: 8000 }
      );

      const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini API");
      }

      const resultJson = JSON.parse(responseText.trim());
      res.json(resultJson);

    } catch (err) {
      console.error("Gemini global AI call failed, falling back to local matching...", err.message);
      res.json({ action: "chat", reply: "Connecting to campus assistant... (local fallback active). Try typing 'go to marketplace', 'open chats', or 'logout'." });
    }
  })
);

export default router;
