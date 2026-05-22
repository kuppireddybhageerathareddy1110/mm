"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Activity, Send, Wand2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { apiFetch, getToken, Result } from "@/lib/api";

function sentimentClass(sentiment?: string) {
  return sentiment === "Negative"
    ? "sentiment-label sentiment-negative"
    : sentiment === "Neutral"
    ? "sentiment-label sentiment-neutral"
    : "sentiment-label sentiment-positive";
}

function ConfidenceRing({ value }: { value: number }) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="confidence-ring">
      <svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
        <circle className="confidence-ring-track" cx="70" cy="70" r={r} />
        <circle
          className="confidence-ring-fill"
          cx="70"
          cy="70"
          r={r}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="confidence-ring-inner">
        <div>
          <div className="confidence-value">{value}%</div>
          <div className="confidence-label">confidence</div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  const router = useRouter();
  const [text, setText] = useState(
    "The onboarding was smooth, the dashboard feels clear, and support solved my issue quickly."
  );
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) router.push("/login");
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<Result>("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const confidence = result?.confidence ?? 0;
  const polarityPct = `${(((result?.polarity ?? 0) + 1) / 2) * 100}%`;

  return (
    <Shell>
      <div className="workspace">
        {/* Input panel */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="caption">Analyze</p>
              <h2>Review text</h2>
            </div>
            <div className="panel-icon gold">
              <Wand2 size={18} />
            </div>
          </div>

          <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
            <label className="label">
              Text sample
              <textarea
                className="textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste customer feedback, reviews, or any text to analyze..."
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button className="primary-button" disabled={loading || !text.trim()} style={{ width: "fit-content" }}>
              <Send size={15} />
              {loading ? "Analyzing…" : "Analyze sentiment"}
            </button>
          </form>

          {result?.lime_html && (
            <div style={{ marginTop: 24 }}>
              <div className="divider" />
              <div style={{ marginTop: 20 }}>
                <p className="caption" style={{ marginBottom: 6 }}>LIME Explanation</p>
                <div className="lime-box" dangerouslySetInnerHTML={{ __html: result.lime_html }} />
              </div>
            </div>
          )}
        </section>

        {/* Result panel */}
        <aside className="panel result-stack">
          <div className="panel-header">
            <div>
              <p className="caption">Result</p>
              <h2 className={sentimentClass(result?.sentiment)}>
                {result?.sentiment ?? "Ready"}
              </h2>
            </div>
            <div className="panel-icon emerald">
              <Activity size={18} />
            </div>
          </div>

          <ConfidenceRing value={confidence} />

          <div className="meter-wrap">
            <p className="meter-title">Polarity</p>
            <div className="meter" style={{ "--position": polarityPct } as React.CSSProperties}>
              <span />
            </div>
            <div className="meter-labels">
              <span>−1 Negative</span>
              <span>+1 Positive</span>
            </div>
            <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {result ? `${result.polarity.toFixed(3)} on a −1 to 1 scale` : "Submit text to calculate polarity."}
            </p>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <p className="meter-title">Negative words</p>
            <div className="word-list">
              {result?.negative_words?.length ? (
                result.negative_words.map((word) => <span key={word}>{word}</span>)
              ) : (
                <span className="none-tag" style={{ background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 10px", fontSize: 12 }}>
                  None detected
                </span>
              )}
            </div>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
