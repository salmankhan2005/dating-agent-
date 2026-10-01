"use client";

import type { PersonResponse } from "@/lib/types";

interface ContextCardsProps {
  person: PersonResponse;
}

export default function ContextCards({ person }: ContextCardsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* LinkedIn Source Card */}
      {person.linkedin_url && (
      <div className="card p-5 bg-white border border-[#e4dfd7] rounded-xl flex flex-col justify-between hover:border-[#451ebb]/30 transition-all">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded flex items-center justify-center bg-[#0a66c2] text-white font-bold text-xs">
                in
              </span>
              <span className="font-semibold text-sm text-[#1c1c1a]">Public LinkedIn</span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
              Verified Source
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <div>
              <span className="text-xs text-[#797586] block">Professional Headline</span>
              <p className="text-sm font-medium text-[#1c1c1a]">{person.headline || "N/A"}</p>
            </div>

            <div>
              <span className="text-xs text-[#797586] block">Career & Professional Signals</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {person.profile.lifestyle_signals.slice(0, 3).map((sig, i) => (
                  <span
                    key={i}
                    className="text-xs bg-[#f5f2eb] text-[#484554] px-2 py-0.5 rounded-full"
                  >
                    {sig}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#ece7df] flex items-center justify-between">
          <a
            href={person.linkedin_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#451ebb] hover:underline font-medium flex items-center gap-1"
          >
            <span>View Public Profile</span>
            <span>↗</span>
          </a>
          <span className="text-[11px] text-[#797586] font-mono">Evidence ID: LI-VERIFIED</span>
        </div>
      </div>
      )}

      {/* Instagram Source Card */}
      {person.instagram_url && (() => {
        const isPrivate = (
          person.cached_instagram_content?.toLowerCase().includes("private") ||
          person.profile.evidence_notes?.some(n => n.toLowerCase().includes("private"))
        );
        return (
          <div className="card p-5 bg-white border border-[#e4dfd7] rounded-xl flex flex-col justify-between hover:border-[#451ebb]/30 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded flex items-center justify-center bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white font-bold text-xs">
                    IG
                  </span>
                  <span className="font-semibold text-sm text-[#1c1c1a]">Instagram Source</span>
                </div>
                {isPrivate ? (
                  <span className="text-[10px] font-mono uppercase bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 font-medium">
                    🔒 Private (Bio Only)
                  </span>
                ) : (
                  <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                    Verified Public
                  </span>
                )}
              </div>

              {isPrivate && (
                <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
                  <strong>Notice:</strong> This account is <strong>Private</strong>. Only the public bio and profile metrics were accessible. No private photos or stories were indexed.
                </div>
              )}

              <div className="space-y-2 mb-4">
                <div>
                  <span className="text-xs text-[#797586] block">Interests & Bio Signals</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {person.profile.interests.length > 0 ? (
                      person.profile.interests.slice(0, 4).map((interest, i) => (
                        <span
                          key={i}
                          className="text-xs bg-[#f2ecff] text-[#451ebb] px-2 py-0.5 rounded-full"
                        >
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#797586] italic">None publicly declared</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-[#797586] block">Aesthetic & Vibe Signals</span>
                  <p className="text-xs text-[#484554] italic">
                    {person.profile.hobbies.slice(0, 3).join(", ") || (isPrivate ? "Limited to public bio text" : "Public aesthetic highlights")}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ece7df] flex items-center justify-between">
              <a
                href={person.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#451ebb] hover:underline font-medium flex items-center gap-1"
              >
                <span>View Instagram</span>
                <span>↗</span>
              </a>
              <span className="text-[11px] text-[#797586] font-mono">
                {isPrivate ? "Evidence ID: IG-PRIVATE-BIO" : "Evidence ID: IG-VERIFIED"}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
