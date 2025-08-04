const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

const isAdmin = roleCheck('ADMIN');
const isOperator = roleCheck('OPERATOR', 'ADMIN');
const isUser = roleCheck('USER', 'OPERATOR', 'ADMIN');

module.exports = {
  roleCheck,
  isAdmin,
  isOperator,
  isUser
}; 