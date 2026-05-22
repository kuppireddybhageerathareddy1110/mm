"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Trash2 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Shell } from "@/components/Shell";
import { apiFetch, getToken, Result } from "@/lib/api";

const COLORS: Record<string, string> = {
  Positive: "#2dd4a0",
  Negative: "#f06e5a",
  Neutral: "#e8a930",
};

function SentimentBadge({ label }: { label: string }) {
  const cls =
    label === "Positive" ? "badge badge-positive" :
    label === "Negative" ? "badge badge-negative" :
    "badge badge-neutral";
  return <span className={cls}>{label}</span>;
}

export default function HistoryPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Result[]>([]);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState("recent");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const data = await apiFetch<{ results: Result[] }>(
        `/api/history?limit=${limit}&sort_by=${sortBy}`
      );
      setRows(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load history");
    }
  }

  async function exportCsv() {
    const token = getToken();
    const res = await fetch("/api/export.csv", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) { setError("CSV export failed"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sentiment_history.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (!getToken()) router.push("/login");
    else load();
  }, [router, limit, sortBy]);

  const chartData = useMemo(() => {
    const counts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.sentiment] = (acc[row.sentiment] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rows]);

  return (
    <Shell>
      <div className="history-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="caption">History</p>
              <h2>Previous analyses</h2>
            </div>
            <button className="secondary-button" onClick={load}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          <div className="toolbar">
            <select className="select" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
            </select>
            <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Most recent</option>
              <option value="polarity">Highest polarity</option>
              <option value="sentiment">By sentiment</option>
            </select>
            <button className="secondary-button" onClick={exportCsv}>
              <Download size={14} /> Export CSV
            </button>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Text</th>
                  <th>Sentiment</th>
                  <th>Polarity</th>
                  <th>Confidence</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.text}
                    </td>
                    <td><SentimentBadge label={row.sentiment} /></td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{row.polarity}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{row.confidence}%</td>
                    <td>
                      <button
                        className="danger-button"
                        onClick={async () => {
                          await apiFetch(`/api/history/${row.id}`, { method: "DELETE" });
                          await load();
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--text-3)", padding: 32 }}>
                      No analyses yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="panel chart-card" style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <div>
            <p className="caption">Distribution</p>
            <h3>Sentiment mix</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border-2)",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "var(--text)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {chartData.length > 0 && (
            <div style={{ display: "grid", gap: 8 }}>
              {chartData.map((item) => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[item.name], display: "block" }} />
                    <span style={{ fontSize: 12, color: "var(--text-2)" }}>{item.name}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)" }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </Shell>
  );
}
