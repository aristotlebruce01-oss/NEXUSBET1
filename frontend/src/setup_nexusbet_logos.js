const fs = require('fs');
const path = require('path');
const https = require('https');

// Target directories
const LOGOS_DIR = path.join(__dirname, '..', 'public', 'logos');
const UTILS_DIR = path.join(__dirname, 'src', 'utils');

// Ensure directories exist
if (!fs.existsSync(LOGOS_DIR)) fs.mkdirSync(LOGOS_DIR, { recursive: true });
if (!fs.existsSync(UTILS_DIR)) fs.mkdirSync(UTILS_DIR, { recursive: true });

// List of all 194 teams
const TEAMS = [
  // Premier League
  "Arsenal FC", "Aston Villa FC", "AFC Bournemouth", "Brentford FC", "Brighton & Hove Albion FC",
  "Chelsea FC", "Crystal Palace FC", "Everton FC", "Fulham FC", "Ipswich Town FC",
  "Leicester City FC", "Liverpool FC", "Manchester City FC", "Manchester United FC", "Newcastle United FC",
  "Nottingham Forest FC", "Southampton FC", "Tottenham Hotspur FC", "West Ham United FC", "Wolverhampton Wanderers FC",

  // LaLiga
  "Athletic Bilbao", "Atlético Madrid", "FC Barcelona", "RC Celta de Vigo", "RCD Espanyol",
  "Getafe CF", "Girona FC", "UD Las Palmas", "CD Leganés", "RCD Mallorca",
  "CA Osasuna", "Rayo Vallecano", "Real Betis", "Real Madrid CF", "Real Sociedad",
  "Sevilla FC", "Valencia CF", "Real Valladolid", "Villarreal CF", "Deportivo Alavés",

  // Bundesliga
  "FC Augsburg", "Bayer 04 Leverkusen", "FC Bayern München", "VfL Bochum", "Borussia Dortmund",
  "Borussia Mönchengladbach", "Eintracht Frankfurt", "FC St. Pauli", "SC Freiburg", "1. FC Heidenheim",
  "TSG 1899 Hoffenheim", "Holstein Kiel", "1. FSV Mainz 05", "RB Leipzig", "VfB Stuttgart",
  "1. FC Union Berlin", "SV Werder Bremen", "VfL Wolfsburg",

  // Serie A
  "Atalanta BC", "Bologna FC 1909", "Cagliari Calcio", "Como 1907", "Empoli FC",
  "ACF Fiorentina", "Genoa CFC", "FC Internazionale Milano", "Juventus FC", "SS Lazio",
  "US Lecce", "AC Milan", "AC Monza", "SSC Napoli", "Parma Calcio 1913",
  "AS Roma", "Torino FC", "Udinese Calcio", "Venezia FC", "Hellas Verona FC",

  // Liga Portugal
  "FC Arouca", "AVS Futebol SAD", "SL Benfica", "Boavista FC", "SC Braga",
  "Casa Pia AC", "GD Estoril Praia", "CF Estrela da Amadora", "FC Famalicão", "SC Farense",
  "Gil Vicente FC", "Moreirense FC", "CD Nacional", "FC Porto", "Rio Ave FC",
  "CD Santa Clara", "Sporting CP", "Vitória SC",

  // Eredivisie
  "AFC Ajax", "AZ Alkmaar", "Feyenoord", "Fortuna Sittard", "Go Ahead Eagles",
  "FC Groningen", "SC Heerenveen", "Heracles Almelo", "NAC Breda", "NEC Nijmegen",
  "PEC Zwolle", "PSV Eindhoven", "RKC Waalwijk", "Sparta Rotterdam", "FC Twente",
  "FC Utrecht", "Willem II", "Almere City FC",

  // Scottish Premiership
  "Aberdeen FC", "Celtic FC", "Dundee FC", "Dundee United FC", "Heart of Midlothian FC",
  "Hibernian FC", "Kilmarnock FC", "Motherwell FC", "Rangers FC", "Ross County FC",
  "St Johnstone FC", "St Mirren FC",

  // Türkiye Süper Lig
  "Adana Demirspor", "Alanyaspor", "Antalyaspor", "Beşiktaş JK", "Bodrum FK",
  "Çaykur Rizespor", "Eyüpspor", "Fenerbahçe SK", "Galatasaray SK", "Gaziantep FK",
  "Göztepe SK", "Hatayspor", "İstanbul Başakşehir", "Kasımpaşaspor", "Kayserispor",
  "Konyaspor", "Samsunspor", "Sivasspor", "Trabzonspor",

  // Greece Super League
  "AEK Athens FC", "Aris Thessaloniki FC", "Asteras Tripolis FC", "Atromitos FC", "Athens Kallithea FC",
  "PAS Lamia 1964", "Levadiakos FC", "OFI Crete FC", "Olympiacos FC", "Panetolikos FC",
  "Panathinaikos FC", "Panserraikos FC", "PAOK FC", "Volos NFC",

  // Belgium Pro League
  "RSC Anderlecht", "K Beerschot VA", "Cercle Brugge KSV", "R Charleroi SC", "Club Brugge KV",
  "FC Dender", "KRC Genk", "KAA Gent", "KV Kortrijk", "OH Leuven",
  "KV Mechelen", "Royal Antwerp FC", "STVV", "Standard Liège", "Royale Union Saint-Gilloise", "KVC Westerlo",

  // Ligue 1
  "Angers SCO", "AJ Auxerre", "Stade Brestois 29", "Le Havre AC", "RC Lens",
  "LOSC Lille", "Olympique Lyonnais", "Olympique de Marseille", "AS Monaco FC", "Montpellier HSC",
  "FC Nantes", "OGC Nice", "Paris Saint-Germain FC", "Stade de Reims", "Stade Rennais FC",
  "AS Saint-Étienne", "RC Strasbourg Alsace", "Toulouse FC"
];

