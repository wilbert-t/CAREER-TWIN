from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field


class RoleSuggestion(BaseModel):
    id: str
    title: str
    short_description: str
    preview_match_score: int = Field(..., ge=0, le=100)
    skills: list[str] = Field(default_factory=list)


class SuggestRolesRequest(BaseModel):
    profile_id: str


class SuggestRolesResponse(BaseModel):
    roles: list[RoleSuggestion]


class AnalyzeRoleFitRequest(BaseModel):
    profile_id: str
    selected_role: str  # role id or free-text string


class AnalyzeRoleFitResponse(BaseModel):
    selected_role: dict[str, Any] = Field(default_factory=dict)
    match_score: dict[str, Any] = Field(default_factory=dict)
    score_breakdown: dict[str, Any] = Field(default_factory=dict)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    readiness_summary: dict[str, Any] = Field(default_factory=dict)
    priority_improvements: list[dict[str, Any]] = Field(default_factory=list)
    learning_steps: list[str] = Field(default_factory=list)
    possible_projects: list[str] = Field(default_factory=list)
    resume_improvements: list[str] = Field(default_factory=list)
    alternative_roles: list[str] = Field(default_factory=list)
    goal_pathway: dict[str, Any] = Field(default_factory=dict)
    evidence_items: list[str] = Field(default_factory=list)


class ExpandProjectRequest(BaseModel):
    profile_id: str
    role: str
    project_name: str
    short_description: str


class ExpandProjectResponse(BaseModel):
    name: str
    short_description: str
    difficulty: int = Field(..., ge=1, le=5)
    uniqueness: int = Field(..., ge=1, le=5)
    duration: str
    description: str
    objectives: str
    tools_required: list[str] = Field(default_factory=list, min_length=1)
