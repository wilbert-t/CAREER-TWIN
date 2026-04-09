from pydantic import BaseModel, Field
from typing import Optional


class Experience(BaseModel):
    title: str = ""
    company: str = ""
    duration: str = ""
    description: str = ""


class Education(BaseModel):
    degree: str = ""
    institution: str = ""
    year: str = ""


class CVProfile(BaseModel):
    name: str = ""
    headline: str = ""
    summary: str = ""
    raw_text: str = ""
    experience: list[Experience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    awards: list[str] = Field(default_factory=list)
    certificates: list[str] = Field(default_factory=list)
    leadership: list[str] = Field(default_factory=list)


class UploadResponse(BaseModel):
    raw_text: str
    structured: CVProfile
    parse_warning: str | None = None


class ConfirmResponse(BaseModel):
    profile_id: str
