"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--bg))" }}>
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "hsl(var(--bg) / 0.88)",
          borderColor: "hsl(var(--border-subtle))",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="container-dashboard h-11 flex items-center justify-between px-1 sm:px-0">
          <Link href="/" className="group select-none">
            <span className="text-base font-extrabold tracking-tight" style={{ color: "hsl(var(--text))" }}>
              Gen
            </span>
            <span className="text-base font-extrabold tracking-tight" style={{ color: "hsl(var(--accent))" }}>
              _IT
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink href="/search" label="Recherche" active={pathname.startsWith("/search")} />
            <NavLink href="/favorites" label="Favoris" active={pathname.startsWith("/favorites")} />
          </nav>

          <div className="flex items-center gap-3">
            <span
              className="hidden sm:block text-[10px] font-mono tracking-widest uppercase px-2 py-1 rounded"
              style={{
                color: "hsl(var(--text-faint))",
                backgroundColor: "hsl(var(--surface-2))",
                letterSpacing: "0.1em",
              }}
            >
              SIRENE · BODACC
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 text-xs font-medium tracking-wide rounded transition-all"
      style={{
        color: active ? "hsl(var(--accent))" : "hsl(var(--text-muted))",
        backgroundColor: active ? "hsl(var(--accent-muted))" : "transparent",
        boxShadow: active ? "inset 0 0 0 1px hsl(var(--accent) / 0.2)" : "none",
      }}
    >
      {label}
    </Link>
  );
}
