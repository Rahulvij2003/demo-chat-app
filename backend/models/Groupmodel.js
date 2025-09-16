const mongoose = require("mongoose");

const GroupChatSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GroupChat", GroupChatSchema);
