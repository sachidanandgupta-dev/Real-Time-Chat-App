import { useMemo, useState } from "react";
import Avatar from "./Avatar";
import NewChatModal from "./NewChatModal";
import { getConversationLabel, getConversationAvatarProps } from "../utils/conversation";

export default function Sidebar({
  conversations,
  selectedId,
  onSelect,
  onConversationCreated,
  currentUser,
  onlineUserIds,
  onLogout,
}) {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter.trim()) return conversations;
    const f = filter.toLowerCase();
    return conversations.filter((c) =>
      getConversationLabel(c, currentUser._id).toLowerCase().includes(f)
    );
  }, [conversations, filter, currentUser._id]);

  return (
    <div className="flex h-full w-full flex-col border-r border-hairline bg-panel md:w-80">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <span className="font-display text-sm font-bold text-canvas">P</span>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">PulseChat</span>
        </div>
        <button
          onClick={onLogout}
          title="Log out"
          className="rounded-md px-2 py-1 text-xs text-text-muted hover:bg-elevated hover:text-text"
        >
          Log out
        </button>
      </div>

      <div className="px-4 pb-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Find a conversation…"
          className="w-full rounded-lg border border-hairline bg-elevated px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {filtered.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-text-muted">
            No conversations yet. Start one below.
          </p>
        )}
        {filtered.map((c) => {
          const label = getConversationLabel(c, currentUser._id);
          const avatarProps = getConversationAvatarProps(c, currentUser._id, onlineUserIds);
          const preview = c.lastMessage
            ? `${c.lastMessage.sender?.username === currentUser.username ? "You: " : ""}${c.lastMessage.text}`
            : "No messages yet";

          return (
            <button
              key={c._id}
              onClick={() => onSelect(c)}
              className={`mb-1 flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-elevated ${
                selectedId === c._id ? "bg-elevated" : ""
              }`}
            >
              <Avatar {...avatarProps} size={42} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{label}</p>
                <p className="truncate text-xs text-text-muted">{preview}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-hairline p-3">
        <button
          onClick={() => setShowModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-elevated py-2.5 text-sm font-medium text-text transition hover:bg-elevated-2"
        >
          <span className="text-accent">+</span> New conversation
        </button>
      </div>

      {showModal && (
        <NewChatModal
          onClose={() => setShowModal(false)}
          onConversationCreated={onConversationCreated}
        />
      )}
    </div>
  );
}
