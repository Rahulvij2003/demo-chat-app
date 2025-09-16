const express = require("express");
const { registerUser, loginUser, getallusers, logoutUser, refreshToken } = require("../controllers/authController");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/users", getallusers);
router.post("/refresh-token", refreshToken);

module.exports = router;
