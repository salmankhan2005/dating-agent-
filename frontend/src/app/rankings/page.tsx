"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { api } from "@/lib/api";
import type { PersonResponse, CandidateRanking } from "@/lib/types";
import { Avatar, ScoreRing, Skeleton } from "@/components/ui";
import RecommendationCard from "@/components/agents/RecommendationCard";
import RecordsTable from "@/components/agents/RecordsTable";

function RankingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialId = searchParams.get("personId");

  const [people, setPeople] = useState<PersonResponse[]>([]);
  const [selected, setSelected] = useState<string>(initialId || "");
  const [rankings, setRankings] = useState<CandidateRanking[] | null>(null);
  const [personName, setPersonName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  useEffect(() => {
    api.listPeople()
      .then((list) => { setPeople(list); if (initialId) fetchRankings(initialId, list); })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingPeople(false));
  }, []);

  const fetchRankings = async (id: string, list?: PersonResponse[]) => {
    const pList = list || people;
    const person = pList.find((p) => p.id === id);
    if (!person) return;
    setPersonName(person.name);
    setLoading(true);
    setRankings(null);
    setError("");
    try {
      const res = await api.getRankings(id);
      setRankings(res.rankings);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelected(id);
    router.push(`/rankings?personId=${id}`);
    fetchRankings(id);
  };

  const scoreColor = (score: number) =>
    score >= 88 ? "var(--primary)" : score >= 78 ? "#b45309" : "var(--text-muted)";

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-10 w-full flex-1">
        <div className="mb-8">
          <h1 className="font-display" style={{ fontSize: "2rem", fontWeight: 400, marginBottom: "0.5rem" }}>
            Compatibility Rankings
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Multi-factor compatibility scores: interest overlap, lifestyle fit, communication match, and date simulation.
          </p>
        </div>

        {error && (
          <div className="card mb-5" style={{ padding: "0.875rem 1rem", borderColor: "#fda4af", background: "#fff1f2" }}>
            <p style={{ fontSize: "0.875rem", color: "#be123c" }}>⚠ {error}</p>
          </div>
        )}

        {/* Selector */}
        <div className="card mb-8" style={{ padding: "1.5rem" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
            Select an agent to see their best matches
          </label>
          {loadingPeople ? (
            <Skeleton width="100%" height={40} />
          ) : (
            <select
              className="input-field"
              value={selected}
              onChange={handleSelect}
              style={{ cursor: "pointer" }}
            >
              <option value="">— Choose an agent —</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.headline.slice(0, 60)}{p.headline.length > 60 ? "…" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <p className="animate-pulse-soft" style={{ fontSize: "0.875rem", color: "var(--text-faint)" }}>
                Computing rankings for {personName}…
              </p>
              <div className="flex gap-1">
                <div className="animate-dot-1 w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
                <div className="animate-dot-2 w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
                <div className="animate-dot-3 w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {Array(8).fill(null).map((_, i) => (
                <div key={i} className="card" style={{ padding: "1.25rem" }}>
                  <div className="flex gap-4 items-center">
                    <Skeleton width={24} height={16} />
                    <Skeleton width={48} height={48} />
                    <div className="flex-1">
                      <Skeleton width="40%" height={15} />
                      <div className="mt-1.5"><Skeleton width="70%" height={12} /></div>
                      <div className="mt-2 flex gap-1">
                        <Skeleton width={60} height={20} />
                        <Skeleton width={80} height={20} />
                      </div>
                    </div>
                    <Skeleton width={56} height={56} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rankings view */}
        {!loading && rankings && (
          <div className="animate-fade-in space-y-6">
            {/* Top Match Showcase */}
            {(() => {
              const currentSubject = people.find((p) => p.id === selected);
              const topCandidate = rankings[0]
                ? people.find((p) => p.id === rankings[0].candidate_id)
                : null;
              if (!currentSubject || !topCandidate || !rankings[0]) return null;
              return (
                <div className="mb-2">
                  <RecommendationCard
                    subject={currentSubject}
                    candidate={topCandidate}
                    compositeScore={rankings[0].composite_score}
                    dateScore={rankings[0].date_score}
                    sharedInterests={rankings[0].shared_tags}
                    rationale={rankings[0].match_rationale}
                  />
                </div>
              );
            })()}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 400 }}>
                  Candidate Leaderboard
                </h2>
                <span style={{ fontSize: "0.8rem", color: "var(--text-faint)" }}>
                  {rankings.length} evaluated agents ranked for {personName}
                </span>
              </div>

              {/* View Switcher */}
              <div className="flex bg-[#f3efe8] p-1 rounded-lg self-start sm:self-center">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewMode === "table"
                      ? "bg-white text-[#1c1c1a] shadow-xs"
                      : "text-[#797586] hover:text-[#1c1c1a]"
                  }`}
                >
                  Records Table
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewMode === "cards"
                      ? "bg-white text-[#1c1c1a] shadow-xs"
                      : "text-[#797586] hover:text-[#1c1c1a]"
                  }`}
                >
                  Detailed Cards
                </button>
              </div>
            </div>

            {/* Score weight legend */}
            <div className="card" style={{ padding: "0.875rem 1.25rem" }}>
              <div className="flex flex-wrap gap-4">
                {[
                  { label: "Interest Fit", pct: "25%" },
                  { label: "Lifestyle", pct: "20%" },
                  { label: "Communication", pct: "20%" },
                  { label: "Explicit Preferences", pct: "20%" },
                  { label: "Date Simulation", pct: "15%" },
                ].map((w) => (
                  <div key={w.label} className="flex items-center gap-1.5">
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)" }} />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {w.label} <strong style={{ color: "var(--text)" }}>{w.pct}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {viewMode === "table" ? (
              <RecordsTable rankings={rankings} subjectId={selected} />
            ) : (
              <div className="flex flex-col gap-3">
              {rankings.map((r, i) => (
                <div key={r.candidate_id} className="card card-hover animate-fade-in" style={{ padding: "1.25rem", animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: r.rank <= 3 ? "var(--primary-light)" : "var(--surface)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.8rem", fontWeight: 700,
                      color: r.rank <= 3 ? "var(--primary)" : "var(--text-faint)",
                      flexShrink: 0,
                    }}>
                      {r.rank}
                    </div>

                    <Avatar name={r.candidate_name} size={44} />

                    <div className="flex-1 min-w-0">
                      <div className="font-medium" style={{ color: "var(--text)" }}>{r.candidate_name}</div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                        {r.candidate_headline}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {r.shared_tags.map((t) => <span key={t} className="tag">{t}</span>)}
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="flex flex-col items-end gap-2" style={{ flexShrink: 0 }}>
                      <ScoreRing score={r.composite_score} />
                      <div className="flex gap-2">
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-faint)" }}>Date score</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: scoreColor(r.date_score) }}>
                            {Math.round(r.date_score)}
                          </div>
                        </div>
                      </div>
                      <a
                        href={`/date?personA=${selected}&personB=${r.candidate_id}`}
                        className="btn-primary"
                        style={{ fontSize: "0.72rem", padding: "0.3rem 0.75rem" }}
                      >
                        Run Date
                      </a>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 progress-bar">
                      <div className="progress-fill" style={{ width: `${r.composite_score}%` }} />
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-faint)", width: 36, textAlign: "right" }}>
                      {r.composite_score}
                    </span>
                  </div>

                  <p style={{ marginTop: "0.625rem", fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                    {r.match_rationale}
                  </p>
                </div>
              ))}
              </div>
            )}
          </div>
        )}

        {!loading && !rankings && !selected && (
          <div className="card flex flex-col items-center justify-center text-center" style={{ padding: "4rem 2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
            <p className="font-display" style={{ fontSize: "1.25rem", fontWeight: 400, marginBottom: "0.5rem" }}>
              Select an agent above
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Rankings are computed instantly from the full agent network.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function RankingsPage() {
  return (
    <Suspense>
      <RankingsContent />
    </Suspense>
  );
}
