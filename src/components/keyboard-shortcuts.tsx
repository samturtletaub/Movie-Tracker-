"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function KeyboardShortcuts() {
  const router = useRouter();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "/") {
        e.preventDefault();
        router.push("/search");
      }
      if (e.key === "g") {
        const handler = (e2: KeyboardEvent) => {
          if (e2.key === "h") router.push("/");
          if (e2.key === "w") router.push("/watchlist");
          if (e2.key === "l") router.push("/library");
          if (e2.key === "s") router.push("/stats");
          window.removeEventListener("keydown", handler);
        };
        window.addEventListener("keydown", handler, { once: true });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
  return null;
}
