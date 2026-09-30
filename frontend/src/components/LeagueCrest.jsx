import React from "react";

const fallback = (name) => {
  const initials = String(name || "Team").split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase().slice(0, 3) || "TM";
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="43" fill="#15213a" stroke="#00E5FF" stroke-width="4"/><text x="48" y="55" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="900" fill="white">${initials}</text></svg>`)}`;
};

export default function LeagueCrest({ name, logoUrl, size = 42 }) {
  return <img src={logoUrl || fallback(name)} alt={`${name} official club crest`} width={size} height={size} className="shrink-0 object-contain drop-shadow-lg" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallback(name); }} />;
}
