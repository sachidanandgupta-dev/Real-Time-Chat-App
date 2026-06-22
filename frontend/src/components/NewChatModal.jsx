import { useEffect, useState } from "react";
import api from "../api/axios";
import Avatar from "./Avatar";

export default function NewChatModal({ onClose, onConversationCreated }) {
  const [mode, setMode] = useState("direct"); // "direct" | "group"
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/users", { params: { search } });
        setUsers(data);
      } catch (err) {
        console.error("Failed to load users:", err.message);
        setError("Could not load users.");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const startDirectChat = async (userId) => {
    setError("");
    try {
      const { data } = await api.post("/conversations", { userId });
      onConversationCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not start chat.");
    }
  };

  const createGroup = async () => {
    setError("");
    if (!groupName.trim()) {
      setError("Give your group a name.");
      return;
    }
    if (selectedIds.length < 2) {
      setError("Pick at least 2 other people for a group.");
      return;
    }
    try {
      const { data } = await api.post("/conversations/group", {
        groupName: groupName.trim(),
        participantIds: selectedIds,
      });
      onConversationCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create group.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-xl border border-hairline bg-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <h2 className="font-display text-lg font-semibold">New conversation</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            ✕
          </button>
        </div>

        <div className="flex gap-1 border-b border-hairline px-5 pt-3">
          {["direct", "group"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setSelectedIds([]);
                setError("");
              }}
              className={`rounded-t-md px-3 py-2 text-sm font-medium capitalize transition ${
                mode === m ? "border-b-2 border-accent text-accent" : "text-text-muted hover:text-text"
              }`}
            >
              {m === "direct" ? "Direct message" : "Group chat"}
            </button>
          ))}
        </div>

        <div className="p-5">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or email…"
            className="w-full rounded-lg border border-hairline bg-elevated px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />

          {mode === "group" && (
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="mt-3 w-full rounded-lg border border-hairline bg-elevated px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            />
          )}

          {error && <p className="mt-3 text-sm text-accent">{error}</p>}

          <div className="mt-4 max-h-60 space-y-1 overflow-y-auto">
            {loading && <p className="py-4 text-center text-sm text-text-muted">Searching…</p>}
            {!loading && users.length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">No users found.</p>
            )}
            {!loading &&
              users.map((u) => {
                const selected = selectedIds.includes(u._id);
                return (
                  <button
                    key={u._id}
                    onClick={() =>
                      mode === "direct" ? startDirectChat(u._id) : toggleSelect(u._id)
                    }
                    className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-elevated ${
                      selected ? "bg-elevated" : ""
                    }`}
                  >
                    <Avatar name={u.username} color={u.avatarColor} size={34} online={u.isOnline} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.username}</p>
                      <p className="truncate text-xs text-text-muted">{u.email}</p>
                    </div>
                    {mode === "group" && (
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                          selected ? "border-accent bg-accent text-canvas" : "border-hairline"
                        }`}
                      >
                        {selected ? "✓" : ""}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {mode === "group" && (
            <button
              onClick={createGroup}
              className="mt-4 w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-canvas transition hover:opacity-90"
            >
              Create group ({selectedIds.length} selected)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
