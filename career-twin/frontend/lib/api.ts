import type { CVProfile, UploadResponse, ConfirmResponse, SuggestRolesResponse, AnalyzeRoleFitResponse, ProjectDetail } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function uploadCV(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/upload-cv`, { method: "POST", body: form });
  } catch {
    throw new Error("Cannot connect to server. Make sure the backend is running on port 8000.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Upload failed: ${res.status}`);
  }
  return res.json();
}

export async function confirmProfile(profile: CVProfile): Promise<ConfirmResponse> {
  const res = await fetch(`${API_BASE}/confirm-profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Confirm failed: ${res.status}`);
  }
  return res.json();
}

export async function suggestRoles(profileId: string): Promise<SuggestRolesResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/suggest-roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: profileId }),
    });
  } catch {
    throw new Error("Cannot connect to server. Make sure the backend is running on port 8000.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function analyzeRoleFit(
  profileId: string,
  selectedRole: string
): Promise<AnalyzeRoleFitResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/analyze-role-fit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: profileId, selected_role: selectedRole }),
    });
  } catch {
    throw new Error("Cannot connect to server. Make sure the backend is running on port 8000.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function expandProject(
  profileId: string,
  role: string,
  projectName: string,
  shortDescription: string
): Promise<ProjectDetail> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/expand-project`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile_id: profileId,
        role,
        project_name: projectName,
        short_description: shortDescription,
      }),
    });
  } catch {
    throw new Error("Cannot connect to server. Make sure the backend is running on port 8000.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}
