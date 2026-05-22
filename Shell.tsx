"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, BrainCircuit, History, LogOut, Shield, Sparkles } from "lucide-react";
import { clearAuth, getStoredUser } from "@/lib/api";

const items = [
  { href: "/", label: "Analyze", icon: BrainCircuit },
  { href: "/history", label: "History", icon: History },
  { href: "/emotional", label: "Crystallize", icon: Sparkles },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark"><Sparkles size={18} /></span>
          <span>Sentiment Studio</span>
        </Link>

        <div>
          <p className="nav-label" style={{ marginBottom: 8 }}>Navigation</p>
          <nav className="nav-list">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`nav-item ${active ? "active" : ""}`}>
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-footer">
          <BarChart3 size={16} style={{ color: "var(--gold)", opacity: 0.7 }} />
          <p>Explainability, history, and admin review — cleanly split between Next.js and FastAPI.</p>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div>
            <p className="caption">AI Sentiment Workspace</p>
            <h1>Text Intelligence Console</h1>
          </div>
          <div className="user-chip">
            <span style={{ color: "var(--text)" }}>{user?.email || "Guest"}</span>
            <button
              type="button"
              className="icon-button"
              aria-label="Logout"
              onClick={() => {
                clearAuth();
                router.push("/login");
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
