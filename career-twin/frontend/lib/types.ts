export interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface CVProfile {
  name: string;
  headline: string;
  summary: string;
  raw_text: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: string[];
  certificates: string[];
  leadership: string[];
}

export interface UploadResponse {
  raw_text: string;
  structured: CVProfile;
}

export interface ConfirmResponse {
  profile_id: string;
}

export interface RoleSuggestion {
  id: string;
  title: string;
  short_description: string;
  preview_match_score: number;
}

export interface SuggestRolesResponse {
  roles: RoleSuggestion[];
}

export interface AnalyzeRoleFitResponse {
  selected_role: Record<string, unknown>;
  match_score: Record<string, unknown>;
  score_breakdown: Record<string, unknown>;
  strengths: string[];
  weaknesses: string[];
  matched_skills: string[];
  missing_skills: string[];
  readiness_summary: Record<string, unknown>;
  priority_improvements: string[];
  learning_steps: string[];
  possible_projects: string[];
  resume_improvements: string[];
  alternative_roles: string[];
  goal_pathway: Record<string, unknown>;
  evidence_items: string[];
}
