"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Check, Pencil } from "lucide-react";

export function NotesEditor({
  entryId,
  initialNotes,
}: {
  entryId: number | null;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isPending, start] = useTransition();
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (!entryId) return;
    const t = setTimeout(() => {
      start(async () => {
        const res = await fetch("/api/entries/notes", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ entryId, notes }),
        });
        if (res.ok) setSavedAt(Date.now());
      });
    }, 700);
    return () => clearTimeout(t);
  }, [notes, entryId]);

  if (!entryId) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-ink-400">
        <Pencil className="mb-2 inline h-3.5 w-3.5" /> Add this to your library to
        start taking notes.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-ink-400">
        <span>Your notes</span>
        <span
          className={cn(
            "flex items-center gap-1 transition-opacity",
            isPending || savedAt ? "opacity-80" : "opacity-0",
          )}
        >
          <Check className="h-3 w-3" />
          {isPending ? "Saving…" : "Saved"}
        </span>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder="A line about what you loved, who recommended it, or why you rated this…"
        className="w-full resize-y rounded-lg bg-transparent text-sm text-ink-100 placeholder:text-ink-400 focus:outline-none"
      />
    </div>
  );
}
