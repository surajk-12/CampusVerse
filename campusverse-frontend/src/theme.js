import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#818CF8", // Premium Indigo
      light: "#A5B4FC",
      dark: "#4F46E5",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#EC4899", // Vibrant Pink
      light: "#F472B6",
      dark: "#BE185D",
      contrastText: "#ffffff",
    },
    background: {
      default: "#0B0F19", // Deep Space Dark background
      paper: "#0F172A", // Sleek Slate dark surface
    },
    text: {
      primary: "#F8FAFC", // Light gray/white text
      secondary: "#94A3B8", // Medium slate text
    },
    success: {
      main: "#10B981", // Emerald
      light: "#34D399",
      dark: "#065F46",
    },
    warning: {
      main: "#F59E0B",
    },
    divider: "rgba(255, 255, 255, 0.08)",
  },
  typography: {
    fontFamily: "'Inter', 'Poppins', 'Outfit', sans-serif",
    h1: {
      fontWeight: 900,
      fontSize: "3.5rem",
      letterSpacing: "-0.02em",
      color: "#FFFFFF",
    },
    h2: {
      fontWeight: 800,
      letterSpacing: "-0.01em",
      color: "#818CF8",
    },
    h4: {
      fontWeight: 800,
      letterSpacing: "-0.01em",
      color: "#F8FAFC",
    },
    h5: {
      fontWeight: 800,
      color: "#F8FAFC",
    },
    h6: {
      fontWeight: 700,
      color: "#F8FAFC",
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
          backgroundColor: "#0B0F19",
          color: "#F8FAFC",
          scrollbarColor: "rgba(255, 255, 255, 0.15) transparent",
          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(255, 255, 255, 0.15)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(255, 255, 255, 0.25)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: "all 0.2s ease-in-out",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.12)",
          ":hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.25)",
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
          background: "rgba(30, 41, 59, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4)",
            borderColor: "rgba(129, 140, 248, 0.3)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundColor: "#0F172A",
          backgroundImage: "none", // disables the elevation overlay on dark mode
        },
        elevation1: {
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        },
        elevation3: {
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        },
        elevation4: {
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          color: "#FFFFFF",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 255, 255, 0.1)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 255, 255, 0.25)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#818CF8",
            borderWidth: "1.5px",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255, 255, 255, 0.05)",
          color: "rgba(248, 250, 252, 0.85)",
          padding: "6px 16px",
          fontSize: "0.82rem",
          fontWeight: 500,
        },
        head: {
          backgroundColor: "#1E293B !important",
          color: "#94A3B8",
          fontWeight: 700,
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          borderBottom: "2px solid rgba(99, 102, 241, 0.35)",
          whiteSpace: "nowrap",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "all 0.15s ease-in-out",
          "&.MuiTableRow-hover:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.02) !important",
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: "rgba(255, 255, 255, 0.6)",
          "&.Mui-selected": {
            color: "#FFFFFF",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: "rgba(255, 255, 255, 0.5)",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "rgba(255, 255, 255, 0.7)",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          },
        },
      },
    },
  },
});

export default theme;
