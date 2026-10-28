import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

const API_BASE = (process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

export default function LiveSports() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const loadOdds = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_BASE}/api/odds`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Odds request failed (${response.status})`);
      }
      const data = await response.json();
      setMatches(Array.isArray(data.matches) ? data.matches : []);
    } catch (err) {
      setError(err.message || "Could not load upcoming odds.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadOdds(); }, [loadOdds]);
  const fmtDate = value => value ? new Date(value).toLocaleString() : "Start time TBC";

  return <section className="nx-card p-5 space-y-4" aria-label="Real-world sports odds">
    <div className="flex items-center justify-between gap-3">
      <div><div className="text-xs font-black uppercase tracking-wider text-[#00E5FF]">Real-world sports</div>
        <h2 className="text-2xl font-black">Upcoming Matches &amp; Odds</h2>
        <p className="text-xs text-[#A29DBE] mt-1">Head-to-head prices from available bookmakers.</p></div>
      <button type="button" onClick={loadOdds} disabled={loading} aria-label="Refresh sports odds" className="nx-btn-primary p-2 rounded-lg"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/></button>
    </div>
    {loading && <p className="text-sm text-[#A29DBE]">Loading upcoming matches…</p>}
    {!loading && error && <div className="text-sm text-rose-300" role="alert">{error} <button type="button" onClick={loadOdds} className="underline ml-2">Try again</button></div>}
    {!loading && !error && matches.length === 0 && <p className="text-sm text-[#A29DBE]">No upcoming odds are currently available.</p>}
    <div className="space-y-3">{matches.map(match => <article key={match.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap justify-between gap-2 text-xs text-[#A29DBE]"><span>{match.sport_title || match.sport_key || "Sports"}</span><span>{fmtDate(match.commence_time)}</span></div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mt-3 font-bold"><span className="truncate">{match.home_team}</span><span className="text-[10px] text-[#FFD700]">VS</span><span className="truncate text-right">{match.away_team}</span></div>
      {(match.bookmakers || []).map(book => <div key={book.key || book.title} className="mt-4"><div className="text-[11px] text-[#A29DBE] mb-2">{book.title}</div>
        {(book.markets || []).filter(m => m.key === "h2h").map(market => <div key={market.key} className="grid grid-cols-2 sm:grid-cols-3 gap-2">{market.outcomes.map(outcome => {
          const id = `${match.id}:${book.key}:${outcome.name}`;
          return <button type="button" key={id} onClick={() => setSelected(selected === id ? null : id)} aria-pressed={selected === id}
            className={`rounded-lg border px-3 py-2 text-left transition-colors ${selected === id ? "border-[#00E5FF] bg-[#00E5FF]/15" : "border-white/10 bg-white/[0.03] hover:border-[#00E5FF]"}`}>
            <span className="block text-xs truncate">{outcome.name}</span><strong className="text-[#00FF87]">{Number(outcome.price).toFixed(2)}</strong>
          </button>;
        })}</div>)}</div>)}
      {!(match.bookmakers || []).length && <p className="text-xs text-[#A29DBE] mt-3">Odds not available for this match yet.</p>}
    </article>)}</div>
    <p className="text-[11px] text-[#A29DBE]">Odds are provided by third parties and can change. Selecting a price here is a visual selection only; it does not place a bet or alter your virtual match engine.</p>
  </section>;
}
