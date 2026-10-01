from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PersonProfile(BaseModel):
    professional_summary: str = ""
    needs: List[str] = Field(default_factory=list)
    hobbies: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    lifestyle_signals: List[str] = Field(default_factory=list)
    communication_style: str = "Reflective, inquisitive"
    explicit_preferences: List[str] = Field(default_factory=list)
    conversation_topics: List[str] = Field(default_factory=list)
    positive_compatibility_signals: List[str] = Field(default_factory=list)
    potential_incompatibility_signals: List[str] = Field(default_factory=list)
    evidence_notes: List[str] = Field(default_factory=list)
    agent_summary: str = ""

class AnalyzeRequest(BaseModel):
    linkedin_url: Optional[str] = None
    instagram_url: Optional[str] = None
    name: Optional[str] = None
    headline: Optional[str] = None

class PersonUpdateRequest(BaseModel):
    name: Optional[str] = None
    headline: Optional[str] = None
    agent_summary: Optional[str] = None
    hobbies: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    communication_style: Optional[str] = None
    conversation_topics: Optional[List[str]] = None
    linkedin_url: Optional[str] = None
    instagram_url: Optional[str] = None

class PersonCreateRequest(BaseModel):
    name: str
    headline: str
    linkedin_url: str
    instagram_url: str
    agent_summary: Optional[str] = ""
    hobbies: Optional[List[str]] = Field(default_factory=list)
    interests: Optional[List[str]] = Field(default_factory=list)
    communication_style: Optional[str] = "Reflective, inquisitive"
    conversation_topics: Optional[List[str]] = Field(default_factory=list)

class PersonResponse(BaseModel):
    id: str
    name: str
    headline: str
    linkedin_url: str
    instagram_url: str
    cached_linkedin_content: Optional[str] = ""
    cached_instagram_content: Optional[str] = ""
    profile: PersonProfile
    created_at: Optional[str] = None

class Message(BaseModel):
    turn: int
    speaker: str  # "agent_a" or "agent_b"
    speaker_name: str
    message: str
    thinking_summary: Optional[str] = ""

class DateEvaluation(BaseModel):
    shared_interests: List[str] = Field(default_factory=list)
    lifestyle_fit: str = "Strong"
    communication_fit: str = "High"
    engagement_score: float = 85.0
    complementary_traits: List[str] = Field(default_factory=list)
    potential_friction: List[str] = Field(default_factory=list)
    strongest_connection: str = ""
    date_summary: str = ""
    score: float = 85.0

class DateRunRequest(BaseModel):
    person_a_id: str
    person_b_id: str

class DateResult(BaseModel):
    id: str
    person_a_id: str
    person_b_id: str
    person_a_name: str
    person_b_name: str
    transcript: List[Message]
    evaluation: DateEvaluation
    score: float
    created_at: Optional[str] = None

class CandidateRanking(BaseModel):
    candidate_id: str
    candidate_name: str
    candidate_headline: str
    rank: int
    composite_score: float
    date_score: float
    shared_tags: List[str]
    match_rationale: str

class RankingsResponse(BaseModel):
    person_id: str
    person_name: str
    rankings: List[CandidateRanking]

class DemoNetworkResponse(BaseModel):
    total_people: int
    total_agents: int
    total_simulated_dates: int
    people: List[PersonResponse]
    recent_dates: List[DateResult]
    top_dyad: Optional[Dict[str, Any]] = None
