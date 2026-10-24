import React from "react";

// Deterministic team badge: the same team name always gets the same badge,
// while different names are spread across multiple shapes and colour families.
export default function TeamLogo({ name, size = 34 }) {
  const text = String(name || "Team").trim() || "Team";
  let h1 = 2166136261;
  let h2 = 16777619;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 16777619) >>> 0;
    h2 ^= c + i * 97;
    h2 = Math.imul(h2, 2246822519) >>> 0;
  }

  const shapes = ["circle", "square", "triangle", "rectangle", "diamond", "hexagon", "shield", "pentagon", "octagon", "ticket", "burst", "ring"];
  const shape = shapes[h1 % shapes.length];
  const hue = h2 % 360;
  const hue2 = (hue + 42 + ((h1 >>> 8) % 55)) % 360;
  const letters = text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase()
    .slice(0, 3) || "TM";

  const shapeMarkup = {
    circle: `<circle cx="48" cy="48" r="40" fill="url(#g)" stroke="white" stroke-opacity=".78" stroke-width="4"/>`,
    square: `<rect x="8" y="8" width="80" height="80" rx="11" fill="url(#g)" stroke="white" stroke-opacity=".78" stroke-width="4"/>`,
    triangle: `<path d="M48 6 91 88H5Z" fill="url(#g)" stroke="white" stroke-opacity=".78" stroke-width="4" stroke-linejoin="round"/>`,
    rectangle: `<rect x="4" y="20" width="88" height="56" rx="11" fill="url(#g)" stroke="white" stroke-opacity=".78" stroke-width="4"/>`,
    diamond: `<path d="M48 4 92 48 48 92 4 48Z" fill="url(#g)" stroke="white" stroke-opacity=".78" stroke-width="4"/>`,
    hexagon: `<path d="M24 6h48l20 42-20 42H24L4 48Z" fill="url(#g)" stroke="white" stroke-opacity=".78" stroke-width="4"/>`,
    shield: `<path d="M48 4 86 17v30c0 24-15 39-38 45C25 86 10 71 10 47V17Z" fill="url(#g)" stroke="white" stroke-opacity=".78" stroke-width="4"/>`,
    pentagon: `<path d="M48 5 90 35 74 89H22L6 35Z" fill="url(#g)" stroke="white" stroke-opacity=".78" stroke-width="4"/>`,
    octagon: `<path d="M26 5h44l21 21v44L70 91H26L5 70V26Z" fill="url(#g)" stroke="white" stroke-opacity=".78" stroke-width="4"/>`,
    ticket: `<path d="M8 20h80v17c-8 0-8 14 0 14v17H8V51c8 0 8-14 0-14Z" fill="url(#g)" stroke="white" stroke-opacity=".78" stroke-width="4"/>`,
    burst: `<path d="m48 3 9 13 15-7 1 16 17 1-7 15 13 10-13 10 7 15-17 1-1 16-15-7-9 13-9-13-15 7-1-16-17-1 7-15L2 51l13-10-7-15 17-1 1-16 15 7Z" fill="url(#g)" stroke="white" stroke-opacity=".78" stroke-width="3"/>`,
    ring: `<circle cx="48" cy="48" r="41" fill="url(#g)" stroke="white" stroke-opacity=".78" stroke-width="4"/><circle cx="48" cy="48" r="27" fill="#07111e" fill-opacity=".72" stroke="white" stroke-opacity=".35" stroke-width="3"/>`,
  }[shape];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 82% 52%)"/><stop offset="1" stop-color="hsl(${hue2} 78% 38%)"/></linearGradient></defs>${shapeMarkup}<circle cx="48" cy="48" r="17" fill="#06101C" fill-opacity=".30" stroke="white" stroke-opacity=".45" stroke-width="2"/><text x="48" y="54" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" font-weight="900" fill="white" letter-spacing="1">${letters}</text></svg>`;

  return <img src={`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`} alt={`${text} logo`} width={size} height={size} className="shrink-0 drop-shadow-lg" />;
}
