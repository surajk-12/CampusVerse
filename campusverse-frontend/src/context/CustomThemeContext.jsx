import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { getAppTheme } from "../theme.js";
import { getThemeColors } from "../themeColors.js";

const CustomThemeContext = createContext({
  mode: "dark",
  toggleTheme: () => {},
  setMode: () => {},
  colors: getThemeColors("dark"),
});

export function CustomThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try {
      const savedMode = localStorage.getItem("campusverse_theme");
      if (savedMode === "light" || savedMode === "dark") {
        return savedMode;
      }
    } catch (e) {
      console.error("Failed to read theme from localStorage", e);
    }
    return "dark"; // Default to dark mode
  });

  const setMode = (newMode) => {
    if (newMode !== "light" && newMode !== "dark") return;
    setModeState(newMode);
    try {
      localStorage.setItem("campusverse_theme", newMode);
    } catch (e) {
      console.error("Failed to save theme to localStorage", e);
    }
  };

  const toggleTheme = () => {
    setMode(mode === "dark" ? "light" : "dark");
  };

  const colors = useMemo(() => getThemeColors(mode), [mode]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", mode);
    root.classList.remove("dark", "light");
    root.classList.add(mode);

    // Set CSS custom properties on :root dynamically for global CSS
    Object.entries({
      "--bg-default": colors.bgDefault,
      "--bg-paper": colors.bgPaper,
      "--bg-card": colors.bgCard,
      "--text-primary": colors.textPrimary,
      "--text-secondary": colors.textSecondary,
      "--text-muted": colors.textMuted,
      "--border-color": colors.borderColor,
      "--input-bg": colors.bgInput,
      "--input-text": colors.inputText,
    }).forEach(([prop, val]) => {
      root.style.setProperty(prop, val);
    });

    // Synchronize body style background and color for smooth transition
    document.body.style.backgroundColor = colors.bgDefault;
    document.body.style.color = colors.textPrimary;
  }, [mode, colors]);

  const appTheme = useMemo(() => getAppTheme(mode), [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleTheme,
      setMode,
      isDark: mode === "dark",
      colors,
    }),
    [mode, colors]
  );

  return (
    <CustomThemeContext.Provider value={value}>
      <MuiThemeProvider theme={appTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </CustomThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(CustomThemeContext);
}
