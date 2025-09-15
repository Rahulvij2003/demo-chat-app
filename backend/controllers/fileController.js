const Message = require("../models/Messagemodel");
const path = require("path");

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const sender = req.user.id; 
    const receiver = req.body.receiver;
    const newMessage = await Message.create({
      sender,
      receiver,
      file: `/uploads/${req.file.filename}`, 
    });

    res.status(201).json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "File upload failed", error: err });
  }
};
