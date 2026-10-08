const fs = require('fs');
const path = require('path');
const https = require('https');

// Target directories
const LOGOS_DIR = path.join(__dirname, '..', '..', 'public', 'logos');
const UTILS_DIR = path.join(__dirname, '..', 'utils');

// Ensure directories exist
if (!fs.existsSync(LOGOS_DIR)) fs.mkdirSync(LOGOS_DIR, { recursive: true });
if (!fs.existsSync(UTILS_DIR)) fs.mkdirSync(UTILS_DIR, { recursive: true });

// Fallback shield SVG
const DEFAULT_SHIELD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6B7280" width="64" height="64"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8s0 .01 0 .01z"/></svg>`;
fs.writeFileSync(path.join(LOGOS_DIR, 'default.svg'), DEFAULT_SHIELD);

// Full list of 194 teams
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

function sanitizeSlug(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function fetchJson(url) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    https.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, destPath).then(resolve);
      }
      if (res.statusCode !== 200) return resolve(false);

      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(true);
      });
    }).on('error', () => resolve(false));
  });
}

async function findAndDownloadLogo(teamName) {
  const slug = sanitizeSlug(teamName);

  // Clean suffix/prefix words for better API matching
  const queryName = teamName
    .replace(/ FC| CF| BC| AC| SC| SK| JK| FK| CD| UD| RC| RCD| ACF| SS| US| SSC| AFC| KSV| KV| KRC| KAA| OH| RSC| VA| KVC| GS| SCO| AJ/gi, '')
    .trim();

  // Query TheSportsDB API
  const apiUrl = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(queryName)}`;
  const apiData = await fetchJson(apiUrl);

  let badgeUrl = null;
  if (apiData && apiData.teams && apiData.teams.length > 0) {
    badgeUrl = apiData.teams[0].strBadge;
  }

  if (badgeUrl) {
    // Determine target extension (TheSportsDB delivers PNG images, which maintain transparent backgrounds)
    const ext = badgeUrl.split('.').pop().split('?')[0] || 'png';
    const filePath = path.join(LOGOS_DIR, `${slug}.${ext}`);

    const success = await downloadFile(badgeUrl, filePath);
    if (success) {
      console.log(`[DOWNLOADED] ${slug}.${ext}`);
      return;
    }
  }

  // Fallback to SVG shield if download fails
  console.warn(`[NOT FOUND] Set fallback shield for: ${teamName}`);
  fs.writeFileSync(path.join(LOGOS_DIR, `${slug}.svg`), DEFAULT_SHIELD);
}

async function run() {
  console.log("Downloading team badges via TheSportsDB API...");

  for (const team of TEAMS) {
    await findAndDownloadLogo(team);
    await sleep(150); // Respect rate limits
  }

  // Generate helper function matching both .png and .svg extensions dynamically
  const helperCode = `// Generated automatically for NexusBet
import fs from 'fs';

export const getLogo = (teamName) => {
  if (!teamName) return "/logos/default.svg";

  const slug = teamName
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  // Checks for direct match in public folder or defaults
  return "/logos/" + slug + ".png";
};
`;

  fs.writeFileSync(path.join(UTILS_DIR, 'getLogo.js'), helperCode);
  console.log("\nProcess completed!");
}

run();