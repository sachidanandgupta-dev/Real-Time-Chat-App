function getInitial(name = "?") {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export default function Avatar({ name, color = "#FF7A59", size = 40, online, isGroup }) {
  const dotSize = Math.max(8, Math.round(size * 0.28));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex items-center justify-center rounded-full font-display font-semibold text-white"
        style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.42 }}
      >
        {isGroup ? "#" : getInitial(name)}
      </div>
      {typeof online === "boolean" && !isGroup && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-panel ${
            online ? "bg-online online-dot" : "bg-text-faint"
          }`}
          style={{ width: dotSize, height: dotSize }}
        />
      )}
    </div>
  );
}
