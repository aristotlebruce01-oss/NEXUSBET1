const fs = require("fs");
const path = require("path");
const https = require("https");

const LOGOS_DIR = path.join(__dirname, "..", "public", "logos");
const UTILS_FILE = path.join(__dirname, "utils", "getLogo.js");
if (!fs.existsSync(LOGOS_DIR)) fs.mkdirSync(LOGOS_DIR, { recursive: true });

const TEAMS = [
  // Premier League (20)
  "Arsenal FC", "Aston Villa FC", "AFC Bournemouth", "Brentford FC", "Brighton & Hove Albion FC",
  "Chelsea FC", "Crystal Palace FC", "Everton FC", "Fulham FC", "Ipswich Town FC",
  "Leicester City FC", "Liverpool FC", "Manchester City FC", "Manchester United FC", "Newcastle United FC",
  "Nottingham Forest FC", "Southampton FC", "Tottenham Hotspur FC", "West Ham United FC", "Wolverhampton Wanderers FC",

  // LaLiga (20)
  "Athletic Bilbao", "Atlético Madrid", "FC Barcelona", "RC Celta de Vigo", "RCD Espanyol",
  "Getafe CF", "Girona FC", "UD Las Palmas", "CD Leganés", "RCD Mallorca",
  "CA Osasuna", "Rayo Vallecano", "Real Betis", "Real Madrid CF", "Real Sociedad",
  "Sevilla FC", "Valencia CF", "Real Valladolid", "Villarreal CF", "Deportivo Alavés",

  // Bundesliga (18)
  "FC Augsburg", "Bayer 04 Leverkusen", "FC Bayern München", "VfL Bochum", "Borussia Dortmund",
  "Borussia Mönchengladbach", "Eintracht Frankfurt", "FC St. Pauli", "SC Freiburg", "1. FC Heidenheim",
  "TSG 1899 Hoffenheim", "Holstein Kiel", "1. FSV Mainz 05", "RB Leipzig", "VfB Stuttgart",
  "1. FC Union Berlin", "SV Werder Bremen", "VfL Wolfsburg",

  // Serie A (20)
  "Atalanta BC", "Bologna FC 1909", "Cagliari Calcio", "Como 1907", "Empoli FC",
  "ACF Fiorentina", "Genoa CFC", "FC Internazionale Milano", "Juventus FC", "SS Lazio",
  "US Lecce", "AC Milan", "AC Monza", "SSC Napoli", "Parma Calcio 1913",
  "AS Roma", "Torino FC", "Udinese Calcio", "Venezia FC", "Hellas Verona FC",

  // Liga Portugal (18)
  "FC Arouca", "AVS Futebol SAD", "SL Benfica", "Boavista FC", "SC Braga",
  "Casa Pia AC", "GD Estoril Praia", "CF Estrela da Amadora", "FC Famalicão", "SC Farense",
  "Gil Vicente FC", "Moreirense FC", "CD Nacional", "FC Porto", "Rio Ave FC",
  "CD Santa Clara", "Sporting CP", "Vitória SC",

  // Eredivisie (18)
  "AFC Ajax", "AZ Alkmaar", "Feyenoord", "Fortuna Sittard", "Go Ahead Eagles",
  "FC Groningen", "SC Heerenveen", "Heracles Almelo", "NAC Breda", "NEC Nijmegen",
  "PEC Zwolle", "PSV Eindhoven", "RKC Waalwijk", "Sparta Rotterdam", "FC Twente",
  "FC Utrecht", "Willem II", "Almere City FC",

  // Scottish Premiership (12)
  "Aberdeen FC", "Celtic FC", "Dundee FC", "Dundee United FC", "Heart of Midlothian FC",
  "Hibernian FC", "Kilmarnock FC", "Motherwell FC", "Rangers FC", "Ross County FC",
  "St Johnstone FC", "St Mirren FC",

  // Türkiye Süper Lig (19)
  "Adana Demirspor", "Alanyaspor", "Antalyaspor", "Beşiktaş JK", "Bodrum FK",
  "Çaykur Rizespor", "Eyüpspor", "Fenerbahçe SK", "Galatasaray SK", "Gaziantep FK",
  "Göztepe SK", "Hatayspor", "İstanbul Başakşehir", "Kasımpaşaspor", "Kayserispor",
  "Konyaspor", "Samsunspor", "Sivasspor", "Trabzonspor",

  // Greece Super League (14)
  "AEK Athens FC", "Aris Thessaloniki FC", "Asteras Tripolis FC", "Atromitos FC", "Athens Kallithea FC",
  "PAS Lamia 1964", "Levadiakos FC", "OFI Crete FC", "Olympiacos FC", "Panetolikos FC",
  "Panathinaikos FC", "Panserraikos FC", "PAOK FC", "Volos NFC",

  // Belgium Pro League (16)
  "RSC Anderlecht", "K Beerschot VA", "Cercle Brugge KSV", "R Charleroi SC", "Club Brugge KV",
  "FC Dender", "KRC Genk", "KAA Gent", "KV Kortrijk", "OH Leuven",
  "KV Mechelen", "Royal Antwerp FC", "STVV", "Standard Liège", "Royale Union Saint-Gilloise", "KVC Westerlo",

  // Ligue 1 (18)
  "Angers SCO", "AJ Auxerre", "Stade Brestois 29", "Le Havre AC", "RC Lens",
  "LOSC Lille", "Olympique Lyonnais", "Olympique de Marseille", "AS Monaco FC", "Montpellier HSC",
  "FC Nantes", "OGC Nice", "Paris Saint-Germain FC", "Stade de Reims", "Stade Rennais FC",
  "AS Saint-Étienne", "RC Strasbourg Alsace", "Toulouse FC"
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const cleanClub = (value) => normalize(value).replace(/^(fc|afc|acf|ss|ssc|as|us|ud|rcd|rc|cd|sl|sv|vfl|vfb|rsc|kaa|krc|kv|kvc|sc|k)_/, "").replace(/_(fc|cf|bc|ac|sc|sk|jk|fk|cfc|calcio|va|ksv)$/, "");
const usable = (file) => { try { const size = fs.statSync(file).size; return size > 300 && size <= 5 * 1024 * 1024; } catch { return false; } };
const existingFor = (team) => {
  const slug = normalize(team);
  const candidates = new Set([slug, cleanClub(slug), cleanClub(slug).replace(/^(fc|afc|acf)_/, "")]);
  const aliases = {
    "brighton_and_hove_albion_fc": "brighton_hove_albion_fc",
    "afc_bournemouth": "afc_bournemouth",
    "aston_villa_fc": "aston_villa_fc",
    "arsenal_fc": "arsenal_fc",
    "fc_bayern_munchen": "fc_bayern_munchen",
    "sc_freiburg": "freiburg",
    "cagliari_calcio": "cagliari",
    "rangers_fc": "rangers",
    "sevilla_fc": "sevilla",
    "real_madrid_cf": "real_madrid_cf",
    "aek_athens_fc": "aek_athens"
  };
  if (aliases[slug]) candidates.add(aliases[slug]);
  for (const stem of candidates) {
    for (const ext of [".svg", ".png", ".webp"]) {
      const file = path.join(LOGOS_DIR, stem + ext);
      if (usable(file)) return file;
    }
  }
  return null;
};
const request = (url, asJson = false) => new Promise((resolve) => {
  const req = https.get(url, { headers: { "User-Agent": "NexusBet-local-crest-import/1.0" }, timeout: 15000 }, (res) => {
    if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
      res.resume();
      const redirected = new URL(res.headers.location, url).toString();
      request(redirected, asJson).then(resolve);
      return;
    }
    const chunks = [];
    res.on("data", (chunk) => chunks.push(chunk));
    res.on("end", () => {
      const body = Buffer.concat(chunks);
      if (res.statusCode < 200 || res.statusCode >= 300) return resolve(null);
      if (asJson) { try { resolve(JSON.parse(body.toString("utf8"))); } catch { resolve(null); } }
      else resolve({ body, contentType: String(res.headers["content-type"] || "").toLowerCase() });
    });
  });
  req.on("timeout", () => { req.destroy(); resolve(null); });
  req.on("error", () => resolve(null));
});
const similarity = (a, b) => {
  const A = new Set(cleanClub(a).split("_").filter((x) => x.length > 1));
  const B = new Set(cleanClub(b).split("_").filter((x) => x.length > 1));
  if (!A.size || !B.size) return 0;
  const intersection = [...A].filter((x) => B.has(x)).length;
  return intersection / new Set([...A, ...B]).size;
};
const writeReport = (results) => {
  const lines = ["NexusBet local team crest import report", "", `Catalogue entries: ${TEAMS.length}`, `Downloaded: ${results.filter(x => x.status === "downloaded").length}`, `Already available locally: ${results.filter(x => x.status === "present").length}`, `Not found/needs review: ${results.filter(x => x.status === "missing").length}`, "", "Details:"];
  for (const r of results) lines.push(`${r.status.toUpperCase()} | ${r.team}${r.note ? ` | ${r.note}` : ""}`);
  fs.writeFileSync(path.join(__dirname, "..", "..", "LEAGUE_CREST_IMPORT_REPORT.txt"), lines.join("\n") + "\n", "utf8");
};

