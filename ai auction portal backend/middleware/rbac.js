// Role-Based Access Control (RBAC) Middleware

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Please login first." });
    }

    const userRole = req.user.role || "buyer";
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `Access denied. Action requires one of the following roles: ${allowedRoles.join(", ")}`,
        currentRole: userRole
      });
    }

    next();
  };
};

// Check specific permission rules
const checkPermissions = (permission) => {
  return (req, res, next) => {
    const role = req.user?.role || "buyer";

    const permissionsByRole = {
      buyer: ["place_bid", "watchlist", "review", "make_payment"],
      seller: ["upload_vehicle", "manage_own_listings", "view_own_revenue"],
      admin: ["approve_vehicle", "reject_vehicle", "ban_user", "view_analytics", "view_reports", "manage_settings"]
    };

    const allowedPermissions = permissionsByRole[role] || [];

    if (!allowedPermissions.includes(permission)) {
      return res.status(403).json({
        error: `Permission denied. Your role '${role}' cannot perform '${permission}'.`,
      });
    }

    next();
  };
};

module.exports = { authorizeRoles, checkPermissions };
