"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { api } from "@/lib/api";
import type { DemoNetworkResponse } from "@/lib/types";
import { Avatar, ScoreRing, Skeleton } from "@/components/ui";
import PromptBar from "@/components/agents/PromptBar";

export default function HomePage() {
  const [demo, setDemo] = useState<DemoNetworkResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDemo()
      .then(setDemo)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main>
        {/* Hero */}
        <section style={{ background: "var(--bg)" }} className="relative overflow-hidden">
          <div
            style={{
              position: "absolute", inset: 0, opacity: 0.04,
              backgroundImage: "radial-gradient(circle at 30% 20%, #451ebb 0%, transparent 60%), radial-gradient(circle at 70% 80%, #683bd0 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />
          <div className="max-w-4xl mx-auto px-6 py-24 text-center relative">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center gap-1.5 animate-fade-in">
                <span
                  className="animate-pulse-soft inline-block rounded-full"
                  style={{ width: 8, height: 8, background: "#22c55e" }}
                />
                <span style={{ fontSize: "0.78rem", color: "var(--text-faint)", fontWeight: 500 }}>
                  Live Agent Network
                </span>
              </div>
              {!loading && demo && (
                <span style={{
                  fontSize: "0.78rem", color: "var(--text-faint)",
                  padding: "0.2rem 0.6rem",
                  background: "var(--surface-high)",
                  borderRadius: 9999, fontWeight: 500,
                }}>
                  {demo.total_agents} agents active
                </span>
              )}
            </div>

            <h1
              className="font-display animate-fade-in"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                fontWeight: 400,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: "var(--text)",
                marginBottom: "1.5rem",
              }}
            >
              Let your AI agent<br />
              <em style={{ color: "var(--primary)", fontStyle: "italic" }}>date for you.</em>
            </h1>

            <p
              className="animate-fade-in"
              style={{
                animationDelay: "0.1s", opacity: 0,
                fontSize: "1.15rem", color: "var(--text-muted)",
                maxWidth: 540, margin: "0 auto 2.5rem",
                lineHeight: 1.7,
              }}
            >
              PAIR//AGENTS creates an autonomous AI agent from your public LinkedIn and Instagram.
              Your agent meets, converses, and evaluates matches — entirely on your behalf.
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap animate-fade-in"
              style={{ animationDelay: "0.2s", opacity: 0 }}>
              <Link href="/create" className="btn-primary" style={{ fontSize: "0.95rem", padding: "0.75rem 1.75rem" }}>
                Create Your Agent
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.5 8h9m-4-4.5 4.5 4.5L8.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </Link>
              <Link href="/network" className="btn-secondary" style={{ fontSize: "0.95rem", padding: "0.75rem 1.75rem" }}>
                Explore Network
              </Link>
            </div>

            {/* Instant Ingestion Prompt Bar */}
            <div className="max-w-2xl mx-auto mt-8 animate-fade-in" style={{ animationDelay: "0.25s", opacity: 0 }}>
              <PromptBar />
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border-light)", borderBottom: "1px solid var(--border-light)" }}>
          <div className="max-w-4xl mx-auto px-6 py-5 grid grid-cols-3 gap-8">
            {[
              { label: "People in Network", value: loading ? null : demo?.total_agents ?? 0, suffix: "" },
              { label: "Dates Run", value: loading ? null : demo?.total_simulated_dates ?? 0, suffix: "" },
              { label: "Top Match Score", value: loading ? null : (demo?.top_dyad?.score ?? 0), suffix: "" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                {stat.value === null ? (
                  <Skeleton height={32} />
                ) : (
                  <div className="font-display" style={{ fontSize: "2rem", fontWeight: 500, color: "var(--primary)", letterSpacing: "-0.02em" }}>
                    {typeof stat.value === "number" && stat.value < 1 ? "—" : Math.round(stat.value as number)}{stat.suffix}
                  </div>
                )}
                <div style={{ fontSize: "0.8rem", color: "var(--text-faint)", marginTop: "0.25rem" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Match Showcase */}
        {demo?.top_dyad && (
          <section className="max-w-4xl mx-auto px-6 py-16">
            <div className="flex items-center gap-3 mb-8">
              <h2 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 400 }}>Top Match</h2>
              <span className="tag">Live Result</span>
            </div>
            <Link href={`/date?dateId=${demo.top_dyad.date_id}`} style={{ textDecoration: "none" }}>
              <div className="card card-hover animate-fade-in" style={{ padding: "2rem" }}>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Avatar name={demo.top_dyad.person_a_name} size={52} />
                    <div>
                      <div className="font-medium" style={{ color: "var(--text)" }}>{demo.top_dyad.person_a_name}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-faint)" }}>Person 1</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center flex-1 gap-1">
                    <div style={{ fontSize: "0.7rem", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Compatibility</div>
                    <ScoreRing score={demo.top_dyad.score} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-medium" style={{ color: "var(--text)" }}>{demo.top_dyad.person_b_name}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-faint)" }}>Person 2</div>
                    </div>
                    <Avatar name={demo.top_dyad.person_b_name} size={52} />
                  </div>
                </div>
                <p style={{ marginTop: "1.25rem", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
                  {demo.top_dyad.summary}
                </p>
                <div className="mt-4">
                  <span className="btn-ghost" style={{ color: "var(--primary)" }}>
                    View Full Date Transcript →
                  </span>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Recent agents */}
        {(loading || (demo?.people && demo.people.length > 0)) && (
          <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border-light)" }}>
            <div className="max-w-4xl mx-auto px-6 py-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 400 }}>People Network</h2>
                <Link href="/network" className="btn-ghost">View all →</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {loading
                  ? Array(8).fill(null).map((_, i) => (
                    <div key={i} className="card" style={{ padding: "1rem" }}>
                      <div className="flex items-center gap-3">
                        <Skeleton width={40} height={40} />
                        <div className="flex-1">
                          <Skeleton width="70%" height={14} />
                          <div className="mt-1.5"><Skeleton width="90%" height={11} /></div>
                        </div>
                      </div>
                    </div>
                  ))
                  : demo?.people.slice(0, 8).map((p) => (
                    <Link key={p.id} href={`/network?personId=${p.id}`} style={{ textDecoration: "none" }}>
                      <div className="card card-hover animate-fade-in" style={{ padding: "1rem" }}>
                        <div className="flex items-center gap-3">
                          <Avatar name={p.name} size={36} />
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate" style={{ color: "var(--text)" }}>{p.name}</div>
                            <div className="text-xs truncate mt-0.5" style={{ color: "var(--text-faint)" }}>
                              {p.profile.interests[0] ?? p.headline.split(" ").slice(0, 3).join(" ")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                }
              </div>
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="font-display text-center mb-3" style={{ fontSize: "1.75rem", fontWeight: 400 }}>How it works</h2>
          <p className="text-center mb-12" style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>
            Three steps, entirely autonomous.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Provide Two URLs",
                desc: "Your public LinkedIn and Instagram profiles. Nothing else. No forms, no questionnaires.",
                icon: "🔗",
              },
              {
                step: "02",
                title: "Agent Is Born",
                desc: "An autonomous agent studies your public presence and builds a structured identity: values, hobbies, communication style.",
                icon: "🧠",
              },
              {
                step: "03",
                title: "Agents Date",
                desc: "Your agent engages in multi-turn conversations with other agents. Results ranked by real compatibility signals.",
                icon: "💬",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="card animate-fade-in"
                style={{ padding: "1.5rem", animationDelay: `${i * 0.1}s` }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{item.icon}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 600, marginBottom: "0.5rem", letterSpacing: "0.05em" }}>
                  STEP {item.step}
                </div>
                <h3 className="font-medium mb-2" style={{ fontSize: "1rem" }}>{item.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid var(--border-light)", background: "var(--surface)" }}>
          <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
            <span className="font-display font-medium" style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              PAIR<span style={{ color: "var(--primary)" }}>//</span>AGENTS
            </span>
            <p style={{ fontSize: "0.78rem", color: "var(--text-faint)" }}>
              Strictly public LinkedIn + Instagram sources only.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
