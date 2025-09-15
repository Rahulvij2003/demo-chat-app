const express = require("express");
const { sendMessage, getMessages } = require("../controllers/messageController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/send", protect, sendMessage);
router.get("/:userId", protect, getMessages);

module.exports = router;
