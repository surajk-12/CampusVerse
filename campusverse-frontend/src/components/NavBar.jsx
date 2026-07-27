import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// MUI imports
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import SchoolIcon from "@mui/icons-material/School";

export default function NavBar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  // track current tab by path
  const [tab, setTab] = useState("home");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith("/dashboard")) setTab("dashboard");
    else if (location.pathname === "/login") setTab("login");
    else if (location.pathname === "/register") setTab("register");
    else setTab("home");
  }, [location.pathname]);

  const handleChange = (event, newValue) => {
    setTab(newValue);
    nav(newValue === "home" ? "/" : `/${newValue}`);
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
        background: isScrolled
          ? "rgba(11, 15, 25, 0.85)"
          : "rgba(11, 15, 25, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        transition: "all 0.3s ease",
        top: 0,
        zIndex: 1100,
        boxShadow: isScrolled ? "0 10px 30px -10px rgba(0,0,0,0.5)" : "none",
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
                background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: "1.2rem",
              }}
            >
              CampusVerse
            </Typography>
          </Box>

          {/* Center Tabs Navigation */}
          <Tabs
            value={tab}
            onChange={handleChange}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              height: "100%",
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: "3px 3px 0 0",
                background: "linear-gradient(90deg, #4F46E5 0%, #EC4899 100%)",
              },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                color: "rgba(255, 255, 255, 0.6)",
                minWidth: 90,
                transition: "color 0.2s",
                "&.Mui-selected": {
                  color: "#FFFFFF",
                },
                "&:hover": {
                  color: "#FFFFFF",
                },
              },
            }}
          >
            <Tab label="Home" value="home" />
            {!user && <Tab label="Login" value="login" />}
            {user && <Tab label="Dashboard" value="dashboard" />}
          </Tabs>

          {/* Right side Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {user ? (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => {
                  logout();
                  nav("/login");
                }}
                sx={{
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
