"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import { api } from "@/lib/api";
import type { PersonResponse, DateResult, Message } from "@/lib/types";
import { Avatar, PersonCard, ScoreRing, Skeleton } from "@/components/ui";
import AgentScreen from "@/components/agents/AgentScreen";

type DateStep = "select" | "running" | "result";

function LiveDateContent() {
  const searchParams = useSearchParams();
  const [people, setPeople] = useState<PersonResponse[]>([]);
  const [personA, setPersonA] = useState<PersonResponse | null>(null);
  const [personB, setPersonB] = useState<PersonResponse | null>(null);
  const [dateResult, setDateResult] = useState<DateResult | null>(null);
  const [step, setStep] = useState<DateStep>("select");
  const [revealedMessages, setRevealedMessages] = useState<Message[]>([]);
  const [thinkingMsg, setThinkingMsg] = useState("Connecting agents…");
  const [thinkingTurn, setThinkingTurn] = useState<string | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<{ id: string; label: string; status: string }[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Pre-populate from URL params
    const pA = searchParams.get("personA");
    const pB = searchParams.get("personB");
    const dateId = searchParams.get("dateId");

    api.listPeople()
      .then((list) => {
        setPeople(list);
        if (pA) setPersonA(list.find((p) => p.id === pA) || null);
        if (pB) setPersonB(list.find((p) => p.id === pB) || null);
        if (dateId) {
          api.getDate(dateId).then((d) => {
            setDateResult(d);
            setRevealedMessages(d.transcript);
            setStep("result");
            const aAgent = list.find((p) => p.id === d.person_a_id);
            const bAgent = list.find((p) => p.id === d.person_b_id);
            if (aAgent) setPersonA(aAgent);
            if (bAgent) setPersonB(bAgent);
          }).catch(console.error);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const runDate = async () => {
    if (!personA || !personB) return;
    setStep("running");
    setRevealedMessages([]);
    setError("");
    setPipelineSteps([]);
    setThinkingMsg("Connecting agents…");
    setThinkingTurn(null);

    try {
      let finalResult: DateResult | null = null;

      await api.runDateStream(personA.id, personB.id, (event) => {
        if (event.type === "step") {
          setPipelineSteps((prev) => {
            const idx = prev.findIndex((s) => s.id === event.id);
            const updated = { id: event.id, label: event.label, status: event.status };
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = updated;
              return next;
            }
            return [...prev, updated];
          });
          setThinkingMsg(event.label);
        } else if (event.type === "turn") {
          setThinkingTurn(event.data.speaker_name);
          setRevealedMessages((prev) => [...prev, event.data]);
          setThinkingTurn(null);
          if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
          }
        } else if (event.type === "done") {
          finalResult = event.data;
        } else if (event.type === "error") {
          setError(event.message);
        }
      });

      if (finalResult) {
        setDateResult(finalResult);
        setStep("result");
      } else if (!error) {
        setStep("result");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to run date. Is the backend running?");
      setStep("select");
    }
  };



  const reset = () => {
    setStep("select");
    setDateResult(null);
    setRevealedMessages([]);
    setPersonA(null);
    setPersonB(null);
    setError("");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-10 w-full flex-1">
        <div className="mb-8">
          <h1 className="font-display" style={{ fontSize: "2rem", fontWeight: 400, marginBottom: "0.5rem" }}>
            Live Agent Date
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Select two agents to run a live multi-turn date conversation and compatibility evaluation.
          </p>
        </div>

        {error && (
          <div className="card mb-5" style={{ padding: "0.875rem 1rem", borderColor: "#fda4af", background: "#fff1f2" }}>
            <p style={{ fontSize: "0.875rem", color: "#be123c" }}>⚠ {error}</p>
          </div>
        )}

        {/* Agent selector */}
        {step === "select" && (
          <div className="animate-fade-in">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {[
                { label: "Agent A", agent: personA, setAgent: setPersonA },
                { label: "Agent B", agent: personB, setAgent: setPersonB },
              ].map(({ label, agent, setAgent }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-medium text-sm" style={{ color: "var(--text-muted)" }}>{label}</h2>
                    {agent && (
                      <button className="btn-ghost" onClick={() => setAgent(null)} style={{ fontSize: "0.7rem" }}>
                        Clear
                      </button>
                    )}
                  </div>
                  {agent ? (
                    <div className="card" style={{ padding: "1.25rem", borderColor: "var(--primary)", boxShadow: "0 0 0 2px var(--primary-light)" }}>
                      <div className="flex items-center gap-3">
                        <Avatar name={agent.name} size={48} />
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{agent.headline}</div>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {agent.profile.interests.slice(0, 2).map((t) => <span key={t} className="tag">{t}</span>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="card"
                      style={{ padding: "1.5rem", borderStyle: "dashed", minHeight: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <p style={{ fontSize: "0.85rem", color: "var(--text-faint)" }}>Select from list below</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <button
                className="btn-primary"
                style={{ fontSize: "0.95rem", padding: "0.75rem 2rem" }}
                disabled={!personA || !personB || personA.id === personB.id}
                onClick={runDate}
              >
                ▶ Run Date
              </button>
              {personA && personB && personA.id === personB.id && (
                <p style={{ fontSize: "0.78rem", color: "#be123c", marginTop: "0.5rem" }}>An agent cannot date itself.</p>
              )}
            </div>

            {/* People grid */}
            <div>
              <h3 className="font-medium mb-3" style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                {loading ? "Loading agents…" : `Choose from ${people.length} agents`}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {loading
                  ? Array(6).fill(null).map((_, i) => (
                    <div key={i} className="card" style={{ padding: "1rem" }}>
                      <div className="flex gap-3 items-center">
                        <Skeleton width={36} height={36} />
                        <div className="flex-1"><Skeleton width="65%" height={13} /></div>
                      </div>
                    </div>
                  ))
                  : people.map((p) => (
                    <div key={p.id} onClick={() => {
                      if (!personA || personA.id === p.id) { setPersonA(p); return; }
                      if (!personB || personB.id === p.id) { setPersonB(p); return; }
                      setPersonB(p);
                    }}>
                      <PersonCard
                        person={p}
                        compact
                        selected={personA?.id === p.id || personB?.id === p.id}
                      />
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* Running state / transcript reveal via AgentScreen */}
        {(step === "running" || step === "result") && personA && personB && (
          <div className="animate-fade-in mb-8">
            {/* Live pipeline steps */}
            {step === "running" && pipelineSteps.length > 0 && (
              <div className="card mb-4" style={{ padding: "0.875rem 1.25rem" }}>
                <div className="flex flex-col gap-1.5">
                  {pipelineSteps.map((s) => (
                    <div key={s.id} className="flex items-center gap-2" style={{ fontSize: "0.82rem" }}>
                      {s.status === "running" ? (
                        <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid var(--primary)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                      ) : (
                        <span style={{ color: "var(--primary)", flexShrink: 0, fontSize: "0.9rem" }}>✓</span>
                      )}
                      <span style={{ color: s.status === "running" ? "var(--text)" : "var(--text-muted)" }}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <AgentScreen
              personA={personA}
              personB={personB}
              dateResult={dateResult}
              revealedMessages={revealedMessages}
              isRunning={step === "running"}
              thinkingMsg={thinkingMsg}
              thinkingTurn={thinkingTurn}
              onNewDate={reset}
            />
          </div>
        )}


        {/* Evaluation results */}
        {step === "result" && dateResult && (
              <div className="animate-fade-in">
                <h2 className="font-display mb-4" style={{ fontSize: "1.25rem", fontWeight: 400 }}>Date Evaluation</h2>

                {/* Score overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  {[
                    { label: "Overall Score", value: dateResult.score },
                    { label: "Engagement", value: dateResult.evaluation.engagement_score },
                  ].map((item) => (
                    <div key={item.label} className="card text-center" style={{ padding: "1.25rem" }}>
                      <div className="font-display" style={{ fontSize: "2rem", fontWeight: 500, color: "var(--primary)" }}>
                        {Math.round(item.value)}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-faint)", marginTop: "0.3rem" }}>{item.label}</div>
                    </div>
                  ))}
                  <div className="card" style={{ padding: "1.25rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                      Lifestyle Fit
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--text)", lineHeight: 1.5 }}>
                      {dateResult.evaluation.lifestyle_fit}
                    </p>
                  </div>
                  <div className="card" style={{ padding: "1.25rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                      Communication
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--text)", lineHeight: 1.5 }}>
                      {dateResult.evaluation.communication_fit}
                    </p>
                  </div>
                </div>

                {/* Insight cards */}
                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  <div className="insight-card insight-card-accent">
                    <div style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                      Shared Interests
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {dateResult.evaluation.shared_interests.map((t) => (
                        <span key={t} className="tag">{t}</span>
                      ))}
                    </div>
                  </div>

                  <div className="insight-card">
                    <div style={{ fontSize: "0.7rem", color: "var(--text-faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                      Strongest Connection
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.65 }}>
                      {dateResult.evaluation.strongest_connection}
                    </p>
                  </div>

                  <div className="insight-card">
                    <div style={{ fontSize: "0.7rem", color: "var(--text-faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                      Complementary Traits
                    </div>
                    {dateResult.evaluation.complementary_traits.map((t, i) => (
                      <p key={i} style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{t}</p>
                    ))}
                  </div>

                  {dateResult.evaluation.potential_friction.length > 0 && (
                    <div className="insight-card" style={{ borderLeft: "3px solid #f59e0b" }}>
                      <div style={{ fontSize: "0.7rem", color: "#b45309", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                        Potential Friction
                      </div>
                      {dateResult.evaluation.potential_friction.map((t, i) => (
                        <p key={i} style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{t}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="card" style={{ padding: "1.5rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                    Date Summary
                  </div>
                  <p style={{ fontSize: "0.9rem", color: "var(--text)", lineHeight: 1.75 }}>
                    {dateResult.evaluation.date_summary}
                  </p>
                </div>
              </div>
            )}
      </main>
    </div>
  );
}

export default function DatePage() {
  return (
    <Suspense>
      <LiveDateContent />
    </Suspense>
  );
}