// Fallback shield SVG
const DEFAULT_SHIELD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6B7280" width="64" height="64"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8s0 .01 0 .01z"/></svg>`;
fs.writeFileSync(path.join(LOGOS_DIR, 'default.svg'), DEFAULT_SHIELD);

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
    const options = { headers: { 'User-Agent': 'NexusBetLogoImporter/1.0 (contact@nexusbet.app)' } };
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
    const options = { headers: { 'User-Agent': 'NexusBetLogoImporter/1.0 (contact@nexusbet.app)' } };
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

async function searchWikipediaImage(teamName) {
  // Query English Wikipedia page images API for official article image
  const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(teamName)}&prop=pageimages|images&pithumbsize=500&format=json`;
  const pageData = await fetchJson(pageUrl);
  
  if (!pageData?.query?.pages) return null;
  const pageKey = Object.keys(pageData.query.pages)[0];
  const page = pageData.query.pages[pageKey];

  if (page?.thumbnail?.source) {
    return page.thumbnail.source;
  }

  // Fallback search directly on Wikimedia Commons
  const query = encodeURIComponent(`${teamName} logo svg`);
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${query}&srnamespace=6&format=json`;
  const searchData = await fetchJson(apiUrl);

  if (searchData?.query?.search?.length > 0) {
    const fileTitle = searchData.query.search[0].title;
    const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&format=json`;
    const infoData = await fetchJson(imageInfoUrl);
    const pages = infoData?.query?.pages;
    const pKey = pages ? Object.keys(pages)[0] : null;
    return pages?.[pKey]?.imageinfo?.[0]?.url || null;
  }

  return null;
}

async function findAndDownloadLogo(teamName) {
  const slug = sanitizeSlug(teamName);
  const filePath = path.join(LOGOS_DIR, `${slug}.svg`);

  // Check if real SVG already downloaded (ignore fallback default shields from previous runs)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.includes('fill="#6B7280"')) {
      console.log(`[EXISTS] ${slug}.svg`);
      return;
    }
  }

  const imageUrl = await searchWikipediaImage(teamName);

  if (imageUrl) {
    const success = await downloadFile(imageUrl, filePath);
    if (success) {
      console.log(`[DOWNLOADED] ${slug}.svg`);
      return;
    }
  }

  console.warn(`[NOT FOUND] Set fallback shield for: ${teamName}`);
  fs.writeFileSync(filePath, DEFAULT_SHIELD);
}

async function run() {
  console.log("Starting enhanced logo import...");

  for (const team of TEAMS) {
    await findAndDownloadLogo(team);
    await sleep(350);
  }

  const helperCode = `// Generated automatically for NexusBet
export const getLogo = (teamName) => {
  if (!teamName) return "/logos/default.svg";

  const slug = teamName
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return "/logos/" + slug + ".svg";
};
`;

  fs.writeFileSync(path.join(UTILS_DIR, 'getLogo.js'), helperCode);
  console.log("Process completed!");
}

run();