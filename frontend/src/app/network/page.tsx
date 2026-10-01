"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { api } from "@/lib/api";
import type { PersonResponse, CandidateRanking } from "@/lib/types";
import { Avatar, PersonCard, ScoreRing, Skeleton } from "@/components/ui";
import ContextCards from "@/components/agents/ContextCards";

function NetworkContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get("personId");

  const [people, setPeople] = useState<PersonResponse[]>([]);
  const [selected, setSelected] = useState<PersonResponse | null>(null);
  const [rankings, setRankings] = useState<CandidateRanking[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    headline: "",
    agent_summary: "",
    hobbies: "",
    interests: "",
    communication_style: "",
    linkedin_url: "",
    instagram_url: "",
  });

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Re-sync Dialog State
  const [showResyncModal, setShowResyncModal] = useState(false);
  const [resyncStep, setResyncStep] = useState<string>("");

  const fetchPeople = async () => {
    try {
      const list = await api.listPeople();
      setPeople(list);
      return list;
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoadingPeople(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  useEffect(() => {
    if (selectedId && people.length) {
      const p = people.find((x) => x.id === selectedId) || null;
      setSelected(p);
      if (p) {
        setLoadingRankings(true);
        api.getRankings(p.id)
          .then((r) => setRankings(r.rankings))
          .catch(console.error)
          .finally(() => setLoadingRankings(false));
      }
    } else if (!selectedId && people.length > 0) {
      setSelected(people[0]);
    }
  }, [selectedId, people]);

  const selectPerson = (p: PersonResponse) => {
    router.push(`/network?personId=${p.id}`);
  };

  // Open Edit Modal with current data
  const handleOpenEdit = () => {
    if (!selected) return;
    setEditForm({
      name: selected.name,
      headline: selected.headline,
      agent_summary: selected.profile.agent_summary,
      hobbies: (selected.profile.hobbies || []).join(", "),
      interests: (selected.profile.interests || []).join(", "),
      communication_style: selected.profile.communication_style || "",
      linkedin_url: selected.linkedin_url,
      instagram_url: selected.instagram_url,
    });
    setShowEditModal(true);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      const updated = await api.updatePerson(selected.id, {
        name: editForm.name.trim(),
        headline: editForm.headline.trim(),
        agent_summary: editForm.agent_summary.trim(),
        hobbies: editForm.hobbies.split(",").map((s) => s.trim()).filter(Boolean),
        interests: editForm.interests.split(",").map((s) => s.trim()).filter(Boolean),
        communication_style: editForm.communication_style.trim(),
        linkedin_url: editForm.linkedin_url.trim(),
        instagram_url: editForm.instagram_url.trim(),
      });
      setSelected(updated);
      await fetchPeople();
      setShowEditModal(false);
      setActionMsg({ type: "success", text: "Agent updated successfully." });
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "Failed to update agent." });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Agent
  const handleDeleteAgent = async () => {
    if (!selected) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      await api.deletePerson(selected.id);
      setShowDeleteConfirm(false);
      setSelected(null);
      const remaining = await fetchPeople();
      if (remaining.length > 0) {
        router.push(`/network?personId=${remaining[0].id}`);
      } else {
        router.push(`/network`);
      }
      setActionMsg({ type: "success", text: "Agent deleted from network." });
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "Failed to delete agent." });
    } finally {
      setActionLoading(false);
    }
  };

  // Re-sync from URLs
  const handleConfirmResync = async () => {
    if (!selected) return;
    setActionLoading(true);
    setActionMsg(null);
    setResyncStep("Connecting to Playwright scraper & fetching latest profile text…");
    try {
      setTimeout(() => {
        setResyncStep("Synthesizing updated persona with Groq LLM…");
      }, 2500);

      const resynced = await api.resyncPerson(selected.id);
      setSelected(resynced);
      await fetchPeople();
      setShowResyncModal(false);
      setActionMsg({ type: "success", text: "Re-synced successfully from public profile URLs." });
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "Re-sync failed." });
    } finally {
      setActionLoading(false);
      setResyncStep("");
    }
  };

  const filtered = people.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.headline.toLowerCase().includes(search.toLowerCase()) ||
      p.profile.interests.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="max-w-6xl mx-auto px-6 py-10 w-full flex-1">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display" style={{ fontSize: "2rem", fontWeight: 400, marginBottom: "0.5rem" }}>
              Agent Network
            </h1>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              {people.length} autonomous agents. Click any agent to inspect or edit profiles, or open a live date from rankings.
            </p>
          </div>
          <Link href="/create" className="btn-primary" style={{ padding: "0.6rem 1.25rem", fontSize: "0.875rem" }}>
            + Create New Agent
          </Link>
        </div>

        {actionMsg && (
          <div
            className="card mb-4 animate-fade-in"
            style={{
              padding: "0.85rem 1.25rem",
              background: actionMsg.type === "success" ? "#f0fdf4" : "#fff1f2",
              borderColor: actionMsg.type === "success" ? "#86efac" : "#fda4af",
            }}
          >
            <p style={{ fontSize: "0.875rem", color: actionMsg.type === "success" ? "#166534" : "#be123c" }}>
              {actionMsg.type === "success" ? "✓ " : "⚠ "}
              {actionMsg.text}
            </p>
          </div>
        )}

        {error && (
          <div className="card mb-4" style={{ padding: "1rem", borderColor: "#fda4af", background: "#fff1f2" }}>
            <p style={{ fontSize: "0.875rem", color: "#be123c" }}>⚠ Backend error: {error}</p>
          </div>
        )}

        <div className="flex gap-8">
          {/* Left: People list */}
          <div style={{ width: 320, flexShrink: 0 }}>
            <div className="mb-4">
              <input
                className="input-field"
                placeholder="Search agents by name or interest…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2" style={{ maxHeight: "calc(100vh - 240px)", overflowY: "auto" }}>
              {loadingPeople
                ? Array(4).fill(null).map((_, i) => (
                  <div key={i} className="card" style={{ padding: "1rem" }}>
                    <div className="flex gap-3 items-center">
                      <Skeleton width={40} height={40} />
                      <div className="flex-1">
                        <Skeleton width="65%" height={14} />
                        <div className="mt-1.5"><Skeleton width="85%" height={11} /></div>
                      </div>
                    </div>
                  </div>
                ))
                : filtered.length === 0 ? (
                  <div className="card text-center p-6" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                    No agents in network.<br />
                    <Link href="/create" style={{ color: "var(--primary)", textDecoration: "underline", marginTop: "0.5rem", display: "inline-block" }}>
                      Create your first agent →
                    </Link>
                  </div>
                ) : (
                  filtered.map((p) => (
                    <PersonCard
                      key={p.id}
                      person={p}
                      compact
                      selected={p.id === selected?.id}
                      onClick={() => selectPerson(p)}
                    />
                  ))
                )
              }
            </div>
          </div>

          {/* Right: Detail panel */}
          <div className="flex-1">
            {!selected && !loadingPeople && (
              <div className="card flex flex-col items-center justify-center text-center" style={{ padding: "4rem 2rem", minHeight: 400 }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
                <p className="font-display" style={{ fontSize: "1.25rem", fontWeight: 400, marginBottom: "0.5rem" }}>
                  Select an agent
                </p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: 360 }}>
                  Click an agent on the left or create a new autonomous agent from public LinkedIn & Instagram profiles.
                </p>
                <Link href="/create" className="btn-primary mt-4" style={{ fontSize: "0.875rem", padding: "0.6rem 1.25rem" }}>
                  Create Agent
                </Link>
              </div>
            )}

            {selected && (
              <div className="animate-fade-in">
                {/* Profile header card with CRUD actions */}
                <div className="card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
                  {/* Top action row */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#ece7df] flex-wrap gap-2">
                    <span style={{ fontSize: "0.75rem", color: "var(--text-faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Agent ID: {selected.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowResyncModal(true)}
                        disabled={actionLoading}
                        className="btn-ghost"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", border: "1px solid var(--border-light)" }}
                        title="Re-fetch LinkedIn & Instagram and re-synthesize with Groq LLM"
                      >
                        🔄 Re-sync
                      </button>
                      <button
                        onClick={handleOpenEdit}
                        disabled={actionLoading}
                        className="btn-ghost"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", border: "1px solid var(--border-light)" }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={actionLoading}
                        className="btn-ghost"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", color: "#e11d48", border: "1px solid #fecdd3" }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Avatar name={selected.name} size={64} />
                    <div className="flex-1 min-w-0">
                      <h2 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 400 }}>
                        {selected.name}
                      </h2>
                      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                        {selected.headline}
                      </p>
                      <div className="flex gap-3 mt-3">
                        <a href={selected.linkedin_url} target="_blank" rel="noopener noreferrer"
                          className="btn-ghost" style={{ fontSize: "0.75rem" }}>
                          LinkedIn ↗
                        </a>
                        <a href={selected.instagram_url} target="_blank" rel="noopener noreferrer"
                          className="btn-ghost" style={{ fontSize: "0.75rem" }}>
                          Instagram ↗
                        </a>
                      </div>
                    </div>
                  </div>

                  <p style={{ marginTop: "1.25rem", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
                    {selected.profile.agent_summary}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {[
                      { label: "Hobbies", items: selected.profile.hobbies },
                      { label: "Interests", items: selected.profile.interests },
                    ].map((section) => (
                      <div key={section.label}>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", fontWeight: 600, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {section.label}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {section.items && section.items.length > 0 ? (
                            section.items.map((t) => (
                              <span key={t} className="tag">{t}</span>
                            ))
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-faint)" }}>None listed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", fontWeight: 600, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Communication Style
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      {selected.profile.communication_style || "unknown"}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#ece7df]">
                    <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", fontWeight: 600, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Verified Dual Sources
                    </div>
                    <ContextCards person={selected} />
                  </div>
                </div>

                {/* Rankings */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display" style={{ fontSize: "1.15rem", fontWeight: 400 }}>
                      Compatibility Rankings
                    </h3>
                    {loadingRankings && (
                      <span className="animate-pulse-soft text-xs" style={{ color: "var(--text-faint)" }}>Computing…</span>
                    )}
                  </div>

                  {loadingRankings ? (
                    <div className="flex flex-col gap-3">
                      {Array(3).fill(null).map((_, i) => (
                        <div key={i} className="card" style={{ padding: "1rem" }}>
                          <div className="flex gap-3 items-center">
                            <Skeleton width={44} height={44} />
                            <div className="flex-1">
                              <Skeleton width="50%" height={14} />
                              <div className="mt-1.5"><Skeleton width="80%" height={11} /></div>
                            </div>
                            <Skeleton width={56} height={56} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : rankings.length === 0 ? (
                    <div className="card text-center p-6" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                      Add more agents to the network to compute live compatibility rankings.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {rankings.slice(0, 10).map((r) => (
                        <div key={r.candidate_id} className="card card-hover animate-fade-in" style={{ padding: "1rem" }}>
                          <div className="flex items-center gap-4">
                            <span style={{ fontSize: "0.75rem", color: "var(--text-faint)", width: 20, textAlign: "center", fontWeight: 600 }}>
                              #{r.rank}
                            </span>
                            <Avatar name={r.candidate_name} size={40} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{r.candidate_name}</div>
                              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                                {r.candidate_headline}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {r.shared_tags.slice(0, 3).map((t) => (
                                  <span key={t} className="tag">{t}</span>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <ScoreRing score={r.composite_score} />
                              <a
                                href={`/date?personA=${selected.id}&personB=${r.candidate_id}`}
                                className="btn-ghost"
                                style={{ fontSize: "0.7rem", color: "var(--primary)", padding: "0.2rem 0.5rem" }}
                              >
                                Run Date →
                              </a>
                            </div>
                          </div>
                          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
                            {r.match_rationale}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* EDIT AGENT MODAL */}
        {showEditModal && (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              backgroundColor: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(3px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
            }}
          >
            <div
              className="card animate-fade-in"
              style={{
                width: "100%", maxWidth: 580, maxHeight: "90vh",
                overflowY: "auto", padding: "2rem", background: "var(--surface)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display" style={{ fontSize: "1.35rem", fontWeight: 400 }}>
                  Edit Agent Persona
                </h3>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowEditModal(false)}
                  style={{ fontSize: "1.1rem", padding: "0.2rem 0.5rem" }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                    Full Name
                  </label>
                  <input
                    className="input-field w-full"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                    Professional Headline
                  </label>
                  <input
                    className="input-field w-full"
                    value={editForm.headline}
                    onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                    Agent Persona Summary
                  </label>
                  <textarea
                    className="input-field w-full"
                    rows={3}
                    value={editForm.agent_summary}
                    onChange={(e) => setEditForm({ ...editForm, agent_summary: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                      Hobbies (comma-separated)
                    </label>
                    <input
                      className="input-field w-full"
                      value={editForm.hobbies}
                      onChange={(e) => setEditForm({ ...editForm, hobbies: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                      Interests (comma-separated)
                    </label>
                    <input
                      className="input-field w-full"
                      value={editForm.interests}
                      onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                    Communication Style
                  </label>
                  <input
                    className="input-field w-full"
                    value={editForm.communication_style}
                    onChange={(e) => setEditForm({ ...editForm, communication_style: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                      LinkedIn URL
                    </label>
                    <input
                      className="input-field w-full"
                      value={editForm.linkedin_url}
                      onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                      Instagram URL
                    </label>
                    <input
                      className="input-field w-full"
                      value={editForm.instagram_url}
                      onChange={(e) => setEditForm({ ...editForm, instagram_url: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-[#ece7df]">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowEditModal(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={actionLoading}
                    style={{ padding: "0.6rem 1.5rem" }}
                  >
                    {actionLoading ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RE-SYNC CONFIRMATION & PROGRESS DIALOG */}
        {showResyncModal && selected && (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              backgroundColor: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(3px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
            }}
          >
            <div
              className="card animate-fade-in"
              style={{
                width: "100%", maxWidth: 480, padding: "2rem",
                background: "var(--surface)", boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span style={{ fontSize: "1.25rem" }}>🔄</span>
                  <h3 className="font-display" style={{ fontSize: "1.3rem", fontWeight: 500, color: "var(--text)" }}>
                    Re-sync Agent Profile
                  </h3>
                </div>
                {!actionLoading && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowResyncModal(false)}
                    style={{ fontSize: "1.1rem", padding: "0.2rem 0.5rem" }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="card p-3.5 bg-white mb-4 border border-[#ece7df] rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar name={selected.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-[#1c1c1a] truncate">{selected.name}</div>
                    <div className="text-xs text-[#797586] truncate">{selected.headline}</div>
                  </div>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-[#f5f2eb] space-y-1 text-[11px] text-[#797586]">
                  <div className="truncate"><strong>LinkedIn:</strong> {selected.linkedin_url}</div>
                  <div className="truncate"><strong>Instagram:</strong> {selected.instagram_url}</div>
                </div>
              </div>

              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                This will re-scrape the live public LinkedIn & Instagram profiles via Playwright and re-synthesize the agent persona and compatibility signals using Groq LLM.
              </p>

              {actionLoading && resyncStep && (
                <div className="p-3 mb-4 rounded-lg bg-[#fbf9f5] border border-[#e4dfd7] flex items-center gap-3 animate-pulse-soft">
                  <span className="animate-spin inline-block">⏳</span>
                  <span className="text-xs font-medium text-[#451ebb]">{resyncStep}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ece7df]">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowResyncModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResync}
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{ padding: "0.55rem 1.4rem", fontSize: "0.875rem" }}
                >
                  {actionLoading ? "Re-syncing…" : "Start Re-sync"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {showDeleteConfirm && selected && (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              backgroundColor: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(3px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
            }}
          >
            <div
              className="card animate-fade-in"
              style={{
                width: "100%", maxWidth: 440, padding: "1.75rem",
                background: "var(--surface)", boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
              }}
            >
              <h3 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 500, color: "#be123c", marginBottom: "0.5rem" }}>
                Delete Agent
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                Are you sure you want to delete <strong>{selected.name}</strong>? This will permanently remove their persona and all date transcripts from the network.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAgent}
                  disabled={actionLoading}
                  style={{
                    background: "#e11d48", color: "#ffffff", border: "none",
                    borderRadius: "6px", padding: "0.5rem 1.25rem", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer"
                  }}
                >
                  {actionLoading ? "Deleting…" : "Yes, Delete Agent"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function NetworkPage() {
  return (
    <Suspense>
      <NetworkContent />
    </Suspense>
  );
}
