const express = require("express");
const { registerUser, loginUser, getallusers, logoutUser } = require("../controllers/authController");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/users", getallusers);

module.exports = router;
