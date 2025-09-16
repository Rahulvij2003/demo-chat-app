const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) return res.status(401).json({ message: "Not authorized, no token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(401).json({ message: "Access token invalid or expired" });
  }
};

module.exports = protect;