function refreshResolverFromLocalAssets() {
  // Rebuild the browser resolver after downloading so every new local image is actually discoverable.
  // This prevents the downloader from saving a crest that the frontend never uses.
  let aliases = {};
  try {
    const current = fs.readFileSync(UTILS_FILE, "utf8");
    const match = current.match(/const ALIASES = (\{[\s\S]*?\});\s*\n\s*export/);
    if (match) aliases = JSON.parse(match[1]);
  } catch (error) {
    console.warn("Could not preserve existing crest aliases:", error.message);
  }

  const candidates = [];
  for (const filename of fs.readdirSync(LOGOS_DIR)) {
    const fullPath = path.join(LOGOS_DIR, filename);
    let stat;
    try { stat = fs.statSync(fullPath); } catch { continue; }
    const ext = path.extname(filename).toLowerCase();
    if (!stat.isFile() || ![".svg", ".png", ".webp", ".jpg", ".jpeg"].includes(ext) || stat.size <= 300 || stat.size > 5 * 1024 * 1024) continue;
    let stem = path.basename(filename, ext);
    if (stem.toLowerCase().endsWith(".svg")) stem = stem.slice(0, -4);
    candidates.push({
      slug: normalize(stem),
      url: `/logos/${filename}`,
      ext,
      size: stat.size
    });
  }
  // Prefer SVG when the same club is packaged in multiple formats.
  candidates.sort((a, b) => (a.ext === ".svg" ? 0 : 1) - (b.ext === ".svg" ? 0 : 1) || b.size - a.size);
  const fileLogos = {};
  for (const item of candidates) if (!fileLogos[item.slug]) fileLogos[item.slug] = item.url;
  // Preserve aliases whose crest is still missing; they become valid as soon as that file is imported.

  const output = `// Auto-generated local-only team crest resolver. Only points to image files present in public/logos.\n// Unknown teams return null; TeamLogo renders a deterministic custom badge.\nconst FILE_LOGOS = ${JSON.stringify(fileLogos, null, 2)};\nconst ALIASES = ${JSON.stringify(aliases, null, 2)};\n\nexport const normalizeTeamName = (value) => String(value || "")\n  .normalize("NFD")\n  .replace(/[\\u0300-\\u036f]/g, "")\n  .toLowerCase()\n  .replace(/&/g, " and ")\n  .replace(/[^a-z0-9]+/g, "_")\n  .replace(/^_+|_+$/g, "");\n\nexport const getLogo = (teamName) => {\n  const slug = normalizeTeamName(teamName);\n  if (!slug) return null;\n  if (FILE_LOGOS[slug]) return FILE_LOGOS[slug];\n  if (ALIASES[slug] && FILE_LOGOS[ALIASES[slug]]) return FILE_LOGOS[ALIASES[slug]];\n  const variants = [\n    slug.replace(/^(fc|afc|acf|ss|ssc|as|us|ud|rcd|rc|cd|sl|sv|vfl|vfb|rsc|kaa|krc|kv|kvc|sc|k)_/, ""),\n    slug.replace(/_(fc|cf|bc|ac|sc|sk|jk|fk|cfc|calcio|va|ksv|kv|sad)$/, ""),\n    slug.replace(/^(fc|afc|acf|ss|ssc|as|us|ud|rcd|rc|cd|sl|sv|vfl|vfb|rsc|kaa|krc|kv|kvc|sc|k)_/, "").replace(/_(fc|cf|bc|ac|sc|sk|jk|fk|cfc|calcio|va|ksv|kv|sad)$/, "")\n  ];\n  for (const variant of variants) {\n    if (FILE_LOGOS[variant]) return FILE_LOGOS[variant];\n    if (ALIASES[variant] && FILE_LOGOS[ALIASES[variant]]) return FILE_LOGOS[ALIASES[variant]];\n  }\n  return null;\n};\nexport default getLogo;\n`;
  fs.writeFileSync(UTILS_FILE, output, "utf8");
  console.log(`Resolver refreshed from ${Object.keys(fileLogos).length} valid local crest files.`);
}

