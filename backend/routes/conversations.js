const express = require("express");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/conversations
// Returns all conversations the logged-in user belongs to, most recent first
router.get("/", protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate("participants", "username email avatarColor isOnline lastSeen")
      .populate("groupAdmin", "username")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username" },
      })
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error.message);
    res.status(500).json({ message: "Server error while fetching conversations" });
  }
});

// @route   POST /api/conversations
// Creates (or returns existing) 1:1 conversation with another user
router.post("/", protect, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, userId], $size: 2 },
    })
      .populate("participants", "username email avatarColor isOnline lastSeen")
      .populate({ path: "lastMessage", populate: { path: "sender", select: "username" } });

    if (conversation) {
      return res.json(conversation);
    }

    conversation = await Conversation.create({
      isGroup: false,
      participants: [req.user._id, userId],
    });

    conversation = await Conversation.findById(conversation._id).populate(
      "participants",
      "username email avatarColor isOnline lastSeen"
    );

    res.status(201).json(conversation);
  } catch (error) {
    console.error("Create conversation error:", error.message);
    res.status(500).json({ message: "Server error while creating conversation" });
  }
});

// @route   POST /api/conversations/group
// Creates a group conversation
router.post("/group", protect, async (req, res) => {
  try {
    const { groupName, participantIds } = req.body;

    if (!groupName || !participantIds || participantIds.length < 2) {
      return res
        .status(400)
        .json({ message: "Group name and at least 2 other participants are required" });
    }

    const allParticipants = [...new Set([...participantIds, req.user._id.toString()])];

    const group = await Conversation.create({
      isGroup: true,
      groupName,
      participants: allParticipants,
      groupAdmin: req.user._id,
    });

    const fullGroup = await Conversation.findById(group._id)
      .populate("participants", "username email avatarColor isOnline lastSeen")
      .populate("groupAdmin", "username");

    res.status(201).json(fullGroup);
  } catch (error) {
    console.error("Create group error:", error.message);
    res.status(500).json({ message: "Server error while creating group" });
  }
});

module.exports = router;
