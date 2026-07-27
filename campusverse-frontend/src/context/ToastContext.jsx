import React, { createContext, useContext, useState } from "react";
import { Snackbar, Alert } from "@mui/material";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("info"); // 'success' | 'info' | 'warning' | 'error'

  const showToast = (msg, sev = "info") => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: "16px",
            fontWeight: 700,
            fontSize: "0.85rem",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            background: severity === "success" 
              ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" 
              : severity === "error"
              ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
              : severity === "warning"
              ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
              : "linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            alignItems: "center",
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
