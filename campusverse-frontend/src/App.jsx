import { Box } from "@mui/material";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import CollegeRegister from "./pages/CollegeRegister.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import NavBar from "./components/NavBar.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import Footer from "./components/Footer.jsx";
import AuthenticatedLayout from "./components/AuthenticatedLayout";
import MySidebar from "./components/MySidebar.jsx";
// import StudentsTable from "./pages/StudentsTable.jsx";
import CollegeDetails from "./pages/CollegeDetails.jsx";
import StudentsPage from "./pages/StudentPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import Chat from "./pages/Chat.jsx";
import MyProfile from "./pages/MyProfile.jsx";
import Connections from "./pages/Connections.jsx";
import QuickActions from "./pages/QuickActions.jsx";

export default function App() {
  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <NavBar />
        <Box sx={{ flex: 1 }}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />

            {/* Registration flow */}
            <Route path="/register" element={<CollegeRegister />} />
            <Route path="/register/student" element={<Register />} />

            {/* Protected routes with sidebar */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout sidebarContent={<MySidebar />}>
                    <Dashboard />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/colleges/:collegeId"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout sidebarContent={<MySidebar />}>
                    <CollegeDetails />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/colleges/:collegeId/students"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout sidebarContent={<MySidebar />}>
                    <StudentsPage />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout sidebarContent={<MySidebar />}>
                    <NotificationsPage />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout sidebarContent={<MySidebar />}>
                    <Chat />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout sidebarContent={<MySidebar />}>
                    <MyProfile />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/connections"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout sidebarContent={<MySidebar />}>
                    <Connections />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/quick-actions"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout sidebarContent={<MySidebar />}>
                    <QuickActions />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
          </Routes>
        </Box>
        <Footer />
      </Box>
    </>
  );
}
