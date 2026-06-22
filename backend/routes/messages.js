const express = require("express");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { protect } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/messages/:conversationId
router.get("/:conversationId", protect, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "You are not part of this conversation" });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username avatarColor")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error.message);
    res.status(500).json({ message: "Server error while fetching messages" });
  }
});

module.exports = router;
