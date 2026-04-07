import type { CVProfile, UploadResponse, ConfirmResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function uploadCV(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/upload-cv`, { method: "POST", body: form });
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
