const mongoose = require("mongoose");

const GroupMessageSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "GroupChat", required: true }, 
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },    
  message: { type: String },  
  file: { type: String },    
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GroupMessage", GroupMessageSchema);
