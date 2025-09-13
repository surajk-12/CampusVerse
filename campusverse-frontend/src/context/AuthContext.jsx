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

  // Save auth in localStorage and state
  const saveAuth = (token, userObj) => {
    if (token) localStorage.setItem("cv_token", token);
    if (userObj) localStorage.setItem("cv_user", JSON.stringify(userObj));
    setUser(userObj || null);
    setFriends(userObj?.friends || []);
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
      setNotifications(notifRes.data || []);

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
      setNotifications(notifRes.data || []);

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
    setUser(null);
    setFriends([]);
    setNotifications([]);
  };

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
          setNotifications(notifRes.data || []);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
