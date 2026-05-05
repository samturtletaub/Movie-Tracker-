import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRuntime(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export const BUCKETS = ["loved", "liked", "meh", "dnf"] as const;
export type Bucket = (typeof BUCKETS)[number];

export const BUCKET_LABELS: Record<Bucket, string> = {
  loved: "Loved",
  liked: "Liked",
  meh: "Meh",
  dnf: "Didn't finish",
};

export function bucketStatus(bucket: Bucket): "watched" | "didnt_finish" {
  return bucket === "dnf" ? "didnt_finish" : "watched";
}
