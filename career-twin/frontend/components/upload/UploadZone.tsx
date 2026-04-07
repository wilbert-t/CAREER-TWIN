"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";

interface UploadZoneProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
  loadingMessage?: string;
}

export function UploadZone({ onUpload, isLoading, loadingMessage }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ALLOWED = [".pdf", ".doc", ".docx"];

  function validate(file: File): string | null {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED.includes(ext)) return `Unsupported type. Use PDF or DOCX.`;
    if (file.size > 10 * 1024 * 1024) return "File too large. Max 10 MB.";
    return null;
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const err = validate(file);
      if (err) { setError(err); return; }
      setError(null);
      onUpload(file);
    },
    [onUpload]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validate(file);
    if (err) { setError(err); return; }
    setError(null);
    onUpload(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={[
        "relative flex flex-col items-center justify-center gap-4",
        "rounded-2xl border-2 border-dashed p-12 text-center",
        "transition-colors duration-200 cursor-pointer",
        isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-slate-400",
        isLoading ? "pointer-events-none opacity-70" : "",
      ].join(" ")}
    >
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={handleFileInput}
        disabled={isLoading}
      />
      {isLoading ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-sm text-slate-600">{loadingMessage ?? "Processing…"}</p>
        </>
      ) : (
        <>
          <div className="rounded-full bg-slate-200 p-4">
            <Upload className="h-8 w-8 text-slate-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">Drop your CV here</p>
            <p className="text-sm text-slate-500 mt-1">or click to browse · PDF or DOCX · max 10 MB</p>
          </div>
          <div className="flex gap-2 text-xs text-slate-400 items-center">
            <FileText className="h-4 w-4" /> PDF &nbsp;|&nbsp; DOCX
          </div>
        </>
      )}
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
