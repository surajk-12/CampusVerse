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
  Tooltip,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Storefront,
  AddShoppingCart,
  Search,
  Close,
  ChevronLeft,
  ChevronRight,
  LocalOffer,
  LocationOn,
  Chat,
  DeleteOutline,
  CheckCircleOutline,
  PhotoCamera,
  AttachMoney,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../api/axios.js";
import ConfirmationModal from "../components/ConfirmationModal.jsx";

const CATEGORIES = [
  "All",
  "Textbooks",
  "Mattresses & Bedding",
  "Lab Coats & Gear",
  "Cycles & Transport",
  "Electronics",
  "Others",
];

const CONDITIONS = ["New", "Like New", "Good", "Fair"];

const FORM_CATEGORIES = CATEGORIES.filter((c) => c !== "All");

export default function MarketplacePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [locationsList, setLocationsList] = useState(["All"]);

  // Post Listing Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [campusLocation, setCampusLocation] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Active Image Indexes for Carousels (mapping itemId -> activeImageIndex)
  const [imageIndexes, setImageIndexes] = useState({});

  // Delete Action State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Connection Request Confirmation State
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [sellerToConnect, setSellerToConnect] = useState(null);

  // Preview and Purchase States
  const [previewItem, setPreviewItem] = useState(null);
  const [previewActiveIdx, setPreviewActiveIdx] = useState(0);
  const [purchaseConfirmOpen, setPurchaseConfirmOpen] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const [sendingPurchase, setSendingPurchase] = useState(false);

  const handleProceedToPurchase = (itemObj) => {
    if (!itemObj || !itemObj.seller) return;
    
    const sellerObj = itemObj.seller;
    const isFriend = sellerObj.friends?.includes(user._id) || user.friends?.includes(sellerObj._id);
    
    if (isFriend) {
      const defaultText = `Hi ${sellerObj.firstName}, I am interested in buying your item "${itemObj.title}" listed for $${itemObj.price} at ${itemObj.campusLocation}. Is it still available?`;
      setPurchaseMessage(defaultText);
      setPurchaseConfirmOpen(true);
    } else {
      setSellerToConnect(sellerObj);
      setConnectDialogOpen(true);
    }
  };

  const handleSendPurchaseOffer = async () => {
    if (!previewItem || !previewItem.seller || !purchaseMessage) return;
    try {
      setSendingPurchase(true);
      await api.post("/chat/send", {
        recipientId: previewItem.seller._id,
        content: purchaseMessage.trim(),
      });
      showToast("Purchase offer message sent directly to the seller!", "success");
      setPurchaseConfirmOpen(false);
      setPreviewItem(null);
    } catch (err) {
      console.error("Failed to send offer:", err);
      showToast(err.response?.data?.message || "Failed to send purchase message.", "error");
    } finally {
      setSendingPurchase(false);
    }
  };

  // Fetch items
  const fetchItems = async (isInitial = false) => {
    try {
      setLoading(true);
      const { data } = await api.get("/items", {
        params: {
          search: searchQuery,
          category: selectedCategory,
          campusLocation: selectedLocation,
        },
      });
      setItems(data);

      if (isInitial) {
        const locs = ["All", ...new Set(data.map((it) => it.campusLocation).filter(Boolean))];
        setLocationsList(locs);
      }

      // Initialize image carousel indexes to 0
      const indexes = {};
      data.forEach((item) => {
        indexes[item._id] = 0;
      });
      setImageIndexes(indexes);
    } catch (err) {
      console.error("Error fetching items:", err);
      showToast("Failed to load marketplace items.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(true);
  }, []);

  useEffect(() => {
    fetchItems(false);
  }, [selectedCategory, selectedLocation, searchQuery]);

  // Image Selection Change
  const handleImageChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (selectedImages.length + files.length > 5) {
        showToast("You can upload a maximum of 5 images.", "warning");
        return;
      }

      // Check file sizes
      const oversized = files.some((file) => file.size > 5 * 1024 * 1024);
      if (oversized) {
        showToast("Maximum size per image is 5MB.", "warning");
        return;
      }

      setSelectedImages((prev) => [...prev, ...files]);

      const previews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...previews]);
    }
  };

  // Remove Selected Image before uploading
  const handleRemovePreview = (idx) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== idx));
    URL.revokeObjectURL(imagePreviews[idx]);
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // Create Listing Submit
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!title || !price || !category || !condition || !campusLocation || !description) {
      showToast("Please fill in all required fields.", "warning");
      return;
    }
    if (selectedImages.length === 0) {
      showToast("Please select at least one image.", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("condition", condition);
      formData.append("campusLocation", campusLocation);
      formData.append("description", description);

      selectedImages.forEach((image) => {
        formData.append("images", image);
      });

      const { data } = await api.post("/items", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setItems((prev) => [data, ...prev]);
      setImageIndexes((prev) => ({ ...prev, [data._id]: 0 }));
      showToast("Marketplace listing published successfully!", "success");

      // Reset
      setTitle("");
      setPrice("");
      setCategory("");
      setCondition("");
      setCampusLocation("");
      setDescription("");
      setSelectedImages([]);
      imagePreviews.forEach((p) => URL.revokeObjectURL(p));
      setImagePreviews([]);
      setModalOpen(false);
    } catch (err) {
      console.error("Error creating listing:", err);
      showToast(err.response?.data?.message || "Failed to publish listing.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Mark listing as Sold
  const handleMarkAsSold = async (itemId) => {
    try {
      const { data } = await api.put(`/items/${itemId}`, { status: "Sold" });
      setItems((prev) => prev.map((item) => (item._id === itemId ? data : item)));
      showToast("Item marked as Sold!", "success");
    } catch (err) {
      console.error("Error marking as sold:", err);
      showToast("Failed to update listing status.", "error");
    }
  };

  // Trigger Delete Modal
  const triggerDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  // Perform Delete
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/items/${itemToDelete._id}`);
      setItems((prev) => prev.filter((item) => item._id !== itemToDelete._id));
      showToast("Listing deleted successfully.", "success");
      setDeleteModalOpen(false);
    } catch (err) {
      console.error("Error deleting listing:", err);
      showToast("Failed to delete listing.", "error");
    }
  };

  // Carousel controls
  const handlePrevImage = (itemId, maxLen, e) => {
    e.stopPropagation();
    setImageIndexes((prev) => {
      const current = prev[itemId] || 0;
      return { ...prev, [itemId]: current === 0 ? maxLen - 1 : current - 1 };
    });
  };

  const handleNextImage = (itemId, maxLen, e) => {
    e.stopPropagation();
    setImageIndexes((prev) => {
      const current = prev[itemId] || 0;
      return { ...prev, [itemId]: current === maxLen - 1 ? 0 : current + 1 };
    });
  };

  // Contact Seller flow
  const handleContactSeller = (sellerObj) => {
    if (!sellerObj) return;

    // Check if uploader and current user are already friends
    const isFriend = sellerObj.friends?.includes(user._id) || user.friends?.includes(sellerObj._id);

    if (isFriend) {
      // Go directly to Messenger
      window.location.href = `/chat?friendId=${sellerObj._id}`;
    } else {
      // Prompt connection request
      setSellerToConnect(sellerObj);
      setConnectDialogOpen(true);
    }
  };

  // Send Connection request
  const handleSendConnectionRequest = async () => {
    if (!sellerToConnect) return;
    try {
      await api.post("/notifications/send-request", {
        from: user._id,
        to: sellerToConnect._id,
      });
      showToast(`Connection request sent to ${sellerToConnect.firstName}! Once they accept, you can start messaging.`, "success");
      setConnectDialogOpen(false);
    } catch (err) {
      console.error("Connection request error:", err);
      showToast(err.response?.data?.message || "Could not send connection request.", "error");
    }
  };



  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      {/* Header section */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight={900} color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Storefront sx={{ color: "primary.main" }} />
            Campus Marketplace
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Buy and sell textbooks, bedding, lab coats, and cycles directly with campus peers
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddShoppingCart />}
          onClick={() => setModalOpen(true)}
          sx={{
            borderRadius: "8px",
            height: 32,
            px: 3,
            fontWeight: 700,
            textTransform: "none",
            background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
            boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)",
            fontSize: "0.78rem",
          }}
        >
          Post an Item
        </Button>
      </Stack>

      {/* Filters header panel */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "0px",
          background: "rgba(30, 41, 59, 0.15)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexGrow: 1 }}>
          <TextField
            placeholder="Search items for sale..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{
              minWidth: { sm: 260 },
              "& .MuiOutlinedInput-root": {
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.06)",
                "& fieldset": { border: "none" },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "text.secondary", fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Category"
              onChange={(e) => setSelectedCategory(e.target.value)}
              sx={{
                borderRadius: "8px",
                bgcolor: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.06)",
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              }}
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Campus Location</InputLabel>
            <Select
              value={selectedLocation}
              label="Campus Location"
              onChange={(e) => setSelectedLocation(e.target.value)}
              sx={{
                borderRadius: "8px",
                bgcolor: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.06)",
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              }}
            >
              {locationsList.map((loc) => (
                <MenuItem key={loc} value={loc}>
                  {loc}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Button
          variant="outlined"
          size="small"
          onClick={fetchItems}
          sx={{
            borderRadius: "8px",
            height: 32,
            px: 2.2,
            fontWeight: 700,
            textTransform: "none",
            fontSize: "0.72rem",
            borderColor: "rgba(255,255,255,0.12)",
          }}
        >
          Refresh Feed
        </Button>
      </Paper>

      {/* Listings Grid */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={45} />
        </Box>
      ) : items.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(30, 41, 59, 0.15)",
            borderRadius: "0px",
          }}
        >
          <Storefront sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
          <Typography variant="body1" fontWeight={750} color="text.secondary">
            No items listed in the campus marketplace yet.
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            Got items you don't need? Sell them to juniors and peers here!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {items.map((item) => {
            const activeIdx = imageIndexes[item._id] || 0;
            const imagesList = item.images || [];
            const activeImg = imagesList[activeIdx] ? `${apiBase}${imagesList[activeIdx]}` : "/placeholder.png";
            const sellerName = item.seller
              ? `${item.seller.firstName} ${item.seller.lastName}`
              : "Seller";
            const sellerPhotoUrl = item.seller?.photo
              ? `${apiBase}/uploads/${item.seller.photo}`
              : undefined;
            const isOwnListing = item.seller?._id === user._id;

            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item._id}>
                <Paper
                  elevation={0}
                  onClick={() => {
                    setPreviewItem(item);
                    setPreviewActiveIdx(0);
                  }}
                  sx={{
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "0px",
                    background: "rgba(30, 41, 59, 0.2)",
                    backdropFilter: "blur(8px)",
                    height: 320,
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    opacity: item.status === "Sold" ? 0.75 : 1,
                    transition: "transform 0.2s, border-color 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      borderColor: "primary.main",
                    }
                  }}
                >
                  {/* Image Carousel */}
                  <Box sx={{ position: "relative", width: "100%", height: 120, background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Storefront sx={{ fontSize: 36, color: "rgba(255,255,255,0.06)", position: "absolute" }} />
                    <Box
                      component="img"
                      src={activeImg}
                      alt={item.title}
                      onError={(e) => { e.target.style.display = 'none'; }}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        zIndex: 1,
                      }}
                    />

                    {/* Image navigation controls */}
                    {imagesList.length > 1 && (
                      <>
                        <IconButton
                          onClick={(e) => handlePrevImage(item._id, imagesList.length, e)}
                          size="small"
                          sx={{
                            position: "absolute",
                            left: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            bgcolor: "rgba(15,23,42,0.7)",
                            color: "white",
                            "&:hover": { bgcolor: "rgba(15,23,42,0.9)" },
                          }}
                        >
                          <ChevronLeft sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                          onClick={(e) => handleNextImage(item._id, imagesList.length, e)}
                          size="small"
                          sx={{
                            position: "absolute",
                            right: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            bgcolor: "rgba(15,23,42,0.7)",
                            color: "white",
                            "&:hover": { bgcolor: "rgba(15,23,42,0.9)" },
                          }}
                        >
                          <ChevronRight sx={{ fontSize: 16 }} />
                        </IconButton>
                        {/* Carousel dot indicators */}
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{
                            position: "absolute",
                            bottom: 10,
                            left: "50%",
                            transform: "translateX(-50%)",
                          }}
                        >
                          {imagesList.map((_, i) => (
                            <Box
                              key={i}
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                bgcolor: i === activeIdx ? "primary.main" : "rgba(255,255,255,0.4)",
                              }}
                            />
                          ))}
                        </Stack>
                      </>
                    )}

                    {/* Status Ribbon overlay */}
                    {item.status === "Sold" && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          bgcolor: "error.main",
                          color: "white",
                          px: 1.5,
                          py: 0.3,
                          borderRadius: "4px",
                          fontWeight: 800,
                          fontSize: "0.68rem",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          boxShadow: "0 4px 10px rgba(239, 68, 68, 0.4)",
                        }}
                      >
                        Sold Out
                      </Box>
                    )}
                  </Box>

                  {/* Item text metadata contents */}
                  <Box sx={{ p: 2, flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <Box>
                      {/* Price, Condition and Category */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={900} color="primary.light">
                          ${item.price}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={item.condition}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: "0.62rem",
                              fontWeight: 800,
                              bgcolor: "rgba(16, 185, 129, 0.1)",
                              color: "#10B981",
                              border: "1px solid rgba(16, 185, 129, 0.2)",
                              borderRadius: "4px",
                            }}
                          />
                          <Chip
                            label={item.category}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: "0.62rem",
                              fontWeight: 800,
                              bgcolor: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              borderRadius: "4px",
                            }}
                          />
                        </Stack>
                      </Stack>

                      {/* Listing Title */}
                      <Typography variant="body2" fontWeight={850} color="text.primary" noWrap sx={{ mb: 0.5 }}>
                        {item.title}
                      </Typography>

                      {/* Description */}
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, height: 34, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.3 }}>
                        {item.description}
                      </Typography>

                      {/* Location Badge */}
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <LocationOn sx={{ fontSize: 12, color: "text.disabled" }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap sx={{ maxWidth: 180 }}>
                          {item.campusLocation}
                        </Typography>
                      </Stack>
                    </Box>

                    <Box>
                      <Divider sx={{ mb: 2, borderColor: "rgba(255, 255, 255, 0.06)" }} />

                      {/* Seller Detail and Contact buttons */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ maxWidth: "55%" }}>
                          <Avatar src={sellerPhotoUrl} sx={{ width: 24, height: 24, bgcolor: "rgba(255,255,255,0.08)", fontSize: 11 }}>
                            {sellerName[0]}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" color="text.primary" fontWeight={700} noWrap display="block">
                              {sellerName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", display: "block" }}>
                              {item.createdAt 
                                ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
                              }
                            </Typography>
                          </Box>
                        </Stack>

                        {isOwnListing ? (
                          <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
                            {item.status === "Available" && (
                              <Tooltip title="Mark as Sold">
                                <IconButton
                                  size="small"
                                  onClick={() => handleMarkAsSold(item._id)}
                                  sx={{
                                    bgcolor: "rgba(16, 185, 129, 0.1)",
                                    color: "#10B981",
                                    borderRadius: "8px",
                                    "&:hover": { bgcolor: "rgba(16, 185, 129, 0.2)" },
                                  }}
                                >
                                  <CheckCircleOutline sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete listing">
                              <IconButton
                                size="small"
                                onClick={() => triggerDelete(item)}
                                sx={{
                                  bgcolor: "rgba(239, 68, 68, 0.1)",
                                  color: "#EF4444",
                                  borderRadius: "8px",
                                  "&:hover": { bgcolor: "rgba(239, 68, 68, 0.2)" },
                                }}
                              >
                                <DeleteOutline sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : item.status === "Available" ? (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Chat sx={{ fontSize: 12 }} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactSeller(item.seller);
                            }}
                            sx={{
                              borderRadius: "8px",
                              height: 28,
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: "0.72rem",
                              px: 1.5,
                              background: "linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)",
                            }}
                          >
                            Contact Seller
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            disabled
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              borderRadius: "8px",
                              height: 28,
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: "0.72rem",
                              px: 1.5,
                              bgcolor: "rgba(255, 255, 255, 0.05) !important",
                              color: "rgba(255, 255, 255, 0.3) !important",
                            }}
                          >
                            Sold Out
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Post listing item Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} closeAfterTransition sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box
          component="form"
          onSubmit={handlePostSubmit}
          sx={{
            width: "90%",
            maxWidth: 500,
            bgcolor: "#0F172A",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "0px",
            p: 4,
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            outline: "none",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={900} color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AddShoppingCart sx={{ color: "primary.main" }} />
              Post Marketplace Listing
            </Typography>
            <IconButton onClick={() => setModalOpen(false)} size="small">
              <Close />
            </IconButton>
          </Stack>

          <Stack spacing={2.5}>
            <TextField
              label="Item Name / Title"
              placeholder="e.g. Lab Coat & Safety Glasses (Like New)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              variant="outlined"
              size="small"
            />

            <TextField
              label="Price ($)"
              type="number"
              placeholder="e.g. 15"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              fullWidth
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><AttachMoney sx={{ fontSize: 18 }} /></InputAdornment>,
              }}
            />

            <FormControl fullWidth size="small" required>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                {FORM_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" required>
              <InputLabel>Condition</InputLabel>
              <Select
                value={condition}
                label="Condition"
                onChange={(e) => setCondition(e.target.value)}
              >
                {CONDITIONS.map((cond) => (
                  <MenuItem key={cond} value={cond}>
                    {cond}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Campus Location / Group"
              placeholder="e.g. North Hostel C3, Room 402"
              value={campusLocation}
              onChange={(e) => setCampusLocation(e.target.value)}
              required
              fullWidth
              variant="outlined"
              size="small"
            />

            <TextField
              label="Listing Description"
              placeholder="Provide details about size, usage period, or meeting points..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              size="small"
            />

            {/* Custom file selector input */}
            <Box>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="marketplace-file-uploader"
                type="file"
                multiple
                onChange={handleImageChange}
              />
              <label htmlFor="marketplace-file-uploader">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<PhotoCamera />}
                  sx={{
                    borderRadius: "8px",
                    height: 38,
                    textTransform: "none",
                    borderColor: "rgba(255,255,255,0.12)",
                    color: "text.secondary",
                  }}
                >
                  Select Photos (Max 5, 5MB limit each)
                </Button>
              </label>

              {/* Thumbnails preview block */}
              {imagePreviews.length > 0 && (
                <Grid container spacing={1} sx={{ mt: 2 }}>
                  {imagePreviews.map((preview, i) => (
                    <Grid size={2.4} key={i} sx={{ position: "relative" }}>
                      <Box
                        component="img"
                        src={preview}
                        sx={{
                          width: "100%",
                          height: 50,
                          objectFit: "cover",
                          borderRadius: "4px",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      />
                      <IconButton
                        onClick={() => handleRemovePreview(i)}
                        size="small"
                        sx={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          bgcolor: "error.main",
                          color: "white",
                          p: 0.1,
                          "&:hover": { bgcolor: "error.dark" },
                        }}
                      >
                        <Close sx={{ fontSize: 10 }} />
                      </IconButton>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>

            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
                height: 38,
                background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
                boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)",
              }}
            >
              {submitting ? "Publishing listing..." : "Publish Item Listing"}
            </Button>
          </Stack>
        </Box>
      </Modal>

      {/* Dynamic confirmation dialog for sending connection request */}
      <Dialog
        open={connectDialogOpen}
        onClose={() => setConnectDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "#0F172A",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "0px",
            p: 1.5,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "text.primary" }}>Send Connection Request?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
            To message this seller, you must send a connection request. Would you like to connect with{" "}
            <strong>
              {sellerToConnect?.firstName} {sellerToConnect?.lastName}
            </strong>
            ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectDialogOpen(false)} sx={{ color: "text.secondary", textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSendConnectionRequest}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Send Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Listing Delete confirmation dialog */}
      <ConfirmationModal
        open={deleteModalOpen}
        title="Delete Listing"
        message={`Are you sure you want to delete the listing "${itemToDelete?.title}"? This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteModalOpen(false)}
        confirmText="Delete Listing"
        severity="error"
      />

      {/* Item Preview Modal */}
      <Modal open={!!previewItem} onClose={() => setPreviewItem(null)} closeAfterTransition sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box
          sx={{
            width: "90%",
            maxWidth: 720,
            bgcolor: "#0F172A",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "0px",
            p: 4,
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            outline: "none",
            position: "relative",
          }}
        >
          <IconButton
            onClick={() => setPreviewItem(null)}
            sx={{ position: "absolute", right: 16, top: 16, color: "text.secondary", zIndex: 10 }}
          >
            <Close />
          </IconButton>

          {previewItem && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Left Side: Image Gallery */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: 280,
                    background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <Storefront sx={{ fontSize: 72, color: "rgba(255,255,255,0.06)", position: "absolute" }} />
                  {previewItem.images?.length > 0 && (
                    <Box
                      component="img"
                      src={`${apiBase}${previewItem.images[previewActiveIdx]}`}
                      alt={previewItem.title}
                      onError={(e) => { e.target.style.display = 'none'; }}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        zIndex: 1,
                      }}
                    />
                  )}

                  {/* Navigation controls */}
                  {previewItem.images?.length > 1 && (
                    <>
                      <IconButton
                        onClick={() => setPreviewActiveIdx(prev => prev === 0 ? previewItem.images.length - 1 : prev - 1)}
                        size="small"
                        sx={{
                          position: "absolute",
                          left: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          bgcolor: "rgba(15,23,42,0.8)",
                          color: "white",
                          zIndex: 2,
                          "&:hover": { bgcolor: "rgba(15,23,42,1)" },
                        }}
                      >
                        <ChevronLeft />
                      </IconButton>
                      <IconButton
                        onClick={() => setPreviewActiveIdx(prev => prev === previewItem.images.length - 1 ? 0 : prev + 1)}
                        size="small"
                        sx={{
                          position: "absolute",
                          right: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          bgcolor: "rgba(15,23,42,0.8)",
                          color: "white",
                          zIndex: 2,
                          "&:hover": { bgcolor: "rgba(15,23,42,1)" },
                        }}
                      >
                        <ChevronRight />
                      </IconButton>
                      {/* Dots */}
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{
                          position: "absolute",
                          bottom: 10,
                          left: "50%",
                          transform: "translateX(-50%)",
                          zIndex: 2,
                        }}
                      >
                        {previewItem.images.map((_, i) => (
                          <Box
                            key={i}
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: i === previewActiveIdx ? "primary.main" : "rgba(255,255,255,0.4)",
                            }}
                          />
                        ))}
                      </Stack>
                    </>
                  )}
                </Box>
              </Grid>

              {/* Right Side: Details */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                    <Chip
                      label={previewItem.condition}
                      size="small"
                      sx={{
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        bgcolor: "rgba(16, 185, 129, 0.1)",
                        color: "#10B981",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        borderRadius: "4px",
                      }}
                    />
                    <Chip
                      label={previewItem.category}
                      size="small"
                      sx={{
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        bgcolor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "4px",
                      }}
                    />
                  </Stack>

                  <Typography variant="h6" fontWeight={900} color="text.primary" sx={{ mb: 1 }}>
                    {previewItem.title}
                  </Typography>

                  <Typography variant="h5" fontWeight={900} color="primary.light" sx={{ mb: 2 }}>
                    ${previewItem.price}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.5, fontSize: "0.82rem" }}>
                    {previewItem.description}
                  </Typography>

                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 2 }}>
                    <LocationOn sx={{ fontSize: 16, color: "text.disabled" }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      {previewItem.campusLocation}
                    </Typography>
                  </Stack>
                </Box>

                <Box>
                  <Divider sx={{ mb: 2, borderColor: "rgba(255, 255, 255, 0.06)" }} />
                  
                  {/* Seller Info Row */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        src={previewItem.seller?.photo ? `${apiBase}/uploads/${previewItem.seller.photo}` : undefined}
                        sx={{ width: 36, height: 36, bgcolor: "rgba(255,255,255,0.08)" }}
                      >
                        {previewItem.seller?.firstName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" color="text.primary" fontWeight={800}>
                          {previewItem.seller?.firstName} {previewItem.seller?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {previewItem.seller?.email}
                        </Typography>
                      </Box>
                    </Stack>

                    {previewItem.seller?._id === user._id ? (
                      <Chip label="Your Listing" color="primary" variant="outlined" size="small" />
                    ) : (
                      previewItem.status === "Available" && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Chat />}
                          onClick={() => handleProceedToPurchase(previewItem)}
                          sx={{
                            borderRadius: "8px",
                            height: 32,
                            textTransform: "none",
                            fontWeight: 700,
                            px: 2,
                            background: "linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)",
                          }}
                        >
                          Proceed to Purchase
                        </Button>
                      )
                    )}
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>
      </Modal>

      {/* Confirm Purchase Interest Offer Dialog */}
      <Dialog
        open={purchaseConfirmOpen}
        onClose={() => setPurchaseConfirmOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "#0F172A",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "0px",
            p: 1.5,
            width: "100%",
            maxWidth: 450,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "text.primary" }}>Confirm Purchase Offer</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <DialogContentText sx={{ color: "text.secondary", fontSize: "0.85rem", mb: 2.5 }}>
            Send a direct purchase request message to the seller to negotiate details or arrange pick up.
          </DialogContentText>
          
          <TextField
            label="Your Message"
            fullWidth
            multiline
            rows={3}
            value={purchaseMessage}
            onChange={(e) => setPurchaseMessage(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseConfirmOpen(false)} sx={{ color: "text.secondary", textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSendPurchaseOffer}
            variant="contained"
            disabled={sendingPurchase}
            sx={{
              background: "linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {sendingPurchase ? "Sending..." : "Send Offer & Chat"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
