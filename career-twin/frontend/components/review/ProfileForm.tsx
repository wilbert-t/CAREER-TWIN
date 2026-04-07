"use client";

import { useState } from "react";
import type { CVProfile, Experience, Education } from "@/lib/types";

interface ProfileFormProps {
  initial: CVProfile;
  onConfirm: (profile: CVProfile) => void;
  isLoading: boolean;
}

export function ProfileForm({ initial, onConfirm, isLoading }: ProfileFormProps) {
  const [profile, setProfile] = useState<CVProfile>(initial);

  function setField<K extends keyof CVProfile>(key: K, value: CVProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onConfirm(profile); }}
      className="space-y-6"
    >
      {/* Name & Headline */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name">
          <input
            value={profile.name}
            onChange={(e) => setField("name", e.target.value)}
            className="input"
            placeholder="Your name"
          />
        </Field>
        <Field label="Headline">
          <input
            value={profile.headline}
            onChange={(e) => setField("headline", e.target.value)}
            className="input"
            placeholder="e.g. Software Engineer"
          />
        </Field>
      </div>

      {/* Summary */}
      <Field label="Summary">
        <textarea
          value={profile.summary}
          onChange={(e) => setField("summary", e.target.value)}
          rows={3}
          className="input"
          placeholder="Brief professional summary"
        />
      </Field>

      {/* Skills */}
      <Field label="Skills (comma-separated)">
        <input
          value={profile.skills.join(", ")}
          onChange={(e) =>
            setField("skills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
          }
          className="input"
          placeholder="Python, SQL, React…"
        />
      </Field>

      {/* Experience */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Experience</h3>
        {profile.experience.map((exp, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 mb-2">
            <input
              value={exp.title}
              onChange={(e) => {
                const updated = [...profile.experience];
                updated[i] = { ...updated[i], title: e.target.value };
                setField("experience", updated);
              }}
              className="input"
              placeholder="Title"
            />
            <input
              value={exp.company}
              onChange={(e) => {
                const updated = [...profile.experience];
                updated[i] = { ...updated[i], company: e.target.value };
                setField("experience", updated);
              }}
              className="input"
              placeholder="Company"
            />
            <input
              value={exp.duration}
              onChange={(e) => {
                const updated = [...profile.experience];
                updated[i] = { ...updated[i], duration: e.target.value };
                setField("experience", updated);
              }}
              className="input"
              placeholder="2022–2024"
            />
          </div>
        ))}
      </div>

      {/* Education */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Education</h3>
        {profile.education.map((edu, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 mb-2">
            <input
              value={edu.degree}
              onChange={(e) => {
                const updated = [...profile.education];
                updated[i] = { ...updated[i], degree: e.target.value };
                setField("education", updated);
              }}
              className="input"
              placeholder="Degree"
            />
            <input
              value={edu.institution}
              onChange={(e) => {
                const updated = [...profile.education];
                updated[i] = { ...updated[i], institution: e.target.value };
                setField("education", updated);
              }}
              className="input"
              placeholder="University"
            />
            <input
              value={edu.year}
              onChange={(e) => {
                const updated = [...profile.education];
                updated[i] = { ...updated[i], year: e.target.value };
                setField("education", updated);
              }}
              className="input"
              placeholder="2024"
            />
          </div>
        ))}
      </div>

      {/* Raw text */}
      <details className="text-sm text-slate-500">
        <summary className="cursor-pointer hover:text-slate-700">View raw extracted text</summary>
        <textarea
          value={profile.raw_text}
          rows={8}
          className="input mt-2 font-mono text-xs"
          readOnly
        />
      </details>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {isLoading ? "Saving profile…" : "Confirm CV →"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
