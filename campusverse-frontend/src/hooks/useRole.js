import { useAuth } from "../context/AuthContext.jsx";

/**
 * useRole — convenience hook for role-based access control in components.
 *
 * Returns:
 *   - role: the raw role string from the user object
 *   - isSuperAdmin: true if role === "super_admin"
 *   - isCollegeAdmin: true if role === "college_admin"
 *   - isModerator: true if role === "moderator"
 *   - isStudent: true if role === "student"
 *   - canModerate: true if user can perform moderation actions (super_admin | college_admin | moderator)
 *   - canAdminister: true if user can perform admin-level actions (super_admin | college_admin)
 *   - hasRole(roles[]): helper fn — returns true if user has any of the given roles
 *   - sameCollege(collegeId): helper fn — returns true if super_admin OR user belongs to given college
 *
 * Usage:
 *   const { isSuperAdmin, canModerate, sameCollege } = useRole();
 *   if (canModerate && sameCollege(post.college._id)) { ... }
 */
export default function useRole() {
  const { user } = useAuth();
  const role = user?.role || "student";

  const isSuperAdmin = role === "super_admin";
  const isCollegeAdmin = role === "college_admin";
  const isModerator = role === "moderator";
  const isStudent = role === "student";

  // Can pin Q&A, verify resources, moderate posts/answers in own college
  const canModerate = isSuperAdmin || isCollegeAdmin || isModerator;

  // Can create events, send announcements, manage students, assign roles
  const canAdminister = isSuperAdmin || isCollegeAdmin;

  /**
   * hasRole — check if user has at least one of the provided roles.
   * @param {string[]} roles - array of role strings to check against
   */
  const hasRole = (roles = []) => roles.includes(role);

  /**
   * sameCollege — super admins always pass. Others must belong to the college.
   * @param {string|Object} collegeId - the college id to check against user.college
   */
  const sameCollege = (collegeId) => {
    if (isSuperAdmin) return true;
    if (!collegeId || !user?.college) return false;
    const targetId = typeof collegeId === "object" ? collegeId?._id?.toString() : collegeId?.toString();
    const userCollege = typeof user.college === "object" ? user.college?._id?.toString() : user.college?.toString();
    return targetId === userCollege;
  };

  return {
    role,
    isSuperAdmin,
    isCollegeAdmin,
    isModerator,
    isStudent,
    canModerate,
    canAdminister,
    hasRole,
    sameCollege,
  };
}
