const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

// Maps userId -> Set of socket ids (a user can have multiple tabs/devices open)
const onlineUsers = new Map();

const addOnlineUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socketId);
};

const removeOnlineUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) return;
  onlineUsers.get(userId).delete(socketId);
  if (onlineUsers.get(userId).size === 0) {
    onlineUsers.delete(userId);
  }
};

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

function initSocket(io) {
  // Authenticate every socket connection using the JWT issued at login
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication error: no token provided"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error("Authentication error: user not found"));
      }
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`Socket connected: ${socket.user.username} (${socket.id})`);

    // Join a personal room so we can target this user directly (e.g. notifications)
    socket.join(userId);
    addOnlineUser(userId, socket.id);

    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit("online_users", getOnlineUserIds());

    // Join a conversation room to start receiving its messages live
    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(conversationId);
    });

    // Typing indicators
    socket.on("typing", ({ conversationId }) => {
      socket.to(conversationId).emit("typing", { conversationId, userId, username: socket.user.username });
    });

    socket.on("stop_typing", ({ conversationId }) => {
      socket.to(conversationId).emit("stop_typing", { conversationId, userId });
    });

    // Sending a message: persist to DB, then broadcast to everyone in the room
    socket.on("send_message", async ({ conversationId, text }, callback) => {
      try {
        if (!text || !text.trim()) {
          if (callback) callback({ error: "Message text cannot be empty" });
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (callback) callback({ error: "Conversation not found" });
          return;
        }
        if (!conversation.participants.some((p) => p.toString() === userId)) {
          if (callback) callback({ error: "You are not part of this conversation" });
          return;
        }

        let message = await Message.create({
          conversation: conversationId,
          sender: userId,
          text: text.trim(),
          readBy: [userId],
        });

        message = await message.populate("sender", "username avatarColor");

        conversation.lastMessage = message._id;
        await conversation.save();

        io.to(conversationId).emit("receive_message", message);

        if (callback) callback({ success: true, message });
      } catch (error) {
        console.error("send_message error:", error.message);
        if (callback) callback({ error: "Server error while sending message" });
      }
    });

    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.user.username} (${socket.id})`);
      removeOnlineUser(userId, socket.id);

      if (!onlineUsers.has(userId)) {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      }
      io.emit("online_users", getOnlineUserIds());
    });
  });
}

module.exports = { initSocket };
