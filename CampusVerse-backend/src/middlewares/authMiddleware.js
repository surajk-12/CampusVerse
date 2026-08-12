import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * protect — verifies JWT token and attaches req.user
 */
export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  res.status(401).json({ message: "Not authorized, no token" });
};

/**
 * requireRole — restricts access to specific roles only
 * Usage: requireRole(["super_admin", "college_admin"])
 */
export const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Required role: ${roles.join(" or ")}. Your role: ${req.user.role}`,
    });
  }
  next();
};

/**
 * requireCollegeScope — ensures college_admin/moderator can only act on their own college.
 * Compares req.params.collegeId (or req.body.college) with req.user.college.
 * Super admins bypass this check entirely.
 */
export const requireCollegeScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  // Super admin has global access
  if (req.user.role === "super_admin") {
    return next();
  }

  // For college-scoped roles, verify the college matches
  const targetCollege =
    req.params.collegeId ||
    req.body.college ||
    req.query.collegeId;

  if (!targetCollege) {
    return next(); // No college context to restrict
  }

  if (req.user.college?.toString() !== targetCollege.toString()) {
    return res.status(403).json({
      message: "Access denied. You can only manage your own college.",
    });
  }

  next();
};

/**
 * requireOwnerOrRole — allows access if the user is the resource owner OR has one of the given roles.
 * Usage: requireOwnerOrRole(doc.author, ["super_admin", "college_admin", "moderator"])
 */
export const requireOwnerOrRole = (ownerId, roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const isOwner = ownerId?.toString() === req.user._id.toString();
  const hasRole = roles.includes(req.user.role);

  if (isOwner || hasRole) {
    return next();
  }

  return res.status(403).json({ message: "Access denied. Insufficient permissions." });
};
