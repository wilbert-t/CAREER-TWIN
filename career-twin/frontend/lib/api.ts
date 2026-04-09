import type { CVProfile, UploadResponse, ConfirmResponse, SuggestRolesResponse, AnalyzeRoleFitResponse, ProjectDetail } from "./types";

function resolveApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  return "http://localhost:8000";
}

const API_BASE = resolveApiBase();

export async function uploadCV(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/upload-cv`, { method: "POST", body: form });
  } catch {
    throw new Error("Cannot connect to the server. The service may be temporarily unavailable — please try again in a moment.");
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
    throw new Error("Cannot connect to the server. The service may be temporarily unavailable — please try again in a moment.");
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
    throw new Error("Cannot connect to the server. The service may be temporarily unavailable — please try again in a moment.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function analyzeRoleFitWithRetry(
  profileId: string,
  selectedRole: string,
  attempts = 3
): Promise<AnalyzeRoleFitResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await analyzeRoleFit(profileId, selectedRole);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Role analysis failed.");
      if (attempt < attempts) {
        await new Promise((resolve) => window.setTimeout(resolve, 700 * attempt));
      }
    }
  }

  throw lastError ?? new Error("Role analysis failed.");
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
    throw new Error("Cannot connect to the server. The service may be temporarily unavailable — please try again in a moment.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}
