// Shared types mirroring backend Pydantic models

export interface PersonProfile {
  professional_summary: string;
  needs: string[];
  hobbies: string[];
  interests: string[];
  lifestyle_signals: string[];
  communication_style: string;
  explicit_preferences: string[];
  conversation_topics: string[];
  positive_compatibility_signals: string[];
  potential_incompatibility_signals: string[];
  evidence_notes: string[];
  agent_summary: string;
}

export interface PersonUpdateRequest {
  name?: string;
  headline?: string;
  agent_summary?: string;
  hobbies?: string[];
  interests?: string[];
  communication_style?: string;
  conversation_topics?: string[];
  linkedin_url?: string;
  instagram_url?: string;
}

export interface PersonCreateRequest {
  name: string;
  headline: string;
  linkedin_url: string;
  instagram_url: string;
  agent_summary?: string;
  hobbies?: string[];
  interests?: string[];
  communication_style?: string;
  conversation_topics?: string[];
}

export interface PersonResponse {
  id: string;
  name: string;
  headline: string;
  linkedin_url: string;
  instagram_url: string;
  cached_linkedin_content?: string;
  cached_instagram_content?: string;
  profile: PersonProfile;
  created_at?: string;
}

export interface Message {
  turn: number;
  speaker: "agent_a" | "agent_b";
  speaker_name: string;
  message: string;
  thinking_summary?: string;
}

export interface DateEvaluation {
  shared_interests: string[];
  lifestyle_fit: string;
  communication_fit: string;
  engagement_score: number;
  complementary_traits: string[];
  potential_friction: string[];
  strongest_connection: string;
  date_summary: string;
  score: number;
}

export interface DateResult {
  id: string;
  person_a_id: string;
  person_b_id: string;
  person_a_name: string;
  person_b_name: string;
  transcript: Message[];
  evaluation: DateEvaluation;
  score: number;
  created_at?: string;
}

export interface CandidateRanking {
  candidate_id: string;
  candidate_name: string;
  candidate_headline: string;
  rank: number;
  composite_score: number;
  date_score: number;
  shared_tags: string[];
  match_rationale: string;
}

export interface RankingsResponse {
  person_id: string;
  person_name: string;
  rankings: CandidateRanking[];
}

export interface DemoNetworkResponse {
  total_people: number;
  total_agents: number;
  total_simulated_dates: number;
  people: PersonResponse[];
  recent_dates: DateResult[];
  top_dyad: {
    date_id: string;
    person_a_name: string;
    person_b_name: string;
    score: number;
    summary: string;
  } | null;
}

export interface AnalyzeRequest {
  linkedin_url?: string;
  instagram_url?: string;
  name?: string;
  headline?: string;
}
