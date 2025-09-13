// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2E7DFF", // CampusVerse Blue
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#FF5A8F", // Youthful Pink
      contrastText: "#ffffff",
    },
    background: {
      default: "#F5F7FA", // Clean light gray
      paper: "#ffffff",
    },
    success: {
      main: "#4CAF50",
    },
    warning: {
      main: "#FFC107",
    },
  },
  typography: {
    fontFamily: "'Poppins', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.5px",
      color: "#2E7DFF",
    },
    h6: {
      fontWeight: 500,
      color: "#444",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "0.5px",
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "10px 22px",
          boxShadow: "0 3px 6px rgba(0,0,0,0.08)",
          ":hover": {
            boxShadow: "0 5px 12px rgba(0,0,0,0.12)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        },
      },
    },
  },
});

export default theme;
