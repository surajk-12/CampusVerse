import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useThemeContext } from "../context/CustomThemeContext.jsx";

// MUI imports
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import SchoolIcon from "@mui/icons-material/School";
import IconButton from "@mui/material/IconButton";
import LogoutIcon from "@mui/icons-material/Logout";
import Tooltip from "@mui/material/Tooltip";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

export default function NavBar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useThemeContext();
  const nav = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (anchorId) => {
    if (location.pathname !== "/") {
      nav("/");
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        el?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } else {
      const el = document.getElementById(anchorId);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const publicPaths = ["/", "/login", "/register", "/register/student"];
  const isPublicPath = publicPaths.includes(location.pathname);

  if (user && !isPublicPath) {
    return null;
  }

  return (
    <AppBar
      position="sticky"
      sx={{
        background: isDark
          ? isScrolled
            ? "rgba(11, 15, 25, 0.85)"
            : "rgba(11, 15, 25, 0.95)"
          : isScrolled
          ? "rgba(255, 255, 255, 0.85)"
          : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: isDark
          ? "1px solid rgba(255, 255, 255, 0.08)"
          : "1px solid rgba(0, 0, 0, 0.08)",
        transition: "all 0.3s ease",
        top: 0,
        zIndex: 1100,
        boxShadow: isScrolled
          ? isDark
            ? "0 10px 30px -10px rgba(0,0,0,0.5)"
            : "0 10px 30px -10px rgba(0,0,0,0.1)"
          : "none",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{
            display: "flex",
            justifyContent: "space-between",
            height: 70,
          }}
        >
          {/* Left side brand logo */}
          <Box
            onClick={() => nav("/")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              cursor: "pointer",
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
              }}
            >
              <SchoolIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.02em",
                background: isDark
                  ? "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)"
                  : "linear-gradient(135deg, #0F172A 0%, #334155 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: "1.2rem",
              }}
            >
              CampusVerse
            </Typography>
          </Box>

          {/* Center Navigation Links (Public) */}
          <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
            {["features", "how-it-works", "college-search-hero", "why-choose-us", "faq"].map((anchor, idx) => {
              const labels = ["Features", "How It Works", "Find Campus", "About", "FAQ"];
              return (
                <Button
                  key={anchor}
                  onClick={() => handleNavClick(anchor)}
                  sx={{
                    color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(15, 23, 42, 0.7)",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    borderRadius: "8px",
                    px: 2,
                    "&:hover": {
                      color: isDark ? "#FFF" : "#0F172A",
                      bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  {labels[idx]}
                </Button>
              );
            })}
          </Box>

          {/* Right side Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 } }}>
            {/* Theme Toggle Button */}
            <Tooltip title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton
                onClick={toggleTheme}
                sx={{
                  color: isDark ? "#FACC15" : "#6366F1",
                  bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(99, 102, 241, 0.08)",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(99, 102, 241, 0.2)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(99, 102, 241, 0.15)",
                    transform: "scale(1.05)",
                  },
                }}
              >
                {isDark ? <LightModeIcon sx={{ fontSize: 20 }} /> : <DarkModeIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>

            {user ? (
              <>
                {/* On mobile, show a quick 'Dashboard' link instead of center tabs */}
                <Button
                  variant="text"
                  size="small"
                  onClick={() => nav("/dashboard")}
                  sx={{
                    display: { xs: "inline-flex", sm: "none" },
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    color: "text.primary",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "8px",
                    "&:hover": {
                      bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                    },
                  }}
                >
                  Dashboard
                </Button>

                {/* Logout Button (Desktop) */}
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => {
                    logout();
                    nav("/login");
                  }}
                  sx={{
                    display: { xs: "none", sm: "inline-flex" },
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    px: 2.5,
                    py: 0.8,
                    borderColor: "rgba(239, 68, 68, 0.4)",
                    color: "#EF4444",
                    "&:hover": {
                      borderColor: "#EF4444",
                      bgcolor: "rgba(239, 68, 68, 0.05)",
                    },
                  }}
                >
                  Logout
                </Button>

                {/* Logout Icon Button (Mobile) */}
                <IconButton
                  size="small"
                  onClick={() => {
                    logout();
                    nav("/login");
                  }}
                  sx={{
                    display: { xs: "inline-flex", sm: "none" },
                    color: "#EF4444",
                    bgcolor: "rgba(239, 68, 68, 0.05)",
                    border: "1px solid rgba(239, 68, 68, 0.15)",
                    borderRadius: "50%",
                    p: 0.8,
                    "&:hover": {
                      borderColor: "#EF4444",
                      bgcolor: "rgba(239, 68, 68, 0.1)",
                    },
                  }}
                >
                  <LogoutIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </>
            ) : (
              <Button
                variant="contained"
                size="small"
                onClick={() => nav("/login")}
                sx={{
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  px: 2.5,
                  py: 0.8,
                  background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)",
                  },
                }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

