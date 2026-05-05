"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Film, Home, List, Search, Sparkles, BarChart3 } from "lucide-react";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/watchlist", label: "Watchlist", icon: List },
  { href: "/library", label: "Library", icon: Film },
  { href: "/search", label: "Search", icon: Search },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber" />
          <span className="font-serif text-2xl italic leading-none tracking-tight">
            Reel
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-ink-300 hover:text-white hover:bg-white/5",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
