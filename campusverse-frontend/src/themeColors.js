/**
 * Centralized theme color manager for CampusVerse.
 * Controls color tokens for both Dark Mode and Light Mode.
 */
export const getThemeColors = (mode = "dark") => {
  const isDark = mode === "dark";

  return {
    isDark,
    mode,

    // Backgrounds
    bgDefault: isDark ? "#0B0F19" : "#F8FAFC",
    bgPaper: isDark ? "#0F172A" : "#FFFFFF",
    bgSurface: isDark ? "#0F172A" : "#FFFFFF",
    bgSurfaceAlt: isDark ? "#111827" : "#F1F5F9",
    // Specific Component Backgrounds (Feed Cards, Comments, Sub-Containers)
    feedCardBg: isDark ? "#0F172A" : "#FFFFFF",
    commentBg: isDark ? "rgba(15, 23, 42, 0.4)" : "#F8FAFC",
    pillBg: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.04)",
    pillHoverBg: isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.08)",

    // Typography / Text Colors
    textPrimary: isDark ? "#F8FAFC" : "#0F172A",
    textSecondary: isDark ? "#94A3B8" : "#475569",
    textMuted: isDark ? "#64748B" : "#64748B",
    textHeadline: isDark ? "#FFFFFF" : "#0F172A",
    subVerseTitle: isDark ? "#FFFFFF" : "#0F172A",
    inputText: isDark ? "#FFFFFF" : "#0F172A",

    // Borders & Dividers
    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
    borderHover: isDark ? "rgba(129, 140, 248, 0.35)" : "rgba(79, 70, 229, 0.35)",

    // Brand Colors
    primary: isDark ? "#818CF8" : "#4F46E5",
    primaryDark: isDark ? "#4F46E5" : "#3730A3",
    primaryLight: isDark ? "#A5B4FC" : "#6366F1",
    secondary: isDark ? "#EC4899" : "#DB2777",
    emerald: "#10B981",
    amber: "#F59E0B",
    purple: "#A78BFA",

    // Shadows
    cardShadow: isDark
      ? "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
      : "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
    boxShadow: isDark
      ? "0 25px 50px -12px rgba(0, 0, 0, 0.4)"
      : "0 10px 30px -10px rgba(0, 0, 0, 0.08)",
  };
};

export default getThemeColors;
