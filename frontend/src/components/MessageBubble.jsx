function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message, isOwn, showSender }) {
  return (
    <div className={`message-enter flex ${isOwn ? "justify-end" : "justify-start"} px-4 py-0.5`}>
      <div className={`max-w-[72%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {showSender && !isOwn && (
          <span className="mb-0.5 px-1 font-mono text-[11px] text-text-faint">
            {message.sender?.username}
          </span>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
            isOwn
              ? "rounded-br-sm bg-accent text-canvas"
              : "rounded-bl-sm bg-elevated text-text"
          }`}
        >
          {message.text}
        </div>
        <span className="mt-0.5 px-1 font-mono text-[10px] text-text-faint">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
