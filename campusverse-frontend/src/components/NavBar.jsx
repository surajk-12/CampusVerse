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

export default function NavBar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  // track current tab by path
  const [tab, setTab] = useState(false);

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

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Left side navigation */}
        <Tabs
          value={tab}
          onChange={handleChange}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Home" value="home" />
          {!user && <Tab label="Login" value="login" />}
          {/* {!user && <Tab label="Register" value="register" />} */}
          {user && <Tab label="Dashboard" value="dashboard" />}
        </Tabs>

        {/* Right side brand + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              letterSpacing: "1px"
            }}
          >
            CampusVerse
          </Typography>

          {user && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                logout();
                nav("/login");
              }}
            >
              Logout
            </Button>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
}
