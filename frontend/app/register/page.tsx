"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Sparkles } from "lucide-react";
import { apiFetch, AuthResponse, storeAuth } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const auth = await apiFetch<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      storeAuth(auth);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-visual">
        <div className="brand"><span className="brand-mark"><Sparkles size={20} /></span><span>Sentiment Studio</span></div>
        <div>
          <h1>Create a sharper feedback loop.</h1>
          <p>Store analyses, compare tone over time, and keep explainability attached to every result.</p>
        </div>
      </section>
      <section className="auth-panel">
        <h2>Create account</h2>
        <p className="muted">Passwords require at least six characters.</p>
        <form onSubmit={submit}>
          <label className="label">Email<input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label className="label">Password<input className="input" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          {error && <p className="error">{error}</p>}
          <button className="primary-button" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
        </form>
        <p className="muted">Already registered? <Link className="link" href="/login">Sign in</Link></p>
      </section>
    </div>
  );
}
