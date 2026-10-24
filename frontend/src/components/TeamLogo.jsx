import React from "react";
import { getLogo } from "@/utils/getLogo";

function makeFallback(text) {
  let h1 = 2166136261;
  let h2 = 16777619;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    h1 ^= c; h1 = Math.imul(h1, 16777619) >>> 0;
    h2 ^= c + i * 97; h2 = Math.imul(h2, 2246822519) >>> 0;
  }
  const shapes = [
    `<circle cx="48" cy="48" r="40"/>`,
    `<rect x="8" y="8" width="80" height="80" rx="12"/>`,
    `<path d="M48 5 92 88H4Z"/>`,
    `<path d="M48 4 92 48 48 92 4 48Z"/>`,
    `<path d="M24 6h48l20 42-20 42H24L4 48Z"/>`,
    `<path d="M48 4 86 17v30c0 24-15 39-38 45C25 86 10 71 10 47V17Z"/>`,
    `<path d="M26 5h44l21 21v44L70 91H26L5 70V26Z"/>`
  ];
  const hue = h2 % 360;
  const hue2 = (hue + 42 + ((h1 >>> 8) % 55)) % 360;
  const letters = text.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase().slice(0, 3) || "TM";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 82% 52%)"/><stop offset="1" stop-color="hsl(${hue2} 78% 38%)"/></linearGradient></defs><g fill="url(#g)" stroke="white" stroke-opacity=".82" stroke-width="4">${shapes[h1 % shapes.length]}</g><circle cx="48" cy="48" r="17" fill="#06101C" fill-opacity=".45" stroke="white" stroke-opacity=".45" stroke-width="2"/><text x="48" y="54" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" font-weight="900" fill="white" letter-spacing="1">${letters}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function TeamLogo({ name, size = 34, className = "" }) {
  const text = String(name || "Team").trim() || "Team";
  const logo = getLogo(text);
  const [failedSource, setFailedSource] = React.useState("");
  const useFallback = !logo || failedSource === logo;
  const source = useFallback ? makeFallback(text) : logo;

  return (
    <img
      src={source}
      alt={`${text} logo`}
      width={size}
      height={size}
      loading="eager"
      decoding="sync"
      draggable="false"
      onError={useFallback ? undefined : () => setFailedSource(logo)}
      className={`shrink-0 object-contain ${className}`.trim()}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    />
  );
}