async function main() {
  console.log("NexusBet: checking local club crests. Existing valid images will not be replaced.");
  const results = [];
  for (let i = 0; i < TEAMS.length; i += 1) {
    const team = TEAMS[i];
    if (existingFor(team)) {
      console.log(`[${i + 1}/${TEAMS.length}] LOCAL  ${team}`);
      results.push({ team, status: "present" });
      continue;
    }
    const query = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(team)}`;
    const data = await request(query, true);
    const matches = Array.isArray(data?.teams) ? data.teams.filter(x => x?.strTeam && x?.strBadge) : [];
    const ranked = matches.map(x => ({ item: x, score: similarity(team, x.strTeam) })).sort((a,b) => b.score-a.score);
    const best = ranked[0];
    if (!best || best.score < 0.6) {
      console.log(`[${i + 1}/${TEAMS.length}] MISSING ${team} (no confident match)`);
      results.push({ team, status: "missing", note: "No confident team-name match from provider" });
      await sleep(250);
      continue;
    }
    const image = await request(best.item.strBadge, false);
    if (!image || image.body.length < 1000 || !(image.contentType.includes("image") || /<svg|\x89PNG/.test(image.body.subarray(0, 300).toString("latin1")))) {
      console.log(`[${i + 1}/${TEAMS.length}] MISSING ${team} (badge download failed)`);
      results.push({ team, status: "missing", note: "Badge download failed or image was invalid" });
      await sleep(250);
      continue;
    }
    const isSvg = image.contentType.includes("svg") || image.body.subarray(0, 300).toString("utf8").includes("<svg");
    const ext = isSvg ? ".svg" : ".png";
    const file = path.join(LOGOS_DIR, normalize(team) + ext);
    fs.writeFileSync(file, image.body);
    // If the resolver's reserved canonical path was .png but provider returned SVG, update all map references.
    if (isSvg) {
      const helper = fs.readFileSync(UTILS_FILE, "utf8");
      fs.writeFileSync(UTILS_FILE, helper.replaceAll(`/logos/${normalize(team)}.png`, `/logos/${normalize(team)}.svg`), "utf8");
    }
    console.log(`[${i + 1}/${TEAMS.length}] DOWNLOADED ${team} (${best.item.strTeam})`);
    results.push({ team, status: "downloaded", note: `matched provider team ${best.item.strTeam}` });
    await sleep(300);
  }
  refreshResolverFromLocalAssets();
  writeReport(results);
  console.log("\nImport finished. Review LEAGUE_CREST_IMPORT_REPORT.txt before deployment.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
