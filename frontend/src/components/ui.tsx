import type { PersonResponse } from "@/lib/types";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  ["#e6deff", "#451ebb"],
  ["#fde8d8", "#c2440e"],
  ["#d4f0e5", "#1a7a4c"],
  ["#fef2cc", "#9a6000"],
  ["#fce7f3", "#9d174d"],
  ["#dbeafe", "#1e40af"],
];

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const [bg, fg] = AVATAR_COLORS[idx];
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: bg, color: fg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Geist', sans-serif",
        fontSize: size * 0.38,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

export function PersonCard({
  person,
  onClick,
  selected,
  compact,
}: {
  person: PersonResponse;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`card card-hover cursor-pointer animate-fade-in`}
      style={{
        padding: compact ? "0.75rem" : "1.25rem",
        borderColor: selected ? "var(--primary)" : undefined,
        boxShadow: selected ? "0 0 0 2px var(--primary-light)" : undefined,
      }}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Avatar name={person.name} size={compact ? 36 : 44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-sm" style={{ color: "var(--text)" }}>
              {person.name}
            </h3>
            {selected && (
              <span className="tag" style={{ fontSize: "0.65rem", padding: "0.1rem 0.5rem" }}>Selected</span>
            )}
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
            {person.headline}
          </p>
          {!compact && (
            <div className="flex flex-wrap gap-1 mt-2">
              {person.profile.interests.slice(0, 3).map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ScoreRing({ score, size }: { score: number; size?: number }) {
  const pct = Math.min(score, 100);
  const color =
    pct >= 88 ? "var(--primary)" :
    pct >= 75 ? "#c2800e" :
    "var(--text-muted)";
  return (
    <div
      className="score-ring"
      style={{
        borderColor: color,
        color,
        ...(size ? { width: size, height: size, minWidth: size, minHeight: size, fontSize: Math.max(10, Math.round(size * 0.35)) } : {}),
      }}
    >
      {Math.round(pct)}
    </div>
  );
}

export function ThinkingDots() {
  return (
    <div className="thinking-indicator">
      <span style={{ fontSize: "0.75rem", color: "var(--text-faint)" }}>Thinking</span>
      <div className="flex gap-1 ml-1">
        <div className="animate-dot-1 w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
        <div className="animate-dot-2 w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
        <div className="animate-dot-3 w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
      </div>
    </div>
  );
}

export function Skeleton({ width = "100%", height = 20 }: { width?: string | number; height?: number }) {
  return <div className="skeleton" style={{ width, height }} />;
}
