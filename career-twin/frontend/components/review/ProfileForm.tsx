"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CVProfile, Experience, Education } from "@/lib/types";

const NAV_SECTIONS = [
  { id: "upload", label: "Upload and Parse CV", kind: "action" },
  { id: "personal",  label: "Personal Information" },
  { id: "skills",    label: "Skills" },
  { id: "education", label: "Education Background" },
  { id: "experience",label: "Internships / Project Experience" },
  { id: "projects", label: "Projects" },
  { id: "awards", label: "Awards & Certifications" },
] as const;

const iCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 " +
  "placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-2 " +
  "focus:ring-slate-100 transition-colors";

interface ProfileFormProps {
  initial: CVProfile;
  onConfirm: (profile: CVProfile) => void;
  isLoading: boolean;
}

export function ProfileForm({ initial, onConfirm, isLoading }: ProfileFormProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<CVProfile>(initial);
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [newSkill, setNewSkill] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const targets = NAV_SECTIONS.filter((s) => s.id !== "upload");
    const observers: IntersectionObserver[] = [];
    targets.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: "-25% 0px -65% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  function set<K extends keyof CVProfile>(key: K, val: CVProfile[K]) {
    setProfile(p => ({ ...p, [key]: val }));
    setIsDirty(true);
  }

  function scrollTo(id: string) {
    const target = document.getElementById(id);
    if (!target) return;

    setActiveSection(id);

    const topOffset = 88;
    const targetTop = window.scrollY + target.getBoundingClientRect().top - topOffset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const nextScrollTop = Math.max(0, Math.min(targetTop, maxScroll));

    window.scrollTo({
      top: nextScrollTop,
      behavior: "smooth",
    });
  }

  function handleUploadClick() {
    if (isDirty && !window.confirm("You have unsaved edits. Leave and discard them?")) return;
    router.push("/");
  }

  function addSkill() {
    const s = newSkill.trim();
    if (s && !profile.skills.includes(s)) set("skills", [...profile.skills, s]);
    setNewSkill("");
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onConfirm(profile); }}>
      <div className="flex gap-8 items-start">

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Personal Information */}
          <section id="personal" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-24">
            <SectionHeader label="Personal Information" />
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                <Field label="Name">
                  <input value={profile.name}
                    onChange={e => set("name", e.target.value)}
                    className={iCls} placeholder="Your name" />
                </Field>
                <Field label="Headline">
                  <input value={profile.headline}
                    onChange={e => set("headline", e.target.value)}
                    className={iCls} placeholder="e.g. Data Engineering Intern" />
                </Field>
              </div>
              <Field label="Summary">
                <textarea value={profile.summary}
                  onChange={e => set("summary", e.target.value)}
                  rows={3} className={`${iCls} resize-none`}
                  placeholder="Brief professional summary" />
              </Field>
            </div>
          </section>

          {/* Skills */}
          <section id="skills" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-24">
            <SectionHeader label="Skills" />
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4 min-h-8">
                {profile.skills.map(skill => (
                  <span key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
                    {skill}
                    <button type="button"
                      onClick={() => set("skills", profile.skills.filter(s => s !== skill))}
                      className="text-slate-400 hover:text-slate-700 transition-colors text-base leading-none">
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                  placeholder="Type a skill and press Enter…"
                  className={`${iCls} flex-1`} />
                <button type="button" onClick={addSkill}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors shrink-0">
                  Add
                </button>
              </div>
            </div>
          </section>

          {/* Education */}
          <section id="education" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-24">
            <SectionHeader label="Education Background" />
            <div className="divide-y divide-slate-50">
              {profile.education.map((edu, i) => (
                <EducationCard key={i} edu={edu}
                  onChange={updated => {
                    const list = [...profile.education];
                    list[i] = updated;
                    set("education", list);
                  }} />
              ))}
            </div>
          </section>

          {/* Experience */}
          <section id="experience" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-24">
            <SectionHeader label="Internships / Project Experience" />
            <div className="divide-y divide-slate-50">
              {profile.experience.map((exp, i) => (
                <ExperienceCard key={i} exp={exp}
                  onChange={updated => {
                    const list = [...profile.experience];
                    list[i] = updated;
                    set("experience", list);
                  }} />
              ))}
            </div>
          </section>

          <section id="projects" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-24">
            <SectionHeader label="Projects" />
            <div className="p-6">
              <EditableList
                items={profile.projects}
                emptyLabel="No projects extracted yet."
                addLabel="Add project"
                placeholder="Project name: describe the outcome, tools, and impact…"
                onChange={(projects) => set("projects", projects)}
              />
            </div>
          </section>

          <section id="awards" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-24">
            <SectionHeader label="Awards & Certifications" />
            <div className="space-y-6 p-6">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Awards</p>
                <EditableList
                  items={profile.awards}
                  emptyLabel="No awards extracted yet."
                  addLabel="Add award"
                  placeholder="Dean’s List, hackathon placement, scholarship, honor, or competition result…"
                  onChange={(awards) => set("awards", awards)}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Certifications</p>
                <EditableList
                  items={profile.certificates}
                  emptyLabel="No certifications extracted yet."
                  addLabel="Add certification"
                  placeholder="AWS Certified Cloud Practitioner, Google Data Analytics…"
                  onChange={(certificates) => set("certificates", certificates)}
                />
              </div>
            </div>
          </section>

          {/* Raw text */}
          <details className="text-sm text-slate-400">
            <summary className="cursor-pointer hover:text-slate-600 select-none transition-colors">
              View raw extracted text
            </summary>
            <textarea value={profile.raw_text} rows={8}
              className={`${iCls} mt-2 font-mono text-xs w-full`} readOnly />
          </details>

          <button type="submit" disabled={isLoading}
            className="w-full rounded-xl bg-slate-900 py-3.5 text-white font-semibold text-base hover:bg-slate-700 disabled:opacity-60 transition-colors">
            {isLoading ? "Saving profile…" : "Confirm CV →"}
          </button>
        </div>

        {/* ── Sticky sidebar ── */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="lg:fixed lg:top-24 lg:z-30 lg:w-56 lg:right-[max(2rem,calc((100vw-80rem)/2+2rem))] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-white/70 bg-[#fcfaf6]/92 p-3 shadow-[0_16px_40px_rgba(72,56,36,0.10)] backdrop-blur-md">
            <ul className="space-y-0.5">
              {NAV_SECTIONS.map(({ id, label }) => {
                const isActive = activeSection === id;
                const isUpload = id === "upload";
                return (
                  <li key={id}>
                    <button type="button"
                      onClick={() => (isUpload ? handleUploadClick() : scrollTo(id))}
                      className={[
                        "w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all",
                        isUpload
                          ? "border border-[#d6c3ae] bg-[#f7efe4] text-[#8A6048] shadow-sm hover:bg-[#f4eadb]"
                          : isActive
                          ? "bg-white shadow-sm text-[#8A6048] font-semibold border border-[#8A6048]/20"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
                      ].join(" ")}>
                      <span
                        className={[
                          "text-xs shrink-0",
                          isUpload || isActive ? "text-[#8A6048]" : "text-slate-300",
                        ].join(" ")}
                      >
                        {isUpload ? "↺" : "✓"}
                      </span>
                      <span className="leading-snug">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

      </div>
    </form>
  );
}

/* ── Shared sub-components ── */

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-6 py-4 border-b border-slate-100">
      <h2 className="text-xs font-semibold tracking-widest text-slate-400 uppercase">{label}</h2>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      {children}
    </div>
  );
}

function EducationCard({ edu, onChange }: { edu: Education; onChange: (e: Education) => void }) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-2 gap-x-12 gap-y-5">
        <Field label="Degree">
          <input value={edu.degree}
            onChange={e => onChange({ ...edu, degree: e.target.value })}
            className={iCls} placeholder="e.g. Bachelor of Science" />
        </Field>
        <Field label="Graduation Year / Period">
          <input value={edu.year}
            onChange={e => onChange({ ...edu, year: e.target.value })}
            className={iCls} placeholder="e.g. 2027 or 2023–2027" />
        </Field>
        <Field label="University">
          <input value={edu.institution}
            onChange={e => onChange({ ...edu, institution: e.target.value })}
            className={iCls} placeholder="Institution name" />
        </Field>
      </div>
    </div>
  );
}

function ExperienceCard({ exp, onChange }: { exp: Experience; onChange: (e: Experience) => void }) {
  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-2 gap-x-12">
        <Field label="Organization Name">
          <input value={exp.company}
            onChange={e => onChange({ ...exp, company: e.target.value })}
            className={iCls} placeholder="Company or organization" />
        </Field>
        <Field label="Period">
          <input value={exp.duration}
            onChange={e => onChange({ ...exp, duration: e.target.value })}
            className={iCls} placeholder="e.g. 2024-06 – 2024-10" />
        </Field>
      </div>
      <Field label="Role & Responsibility">
        <input value={exp.title}
          onChange={e => onChange({ ...exp, title: e.target.value })}
          className={iCls} placeholder="Your role or title" />
      </Field>
      <Field label="Job Description">
        <textarea value={exp.description || ""}
          onChange={e => onChange({ ...exp, description: e.target.value })}
          rows={5} className={`${iCls} resize-y leading-relaxed`}
          placeholder="Describe your responsibilities and achievements…" />
      </Field>
    </div>
  );
}

function EditableList({
  items,
  onChange,
  placeholder,
  addLabel,
  emptyLabel,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel: string;
  emptyLabel: string;
}) {
  const safeItems = Array.isArray(items) ? items : [];

  function updateItem(index: number, value: string) {
    const next = [...safeItems];
    next[index] = value;
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(safeItems.filter((_, itemIndex) => itemIndex !== index));
  }

  function addItem() {
    onChange([...safeItems, ""]);
  }

  return (
    <div className="space-y-3">
      {safeItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-400">
          {emptyLabel}
        </div>
      ) : (
        safeItems.map((item, index) => (
          <div key={index} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Item {index + 1}</p>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-700"
              >
                Remove
              </button>
            </div>
            <textarea
              value={item}
              onChange={(event) => updateItem(index, event.target.value)}
              rows={3}
              className={`${iCls} resize-y leading-relaxed`}
              placeholder={placeholder}
            />
          </div>
        ))
      )}
      <button
        type="button"
        onClick={addItem}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
      >
        {addLabel}
      </button>
    </div>
  );
}
