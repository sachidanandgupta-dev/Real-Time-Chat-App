export default function TypingIndicator({ label }) {
  if (!label) return null;
  return (
    <div className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono text-text-muted">
      <span>{label}</span>
      <span className="typing-cursor">▍</span>
    </div>
  );
}
