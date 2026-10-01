"use client";

import { useEffect, useRef, useState } from "react";
import type { PersonResponse, DateResult, Message } from "@/lib/types";
import { Avatar, ScoreRing } from "@/components/ui";

interface AgentScreenProps {
  personA: PersonResponse;
  personB: PersonResponse;
  dateResult: DateResult | null;
  revealedMessages: Message[];
  isRunning: boolean;
  thinkingMsg?: string;
  thinkingTurn?: string | null;
  onNewDate?: () => void;
}

export default function AgentScreen({
  personA,
  personB,
  dateResult,
  revealedMessages,
  isRunning,
  thinkingMsg = "Calibrating conversation tone…",
  thinkingTurn,
  onNewDate,
}: AgentScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"insights" | "sources">("insights");

  // Auto-scroll as messages appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [revealedMessages, thinkingTurn]);

  return (
    <div className="card overflow-hidden border border-[#e4dfd7] shadow-sm bg-[#fdfcf9] rounded-2xl flex flex-col h-[780px]">
      {/* Header: Split Agent Cards with Live Status */}
      <div className="p-4 sm:p-5 border-b border-[#ece7df] bg-[#faf7f2] flex items-center justify-between gap-4">
        {/* Agent A */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <Avatar name={personA.name} size={46} />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                isRunning && thinkingTurn === personA.name
                  ? "bg-purple-600 animate-ping"
                  : "bg-emerald-500"
              }`}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate text-[#1c1c1a]">{personA.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[#ece7df] text-[#484554]">
                Agent A
              </span>
            </div>
            <p className="text-xs text-[#797586] truncate max-w-[180px] sm:max-w-[220px]">
              {personA.headline || "Autonomous Dating Agent"}
            </p>
          </div>
        </div>

        {/* Center Connection Indicator */}
        <div className="hidden sm:flex flex-col items-center justify-center px-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#797586] uppercase tracking-wider mb-1">
            <span>Live Sync</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-lg text-[#797586]">↔</div>
        </div>

        {/* Agent B */}
        <div className="flex items-center gap-3 min-w-0 text-right flex-row-reverse sm:flex-row">
          <div className="min-w-0">
            <div className="flex items-center justify-end gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[#ece7df] text-[#484554]">
                Agent B
              </span>
              <span className="font-semibold text-sm truncate text-[#1c1c1a]">{personB.name}</span>
            </div>
            <p className="text-xs text-[#797586] truncate max-w-[180px] sm:max-w-[220px]">
              {personB.headline || "Autonomous Dating Agent"}
            </p>
          </div>
          <div className="relative">
            <Avatar name={personB.name} size={46} />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                isRunning && thinkingTurn === personB.name
                  ? "bg-purple-600 animate-ping"
                  : "bg-emerald-500"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Main Split Body: Chat Area (65%) + Dynamic Realtime Side Panel (35%) */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Left: Chat Container */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-[#ece7df] bg-[#fcfaf7]">
          {/* Messages Stream */}
          <div
            ref={scrollRef}
            className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 scroll-smooth"
          >
            {revealedMessages.length === 0 && isRunning && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
                <div className="w-10 h-10 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
                <p className="font-serif italic text-sm text-[#797586]">{thinkingMsg}</p>
              </div>
            )}

            {revealedMessages.map((msg, idx) => {
              const isA = msg.speaker === "agent_a";
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    isA ? "items-start" : "items-end"
                  } animate-fade-in group`}
                >
                  <div
                    className={`flex items-center gap-2 mb-1.5 text-xs text-[#797586] ${
                      isA ? "flex-row" : "flex-row-reverse"
                    }`}
                  >
                    <Avatar name={msg.speaker_name} size={22} />
                    <span className="font-medium text-[#1c1c1a]">{msg.speaker_name}</span>
                    <span className="text-[10px] font-mono text-[#a19cae]">Turn {msg.turn}</span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      isA
                        ? "bg-white text-[#1c1c1a] border border-[#e8e3da] rounded-tl-sm"
                        : "bg-[#451ebb] text-white rounded-tr-sm"
                    }`}
                  >
                    {msg.message}
                  </div>

                  {msg.thinking_summary && (
                    <div
                      className={`mt-1.5 text-[11px] font-mono italic px-2.5 py-1 rounded border ${
                        isA
                          ? "bg-[#f5f1eb] text-[#6d687a] border-[#e2ddd5]"
                          : "bg-[#f0ecfc] text-[#451ebb] border-[#d8ceff]"
                      } max-w-[85%] sm:max-w-[78%] flex items-center gap-1.5`}
                    >
                      <span className="text-[12px]">💭</span>
                      <span className="truncate">{msg.thinking_summary}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* In-flight typing indicator */}
            {isRunning && thinkingTurn && (
              <div
                className={`flex items-center gap-2 animate-fade-in ${
                  thinkingTurn === personB.name ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#e4dfd7] shadow-sm">
                  <span className="text-xs text-[#797586] font-medium">
                    {thinkingTurn} is crafting response
                  </span>
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Footer Bar */}
          <div className="p-3 border-t border-[#ece7df] bg-white flex items-center justify-between text-xs text-[#797586]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] bg-[#f5f1eb] px-2 py-0.5 rounded text-[#484554]">
                Turn {revealedMessages.length} of 6-10
              </span>
              <span className="text-[#a19cae]">•</span>
              <span className="italic">Autonomous Agent-to-Agent Dating</span>
            </div>

            {onNewDate && (
              <button
                onClick={onNewDate}
                className="text-xs font-medium text-purple-700 hover:text-purple-900 transition-colors"
              >
                New Date ↺
              </button>
            )}
          </div>
        </div>

        {/* Right: Dynamic Insight Panel */}
        <div className="w-full lg:w-[360px] bg-[#faf8f5] flex flex-col overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#ece7df] pb-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("insights")}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === "insights"
                    ? "bg-[#451ebb] text-white"
                    : "text-[#797586] hover:text-[#1c1c1a]"
                }`}
              >
                Live Insights
              </button>
              <button
                onClick={() => setActiveTab("sources")}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === "sources"
                    ? "bg-[#451ebb] text-white"
                    : "text-[#797586] hover:text-[#1c1c1a]"
                }`}
              >
                Dual Sources
              </button>
            </div>

            {dateResult && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#797586] font-mono">Score:</span>
                <span className="font-serif font-bold text-sm text-[#451ebb]">
                  {Math.round(dateResult.score)}
                </span>
              </div>
            )}
          </div>

          {activeTab === "insights" ? (
            <div className="space-y-3.5">
              {/* Overall Compatibility Summary */}
              {dateResult ? (
                <div className="p-3.5 rounded-xl bg-white border border-[#ece7df] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#797586]">
                      Compatibility Gauge
                    </span>
                    <ScoreRing score={dateResult.score} size={42} />
                  </div>
                  <p className="text-xs text-[#484554] leading-relaxed">
                    {dateResult.evaluation.strongest_connection ||
                      dateResult.evaluation.date_summary}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-[#ddd8ce] text-center space-y-2">
                  <div className="text-xs text-[#797586] font-mono">EVALUATION IN PROGRESS</div>
                  <p className="text-xs text-[#a19cae]">
                    Synthesizing communication cadence, lifestyle alignment, and shared energy…
                  </p>
                </div>
              )}

              {/* Shared Interests Card */}
              <div className="p-3.5 rounded-xl bg-white border border-[#ece7df] shadow-xs space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#797586] flex items-center gap-1.5">
                  <span>✨ Shared Interests</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {dateResult?.evaluation?.shared_interests &&
                  dateResult.evaluation.shared_interests.length > 0 ? (
                    dateResult.evaluation.shared_interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-2 py-0.5 rounded-full text-xs bg-[#f2ecff] text-[#451ebb] font-medium"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    // Intersect profile interests if evaluation isn't ready
                    personA.profile.interests
                      .filter((i) => personB.profile.interests.includes(i))
                      .map((interest) => (
                        <span
                          key={interest}
                          className="px-2 py-0.5 rounded-full text-xs bg-[#f2ecff] text-[#451ebb] font-medium"
                        >
                          {interest}
                        </span>
                      ))
                  )}
                  {(!dateResult?.evaluation?.shared_interests ||
                    dateResult.evaluation.shared_interests.length === 0) &&
                    personA.profile.interests.filter((i) =>
                      personB.profile.interests.includes(i)
                    ).length === 0 && (
                      <span className="text-xs text-[#797586] italic">
                        Evaluating shared overlaps…
                      </span>
                    )}
                </div>
              </div>

              {/* Synergy & Complementary Traits */}
              <div className="p-3.5 rounded-xl bg-white border border-[#ece7df] shadow-xs space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#797586]">
                  🌱 Complementary Dynamics
                </div>
                <div className="space-y-1.5">
                  {dateResult?.evaluation?.complementary_traits?.map((trait, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-[#484554] flex items-start gap-1.5 leading-snug"
                    >
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{trait}</span>
                    </div>
                  )) || (
                    <div className="text-xs text-[#797586] italic">
                      Tracking reciprocal conversation moves…
                    </div>
                  )}
                </div>
              </div>

              {/* Potential Friction / Balance */}
              {dateResult?.evaluation?.potential_friction &&
                dateResult.evaluation.potential_friction.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#fffcf5] border border-[#f2e6cb] shadow-xs space-y-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-[#b45309]">
                      ⚠️ Growth & Friction Points
                    </div>
                    <div className="space-y-1">
                      {dateResult.evaluation.potential_friction.map((f, idx) => (
                        <p key={idx} className="text-xs text-[#78350f] leading-snug">
                          • {f}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            /* Sources Tab: Strict LinkedIn + Instagram verification */
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-white border border-[#ece7df] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1c1c1a]">{personA.name}</span>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    Dual Verified
                  </span>
                </div>
                <div className="text-xs space-y-1 text-[#484554]">
                  <div>
                    <span className="font-medium text-[#797586]">LinkedIn: </span>
                    <a
                      href={personA.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-700 hover:underline truncate inline-block max-w-[200px] align-bottom"
                    >
                      {personA.linkedin_url}
                    </a>
                  </div>
                  <div>
                    <span className="font-medium text-[#797586]">Instagram: </span>
                    <a
                      href={personA.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-700 hover:underline truncate inline-block max-w-[200px] align-bottom"
                    >
                      {personA.instagram_url}
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white border border-[#ece7df] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1c1c1a]">{personB.name}</span>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    Dual Verified
                  </span>
                </div>
                <div className="text-xs space-y-1 text-[#484554]">
                  <div>
                    <span className="font-medium text-[#797586]">LinkedIn: </span>
                    <a
                      href={personB.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-700 hover:underline truncate inline-block max-w-[200px] align-bottom"
                    >
                      {personB.linkedin_url}
                    </a>
                  </div>
                  <div>
                    <span className="font-medium text-[#797586]">Instagram: </span>
                    <a
                      href={personB.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-700 hover:underline truncate inline-block max-w-[200px] align-bottom"
                    >
                      {personB.instagram_url}
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#f0ecfc] border border-[#d8ceff] text-[11px] text-[#451ebb] leading-relaxed">
                🔒 <strong>Strict Source Rule:</strong> These agents operate solely on evidence
                extracted from public LinkedIn and Instagram. No external prior knowledge or
                unauthorized data is used.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
