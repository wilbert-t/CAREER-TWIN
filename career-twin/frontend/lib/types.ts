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
