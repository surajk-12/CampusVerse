import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("cv_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState(user?.friends || []);
  const [notifications, setNotifications] = useState([]);

  // Track the count of notifications and friends that the user has "seen"
  const [seenNotificationsCount, setSeenNotificationsCount] = useState(() => {
    const saved = localStorage.getItem("cv_seen_notifications_count");
    return saved !== null ? Number(saved) : null;
  });
  const [seenFriendsCount, setSeenFriendsCount] = useState(() => {
    const saved = localStorage.getItem("cv_seen_friends_count");
    return saved !== null ? Number(saved) : null;
  });

  // Save auth in localStorage and state
  const saveAuth = (token, userObj) => {
    if (token) localStorage.setItem("cv_token", token);
    if (userObj) localStorage.setItem("cv_user", JSON.stringify(userObj));
    setUser(userObj || null);
    const friendList = userObj?.friends || [];
    setFriends(friendList);

    // Initialize seen friends count if not set
    if (localStorage.getItem("cv_seen_friends_count") === null) {
      localStorage.setItem("cv_seen_friends_count", friendList.length);
      setSeenFriendsCount(friendList.length);
    }
  };

  // Register college
  const registerCollege = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/colleges/register", payload);
      return { ok: true, data };
    } catch (e) {
      return { ok: false, message: e?.response?.data?.message || "College registration failed" };
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("cv_token", data.token);

      const me = await api.get("/auth/me");
      saveAuth(data.token, me.data);

      // Fetch notifications for the user
      const notifRes = await api.get(`/notifications/${me.data._id}`);
      const notifList = notifRes.data || [];
      setNotifications(notifList);

      // Initialize seen counts on login
      const pendingCount = notifList.filter((n) => n.status === "pending").length;
      localStorage.setItem("cv_seen_notifications_count", pendingCount);
      setSeenNotificationsCount(pendingCount);

      const friendCount = me.data.friends?.length || 0;
      localStorage.setItem("cv_seen_friends_count", friendCount);
      setSeenFriendsCount(friendCount);

      return { ok: true };
    } catch (e) {
      return { ok: false, message: e?.response?.data?.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  // Register
  const register = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", payload);
      localStorage.setItem("cv_token", data.token);

      const me = await api.get("/auth/me");
      saveAuth(data.token, me.data);

      // Fetch notifications
      const notifRes = await api.get(`/notifications/${me.data._id}`);
      const notifList = notifRes.data || [];
      setNotifications(notifList);

      // Initialize seen counts on registration
      const pendingCount = notifList.filter((n) => n.status === "pending").length;
      localStorage.setItem("cv_seen_notifications_count", pendingCount);
      setSeenNotificationsCount(pendingCount);

      const friendCount = me.data.friends?.length || 0;
      localStorage.setItem("cv_seen_friends_count", friendCount);
      setSeenFriendsCount(friendCount);

      return { ok: true };
    } catch (e) {
      return { ok: false, message: e?.response?.data?.message || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("cv_token");
    localStorage.removeItem("cv_user");
    localStorage.removeItem("cv_seen_notifications_count");
    localStorage.removeItem("cv_seen_friends_count");
    setUser(null);
    setFriends([]);
    setNotifications([]);
    setSeenNotificationsCount(null);
    setSeenFriendsCount(null);
  };

  // Refresh notifications from server
  const refreshNotifications = async (userId) => {
    if (!userId) return;
    try {
      const { data } = await api.get(`/notifications/${userId}`);
      setNotifications(data || []);
    } catch (err) {
      console.error("Failed to refresh notifications", err);
    }
  };

  // Refresh friends list from server
  const refreshFriends = async (userId) => {
    if (!userId) return;
    try {
      const { data } = await api.get(`/users/${userId}`);
      const friendList = data.friends || [];
      setFriends(friendList);
    } catch (err) {
      console.error("Failed to refresh friends", err);
    }
  };

  // Mark notification count as seen (resets badge)
  const markNotificationsAsSeen = () => {
    const pendingCount = notifications.filter((n) => n.status === "pending").length;
    localStorage.setItem("cv_seen_notifications_count", pendingCount);
    setSeenNotificationsCount(pendingCount);
  };

  // Mark connections count as seen (resets badge)
  const markConnectionsAsSeen = () => {
    const friendCount = friends.length;
    localStorage.setItem("cv_seen_friends_count", friendCount);
    setSeenFriendsCount(friendCount);
  };

  // Keep seen count from exceeding actual count if items are removed/rejected
  useEffect(() => {
    const pendingCount = notifications.filter((n) => n.status === "pending").length;
    if (seenNotificationsCount !== null && pendingCount < seenNotificationsCount) {
      localStorage.setItem("cv_seen_notifications_count", pendingCount);
      setSeenNotificationsCount(pendingCount);
    }
  }, [notifications, seenNotificationsCount]);

  useEffect(() => {
    const friendCount = friends.length;
    if (seenFriendsCount !== null && friendCount < seenFriendsCount) {
      localStorage.setItem("cv_seen_friends_count", friendCount);
      setSeenFriendsCount(friendCount);
    }
  }, [friends, seenFriendsCount]);

  // Initializing counts if they are fetched on first boot
  useEffect(() => {
    if (seenNotificationsCount === null && notifications.length > 0) {
      const pendingCount = notifications.filter((n) => n.status === "pending").length;
      localStorage.setItem("cv_seen_notifications_count", pendingCount);
      setSeenNotificationsCount(pendingCount);
    }
  }, [notifications, seenNotificationsCount]);

  useEffect(() => {
    if (seenFriendsCount === null && friends.length > 0) {
      localStorage.setItem("cv_seen_friends_count", friends.length);
      setSeenFriendsCount(friends.length);
    }
  }, [friends, seenFriendsCount]);

  // On first load, if token exists but no user, fetch /me and notifications
  useEffect(() => {
    const token = localStorage.getItem("cv_token");
    if (token && !user) {
      api.get("/auth/me")
        .then(async (res) => {
          const me = res.data;
          saveAuth(token, me);

          // Fetch notifications
          const notifRes = await api.get(`/notifications/${me._id}`);
          const notifList = notifRes.data || [];
          setNotifications(notifList);

          // Initialize seen notification count if null
          const pendingCount = notifList.filter((n) => n.status === "pending").length;
          if (localStorage.getItem("cv_seen_notifications_count") === null) {
            localStorage.setItem("cv_seen_notifications_count", pendingCount);
            setSeenNotificationsCount(pendingCount);
          }
        })
        .catch(() => logout());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        registerCollege,
        friends,
        setFriends,
        notifications,
        setNotifications,
        refreshNotifications,
        refreshFriends,
        seenNotificationsCount,
        seenFriendsCount,
        markNotificationsAsSeen,
        markConnectionsAsSeen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
