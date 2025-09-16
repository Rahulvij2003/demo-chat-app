const GroupMessage = require("../models/Groupmsgmodel");
const GroupChat = require("../models/Groupmodel");
const User = require("../models/Usermodel");


exports.createGroup = async (req, res) => {
  const { name, members } = req.body; 

  try {
    const group = await GroupChat.create({
      name,
      members: [...members, req.user.id], 
      admins: [req.user.id],              
      createdBy: req.user.id,        
    });

    res.status(201).json({ message: "Group created", group });
  } catch (err) {
    res.status(500).json({ message: "Error creating group" });
  }
};


exports.addMember = async (req, res) => {
  const { groupId } = req.params;
  const { memberId } = req.body;

  const group = await GroupChat.findById(groupId);
  if (!group) return res.status(404).json({ message: "Group not found" });
  if (!group.admins.includes(req.user.id))
    return res.status(403).json({ message: "Only admin can add members" });

  if (group.members.includes(memberId))
    return res.status(400).json({ message: "User already in group" });

  group.members.push(memberId);
  await group.save();

  res.json({ message: "Member added", group });
};


exports.assignAdmin = async (req, res) => {
  const { groupId } = req.params;
  const { memberId } = req.body;

  const group = await GroupChat.findById(groupId);
  if (!group) return res.status(404).json({ message: "Group not found" });

  if (!group.admins.includes(req.user.id))
    return res.status(403).json({ message: "Only admin can assign admin" });

  if (!group.members.includes(memberId))
    return res.status(400).json({ message: "User not in group" });

  if (!group.admins.includes(memberId)) group.admins.push(memberId);
  await group.save();

  res.json({ message: "Admin assigned", group });
};


exports.getMyGroups = async (req, res) => {
  try {
    const groups = await GroupChat.find({ members: req.user.id })
      .populate("members", "username email")
      .populate("admins", "username email");

    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Error fetching groups" });
  }
};



exports.sendGroupMessage = async (req, res) => {
  const { groupId } = req.params;
  const messageText = req.body.message || ""; 
  const filePath = req.file ? req.file.path : null; 

  try {
    const group = await GroupChat.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.members.includes(req.user.id))
      return res.status(403).json({ message: "You are not a member of this group" });

    const groupMsg = await GroupMessage.create({
      group: groupId,
      sender: req.user.id,
      message: messageText,
      file: filePath,
    });

    res.status(201).json(groupMsg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending group message" });
  }
};

exports.getGroupMessages = async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await GroupChat.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.members.includes(req.user.id))
      return res.status(403).json({ message: "You are not a member of this group" });

    const messages = await GroupMessage.find({ group: groupId })
      .populate("sender", "username email")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching group messages" });
  }
};

exports.removeAdmin = async (req, res) => {
  try {
    const { groupId, adminId } = req.params;
    const userId = req.user.id; 

    const group = await GroupChat.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "Only group creator can remove an admin" });
    }
    if (!group.admins.includes(adminId)) {
      return res.status(400).json({ message: "User is not an admin of this group" });
    }
    group.admins = group.admins.filter((id) => id.toString() !== adminId);
    await group.save();

    res.json({ message: "Admin removed successfully", group });
  } catch (err) {
    console.error("Error removing admin:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    const group = await GroupChat.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "Only group creator can remove a member" });
    }

    if (!group.members.includes(memberId)) {
      return res.status(400).json({ message: "User is not a member of this group" });
    }
    group.members = group.members.filter((id) => id.toString() !== memberId);
    if (group.admins.includes(memberId)) {
      group.admins = group.admins.filter((id) => id.toString() !== memberId);
    }

    await group.save();

    res.json({ message: "Member removed successfully", group });
  } catch (err) {
    console.error("Error removing member:", err);
    res.status(500).json({ message: "Server error" });
  }
};


