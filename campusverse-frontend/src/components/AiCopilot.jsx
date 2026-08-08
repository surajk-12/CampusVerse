import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  CircularProgress,
  IconButton,
  Paper,
  Chip,
} from "@mui/material";
import { AutoAwesome, Close, SmartToy } from "@mui/icons-material";
import api from "../api/axios.js";

export default function AiCopilot({ type, data, onAiFilter }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");

  const handleAiSearch = async (e, customQuery = null) => {
    if (e) e.preventDefault();
    const searchQuery = customQuery || query;
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);

      // Simplify the data array depending on the page type to minimize bandwidth/token usage
      let simplifiedData = [];
      if (type === "market") {
        simplifiedData = data.map((item) => ({
          id: item._id,
          title: item.title,
          description: item.description,
          price: item.price,
          category: item.category,
          condition: item.condition,
          location: item.campusLocation,
        }));
      } else if (type === "notes") {
        simplifiedData = data.map((res) => ({
          id: res._id,
          title: res.title,
          description: res.description,
          department: res.department,
          year: res.year,
          tags: res.tags,
        }));
      } else if (type === "feed") {
        simplifiedData = data.map((post) => ({
          id: post._id,
          title: post.title,
          content: post.content,
        }));
      } else if (type === "qna" || type === "queries") {
        simplifiedData = data.map((item) => ({
          id: item._id,
          title: item.title,
          description: item.description,
          tags: item.tags || [],
        }));
      } else if (type === "dashboard") {
        simplifiedData = data.map((c) => ({
          id: c._id,
          collegeName: c.collegeName || c.name,
          city: c.city || c.location,
          state: c.state,
          country: c.country,
          students: c.students || [],
        }));
      } else if (type === "events") {
        simplifiedData = data.map((ev) => ({
          id: ev._id,
          title: ev.title,
          description: ev.description,
          category: ev.category,
          location: ev.location,
        }));
      } else if (type === "connections") {
        simplifiedData = data.map((f) => ({
          id: f._id,
          firstName: f.firstName,
          lastName: f.lastName,
          course: f.course,
          branch: f.branch,
          email: f.email,
        }));
      } else if (type === "chat") {
        simplifiedData = data.map((f) => ({
          id: f._id,
          firstName: f.firstName,
          lastName: f.lastName,
          course: f.course,
          branch: f.branch,
        }));
      } else {
        simplifiedData = data.map((item) => ({
          id: item._id || item.id,
          ...item,
        }));
      }

      const { data: result } = await api.post("/ai/copilot", {
        query: searchQuery.trim(),
        type,
        data: simplifiedData,
      });

      setAiExplanation(result.response);
      onAiFilter(result.filteredIds, result.response);
    } catch (err) {
      console.error("AI copilot request failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setAiExplanation("");
    onAiFilter(null, "");
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    handleAiSearch(null, suggestion);
  };

  const getPromptSuggestions = () => {
    if (type === "dashboard") return ["Colleges with 2 students", "Delhi campuses", "IITs"];
    if (type === "market") return ["Cycles under $50", "Mattresses", "Hostel items"];
    if (type === "notes") return ["CSE resources", "1st Year notes", "Physics"];
    if (type === "feed") return ["Placement discussions", "Organizer updates"];
    if (type === "qna") return ["Exam queries", "Tech doubts"];
    if (type === "events") return ["Tech fests", "Sports events", "Upcoming cultural"];
    if (type === "connections") return ["CSE classmates", "IIT Delhi peers"];
    if (type === "chat") return ["Search friend", "IT department"];
    return [];
  };

  const getPlaceholderText = () => {
    if (type === "market") return "Ask AI (e.g. 'Cycles under $50 in North Hostel', 'Mattress in good condition')";
    if (type === "notes") return "Ask AI (e.g. 'CSE 1st Year notes', 'IT department subject codes')";
    if (type === "feed") return "Ask AI (e.g. 'posts about placements', 'hackathons and events')";
    if (type === "dashboard") return "Ask AI (e.g. 'colleges in Delhi', 'colleges with 2 students')";
    if (type === "qna" || type === "queries") return "Ask AI (e.g. 'doubts about physics weightage', 'exams tags')";
    if (type === "events") return "Ask AI (e.g. 'Tech events', 'upcoming sports hackathons')";
    if (type === "connections") return "Ask AI (e.g. 'CS branch students', 'Manish passing year')";
    if (type === "chat") return "Ask AI (e.g. 'friends in CSE', 'IT department classmates')";
    return "Ask AI...";
  };

  const suggestions = getPromptSuggestions();

  return (
    <Box sx={{ mb: 3 }}>
      <Paper
        component="form"
        onSubmit={(e) => handleAiSearch(e)}
        elevation={0}
        sx={{
          p: 1.5,
          border: "1px solid rgba(139, 92, 246, 0.25)",
          borderRadius: "16px",
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(139, 92, 246, 0.05)",
          transition: "all 0.3s ease-in-out",
          "&:hover, &:focus-within": {
            borderColor: "rgba(139, 92, 246, 0.5)",
            boxShadow: "0 8px 32px rgba(139, 92, 246, 0.15)",
          },
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <SmartToy sx={{ color: "rgba(139, 92, 246, 0.8)", fontSize: 24, ml: 1 }} />
            <TextField
              placeholder={getPlaceholderText()}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              fullWidth
              size="small"
              variant="standard"
              InputProps={{
                disableUnderline: true,
                style: {
                  color: "#FFFFFF",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                },
              }}
            />
            {query && (
              <IconButton onClick={handleClear} size="small" sx={{ color: "text.secondary" }}>
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            )}
            <IconButton
              type="submit"
              disabled={loading || !query.trim()}
              size="small"
              sx={{
                width: 32,
                height: 32,
                background: loading || !query.trim()
                  ? "rgba(255,255,255,0.03)"
                  : "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
                color: loading || !query.trim() ? "rgba(255,255,255,0.2)" : "#FFFFFF",
                boxShadow: loading || !query.trim() ? "none" : "0 4px 10px rgba(139, 92, 246, 0.2)",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  background: "linear-gradient(135deg, #4F46E5 0%, #9333EA 100%)",
                  transform: "scale(1.05)",
                  boxShadow: "0 6px 15px rgba(139, 92, 246, 0.3)",
                },
                "&.Mui-disabled": {
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.2)",
                }
              }}
            >
              {loading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <AutoAwesome sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Stack>

          {/* Prompt Suggestions */}
          {suggestions.length > 0 && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", gap: 1, pl: 6.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem", fontWeight: 700 }}>
                Try:
              </Typography>
              {suggestions.map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  size="small"
                  sx={{
                    cursor: "pointer",
                    height: 20,
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    bgcolor: "rgba(255, 255, 255, 0.03)",
                    color: "text.secondary",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      bgcolor: "rgba(139, 92, 246, 0.08)",
                      borderColor: "rgba(139, 92, 246, 0.3)",
                      color: "primary.light",
                    },
                  }}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* AI Explanation Banner */}
      {aiExplanation && (
        <Paper
          elevation={0}
          sx={{
            mt: 1.5,
            p: 2,
            border: "1px dashed rgba(16, 185, 129, 0.25)",
            borderRadius: "12px",
            bgcolor: "rgba(16, 185, 129, 0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Stack direction="row" spacing={1.5}>
            <AutoAwesome sx={{ color: "#10B981", fontSize: 18, mt: 0.2 }} />
            <Box>
              <Typography variant="caption" fontWeight={800} color="#10B981" display="block" sx={{ textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.3 }}>
                AI Filter Applied
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem", lineHeight: 1.4 }}>
                {aiExplanation}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={handleClear} size="small" sx={{ color: "#10B981", mt: -0.5 }}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Paper>
      )}
    </Box>
  );
}
