import React, { useState } from "react";
import { TextField, InputAdornment, IconButton, Tooltip, CircularProgress } from "@mui/material";
import { SmartToy as RobotIcon, Search as SearchIcon, AutoAwesome as SparklesIcon } from "@mui/icons-material";
import api from "../api/axios";

export default function AISearchInput({
  placeholder = "Search...",
  context,
  onFilterApply,
  sx = {}
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      // Clear filters
      onFilterApply({ search: "", category: "All", department: "All", year: "All", tag: "All" });
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/ai/parse-search", {
        query: trimmed,
        context: context
      });
      
      onFilterApply(data);
    } catch (error) {
      console.error("AI Search Error:", error);
      // Fallback: apply the query directly to the search field
      onFilterApply({ search: trimmed, category: "All", department: "All", year: "All", tag: "All" });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <TextField
      placeholder={placeholder}
      variant="outlined"
      size="small"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={loading}
      sx={{
        "& .MuiOutlinedInput-root": {
          background: "rgba(129, 140, 248, 0.03)",
          borderRadius: "10px",
          border: "1px solid rgba(129, 140, 248, 0.25)",
          "& fieldset": { border: "none" },
          "&:hover": {
            border: "1px solid rgba(129, 140, 248, 0.45)",
          },
          "&.Mui-focused": {
            border: "1.5px solid #818CF8",
            boxShadow: "0 0 0 3px rgba(129, 140, 248, 0.15)",
          }
        },
        ...sx
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SparklesIcon sx={{ color: "#818CF8", fontSize: 16 }} />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            {loading ? (
              <CircularProgress size={16} sx={{ color: "#818CF8", mr: 1 }} />
            ) : (
              <Tooltip title="Ask AI to filter" placement="top">
                <IconButton onClick={handleSearch} size="small" sx={{ color: "#818CF8" }}>
                  <RobotIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </InputAdornment>
        )
      }}
    />
  );
}
