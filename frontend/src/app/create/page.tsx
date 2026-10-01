"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import type { PersonResponse } from "@/lib/types";
import { Avatar } from "@/components/ui";
import TaskRows, { TaskItem } from "@/components/agents/TaskRows";
import ContextCards from "@/components/agents/ContextCards";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Step = "form" | "loading" | "result" | "error";

function isValidProfileUrl(value: string, platform: "linkedin" | "instagram"): boolean {
  try {
    const url = new URL(value.trim());
    const domain = platform === "linkedin" ? "linkedin.com" : "instagram.com";
    const hostname = url.hostname.toLowerCase();
    const validHost = hostname === domain || hostname.endsWith(`.${domain}`);

    if (!validHost || !["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      return false;
    }

    if (platform === "linkedin") {
      return /^\/(?:in\/[\w%-]+|pub\/[\w%-]+|[\w%-]+)(?:\/.*)?$/i.test(url.pathname);
    }

    return /^\/[\w.-]+\/?$/i.test(url.pathname);
  } catch {
    return false;
  }
}

export default function CreatePage() {
  const [step, setStep] = useState<Step>("form");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [result, setResult] = useState<PersonResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [linkErrors, setLinkErrors] = useState<{ linkedin?: string; instagram?: string }>({});
  const [thinkingMsg, setThinkingMsg] = useState("Validating sources…");
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: "1", label: "Validate LinkedIn Profile", detail: "Verify public URL format and access", status: "idle" },
    { id: "2", label: "Validate Instagram Profile", detail: "Verify handle and public availability", status: "idle" },
    { id: "3", label: "Extract Public Content", detail: "Scrape headline, bio, experience & tags", status: "idle" },
    { id: "4", label: "Synthesize Knowledge Graph", detail: "Map interests, hobbies, and dating needs", status: "idle" },
    { id: "5", label: "Instantiate Agent Persona", detail: "Finalize conversational dating agent", status: "idle" },
  ]);

  const thinkingMessages = [
    "Validating profile sources…",
    "Extracting public content…",
    "Analyzing LinkedIn career history…",
    "Parsing Instagram visual themes…",
    "Synthesizing personality signals…",
    "Building agent persona…",
    "Finalizing compatibility profile…",
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const linkedinValue = linkedinUrl.trim();
    const instagramValue = instagramUrl.trim();

    if (!linkedinValue && !instagramValue) {
      setLinkErrors({});
      setError("Please provide at least one public LinkedIn or Instagram URL.");
      return;
    }

    const nextLinkErrors: { linkedin?: string; instagram?: string } = {};
    if (linkedinValue && !isValidProfileUrl(linkedinValue, "linkedin")) {
      nextLinkErrors.linkedin = "Enter a valid LinkedIn profile URL, such as https://www.linkedin.com/in/username.";
    }
    if (instagramValue && !isValidProfileUrl(instagramValue, "instagram")) {
      nextLinkErrors.instagram = "Enter a valid Instagram profile URL, such as https://www.instagram.com/username.";
    }
    if (Object.keys(nextLinkErrors).length > 0) {
      setLinkErrors(nextLinkErrors);
      setError("Please correct the highlighted profile URL before continuing.");
      return;
    }

    setLinkErrors({});
    setError("");
    setStep("loading");
    // All tasks start as idle — they will be updated in real-time via SSE stream
    setTasks([
      { id: "1", label: "Validate LinkedIn Profile", detail: linkedinUrl ? "Checking public URL access…" : "Not provided", status: linkedinUrl ? "running" : "completed" },
      { id: "2", label: "Validate Instagram Profile", detail: instagramUrl ? "Checking public URL access…" : "Not provided", status: instagramUrl ? "running" : "completed" },
      { id: "3", label: "Extract Public Content", detail: "Pending validation", status: "idle" },
      { id: "4", label: "Synthesize Knowledge Graph", detail: "Pending extraction", status: "idle" },
      { id: "5", label: "Instantiate Agent Persona", detail: "Pending synthesis", status: "idle" },
    ]);

    // Cycle through thinking messages while waiting
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % thinkingMessages.length;
      setThinkingMsg(thinkingMessages[idx]);
    }, 1800);

    const body = JSON.stringify({
      linkedin_url: linkedinValue,
      instagram_url: instagramValue,
      name: name || undefined,
      headline: headline || undefined,
    });

    try {
      // Use fetch with streaming to read SSE from backend
      const response = await fetch(`${BASE_URL}/api/people/analyze/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!response.ok || !response.body) {
        const err = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(err.detail || `Server error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE lines: "event: name\ndata: {...}\n\n"
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const lines = chunk.split("\n");
          let eventName = "message";
          let dataStr = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventName = line.slice(7).trim();
            if (line.startsWith("data: ")) dataStr = line.slice(6).trim();
          }
          if (!dataStr) continue;

          let payload: Record<string, unknown>;
          try { payload = JSON.parse(dataStr); } catch { continue; }

          if (eventName === "step") {
            const { id, status, label, detail } = payload as { id: string; status: string; label: string; detail: string };
            setTasks((prev) =>
              prev.map((t) => t.id === id ? { ...t, status: status as TaskItem["status"], label, detail } : t)
            );
          } else if (eventName === "done") {
            setResult(payload as unknown as PersonResponse);
            setTasks((prev) => prev.map((t) => ({ ...t, status: "completed" as TaskItem["status"] })));
            setStep("result");
            finished = true;
          } else if (eventName === "error") {
            const { message } = payload as { message: string };
            setTasks((prev) =>
              prev.map((t) => (t.status === "running" || t.status === "idle" ? { ...t, status: "error", detail: "Failed" } : t))
            );
            setError(message);
            setStep("error");
            finished = true;
          }
        }
      }
    } catch (err: unknown) {
      setTasks((prev) =>
        prev.map((t) => (t.status === "running" || t.status === "idle" ? { ...t, status: "error", detail: "Failed" } : t))
      );
      setError((err as Error).message || "Agent creation failed. Please check your URLs and try again.");
      setStep("error");
    } finally {
      clearInterval(interval);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="max-w-2xl mx-auto px-6 py-14 w-full flex-1">
        {step === "form" && (
          <div className="animate-fade-in">
            <div className="mb-10">
              <h1 className="font-display" style={{ fontSize: "2rem", fontWeight: 400, marginBottom: "0.5rem" }}>
                Create Your Agent
              </h1>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
                Your autonomous agent will be built <strong>exclusively</strong> from your public LinkedIn and Instagram profiles.
                No other data sources are used.
              </p>
            </div>

            {error && (
              <div role="alert" aria-live="assertive" className="card mb-6" style={{ padding: "0.875rem 1rem", borderColor: "#fda4af", background: "#fff1f2" }}>
                <p style={{ fontSize: "0.875rem", color: "#be123c" }}>⚠ {error}</p>
              </div>
            )}

            <form onSubmit={submit} className="flex flex-col gap-5">
              <div className="card" style={{ padding: "1.5rem" }}>
                <h2 className="font-medium mb-4" style={{ fontSize: "0.95rem" }}>
                  Source Profiles (at least one required)
                </h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)", display: "block", marginBottom: "0.375rem" }}>
                      LinkedIn Profile URL
                    </label>
                    <input
                      className="input-field"
                      type="text"
                      inputMode="url"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={linkedinUrl}
                      aria-invalid={Boolean(linkErrors.linkedin)}
                      aria-describedby={linkErrors.linkedin ? "linkedin-url-error" : undefined}
                      onChange={(e) => {
                        setLinkedinUrl(e.target.value);
                        setLinkErrors((current) => ({ ...current, linkedin: undefined }));
                        setError("");
                      }}
                    />
                    {linkErrors.linkedin && (
                      <p id="linkedin-url-error" className="mt-1 text-xs text-rose-700">{linkErrors.linkedin}</p>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)", display: "block", marginBottom: "0.375rem" }}>
                      Instagram Profile URL
                    </label>
                    <input
                      className="input-field"
                      type="text"
                      inputMode="url"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="https://instagram.com/yourhandle"
                      value={instagramUrl}
                      aria-invalid={Boolean(linkErrors.instagram)}
                      aria-describedby={linkErrors.instagram ? "instagram-url-error" : undefined}
                      onChange={(e) => {
                        setInstagramUrl(e.target.value);
                        setLinkErrors((current) => ({ ...current, instagram: undefined }));
                        setError("");
                      }}
                    />
                    {linkErrors.instagram && (
                      <p id="instagram-url-error" className="mt-1 text-xs text-rose-700">{linkErrors.instagram}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: "1.5rem" }}>
                <h2 className="font-medium mb-1" style={{ fontSize: "0.95rem" }}>
                  Optional — Quick Hints
                </h2>
                <p style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginBottom: "1rem" }}>
                  Speeds up extraction. Leave blank to auto-detect.
                </p>
                <div className="flex flex-col gap-4">
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)", display: "block", marginBottom: "0.375rem" }}>
                      Your Name
                    </label>
                    <input
                      className="input-field"
                      placeholder="e.g. Alex Morgan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)", display: "block", marginBottom: "0.375rem" }}>
                      Professional Headline
                    </label>
                    <input
                      className="input-field"
                      placeholder="e.g. Product Designer at Acme"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Source constraint notice */}
              <div style={{ background: "var(--primary-light)", border: "1px solid var(--primary-mid)", borderRadius: "var(--radius)", padding: "1rem" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--primary)", lineHeight: 1.65 }}>
                  🔒 <strong>Privacy first.</strong> Your agent is built <em>only</em> from your public LinkedIn and Instagram.
                  No other sources are accessed. Only publicly visible data is used.
                </p>
              </div>

              <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start", fontSize: "0.95rem", padding: "0.75rem 1.75rem" }}>
                Create Agent →
              </button>
            </form>
          </div>
        )}

        {step === "loading" && (
          <div className="animate-fade-in flex flex-col items-center justify-center max-w-lg mx-auto" style={{ minHeight: 400, gap: "1.75rem" }}>
            {/* Animated agent thinking visualization */}
            <div style={{ position: "relative", width: 88, height: 88 }}>
              <div
                style={{
                  position: "absolute", inset: 0,
                  borderRadius: "50%",
                  border: "2px solid var(--primary-light)",
                  borderTopColor: "var(--primary)",
                }}
                className="animate-spin-slow"
              />
              <div
                style={{
                  position: "absolute", inset: 10,
                  borderRadius: "50%",
                  border: "1.5px solid var(--primary-mid)",
                  borderBottomColor: "var(--secondary)",
                  animationDirection: "reverse",
                }}
                className="animate-spin-slow"
              />
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.75rem",
              }}>
                🧠
              </div>
            </div>

            <div className="text-center">
              <h2 className="font-display mb-1" style={{ fontSize: "1.5rem", fontWeight: 400 }}>
                Synthesizing Autonomous Agent…
              </h2>
              <p className="animate-pulse-soft font-mono" style={{ fontSize: "0.825rem", color: "var(--primary)" }}>
                {thinkingMsg}
              </p>
            </div>

            {/* Beautiful UI Task Stepper */}
            <div className="w-full">
              <TaskRows tasks={tasks} />
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="animate-fade-in">
            <div className="card" style={{ padding: "2rem", borderColor: "#fda4af", background: "#fff1f2", marginBottom: "1.5rem" }}>
              <h2 className="font-display mb-2" style={{ fontSize: "1.25rem", fontWeight: 400 }}>
                Agent Creation Failed
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#be123c", marginBottom: "1rem" }}>
                {error}
              </p>
              <div style={{ fontSize: "0.8rem", color: "#be123c", lineHeight: 1.65 }}>
                <strong>Common causes:</strong>
                <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
                  <li>The profile is private or requires login</li>
                  <li>Invalid URL format</li>
                  <li>Backend API is not running (start with: <code style={{ background: "#fecdd3", padding: "0.1rem 0.35rem", borderRadius: 4 }}>cd backend && uvicorn main:app</code>)</li>
                </ul>
              </div>
            </div>
            <button onClick={() => setStep("form")} className="btn-secondary">
              ← Try Again
            </button>
          </div>
        )}

        {step === "result" && result && (
          <div className="animate-fade-in">
            <div className="mb-6 flex items-center gap-3">
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>
                ✓
              </div>
              <h2 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 400 }}>
                Agent Created!
              </h2>
            </div>

            {/* Profile card */}
            <div className="card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
              <div className="flex items-start gap-4 mb-5">
                <Avatar name={result.name} size={60} />
                <div>
                  <h3 className="font-display" style={{ fontSize: "1.3rem", fontWeight: 400 }}>{result.name}</h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{result.headline}</p>
                  <span className="tag mt-2 inline-block" style={{ fontSize: "0.7rem" }}>Active Agent</span>
                </div>
              </div>

              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "1.25rem", borderLeft: "3px solid var(--primary-mid)", paddingLeft: "0.875rem" }}>
                {result.profile.agent_summary}
              </p>

              {[
                { label: "Hobbies", items: result.profile.hobbies },
                { label: "Interests", items: result.profile.interests },
                { label: "Lifestyle", items: result.profile.lifestyle_signals },
                { label: "Dating Needs", items: result.profile.needs },
              ].map((s) => (
                <div key={s.label} style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", fontWeight: 600, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {s.label}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {s.items.map((t) => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: "1.25rem" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", fontWeight: 600, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Communication Style
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  {result.profile.communication_style}
                </p>
              </div>

              {result.profile.evidence_notes.length > 0 && (
                <div style={{ marginTop: "1.25rem", background: "var(--surface)", borderRadius: "var(--radius-sm)", padding: "0.75rem" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", fontWeight: 600, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Source Evidence
                  </div>
                  {result.profile.evidence_notes.map((n, i) => (
                    <p key={i} style={{ fontSize: "0.78rem", color: "var(--text-faint)", lineHeight: 1.6 }}>{n}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Strict Dual Sources Card */}
            <div className="mb-6">
              <h3 className="font-serif text-base font-medium mb-3 text-[#1c1c1a]">
                Verified Sources
              </h3>
              <ContextCards person={result} />
            </div>

            <div className="flex gap-3 flex-wrap">
              <a href={`/network?personId=${result.id}`} className="btn-primary">
                View in Network →
              </a>
              <a href={`/rankings?personId=${result.id}`} className="btn-secondary">
                See Rankings
              </a>
              <button onClick={() => { setStep("form"); setLinkedinUrl(""); setInstagramUrl(""); setName(""); setHeadline(""); setResult(null); }} className="btn-ghost">
                Create Another
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
