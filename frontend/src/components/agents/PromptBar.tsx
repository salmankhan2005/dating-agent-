"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PromptBarProps {
  onAnalyze?: (linkedinUrl: string, instagramUrl: string) => void;
  className?: string;
}

export default function PromptBar({ onAnalyze, className = "" }: PromptBarProps) {
  const router = useRouter();
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinUrl || !instagramUrl) return;

    if (onAnalyze) {
      onAnalyze(linkedinUrl, instagramUrl);
    } else {
      router.push(
        `/create?linkedin=${encodeURIComponent(linkedinUrl)}&instagram=${encodeURIComponent(
          instagramUrl
        )}`
      );
    }
  };

  return (
    <div
      className={`card p-3 sm:p-4 bg-white/95 backdrop-blur-md border-2 border-[#451ebb]/25 rounded-2xl shadow-lg hover:border-[#451ebb]/50 transition-all ${className}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#451ebb] font-semibold">
              Instant Profile Ingestion
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#797586] hidden sm:inline">
            Strict Source Boundary: LI + IG only
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-2.5">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-bold text-[#0a66c2]">in</span>
            <input
              type="url"
              placeholder="LinkedIn URL (e.g. linkedin.com/in/alexmorgan)"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="input-field pl-8 text-xs py-2.5 bg-[#fcfaf7]"
              required
            />
          </div>

          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-bold text-[#dd2a7b]">IG</span>
            <input
              type="url"
              placeholder="Instagram URL (e.g. instagram.com/alexmorgan)"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              className="input-field pl-9 text-xs py-2.5 bg-[#fcfaf7]"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-[#797586] flex items-center gap-1.5">
            <span>🔒</span>
            <span>Zero third-party scraping. 100% public source boundary.</span>
          </div>

          <button
            type="submit"
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-sm"
          >
            <span>Spawn Autonomous Agent</span>
            <span>→</span>
          </button>
        </div>
      </form>
    </div>
  );
}
