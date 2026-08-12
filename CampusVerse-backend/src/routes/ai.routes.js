import express from "express";
import { askAI } from "../utils/aiService.js";
import { protect } from "../middlewares/authMiddleware.js";
import College from "../models/College.model.js";

const router = express.Router();

// 1. General Chat / Assistant
router.post("/chat", protect, async (req, res) => {
  try {
    const { message, currentPath = "/dashboard" } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Query database to fetch dynamic campus context
    const collegesList = await College.find({}, "collegeName students");
    const statsSummary = collegesList
      .map(c => `"${c.collegeName}" has ${c.students?.length || 0} registered student(s)`)
      .join(", ");

    const systemPrompt = `You are a helpful academic assistant inside the CampusVerse network. 
The user is currently viewing the page path: "${currentPath}".
Current database status:
- Total registered colleges: ${collegesList.length}
- Campus enrollment status: ${statsSummary || "No campuses registered yet"}.

Analyze the user's message:
1. If the user wants to filter, search, or find specific items/colleges/notes on their CURRENT page, output a JSON object containing:
   "reply": A brief friendly response confirming the filter (under 2 sentences).
   "filter": The specific keyword/criteria to search/filter (e.g., "colleges with 2 students", "exam papers", "Priya").
2. If the user wants to navigate to another page, output:
   "reply": A brief friendly response confirming the redirection.
   "route": The target route path (one of "/dashboard", "/feed", "/notes", "/marketplace", "/queries", "/chat", "/profile", "/connections", "/events").
3. Otherwise, just output a conversational response:
   "reply": Your friendly answer directly referencing the database context when asked about system stats. Keep it under 3 sentences.

Respond ONLY with a JSON object in this format:
{
  "reply": "...",
  "filter": "..." (optional),
  "route": "..." (optional)
}`;

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      { role: "user", content: message }
    ];

    const replyText = await askAI(messages, "json");
    
    let replyJson;
    try {
      replyJson = JSON.parse(replyText);
    } catch {
      // Regex parsing fallback
      const filterMatch = replyText.match(/"filter":\s*"([^"]+)"/);
      const routeMatch = replyText.match(/"route":\s*"([^"]+)"/);
      const replyMatch = replyText.match(/"reply":\s*"([^"]+)"/);
      replyJson = {
        reply: replyMatch ? replyMatch[1] : replyText,
        filter: filterMatch ? filterMatch[1] : undefined,
        route: routeMatch ? routeMatch[1] : undefined
      };
    }

    res.json(replyJson);
  } catch (error) {
    console.error("AI Chat Route Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// 2. Smart Natural Language Navigation
router.post("/navigate", protect, async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ message: "Command is required" });
    }

    const messages = [
      {
        role: "system",
        content: `You are a navigation router assistant for the CampusVerse web app.
Your task is to analyze the user's natural language input and map it to one of these routes:
- "/dashboard" (stats, campus dashboard)
- "/feed" (general announcement posts, feed, campus updates)
- "/notes" (study materials, lecture notes, exam vault, pdfs)
- "/marketplace" (buying and selling books, peer marketplace, calculator trading)
- "/queries" (doubt solving, homework queries, Q&A forum)
- "/chat" (messaging classmates, private messaging)
- "/profile" (checking personal profile, identity details)
- "/connections" (friends directory, request connections)
- "/events" (seminars, campus workshops, events directory)

Respond ONLY with a JSON object in the following format:
{
  "route": "/matching-route",
  "explanation": "Brief explanation of where you are taking them"
}`
      },
      { role: "user", content: command }
    ];

    const replyText = await askAI(messages, "json");
    
    // Parse response
    let replyJson;
    try {
      replyJson = JSON.parse(replyText);
    } catch {
      // Regex parse fallback if the model returned wrapped markdown or plain text
      const routeMatch = replyText.match(/"route":\s*"([^"]+)"/);
      const explanationMatch = replyText.match(/"explanation":\s*"([^"]+)"/);
      replyJson = {
        route: routeMatch ? routeMatch[1] : "/dashboard",
        explanation: explanationMatch ? explanationMatch[1] : "Parsed fallback."
      };
    }

    res.json(replyJson);
  } catch (error) {
    console.error("AI Navigate Route Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// 3. Smart Search Query Parser (Human-level language filters)
router.post("/parse-search", protect, async (req, res) => {
  try {
    const { query, context } = req.body;
    if (!query || !context) {
      return res.status(400).json({ message: "Query and Context are required" });
    }

    const systemPrompt = `You are a smart search parser for the CampusVerse college network web application.
Your goal is to parse the user's natural language search query and convert it into a structured filter JSON object based on the context: "${context}".

Context schemas & formats to follow:

1. Context: "dashboard"
Format:
{
  "search": "Standardized text query or parsed query condition e.g. 'colleges with 2 students'"
}

2. Context: "marketplace"
Available Categories: "All", "Textbooks", "Mattresses & Bedding", "Lab Coats & Gear", "Cycles & Transport", "Electronics", "Others"
Format:
{
  "search": "The core item keywords (e.g. 'calculus book' -> 'calculus')",
  "category": "One of the exact category strings above (defaults to 'All' if none match)",
  "location": "The parsed location if they specify a block or floor (defaults to 'All' or empty)"
}

3. Context: "notes"
Available Departments: "All", "Computer Science", "Information Technology", "Mechanical", "Electrical", "Electronics", "Civil", "Management", "Science & Arts"
Available Years: "All", "1st Year", "2nd Year", "3rd Year", "4th Year", "Postgrad"
Format:
{
  "search": "The core note subject keywords",
  "department": "One of the exact department strings above (defaults to 'All')",
  "year": "One of the exact year strings above (defaults to 'All')"
}

4. Context: "queries"
Available Tags: "All", "exams", "placements", "tech", "hostellife", "academics", "sports", "general"
Format:
{
  "search": "The core question keywords",
  "tag": "One of the exact tag strings above (defaults to 'All')",
  "myCollegeOnly": true/false (true only if user mentions 'my college', 'my campus', or 'locally')
}

5. Context: "connections"
Format:
{
  "search": "The user query (e.g. course name, branch, name keywords)"
}

Respond ONLY with a JSON object in the matching format. Do not write codeblocks, markdown, or chat explanations.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: query }
    ];

    const replyText = await askAI(messages, "json");
    
    let replyJson;
    try {
      replyJson = JSON.parse(replyText);
    } catch {
      // Direct regex parsing fallback
      const searchMatch = replyText.match(/"search":\s*"([^"]+)"/);
      const categoryMatch = replyText.match(/"category":\s*"([^"]+)"/);
      const deptMatch = replyText.match(/"department":\s*"([^"]+)"/);
      const yearMatch = replyText.match(/"year":\s*"([^"]+)"/);
      const tagMatch = replyText.match(/"tag":\s*"([^"]+)"/);
      replyJson = {
        search: searchMatch ? searchMatch[1] : query,
        category: categoryMatch ? categoryMatch[1] : "All",
        department: deptMatch ? deptMatch[1] : "All",
        year: yearMatch ? yearMatch[1] : "All",
        tag: tagMatch ? tagMatch[1] : "All"
      };
    }

    res.json(replyJson);
  } catch (error) {
    console.error("AI Search Parse Route Error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
