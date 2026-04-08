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
  parse_warning?: string | null;
}

export interface ConfirmResponse {
  profile_id: string;
}

export interface RoleSuggestion {
  id: string;
  title: string;
  short_description: string;
  preview_match_score: number;
  skills?: string[];
}

export interface SuggestRolesResponse {
  roles: RoleSuggestion[];
}

export interface PriorityImprovement {
  area: string;
  title: string;
  detail: string;
  action: string;
}

export interface ProjectDetail {
  name: string;
  short_description: string;
  difficulty: number;   // 1-5
  uniqueness: number;   // 1-5
  duration: string;
  description: string;
  objectives: string;
  tools_required: string[];
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
  priority_improvements: PriorityImprovement[];
  learning_steps: string[];
  possible_projects: string[];
  resume_improvements: string[];
  alternative_roles: string[];
  goal_pathway: Record<string, unknown>;
  evidence_items: string[];
}
