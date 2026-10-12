import React, { useMemo } from "react";
import { getLogo } from "../utils/getLogo";

// Stable local crest renderer. Recognized teams use one packaged local asset.
// Unrecognized/custom teams get a deterministic geometric monogram badge (no remote request).
const palette = ["#00D1B2", "#F2B705", "#E4572E", "#4776E6", "#B23AEE", "#E83F6F", "#28A745", "#F08A24"];
const hashName = (value) => { let h = 2166136261; for (const ch of String(value || "Team")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const initials = (value) => String(value || "TEAM").trim().split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0]).join("").toUpperCase() || "TM";
const customBadge = (name) => {
  const h = hashName(name); const c1 = palette[h % palette.length]; const c2 = palette[(h >>> 4) % palette.length];
  const shapes = [
    `<path d="M50 5 L91 21 L86 64 L50 94 L14 64 L9 21 Z" fill="#0B0C10" stroke="${c1}" stroke-width="5"/>`,
    `<path d="M50 5 L94 50 L50 95 L6 50 Z" fill="#0B0C10" stroke="${c1}" stroke-width="5"/>`,
    `<circle cx="50" cy="50" r="43" fill="#0B0C10" stroke="${c1}" stroke-width="5"/>`,
    `<path d="M18 12 H82 L94 50 L82 88 H18 L6 50 Z" fill="#0B0C10" stroke="${c1}" stroke-width="5"/>`,
    `<path d="M50 5 L94 88 H6 Z" fill="#0B0C10" stroke="${c1}" stroke-width="5"/>`,
    `<path d="M18 7 H82 L96 23 V77 L82 93 H18 L4 77 V23 Z" fill="#0B0C10" stroke="${c1}" stroke-width="5"/>`
  ];
  const shape = shapes[(h >>> 8) % shapes.length];
  const text = initials(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${shape}<path d="M20 34 L50 19 L80 34" fill="none" stroke="${c2}" stroke-width="3" opacity=".9"/><text x="50" y="61" font-family="Arial,sans-serif" font-size="${text.length>1?25:32}" font-weight="900" text-anchor="middle" fill="#FFFFFF">${text.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</text><path d="M32 72 H68" stroke="${c2}" stroke-width="4" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
const TeamLogo = ({ name, teamName, logoUrl, size, className = "w-6 h-6 inline-block" }) => {
  const team = teamName || name || "";
  const local = useMemo(() => (typeof logoUrl === "string" && logoUrl.startsWith("/logos/") ? logoUrl : getLogo(team)), [logoUrl, team]);
  const fallback = useMemo(() => customBadge(team), [team]);
  const numericSize = Number(size);
  const style = { width: Number.isFinite(numericSize) && numericSize > 0 ? numericSize : 24, height: Number.isFinite(numericSize) && numericSize > 0 ? numericSize : 24, flexShrink: 0, objectFit: "contain", display: "inline-block" };
  return <img src={local || fallback} alt={team || "Team logo"} className={className} style={style} width={style.width} height={style.height} loading="eager" decoding="sync" draggable="false" onError={local ? (event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallback; } : undefined} />;
};
export default TeamLogo;
