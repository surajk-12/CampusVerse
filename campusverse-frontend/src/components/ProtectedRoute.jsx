import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * ProtectedRoute — guards a route based on authentication and optional role restrictions.
 *
 * Props:
 *   - children: the component to render if access is granted
 *   - roles: (optional) array of allowed roles e.g. ["super_admin", "college_admin"]
 *            If omitted, any authenticated user can access.
 *   - redirectTo: (optional) where to redirect on role-access failure (default: "/dashboard")
 *
 * Behavior:
 *   - Unauthenticated → redirect to /login
 *   - Authenticated but wrong role → redirect to redirectTo (default /dashboard)
 *   - Authenticated and authorized → render children
 */
export default function ProtectedRoute({ children, roles, redirectTo = "/dashboard" }) {
  const { user } = useAuth();
  const location = useLocation();

  // Not logged in at all → send to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role restriction specified → check if user's role is allowed
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
