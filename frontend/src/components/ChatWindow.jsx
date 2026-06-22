import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useSocket } from "../context/useSocket";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { getConversationLabel, getConversationAvatarProps } from "../utils/conversation";

let typingTimeout = null;

export default function ChatWindow({ conversation, currentUser, onlineUserIds, onLastMessageUpdate }) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [typingUsers, setTypingUsers] = useState({}); // userId -> username
  const bottomRef = useRef(null);

  const label = getConversationLabel(conversation, currentUser._id);
  const avatarProps = getConversationAvatarProps(conversation, currentUser._id, onlineUserIds);
  const otherParticipant = conversation.participants.find((p) => p._id !== currentUser._id);
  const isOtherOnline = !conversation.isGroup && onlineUserIds.includes(otherParticipant?._id);

  // Load message history and join the conversation's socket room.
  // This component is remounted with a fresh key per conversation (see ChatPage),
  // so messages/loading/typingUsers already start at their initial values here.
  useEffect(() => {
    let cancelled = false;

    api.get(`/messages/${conversation._id}`).then(({ data }) => {
      if (!cancelled) {
        setMessages(data);
        setLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        console.error("Failed to load messages:", err.message);
        setLoading(false);
      }
    });

    socket?.emit("join_conversation", conversation._id);

    return () => {
      cancelled = true;
      socket?.emit("leave_conversation", conversation._id);
    };
  }, [conversation._id, socket]);

  // Listen for live events scoped to this conversation
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (message) => {
      if (message.conversation !== conversation._id) return;
      setMessages((prev) => [...prev, message]);
      onLastMessageUpdate(conversation._id, message);
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[message.sender._id];
        return next;
      });
    };

    const handleTyping = ({ conversationId, userId, username }) => {
      if (conversationId !== conversation._id || userId === currentUser._id) return;
      setTypingUsers((prev) => ({ ...prev, [userId]: username }));
    };

    const handleStopTyping = ({ conversationId, userId }) => {
      if (conversationId !== conversation._id) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    socket.on("receive_message", handleReceive);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
    };
  }, [socket, conversation._id, currentUser._id, onLastMessageUpdate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleChange = (e) => {
    setText(e.target.value);
    if (!socket) return;
    socket.emit("typing", { conversationId: conversation._id });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("stop_typing", { conversationId: conversation._id });
    }, 1500);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !socket) return;

    socket.emit("send_message", { conversationId: conversation._id, text: trimmed }, (res) => {
      if (res?.error) {
        console.error("Send failed:", res.error);
      } else if (res?.message) {
        onLastMessageUpdate(conversation._id, res.message);
      }
    });

    socket.emit("stop_typing", { conversationId: conversation._id });
    clearTimeout(typingTimeout);
    setText("");
  };

  const typingLabel =
    Object.keys(typingUsers).length > 0
      ? `${Object.values(typingUsers).join(", ")} ${
          Object.keys(typingUsers).length > 1 ? "are" : "is"
        } typing`
      : "";

  return (
    <div className="flex h-full flex-1 flex-col bg-canvas">
      <div className="flex items-center gap-3 border-b border-hairline px-5 py-3.5">
        <Avatar {...avatarProps} size={38} />
        <div>
          <p className="font-display text-sm font-semibold">{label}</p>
          <p className="text-xs text-text-muted">
            {conversation.isGroup
              ? `${conversation.participants.length} members`
              : isOtherOnline
              ? "Online"
              : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {loading && <p className="py-8 text-center text-sm text-text-muted">Loading messages…</p>}
        {!loading && messages.length === 0 && (
          <p className="py-8 text-center text-sm text-text-muted">
            No messages yet. Say hello to {conversation.isGroup ? "the group" : label}.
          </p>
        )}
        {!loading &&
          messages.map((m, idx) => {
            const prev = messages[idx - 1];
            const showSender = conversation.isGroup && (!prev || prev.sender._id !== m.sender._id);
            return (
              <MessageBubble
                key={m._id}
                message={m}
                isOwn={m.sender._id === currentUser._id}
                showSender={showSender}
              />
            );
          })}
        <div ref={bottomRef} />
      </div>

      <TypingIndicator label={typingLabel} />

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-hairline p-3">
        <input
          value={text}
          onChange={handleChange}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-hairline bg-elevated px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-canvas transition hover:opacity-90 disabled:opacity-40"
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
