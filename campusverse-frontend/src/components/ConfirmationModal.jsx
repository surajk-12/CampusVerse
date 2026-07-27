import React from "react";
import { Modal, Box, Typography, Stack, Button } from "@mui/material";
import { WarningAmber } from "@mui/icons-material";

export default function ConfirmationModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Delete",
  cancelText = "Cancel",
  severity = "error"
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      closeAfterTransition
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1400, // Ensure it sits above standard Dialogs/Drawers
      }}
    >
      <Box
        sx={{
          width: "90%",
          maxWidth: 400,
          bgcolor: "#0F172A",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "24px",
          p: 3.5,
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)",
          outline: "none",
        }}
      >
        <Stack spacing={2.5} alignItems="center" textAlign="center">
          <Box
            sx={{
              p: 1.5,
              borderRadius: "50%",
              bgcolor: severity === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)",
              color: severity === "error" ? "#EF4444" : "#F59E0B",
              display: "inline-flex",
            }}
          >
            <WarningAmber sx={{ fontSize: 32 }} />
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={850} color="text.primary" sx={{ mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              {message}
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} width="100%">
            <Button
              variant="outlined"
              fullWidth
              onClick={onCancel}
              sx={{
                borderRadius: "30px",
                textTransform: "none",
                fontWeight: 700,
                borderColor: "rgba(255,255,255,0.12)",
                color: "text.secondary",
                height: 36,
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.2)",
                  bgcolor: "rgba(255,255,255,0.02)",
                },
              }}
            >
              {cancelText}
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={onConfirm}
              sx={{
                borderRadius: "30px",
                textTransform: "none",
                fontWeight: 700,
                bgcolor: severity === "error" ? "#EF4444" : "primary.main",
                color: "#fff",
                height: 36,
                "&:hover": {
                  bgcolor: severity === "error" ? "#DC2626" : "primary.dark",
                },
              }}
            >
              {confirmText}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}
