"use client";

import Link from "next/link";
import type { PersonResponse } from "@/lib/types";
import { Avatar, ScoreRing } from "@/components/ui";

interface RecommendationCardProps {
  subject: PersonResponse;
  candidate: PersonResponse;
  compositeScore: number;
  dateScore?: number;
  sharedInterests: string[];
  rationale: string;
}

export default function RecommendationCard({
  subject,
  candidate,
  compositeScore,
  dateScore,
  sharedInterests,
  rationale,
}: RecommendationCardProps) {
  return (
    <div className="card p-6 bg-gradient-to-br from-[#faf7f2] via-white to-[#f7f2fb] border-2 border-[#cabeff] rounded-2xl shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#451ebb]" />
          <span className="text-xs font-mono uppercase tracking-wider text-[#451ebb] font-semibold">
            Top Compatibility Recommendation
          </span>
        </div>
        <ScoreRing score={compositeScore} size={48} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-[#ece7df]">
        <div className="flex items-center gap-3">
          <Avatar name={candidate.name} size={54} />
          <div>
            <h3 className="font-serif text-lg font-medium text-[#1c1c1a]">{candidate.name}</h3>
            <p className="text-xs text-[#797586]">{candidate.headline || "Autonomous Agent"}</p>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {sharedInterests.slice(0, 3).map((item) => (
                <span
                  key={item}
                  className="px-2 py-0.5 rounded-full text-[11px] bg-[#f2ecff] text-[#451ebb] font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Link
            href={`/date?personA=${subject.id}&personB=${candidate.id}`}
            className="btn-primary text-xs px-4 py-2"
          >
            Launch Agent Date ✦
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#797586] block">
          Compatibility Rationale
        </span>
        <p className="text-xs text-[#484554] leading-relaxed italic bg-white/70 p-3 rounded-lg border border-[#ece7df]">
          "{rationale}"
        </p>
      </div>

      {dateScore !== undefined && (
        <div className="mt-3 flex items-center justify-between text-xs text-[#797586] pt-2 border-t border-[#f0ece5]">
          <span>Simulated Date Score</span>
          <span className="font-semibold text-[#1c1c1a]">{Math.round(dateScore)} / 100</span>
        </div>
      )}
    </div>
  );
}
