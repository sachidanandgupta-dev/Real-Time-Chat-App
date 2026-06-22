import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";
import { useSocket } from "../context/useSocket";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

export default function ChatPage() {
  const { user, logout } = useAuth();
  const { onlineUserIds, connected } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showSidebarMobile, setShowSidebarMobile] = useState(true);

  useEffect(() => {
    api
      .get("/conversations")
      .then(({ data }) => {
        setConversations(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load conversations:", err.message);
        setLoading(false);
        setFetchError(true);
      });
  }, []);

  const handleSelect = (conversation) => {
    setSelected(conversation);
    setShowSidebarMobile(false);
  };

  const handleConversationCreated = (conversation) => {
    setConversations((prev) => {
      const exists = prev.find((c) => c._id === conversation._id);
      if (exists) return prev;
      return [conversation, ...prev];
    });
    handleSelect(conversation);
  };

  const handleLastMessageUpdate = useCallback((conversationId, message) => {
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c._id === conversationId ? { ...c, lastMessage: message } : c
      );
      // Bump the most recently active conversation to the top
      const idx = updated.findIndex((c) => c._id === conversationId);
      if (idx > 0) {
        const [moved] = updated.splice(idx, 1);
        updated.unshift(moved);
      }
      return updated;
    });
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className={`${showSidebarMobile ? "flex" : "hidden"} w-full md:flex md:w-auto`}>
        <Sidebar
          conversations={conversations}
          selectedId={selected?._id}
          onSelect={handleSelect}
          onConversationCreated={handleConversationCreated}
          currentUser={user}
          onlineUserIds={onlineUserIds}
          onLogout={logout}
        />
      </div>

      <div className={`${showSidebarMobile ? "hidden" : "flex"} w-full md:flex md:flex-1`}>
        {selected ? (
          <div className="flex w-full flex-col">
            <button
              onClick={() => setShowSidebarMobile(true)}
              className="border-b border-hairline px-4 py-2 text-left text-xs text-text-muted md:hidden"
            >
              ← Back to conversations
            </button>
            <ChatWindow
              key={selected._id}
              conversation={selected}
              currentUser={user}
              onlineUserIds={onlineUserIds}
              onLastMessageUpdate={handleLastMessageUpdate}
            />
          </div>
        ) : (
          <div className="hidden flex-1 flex-col items-center justify-center gap-2 md:flex">
            {fetchError ? (
              <p className="font-mono text-sm text-accent">
                Could not connect to server. Is the backend running?
              </p>
            ) : (
              <p className="font-display text-lg text-text-muted">
                {loading ? "Loading conversations…" : "Select a conversation to start chatting"}
              </p>
            )}
            {!connected && !fetchError && (
              <p className="font-mono text-xs text-accent">Reconnecting to server…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
