"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/network", label: "Agent Network" },
  { href: "/create", label: "Create Agent" },
  { href: "/date", label: "Live Date" },
  { href: "/rankings", label: "Rankings" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header style={{ borderBottom: "1px solid var(--border-light)", background: "rgba(252,249,246,0.92)" }}
      className="sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group" style={{ textDecoration: "none" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "8px",
            background: "var(--primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="5" cy="9" r="3" fill="white" opacity="0.9" />
              <circle cx="13" cy="9" r="3" fill="white" opacity="0.6" />
              <path d="M8 9 C8 9 9 7 10 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-display font-medium" style={{ fontSize: "1.05rem", color: "var(--text)", letterSpacing: "-0.01em" }}>
            PAIR<span style={{ color: "var(--primary)" }}>//</span>AGENTS
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname === link.href ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <Link href="/create" className="btn-primary" style={{ fontSize: "0.8rem", padding: "0.45rem 1rem" }}>
          <span>＋</span> Add Agent
        </Link>
      </div>
    </header>
  );
}
