import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
  Avatar,
  IconButton,
  Divider,
  CircularProgress,
  Grid,
  Chip,
  Modal,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Event as EventIcon,
  LocationOn,
  Category,
  CalendarMonth,
  Add,
  Link as LinkIcon,
  CheckCircle,
  School,
  Search,
  Close,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import api from "../api/axios.js";

const CATEGORIES = ["All", "Tech", "Cultural", "Sports"];
const TIME_FILTERS = [
  { value: "upcoming", label: "Upcoming Events" },
  { value: "all", label: "All Events" },
  { value: "past", label: "Past Events" },
];

export default function EventsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [timeFilter, setTimeFilter] = useState("upcoming");

  // Create Event Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDateTime, setEventDateTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventCategory, setEventCategory] = useState("Tech");
  const [eventRegLink, setEventRegLink] = useState("");

  // Confirmation Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    message: "",
    confirmText: "Delete",
    severity: "error",
    onConfirm: () => {},
  });

  // Fetch Events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/events", {
        params: {
          category: selectedCategory,
          timeFilter: timeFilter,
        },
      });
      setEvents(data);
    } catch (err) {
      console.error("Error fetching events:", err);
      showToast("Failed to fetch events list.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, timeFilter]);

  // Request Confirmation Helper
  const triggerConfirmation = (title, message, confirmText, severity, onConfirmAction) => {
    setConfirmConfig({
      title,
      message,
      confirmText,
      severity,
      onConfirm: () => {
        onConfirmAction();
        setConfirmOpen(false);
      },
    });
    setConfirmOpen(true);
  };

  // Handle Event Creation
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle || !eventDescription || !eventDateTime || !eventLocation || !eventCategory) {
      showToast("Please fill in all required fields.", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post("/events", {
        title: eventTitle,
        description: eventDescription,
        dateTime: eventDateTime,
        location: eventLocation,
        category: eventCategory,
        registrationLink: eventRegLink,
      });

      setEvents((prev) => [data, ...prev]);
      showToast("Event hosted successfully!", "success");
      
      // Reset State & Close Modal
      setEventTitle("");
      setEventDescription("");
      setEventDateTime("");
      setEventLocation("");
      setEventCategory("Tech");
      setEventRegLink("");
      setModalOpen(false);
    } catch (err) {
      console.error("Error hosting event:", err);
      showToast(err.response?.data?.message || "Failed to host event.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Register for Event
  const handleRegister = async (eventId, title) => {
    triggerConfirmation(
      "Confirm Event Registration",
      `Are you sure you want to register for "${title}"?`,
      "Register",
      "info",
      async () => {
        try {
          const { data } = await api.post(`/events/${eventId}/register`);
          setEvents((prev) =>
            prev.map((ev) => (ev._id === eventId ? { ...ev, registrations: data.registrations } : ev))
          );
          showToast("Successfully registered for this event!", "success");
        } catch (err) {
          console.error("Registration error:", err);
          showToast(err.response?.data?.message || "Could not complete registration.", "error");
        }
      }
    );
  };

  // Unregister/Cancel Registration
  const handleUnregister = async (eventId, title) => {
    triggerConfirmation(
      "Cancel Registration",
      `Are you sure you want to cancel your registration for "${title}"?`,
      "Confirm Cancel",
      "warning",
      async () => {
        try {
          const { data } = await api.post(`/events/${eventId}/unregister`);
          setEvents((prev) =>
            prev.map((ev) => (ev._id === eventId ? { ...ev, registrations: data.registrations } : ev))
          );
          showToast("Cancelled event registration.", "success");
        } catch (err) {
          console.error("Cancel error:", err);
          showToast(err.response?.data?.message || "Could not cancel registration.", "error");
        }
      }
    );
  };

  // Filter local events based on search query
  const filteredEvents = events.filter((ev) => {
    const titleMatch = ev.title.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = ev.description.toLowerCase().includes(searchQuery.toLowerCase());
    const collegeMatch = ev.organizingCollege?.collegeName?.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || descMatch || collegeMatch;
  });

  // Registered events for "My Agenda"
  const myRegisteredEvents = events.filter((ev) => ev.registrations?.includes(user?._id));

  // Category Color Map
  const getCategoryColor = (cat) => {
    if (cat === "Tech") return { bg: "rgba(129, 140, 248, 0.1)", text: "#818CF8", border: "rgba(129, 140, 248, 0.2)" };
    if (cat === "Cultural") return { bg: "rgba(236, 72, 153, 0.1)", text: "#EC4899", border: "rgba(236, 72, 153, 0.2)" };
    return { bg: "rgba(16, 185, 129, 0.1)", text: "#10B981", border: "rgba(16, 185, 129, 0.2)" };
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      {/* Header section */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight={900} color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarMonth sx={{ color: "primary.main" }} />
            Events Calendar
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Browse technical hackathons, cultural fests, and sports meets cross-campus
          </Typography>
        </Box>

        {user?.role === "Organizer" && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setModalOpen(true)}
            sx={{
              borderRadius: "30px",
              height: 34,
              px: 3,
              fontWeight: 700,
              textTransform: "none",
              background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
              boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)",
              fontSize: "0.78rem",
            }}
          >
            Host Event
          </Button>
        )}
      </Stack>

      <Grid container spacing={3}>
        {/* Left Column: Discover Events */}
        <Grid size={{ xs: 12, md: 8 }}>


          {/* Filtering toolbar */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(30, 41, 59, 0.15)",
              backdropFilter: "blur(12px)",
              borderRadius: "0px",
            }}
          >
            <Stack spacing={2.2}>
              {/* Search and Time Filter Selector */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  placeholder="Search events, fests, fests or colleges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: <Search sx={{ color: "text.secondary", fontSize: 18, mr: 1 }} />,
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      bgcolor: "rgba(255,255,255,0.015)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      "& fieldset": { border: "none" },
                    },
                  }}
                />

                <Select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  size="small"
                  sx={{
                    minWidth: 160,
                    borderRadius: "8px",
                    bgcolor: "rgba(255,255,255,0.015)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  }}
                >
                  {TIME_FILTERS.map((f) => (
                    <MenuItem key={f.value} value={f.value}>
                      {f.label}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>

              {/* Category Filter Pills */}
              <Stack direction="row" spacing={1} overflow="auto" sx={{ pb: 0.5 }}>
                {CATEGORIES.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    onClick={() => setSelectedCategory(cat)}
                    sx={{
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      height: 28,
                      borderRadius: "30px",
                      bgcolor: selectedCategory === cat ? "primary.main" : "rgba(255, 255, 255, 0.03)",
                      color: selectedCategory === cat ? "#fff" : "text.secondary",
                      border: "1px solid",
                      borderColor: selectedCategory === cat ? "primary.main" : "rgba(255, 255, 255, 0.06)",
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: selectedCategory === cat ? "primary.dark" : "rgba(255, 255, 255, 0.07)",
                        borderColor: selectedCategory === cat ? "primary.dark" : "rgba(255, 255, 255, 0.12)",
                      },
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          </Paper>

          {/* Events Stream */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={45} />
            </Box>
          ) : filteredEvents.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 5,
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(30, 41, 59, 0.15)",
                borderRadius: "24px",
              }}
            >
              <Typography variant="body1" fontWeight={700} color="text.secondary">
                No events found matching your filter criteria.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={3}>
              {filteredEvents.map((ev) => {
                const isRegistered = ev.registrations?.includes(user?._id);
                const colors = getCategoryColor(ev.category);
                const eventDate = new Date(ev.dateTime);

                return (
                  <Paper
                    key={ev._id}
                    elevation={0}
                    sx={{
                      p: 3,
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "24px",
                      background: "rgba(30, 41, 59, 0.2)",
                      backdropFilter: "blur(8px)",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        borderColor: "rgba(255,255,255,0.15)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
                      },
                    }}
                  >
                    {/* Header: Category Badge and Date */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Chip
                        label={ev.category}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          bgcolor: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <CalendarMonth sx={{ fontSize: 13 }} />
                        {eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </Typography>
                    </Stack>

                    {/* Title */}
                    <Typography variant="subtitle1" fontWeight={850} color="text.primary" sx={{ mb: 1 }}>
                      {ev.title}
                    </Typography>

                    {/* Description */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.2, lineHeight: 1.5, fontSize: "0.85rem" }}>
                      {ev.description}
                    </Typography>

                    <Divider sx={{ mb: 2, borderColor: "rgba(255, 255, 255, 0.06)" }} />

                    {/* Footer Row: College details and actions */}
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <School sx={{ fontSize: 14, color: "primary.main" }} />
                          {ev.organizingCollege?.collegeName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, pl: 0.2 }}>
                          <LocationOn sx={{ fontSize: 12 }} />
                          {ev.location} ({ev.organizingCollege?.city})
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {ev.registrations?.length || 0} Registered
                        </Typography>

                        {/* Actions */}
                        {ev.registrationLink ? (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<LinkIcon sx={{ fontSize: 12 }} />}
                            onClick={() => window.open(ev.registrationLink, "_blank")}
                            sx={{
                              borderRadius: "30px",
                              height: 28,
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: "0.72rem",
                              px: 2,
                            }}
                          >
                            Join Portal
                          </Button>
                        ) : isRegistered ? (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckCircle sx={{ fontSize: 12 }} />}
                            onClick={() => handleUnregister(ev._id, ev.title)}
                            sx={{
                              borderRadius: "30px",
                              height: 28,
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: "0.72rem",
                              px: 2,
                              bgcolor: "success.main",
                              color: "#fff",
                            }}
                          >
                            Registered
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleRegister(ev._id, ev.title)}
                            sx={{
                              borderRadius: "30px",
                              height: 28,
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: "0.72rem",
                              px: 2.2,
                              background: "linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)",
                            }}
                          >
                            Register
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          {/* User profile / College widget */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(30, 41, 59, 0.25)",
              backdropFilter: "blur(12px)",
              borderRadius: "24px",
            }}
          >
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: "rgba(79, 70, 229, 0.12)", width: 44, height: 44 }}>
                  <School sx={{ fontSize: 24, color: "primary.main" }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={900} color="text.primary">
                    Cross-Campus Events
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Local college-connected calendar
                  </Typography>
                </Box>
              </Stack>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                Verified student fests, tech hackathons, and sports events across all registered universities are aggregated here. You can click 'Register' for internal tracking.
              </Typography>
            </Stack>
          </Paper>

          {/* Agenda widget: Registered / Upcoming Dashboard */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(30, 41, 59, 0.25)",
              backdropFilter: "blur(12px)",
              borderRadius: "24px",
            }}
          >
            <Typography variant="subtitle2" fontWeight={900} color="text.primary" sx={{ mb: 2.5, display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircle sx={{ color: "success.main", fontSize: 20 }} />
              My Agenda ({myRegisteredEvents.length})
            </Typography>

            {myRegisteredEvents.length === 0 ? (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ textAlign: "center", py: 2 }}>
                You haven't registered for any events yet. Build your agenda!
              </Typography>
            ) : (
              <Stack spacing={2}>
                {myRegisteredEvents.map((ev) => {
                  const eventDate = new Date(ev.dateTime);
                  return (
                    <Box
                      key={ev._id}
                      sx={{
                        p: 2,
                        borderRadius: "16px",
                        bgcolor: "rgba(255, 255, 255, 0.015)",
                        border: "1px solid rgba(255, 255, 255, 0.04)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box sx={{ maxWidth: "70%" }}>
                        <Typography variant="caption" fontWeight={850} color="text.primary" noWrap display="block">
                          {ev.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem" }}>
                          {eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {ev.location}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleUnregister(ev._id, ev.title)}
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          fontSize: "0.68rem",
                          minWidth: 50,
                          p: 0,
                          borderRadius: "30px",
                          height: 24,
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Host Event Modal (for Organizer role) */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} closeAfterTransition sx={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
        <Box
          component="form"
          onSubmit={handleCreateEvent}
          sx={{
            width: "90%",
            maxWidth: 500,
            bgcolor: "#0F172A",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "24px",
            p: { xs: 2.5, sm: 4 },
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            outline: "none",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={850} color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Add sx={{ color: "primary.main" }} />
              Host Campus Event
            </Typography>
            <IconButton onClick={() => setModalOpen(false)} size="small">
              <Close />
            </IconButton>
          </Stack>

          <Stack spacing={2.5}>
            <TextField
              label="Event Title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              required
              fullWidth
              variant="outlined"
              size="small"
            />

            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={eventCategory}
                label="Category"
                onChange={(e) => setEventCategory(e.target.value)}
                required
              >
                <MenuItem value="Tech">Tech / Hackathon</MenuItem>
                <MenuItem value="Cultural">Cultural / Fest</MenuItem>
                <MenuItem value="Sports">Sports Meet</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Date & Time"
              type="datetime-local"
              value={eventDateTime}
              onChange={(e) => setEventDateTime(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              size="small"
            />

            <TextField
              label="Location / Room / Platform"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="e.g. Main Auditorium or Virtual Zoom link"
              required
              fullWidth
              variant="outlined"
              size="small"
            />

            <TextField
              label="Description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              required
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              size="small"
            />

            <TextField
              label="External Portal Link (Optional)"
              value={eventRegLink}
              onChange={(e) => setEventRegLink(e.target.value)}
              placeholder="e.g. https://hackathon.dev"
              fullWidth
              variant="outlined"
              size="small"
            />

            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                borderRadius: "30px",
                textTransform: "none",
                fontWeight: 700,
                height: 38,
                background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
                boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)",
              }}
            >
              {submitting ? "Posting..." : "Host Event"}
            </Button>
          </Stack>
        </Box>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmationModal
        open={confirmOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        severity={confirmConfig.severity}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
