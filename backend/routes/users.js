const express = require("express");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/users?search=keyword
// Returns all users except the logged-in user, optionally filtered by search
router.get("/", protect, async (req, res) => {
  try {
    const search = req.query.search;
    const filter = search
      ? {
          $and: [
            { _id: { $ne: req.user._id } },
            {
              $or: [
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
              ],
            },
          ],
        }
      : { _id: { $ne: req.user._id } };

    const users = await User.find(filter).select("username email avatarColor isOnline lastSeen");
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error.message);
    res.status(500).json({ message: "Server error while fetching users" });
  }
});

module.exports = router;
