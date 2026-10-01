"use client";

import { useState } from "react";
import Link from "next/link";
import type { CandidateRanking } from "@/lib/types";
import { Avatar, ScoreRing } from "@/components/ui";

interface RecordsTableProps {
  rankings: CandidateRanking[];
  subjectId: string;
}

export default function RecordsTable({ rankings, subjectId }: RecordsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [minScore, setMinScore] = useState(0);

  const filtered = rankings.filter((r) => {
    const matchesSearch =
      r.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.shared_tags.some((i: string) => i.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesScore = r.composite_score >= minScore;
    return matchesSearch && matchesScore;
  });

  return (
    <div className="card bg-white border border-[#e4dfd7] rounded-xl overflow-hidden shadow-xs">
      {/* Controls Bar */}
      <div className="p-4 border-b border-[#ece7df] bg-[#faf8f5] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search candidates or interests…"
            className="input-field text-xs py-2 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-[#797586] self-end sm:self-center">
          <span>Min Score: {minScore}</span>
          <input
            type="range"
            min={0}
            max={90}
            step={5}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-24 accent-[#451ebb]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f5f2eb] text-[#797586] uppercase font-mono text-[10px] tracking-wider border-b border-[#ece7df]">
            <tr>
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Candidate Agent</th>
              <th className="py-3 px-4 text-center">Composite Score</th>
              <th className="py-3 px-4 text-center">Date Score</th>
              <th className="py-3 px-4">Key Shared Signals</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ece7df]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#797586] italic">
                  No matching candidates found for this filter.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.candidate_id}
                  className="hover:bg-[#faf8f5] transition-colors group"
                >
                  <td className="py-3 px-4 font-mono font-medium text-[#797586]">
                    #{item.rank}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={item.candidate_name} size={32} />
                      <div>
                        <div className="font-semibold text-[#1c1c1a]">{item.candidate_name}</div>
                        <div className="text-[11px] text-[#797586] max-w-[200px] truncate">
                          {item.match_rationale}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex justify-center">
                      <ScoreRing score={item.composite_score} size={36} />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {item.date_score !== null && item.date_score !== undefined ? (
                      <span className="font-semibold text-[#451ebb]">
                        {Math.round(item.date_score)}
                      </span>
                    ) : (
                      <span className="text-[#a19cae]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {item.shared_tags.slice(0, 3).map((interest: string) => (
                        <span
                          key={interest}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-[#f2ecff] text-[#451ebb]"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/date?personA=${subjectId}&personB=${item.candidate_id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-[#451ebb] hover:bg-[#341496] transition-colors"
                    >
                      <span>Simulate Date</span>
                      <span>→</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
