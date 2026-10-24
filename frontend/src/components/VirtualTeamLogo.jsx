import React from "react";

// Synthetic crests are deliberately used only for uploaded/simulated virtual fixtures.
// The deterministic seed means they never blink or change during re-renders.
export default function VirtualTeamLogo({ name, size = 38, className = "" }) {
  const team = String(name || "Virtual Team").trim();
  let hash = 2166136261;
  for (let i = 0; i < team.length; i += 1) { hash ^= team.charCodeAt(i); hash = Math.imul(hash, 16777619) >>> 0; }
  const colors = ["#00C2D7", "#FF6B35", "#8D5CF6", "#E7B52C", "#E84363", "#20B486", "#367BF5", "#C4D3E8", "#D97706", "#F472B6"];
  const c1 = colors[hash % colors.length], c2 = colors[(hash >>> 5) % colors.length];
  const initials = team.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase() || "VT";
  const shapes = [
    <circle key="shape" cx="48" cy="48" r="42" />,
    <path key="shape" d="M48 4 88 19 84 61 48 92 12 61 8 19Z" />,
    <path key="shape" d="M22 5H74L91 22V74L74 91H22L5 74V22Z" />,
    <path key="shape" d="M48 4 92 48 48 92 4 48Z" />,
    <path key="shape" d="M17 8H79L91 27V69L79 88H17L5 69V27Z" />,
    <path key="shape" d="M10 17 48 5 86 17V52Q82 78 48 92Q14 78 10 52Z" />,
    <path key="shape" d="M48 5 89 28 77 76 48 91 19 76 7 28Z" />,
  ];
  return <svg className={`shrink-0 ${className}`} width={size} height={size} viewBox="0 0 96 96" role="img" aria-label={`${team} virtual crest`}>
    <defs><linearGradient id={`crest-${hash}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={c1}/><stop offset="1" stopColor={c2}/></linearGradient></defs>
    <path d="M48 2 92 25 92 70 48 94 4 70 4 25Z" fill="#0B0C10" stroke="#D9E2EF" strokeWidth="2"/>
    <g transform={`rotate(${hash % 4 * 45} 48 48)`} fill={`url(#crest-${hash})`} stroke="#F6F8FC" strokeWidth="3">{shapes[(hash >>> 8) % shapes.length]}</g>
    <path d="M18 48H78M48 18V78" stroke="#0B0C10" strokeOpacity=".65" strokeWidth="3"/>
    <text x="48" y="56" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize={initials.length > 2 ? "19" : "25"} fontWeight="900" fill="#FFFFFF" stroke="#0B0C10" strokeWidth="2.5" paintOrder="stroke">{initials}</text>
  </svg>;
}
