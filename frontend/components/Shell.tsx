"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, BrainCircuit, History, LogOut, Shield, Sparkles } from "lucide-react";
import { clearAuth, getStoredUser } from "@/lib/api";

const items = [
  { href: "/", label: "Analyze", icon: BrainCircuit },
  { href: "/history", label: "History", icon: History },
  { href: "/admin", label: "Admin", icon: Shield }
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark"><Sparkles size={20} /></span>
          <span>Sentiment Studio</span>
        </Link>
        <nav className="nav-list">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`nav-item ${active ? "active" : ""}`}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-card">
          <BarChart3 size={18} />
          <p>Explainability, history, and admin review are now split cleanly between Next.js and FastAPI.</p>
        </div>
      </aside>
      <main className="main-shell">
        <header className="topbar">
          <div>
            <p className="caption">AI sentiment workspace</p>
            <h1>Text intelligence console</h1>
          </div>
          <div className="user-chip">
            <span>{user?.email || "Guest"}</span>
            <button
              type="button"
              className="icon-button"
              aria-label="Logout"
              onClick={() => {
                clearAuth();
                router.push("/login");
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
