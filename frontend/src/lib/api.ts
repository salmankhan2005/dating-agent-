// API client for PAIR//AGENTS backend

import type {
  PersonResponse,
  DateResult,
  RankingsResponse,
  DemoNetworkResponse,
  AnalyzeRequest,
  Message,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

export type DateStreamEvent =
  | { type: "step"; id: string; label: string; status: string }
  | { type: "turn"; data: Message }
  | { type: "done"; data: DateResult }
  | { type: "error"; message: string };

export const api = {
  health: () => apiFetch<{ status: string; service: string; version: string }>("/api/health"),

  // People CRUD
  listPeople: () => apiFetch<PersonResponse[]>("/api/people"),
  getPerson: (id: string) => apiFetch<PersonResponse>(`/api/people/${id}`),
  analyzePerson: (req: AnalyzeRequest) =>
    apiFetch<PersonResponse>("/api/people/analyze", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  createPerson: (req: import("./types").PersonCreateRequest) =>
    apiFetch<PersonResponse>("/api/people", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  updatePerson: (id: string, req: import("./types").PersonUpdateRequest) =>
    apiFetch<PersonResponse>(`/api/people/${id}`, {
      method: "PUT",
      body: JSON.stringify(req),
    }),
  deletePerson: (id: string) =>
    apiFetch<{ status: string; deleted_id: string; message: string }>(`/api/people/${id}`, {
      method: "DELETE",
    }),
  resyncPerson: (id: string) =>
    apiFetch<PersonResponse>(`/api/people/${id}/resync`, {
      method: "POST",
    }),

  // Dates
  getDate: (id: string) => apiFetch<DateResult>(`/api/dates/${id}`),
  runDate: (personAId: string, personBId: string) =>
    apiFetch<DateResult>("/api/dating/run", {
      method: "POST",
      body: JSON.stringify({ person_a_id: personAId, person_b_id: personBId }),
    }),

  /**
   * Streaming SSE version of runDate.
   * Calls onEvent for each SSE event as it arrives.
   * Returns a Promise that resolves when the stream ends.
   */
  runDateStream: async (
    personAId: string,
    personBId: string,
    onEvent: (event: DateStreamEvent) => void
  ): Promise<void> => {
    const res = await fetch(`${BASE_URL}/api/dating/run/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person_a_id: personAId, person_b_id: personBId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `API error ${res.status}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      let currentEvent = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          try {
            const payload = JSON.parse(line.slice(6));
            if (currentEvent === "step") {
              onEvent({ type: "step", id: payload.id, label: payload.label, status: payload.status });
            } else if (currentEvent === "turn") {
              onEvent({ type: "turn", data: payload as Message });
            } else if (currentEvent === "done") {
              onEvent({ type: "done", data: payload as DateResult });
            } else if (currentEvent === "error") {
              onEvent({ type: "error", message: payload.message || JSON.stringify(payload) });
            }
          } catch {
            // skip malformed SSE line
          }
          currentEvent = "";
        }
      }
    }
  },

  // Rankings
  getRankings: (personId: string) => apiFetch<RankingsResponse>(`/api/rankings/${personId}`),

  // Demo
  getDemo: () => apiFetch<DemoNetworkResponse>("/api/demo"),
};

