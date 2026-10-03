import React, { useMemo, useState } from "react";

// Real club crest resolver for the leagues supported by NexusBet.
// FootyLogos provides current 2026/27 transparent crest files.  We try
// several safe aliases because admins may enter names such as "Barcelona"
// instead of "FC Barcelona". Unknown/custom teams keep the old generated badge.
const ALIASES = {
  "barcelona": ["fc-barcelona"],
  "barca": ["fc-barcelona"],
  "fc barcelona": ["fc-barcelona"],
  "real madrid": ["real-madrid"],
  "real madrid cf": ["real-madrid"],
  "atletico madrid": ["atletico-madrid"],
  "atletico de madrid": ["atletico-madrid"],
  "athletic bilbao": ["athletic-club-bilbao"],
  "athletic club": ["athletic-club-bilbao"],
  "manchester united": ["manchester-united"],
  "manchester united fc": ["manchester-united"],
  "man utd": ["manchester-united"],
  "man united": ["manchester-united"],
  "manchester city": ["manchester-city"],
  "man city": ["manchester-city"],
  "tottenham": ["tottenham-hotspur"],
  "tottenham hotspur": ["tottenham-hotspur"],
  "spurs": ["tottenham-hotspur"],
  "west ham": ["west-ham-united"],
  "west ham united": ["west-ham-united"],
  "newcastle": ["newcastle-united"],
  "newcastle united": ["newcastle-united"],
  "nottingham forest": ["nottingham-forest"],
  "nottm forest": ["nottingham-forest"],
  "wolves": ["wolverhampton-wanderers"],
  "wolverhampton wanderers": ["wolverhampton-wanderers"],
  "brighton": ["brighton-hove-albion"],
  "brighton & hove albion": ["brighton-hove-albion"],
  "brighton and hove albion": ["brighton-hove-albion"],
  "bayern munich": ["bayern-munich", "bayern-munchen"],
  "bayern munchen": ["bayern-munchen", "bayern-munich"],
  "borussia monchengladbach": ["borussia-monchengladbach", "borussia-monchengladbach-1899"],
  "borussia mönchengladbach": ["borussia-monchengladbach", "borussia-monchengladbach-1899"],
  "rb leipzig": ["rb-leipzig"],
  "inter": ["inter-milan", "inter"],
  "inter milan": ["inter-milan", "inter"],
  "internazionale": ["inter-milan", "inter"],
  "ac milan": ["ac-milan"],
  "milan": ["ac-milan"],
  "juventus": ["juventus"],
  "napoli": ["napoli"],
  "roma": ["as-roma", "roma"],
  "as roma": ["as-roma", "roma"],
  "lazio": ["lazio"],
  "psg": ["paris-saint-germain"],
  "paris saint-germain": ["paris-saint-germain"],
  "paris saint germain": ["paris-saint-germain"],
  "marseille": ["olympique-marseille", "marseille"],
  "lyon": ["olympique-lyonnais", "lyon"],
  "monaco": ["as-monaco", "monaco"],
  "ajax": ["ajax"],
  "psv": ["psv-eindhoven", "psv"],
  "feyenoord": ["feyenoord"],
  "benfica": ["benfica"],
  "porto": ["fc-porto", "porto"],
  "sporting": ["sporting-cp", "sporting"],
  "sporting cp": ["sporting-cp", "sporting"],
  "galatasaray": ["galatasaray"],
  "fenerbahce": ["fenerbahce"],
  "fenerbahçe": ["fenerbahce"],
  "besiktas": ["besiktas"],
  "beşiktaş": ["besiktas"],
  "trabzonspor": ["trabzonspor"],
  "olympiacos": ["olympiacos"],
  "panathinaikos": ["panathinaikos"],
  "anderlecht": ["anderlecht"],
  "club brugge": ["club-brugge"],
  "rangers": ["rangers"],
  "celtic": ["celtic"],
  // France Ligue 1 (2026/27)
  "angers sco": ["angers"],
  "angers": ["angers"],
  "aj auxerre": ["aj-auxerre"],
  "auxerre": ["aj-auxerre"],
  "stade brestois 29": ["stade-brestois-29"],
  "brest": ["stade-brestois-29"],
  "le havre ac": ["le-havre"],
  "le havre": ["le-havre"],
  "rc lens": ["rc-lens"],
  "lens": ["rc-lens"],
  "losc lille": ["losc-lille"],
  "lille": ["losc-lille"],
  "fc lorient": ["fc-lorient"],
  "lorient": ["fc-lorient"],
  "olympique lyonnais": ["olympique-lyonnais"],
  "ol": ["olympique-lyonnais"],
  "le mans fc": ["le-mans"],
  "le mans": ["le-mans"],
  "olympique de marseille": ["olympique-marseille"],
  "om": ["olympique-marseille"],
  "as monaco": ["as-monaco"],
  "ogc nice": ["ogc-nice"],
  "nice": ["ogc-nice"],
  "paris fc": ["paris-fc"],
  "rc strasbourg alsace": ["rc-strasbourg-alsace"],
  "strasbourg": ["rc-strasbourg-alsace"],
  "stade rennais": ["stade-rennais"],
  "stade rennais fc": ["stade-rennais"],
  "rennes": ["stade-rennais"],
  "toulouse fc": ["toulouse"],
  "toulouse": ["toulouse"],
  "estac troyes": ["troyes"],
  "troyes": ["troyes"],
};

const normalize = (value) => String(value || "").trim().toLowerCase().replace(/\u00e6/g, "ae").replace(/\u00f8/g, "o").replace(/\u00e5/g, "a").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const slugify = (value) => normalize(value).replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function crestCandidates(name) {
  const key = normalize(name);
  const direct = ALIASES[key] || [];
  const slug = slugify(name);
  const variants = [slug];
  if (slug.startsWith("fc-")) variants.push(slug.slice(3));
  if (slug.startsWith("afc-")) variants.push(slug.slice(4));
  if (slug.endsWith("-fc")) variants.push(slug.slice(0, -3));
  if (slug.endsWith("-cf")) variants.push(slug.slice(0, -3));
  if (slug.endsWith("-afc")) variants.push(slug.slice(0, -4));
  return [...new Set([...direct, ...variants])].filter(Boolean).map((x) => `https://www.footylogos.com/dls/logo/${x}.png`);
}

function FallbackLogo({ text, size }) {
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
  const letters = text.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase().slice(0, 3) || "TM";
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

export default function TeamLogo({ name, size = 34 }) {
  const text = String(name || "Team").trim() || "Team";
  const candidates = useMemo(() => crestCandidates(text), [text]);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  React.useEffect(() => { setIndex(0); setFailed(false); }, [text]);

  if (failed || !candidates.length) return <FallbackLogo text={text} size={size} />;
  return (
    <img
      src={candidates[index]}
      alt={`${text} crest`}
      width={size}
      height={size}
      className="shrink-0 object-contain drop-shadow-lg"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        if (index < candidates.length - 1) setIndex((v) => v + 1);
        else setFailed(true);
      }}
    />
  );
}
