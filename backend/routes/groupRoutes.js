const express = require("express");
const { sendGroupMessage, getGroupMessages, createGroup, addMember, assignAdmin, getMyGroups, removeAdmin, removeMember } = require("../controllers/groupController");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });
router.post("/create", protect, createGroup);
router.post("/:groupId/add-member", protect, addMember);
router.post("/:groupId/assign-admin", protect, assignAdmin);
router.get("/my-groups", protect, getMyGroups);
router.post("/:groupId/send", protect, upload.single("file"), sendGroupMessage);
router.get("/:groupId/messages", protect, getGroupMessages);
router.delete("/:groupId/remove-admin/:adminId", protect, removeAdmin);
router.delete("/:groupId/remove-member/:memberId", protect, removeMember);

module.exports = router;
