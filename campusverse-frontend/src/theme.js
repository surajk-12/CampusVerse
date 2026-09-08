import { createTheme } from "@mui/material/styles";

export const getAppTheme = (mode = "dark") => {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? "#818CF8" : "#4F46E5", // Indigo main
        light: isDark ? "#A5B4FC" : "#6366F1",
        dark: isDark ? "#4F46E5" : "#3730A3",
        contrastText: "#ffffff",
      },
      secondary: {
        main: isDark ? "#EC4899" : "#DB2777", // Vibrant Pink
        light: isDark ? "#F472B6" : "#F472B6",
        dark: isDark ? "#BE185D" : "#9D174D",
        contrastText: "#ffffff",
      },
      background: {
        default: isDark ? "#0B0F19" : "#F8FAFC", // Deep Space Dark vs Soft Light Slate
        paper: isDark ? "#0F172A" : "#FFFFFF",   // Slate surface vs Pure White
      },
      text: {
        primary: isDark ? "#F8FAFC" : "#0F172A",   // High contrast text
        secondary: isDark ? "#94A3B8" : "#475569", // Muted slate text
      },
      success: {
        main: "#10B981", // Emerald
        light: "#34D399",
        dark: "#065F46",
      },
      warning: {
        main: "#F59E0B",
      },
      divider: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
    },
    typography: {
      fontFamily: "'Inter', 'Poppins', 'Outfit', sans-serif",
      h1: {
        fontWeight: 900,
        fontSize: "3.5rem",
        letterSpacing: "-0.02em",
        color: isDark ? "#FFFFFF" : "#0F172A",
      },
      h2: {
        fontWeight: 800,
        letterSpacing: "-0.01em",
        color: isDark ? "#818CF8" : "#4F46E5",
      },
      h4: {
        fontWeight: 800,
        letterSpacing: "-0.01em",
        color: isDark ? "#F8FAFC" : "#0F172A",
      },
      h5: {
        fontWeight: 800,
        color: isDark ? "#F8FAFC" : "#0F172A",
      },
      h6: {
        fontWeight: 700,
        color: isDark ? "#F8FAFC" : "#0F172A",
      },
      button: {
        textTransform: "none",
        fontWeight: 700,
        letterSpacing: "0.02em",
      },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? "#0B0F19" : "#F8FAFC",
            color: isDark ? "#F8FAFC" : "#0F172A",
            transition: "background-color 0.3s ease, color 0.3s ease",
            scrollbarColor: isDark
              ? "rgba(255, 255, 255, 0.15) transparent"
              : "rgba(0, 0, 0, 0.2) transparent",
            "&::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.2)",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.35)",
            },
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            color: isDark ? "#F8FAFC" : "#0F172A",
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: isDark ? "#94A3B8" : "#475569",
            "&.Mui-focused": {
              color: isDark ? "#818CF8" : "#4F46E5",
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            transition: "all 0.2s ease-in-out",
            boxShadow: isDark
              ? "0 4px 6px -1px rgba(0, 0, 0, 0.12)"
              : "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            ":hover": {
              transform: "translateY(-1px)",
              boxShadow: isDark
                ? "0 10px 15px -3px rgba(0, 0, 0, 0.25)"
                : "0 8px 12px -2px rgba(0, 0, 0, 0.1)",
            },
          },
          sizeSmall: {
            padding: "4px 12px",
            fontSize: "0.72rem",
          },
          sizeMedium: {
            padding: "6px 16px",
            fontSize: "0.82rem",
          },
          sizeLarge: {
            padding: "9px 22px",
            fontSize: "0.9rem",
          },
          containedPrimary: {
            background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
            color: "#ffffff",
            ":hover": {
              background: "linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)",
            },
          },
          containedSecondary: {
            background: "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)",
            color: "#ffffff",
            ":hover": {
              background: "linear-gradient(135deg, #D0176D 0%, #E11D48 100%)",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            background: isDark ? "rgba(30, 41, 59, 0.4)" : "#FFFFFF",
            border: isDark
              ? "1px solid rgba(255, 255, 255, 0.08)"
              : "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow: isDark
              ? "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
              : "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              boxShadow: isDark
                ? "0 20px 25px -5px rgba(0, 0, 0, 0.4)"
                : "0 10px 25px -3px rgba(0, 0, 0, 0.08)",
              borderColor: isDark
                ? "rgba(129, 140, 248, 0.4)"
                : "rgba(79, 70, 229, 0.3)",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
            color: isDark ? "#F8FAFC" : "#0F172A",
            backgroundImage: "none",
          },
          elevation1: {
            boxShadow: isDark
              ? "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
              : "0 2px 10px rgba(0, 0, 0, 0.04)",
            border: isDark
              ? "1px solid rgba(255, 255, 255, 0.06)"
              : "1px solid rgba(0, 0, 0, 0.06)",
          },
          elevation3: {
            boxShadow: isDark
              ? "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
              : "0 6px 16px rgba(0, 0, 0, 0.06)",
            border: isDark
              ? "1px solid rgba(255, 255, 255, 0.08)"
              : "1px solid rgba(0, 0, 0, 0.08)",
          },
          elevation4: {
            boxShadow: isDark
              ? "0 20px 25px -5px rgba(0, 0, 0, 0.4)"
              : "0 12px 24px rgba(0, 0, 0, 0.08)",
            border: isDark
              ? "1px solid rgba(255, 255, 255, 0.1)"
              : "1px solid rgba(0, 0, 0, 0.1)",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
            color: isDark ? "#F8FAFC" : "#0F172A",
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            color: isDark ? "#FFFFFF" : "#0F172A",
            backgroundColor: isDark ? "rgba(15, 23, 42, 0.4)" : "rgba(255, 255, 255, 0.8)",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.15)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.3)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "#818CF8" : "#4F46E5",
              borderWidth: "1.5px",
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)",
            color: isDark ? "rgba(248, 250, 252, 0.85)" : "#1E293B",
            padding: "8px 16px",
            fontSize: "0.82rem",
            fontWeight: 500,
          },
          head: {
            backgroundColor: isDark ? "#1E293B !important" : "#F1F5F9 !important",
            color: isDark ? "#94A3B8" : "#475569",
            fontWeight: 700,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            borderBottom: isDark
              ? "2px solid rgba(99, 102, 241, 0.35)"
              : "2px solid rgba(79, 70, 229, 0.25)",
            whiteSpace: "nowrap",
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: "all 0.15s ease-in-out",
            "&.MuiTableRow-hover:hover": {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.03) !important"
                : "rgba(0, 0, 0, 0.03) !important",
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(15, 23, 42, 0.6)",
            "&.Mui-selected": {
              color: isDark ? "#FFFFFF" : "#4F46E5",
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: {
            color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(15, 23, 42, 0.5)",
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(15, 23, 42, 0.7)",
            "&:hover": {
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
            },
          },
        },
      },
    },
  });
};

const defaultTheme = getAppTheme("dark");
export default defaultTheme;
