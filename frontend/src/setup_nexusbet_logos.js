const fs = require('fs');
const path = require('path');
const https = require('https');

// Target directory inside public/
const LOGOS_DIR = path.join(__dirname, 'public', 'logos');
const UTILS_DIR = path.join(__dirname, 'src', 'utils');

// Ensure directories exist
if (!fs.existsSync(LOGOS_DIR)) fs.mkdirSync(LOGOS_DIR, { recursive: true });
if (!fs.existsSync(UTILS_DIR)) fs.mkdirSync(UTILS_DIR, { recursive: true });

// 194 Teams & Crest URLs
const TEAM_CRESTS = {
  // Premier League
  "Arsenal": "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
  "Aston Villa": "https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282024%29.svg",
  "Bournemouth": "https://upload.wikimedia.org/wikipedia/en/e/e5/AFC_Bournemouth_%282013%29.svg",
  "Brentford": "https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg",
  "Brighton & Hove Albion": "https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg",
  "Chelsea": "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
  "Crystal Palace": "https://upload.wikimedia.org/wikipedia/en/a/a2/Crystal_Palace_FC_logo_%282022%29.svg",
  "Everton": "https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg",
  "Fulham": "https://upload.wikimedia.org/wikipedia/en/e/eb/Fulham_FC_%28shield%29.svg",
  "Ipswich Town": "https://upload.wikimedia.org/wikipedia/en/4/43/Ipswich_Town.svg",
  "Leicester City": "https://upload.wikimedia.org/wikipedia/en/2/2d/Leicester_City_crest.svg",
  "Liverpool": "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
  "Manchester City": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
  "Manchester United": "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg",
  "Newcastle United": "https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg",
  "Nottingham Forest": "https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_logo.svg",
  "Southampton": "https://upload.wikimedia.org/wikipedia/en/c/c9/FC_Southampton.svg",
  "Tottenham Hotspur": "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg",
  "West Ham United": "https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg",
  "Wolverhampton Wanderers": "https://upload.wikimedia.org/wikipedia/en/c/c9/Wolverhampton_Wanderers_FC_crest.svg",

  // LaLiga
  "Athletic Bilbao": "https://upload.wikimedia.org/wikipedia/en/7/73/Athletic_Club_logo.svg",
  "Atlético Madrid": "https://upload.wikimedia.org/wikipedia/en/c/c1/Atletico_Madrid_logo_%282024%29.svg",
  "Barcelona": "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
  "Celta Vigo": "https://upload.wikimedia.org/wikipedia/en/1/12/RC_Celta_de_Vigo_logo.svg",
  "Espanyol": "https://upload.wikimedia.org/wikipedia/en/d/d6/RCD_Espanyol_logo.svg",
  "Getafe": "https://upload.wikimedia.org/wikipedia/en/7/7f/Getafe_CF_logo.svg",
  "Girona": "https://upload.wikimedia.org/wikipedia/en/9/90/Girona_FC_logo.svg",
  "Las Palmas": "https://upload.wikimedia.org/wikipedia/en/3/30/UD_Las_Palmas_logo.svg",
  "Leganés": "https://upload.wikimedia.org/wikipedia/en/0/02/CD_Legan%C3%A9s_logo.svg",
  "Mallorca": "https://upload.wikimedia.org/wikipedia/en/e/e0/RCD_Mallorca_logo.svg",
  "Osasuna": "https://upload.wikimedia.org/wikipedia/en/d/db/CA_Osasuna_logo.svg",
  "Rayo Vallecano": "https://upload.wikimedia.org/wikipedia/en/1/17/Rayo_Vallecano_logo.svg",
  "Real Betis": "https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg",
  "Real Madrid": "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
  "Real Sociedad": "https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg",
  "Sevilla": "https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg",
  "Valencia": "https://upload.wikimedia.org/wikipedia/en/c/ce/Valenciacf.svg",
  "Real Valladolid": "https://upload.wikimedia.org/wikipedia/en/6/6e/Real_Valladolid_logo.svg",
  "Villarreal": "https://upload.wikimedia.org/wikipedia/en/7/70/Villarreal_CF_logo.svg",
  "Alavés": "https://upload.wikimedia.org/wikipedia/en/2/2e/Deportivo_Alaves_logo.svg",

  // Bundesliga
  "Augsburg": "https://upload.wikimedia.org/wikipedia/en/c/c5/FC_Augsburg_logo.svg",
  "Bayer Leverkusen": "https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg",
  "Bayern Munich": "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg",
  "Bochum": "https://upload.wikimedia.org/wikipedia/commons/7/72/VfL_Bochum_logo.svg",
  "Borussia Dortmund": "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg",
  "Borussia Mönchengladbach": "https://upload.wikimedia.org/wikipedia/commons/8/81/Borussia_M%C3%B6nchengladbach_logo.svg",
  "Eintracht Frankfurt": "https://upload.wikimedia.org/wikipedia/commons/0/04/Eintracht_Frankfurt_Logo.svg",
  "FC St. Pauli": "https://upload.wikimedia.org/wikipedia/en/8/8c/FC_St._Pauli_logo.svg",
  "Freiburg": "https://upload.wikimedia.org/wikipedia/en/6/6d/SC_Freiburg_logo.svg",
  "Heidenheim": "https://upload.wikimedia.org/wikipedia/commons/9/9d/1._FC_Heidenheim_1846.svg",
  "Hoffenheim": "https://upload.wikimedia.org/wikipedia/commons/e/e7/TSG_1899_Hoffenheim_logo.svg",
  "Holstein Kiel": "https://upload.wikimedia.org/wikipedia/commons/3/30/Holstein_Kiel_Logo.svg",
  "Mainz 05": "https://upload.wikimedia.org/wikipedia/commons/0/0b/FSV_Mainz_05_Logo.svg",
  "RB Leipzig": "https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg",
  "Stuttgart": "https://upload.wikimedia.org/wikipedia/commons/e/eb/VfB_Stuttgart_1893_Logo.svg",
  "Union Berlin": "https://upload.wikimedia.org/wikipedia/commons/4/44/1._FC_Union_Berlin_Logo.svg",
  "Werder Bremen": "https://upload.wikimedia.org/wikipedia/commons/b/be/SV-Werder-Bremen-Logo.svg",
  "Wolfsburg": "https://upload.wikimedia.org/wikipedia/commons/c/ce/VfL_Wolfsburg_Logo.svg",

  // Serie A
  "Atalanta": "https://upload.wikimedia.org/wikipedia/en/6/66/Atalanta_BC_logo.svg",
  "Bologna": "https://upload.wikimedia.org/wikipedia/en/5/5b/Bologna_FC_1909_logo.svg",
  "Cagliari": "https://upload.wikimedia.org/wikipedia/en/6/61/Cagliari_Calcio_1920.svg",
  "Como": "https://upload.wikimedia.org/wikipedia/en/7/7d/Como_1907_logo.svg",
  "Empoli": "https://upload.wikimedia.org/wikipedia/en/a/a3/Empoli_FC_logo.svg",
  "Fiorentina": "https://upload.wikimedia.org/wikipedia/commons/7/79/ACF_Fiorentina_2022.svg",
  "Genoa": "https://upload.wikimedia.org/wikipedia/en/6/6c/Genoa_C.F.C._logo.svg",
  "Inter Milan": "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg",
  "Juventus": "https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg",
  "Lazio": "https://upload.wikimedia.org/wikipedia/en/c/ce/S.S._Lazio_badge.svg",
  "Lecce": "https://upload.wikimedia.org/wikipedia/en/a/a7/US_Lecce_logo.svg",
  "AC Milan": "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg",
  "Monza": "https://upload.wikimedia.org/wikipedia/en/2/2e/AC_Monza_logo.svg",
  "Napoli": "https://upload.wikimedia.org/wikipedia/commons/2/28/SSC_Napoli_2024_%28deep_blue%29.svg",
  "Parma": "https://upload.wikimedia.org/wikipedia/en/a/a9/Parma_Calcio_1913_logo.svg",
  "Roma": "https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg",
  "Torino": "https://upload.wikimedia.org/wikipedia/en/2/2e/Torino_FC_logo.svg",
  "Udinese": "https://upload.wikimedia.org/wikipedia/en/c/ce/Udinese_Calcio_logo.svg",
  "Venezia": "https://upload.wikimedia.org/wikipedia/en/4/4c/Venezia_FC_logo.svg",
  "Verona": "https://upload.wikimedia.org/wikipedia/en/9/92/Hellas_Verona_FC_logo.svg",

  // Liga Portugal
  "Arouca": "https://upload.wikimedia.org/wikipedia/en/b/b4/FC_Arouca_logo.svg",
  "AVS": "https://upload.wikimedia.org/wikipedia/en/2/21/AVS_Futebol_SAD_logo.svg",
  "Benfica": "https://upload.wikimedia.org/wikipedia/en/a/a2/SL_Benfica_logo.svg",
  "Boavista": "https://upload.wikimedia.org/wikipedia/en/4/40/Boavista_FC_logo.svg",
  "Braga": "https://upload.wikimedia.org/wikipedia/en/7/79/S.C._Braga_logo.svg",
  "Casa Pia": "https://upload.wikimedia.org/wikipedia/en/8/8d/Casa_Pia_A.C._logo.svg",
  "Estoril": "https://upload.wikimedia.org/wikipedia/en/8/8c/G.D._Estoril_Praia_logo.svg",
  "Estrela da Amadora": "https://upload.wikimedia.org/wikipedia/en/0/08/C.F._Estrela_da_Amadora_logo.svg",
  "Famalicão": "https://upload.wikimedia.org/wikipedia/en/a/a3/FC_Famalic%C3%A3o_logo.svg",
  "Farense": "https://upload.wikimedia.org/wikipedia/en/1/1b/S.C._Farense_logo.svg",
  "Gil Vicente": "https://upload.wikimedia.org/wikipedia/en/c/c5/Gil_Vicente_FC_logo.svg",
  "Moreirense": "https://upload.wikimedia.org/wikipedia/en/a/a0/Moreirense_F.C._logo.svg",
  "Nacional": "https://upload.wikimedia.org/wikipedia/en/3/3d/C.D._Nacional_logo.svg",
  "Porto": "https://upload.wikimedia.org/wikipedia/en/f/f1/FC_Porto_logo.svg",
  "Rio Ave": "https://upload.wikimedia.org/wikipedia/en/c/c5/Rio_Ave_FC_logo.svg",
  "Santa Clara": "https://upload.wikimedia.org/wikipedia/en/8/8b/C.D._Santa_Clara_logo.svg",
  "Sporting CP": "https://upload.wikimedia.org/wikipedia/en/1/18/Sporting_CP_logo.svg",
  "Vitoria de Guimaraes": "https://upload.wikimedia.org/wikipedia/en/a/a8/Vit%C3%B3ria_S.C._logo.svg",

  // Eredivisie
  "Ajax": "https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg",
  "AZ Alkmaar": "https://upload.wikimedia.org/wikipedia/commons/e/e0/AZ_Alkmaar_Logo.svg",
  "Feyenoord": "https://upload.wikimedia.org/wikipedia/en/e/e3/Feyenoord_logo.svg",
  "Fortuna Sittard": "https://upload.wikimedia.org/wikipedia/en/a/a4/Fortuna_Sittard_logo.svg",
  "Go Ahead Eagles": "https://upload.wikimedia.org/wikipedia/en/7/77/Go_Ahead_Eagles_logo.svg",
  "Groningen": "https://upload.wikimedia.org/wikipedia/en/a/a7/FC_Groningen_logo.svg",
  "Heerenveen": "https://upload.wikimedia.org/wikipedia/en/1/1d/SC_Heerenveen_logo.svg",
  "Heracles Almelo": "https://upload.wikimedia.org/wikipedia/en/c/c4/Heracles_Almelo_logo.svg",
  "NAC Breda": "https://upload.wikimedia.org/wikipedia/en/d/d4/NAC_Breda_logo.svg",
  "NEC Nijmegen": "https://upload.wikimedia.org/wikipedia/en/b/b3/N.E.C._Nijmegen_logo.svg",
  "PEC Zwolle": "https://upload.wikimedia.org/wikipedia/en/3/36/PEC_Zwolle_logo.svg",
  "PSV Eindhoven": "https://upload.wikimedia.org/wikipedia/en/0/05/PSV_Eindhoven.svg",
  "RKC Waalwijk": "https://upload.wikimedia.org/wikipedia/en/1/19/RKC_Waalwijk_logo.svg",
  "Sparta Rotterdam": "https://upload.wikimedia.org/wikipedia/en/9/90/Sparta_Rotterdam_logo.svg",
  "Twente": "https://upload.wikimedia.org/wikipedia/en/e/e3/FC_Twente_logo.svg",
  "Utrecht": "https://upload.wikimedia.org/wikipedia/en/7/79/FC_Utrecht_logo.svg",
  "Willem II": "https://upload.wikimedia.org/wikipedia/en/0/0d/Willem_II_logo.svg",
  "Almere City": "https://upload.wikimedia.org/wikipedia/en/3/3b/Almere_City_FC_logo.svg",

  // Scottish Premiership
  "Aberdeen": "https://upload.wikimedia.org/wikipedia/en/2/22/Aberdeen_FC_logo.svg",
  "Celtic": "https://upload.wikimedia.org/wikipedia/en/3/39/Celtic_FC_crest.svg",
  "Dundee": "https://upload.wikimedia.org/wikipedia/en/7/76/Dundee_F.C._logo.svg",
  "Dundee United": "https://upload.wikimedia.org/wikipedia/en/2/25/Dundee_United_FC_logo.svg",
  "Hearts": "https://upload.wikimedia.org/wikipedia/en/9/98/Heart_of_Midlothian_FC_crest.svg",
  "Hibernian": "https://upload.wikimedia.org/wikipedia/en/0/02/Hibernian_FC_logo.svg",
  "Kilmarnock": "https://upload.wikimedia.org/wikipedia/en/0/08/Kilmarnock_FC_logo.svg",
  "Motherwell": "https://upload.wikimedia.org/wikipedia/en/3/30/Motherwell_FC_logo.svg",
  "Rangers": "https://upload.wikimedia.org/wikipedia/en/4/43/Rangers_FC.svg",
  "Ross County": "https://upload.wikimedia.org/wikipedia/en/0/00/Ross_County_FC_logo.svg",
  "St Johnstone": "https://upload.wikimedia.org/wikipedia/en/1/1a/St_Johnstone_FC_logo.svg",
  "St Mirren": "https://upload.wikimedia.org/wikipedia/en/f/f2/St_Mirren_FC_logo.svg",

  // Türkiye Süper Lig
  "Adana Demirspor": "https://upload.wikimedia.org/wikipedia/en/c/c2/Adana_Demirspor_logo.svg",
  "Alanyaspor": "https://upload.wikimedia.org/wikipedia/en/8/87/Alanyaspor_logo.svg",
  "Antalyaspor": "https://upload.wikimedia.org/wikipedia/en/b/b9/Antalyaspor_logo.svg",
  "Beşiktaş": "https://upload.wikimedia.org/wikipedia/commons/2/20/Besiktas_JK_logo.svg",
  "Bodrum": "https://upload.wikimedia.org/wikipedia/en/1/16/Bodrum_FK_logo.svg",
  "Rizespor": "https://upload.wikimedia.org/wikipedia/en/d/df/%C3%87aykur_Rizespor_logo.svg",
  "Eyüpspor": "https://upload.wikimedia.org/wikipedia/en/e/eb/Ey%C3%BCpspor_logo.svg",
  "Fenerbahçe": "https://upload.wikimedia.org/wikipedia/en/3/39/Fenerbah%C3%A7e_SK_logo.svg",
  "Galatasaray": "https://upload.wikimedia.org/wikipedia/commons/3/37/Galatasaray_Star_Logo.svg",
  "Gaziantep": "https://upload.wikimedia.org/wikipedia/en/4/4b/Gaziantep_FK_logo.svg",
  "Göztepe": "https://upload.wikimedia.org/wikipedia/en/2/29/G%C3%B6ztepe_S.K._logo.svg",
  "Hatayspor": "https://upload.wikimedia.org/wikipedia/en/6/60/Hatayspor_logo.svg",
  "Başakşehir": "https://upload.wikimedia.org/wikipedia/en/0/0a/Istanbul_Basaksehir_logo.svg",
  "Kasımpaşa": "https://upload.wikimedia.org/wikipedia/en/2/27/Kas%C4%B1mpa%C5%9Fa_SK_logo.svg",
  "Kayserispor": "https://upload.wikimedia.org/wikipedia/en/9/90/Kayserispor_logo.svg",
  "Konyaspor": "https://upload.wikimedia.org/wikipedia/en/e/e0/Konyaspor_logo.svg",
  "Samsunspor": "https://upload.wikimedia.org/wikipedia/en/9/9f/Samsunspor_logo.svg",
  "Sivasspor": "https://upload.wikimedia.org/wikipedia/en/c/ca/Sivasspor_logo.svg",
  "Trabzonspor": "https://upload.wikimedia.org/wikipedia/en/d/d7/Trabzonspor_logo.svg",

  // Greece Super League
  "AEK Athens": "https://upload.wikimedia.org/wikipedia/en/0/04/AEK_Athens_FC_logo.svg",
  "Aris Thessaloniki": "https://upload.wikimedia.org/wikipedia/en/8/8f/Aris_Thessaloniki_FC_logo.svg",
  "Asteras Tripolis": "https://upload.wikimedia.org/wikipedia/en/3/34/Asteras_Tripolis_FC_logo.svg",
  "Atromitos": "https://upload.wikimedia.org/wikipedia/en/9/9d/Atromitos_FC_logo.svg",
  "Athens Kallithea": "https://upload.wikimedia.org/wikipedia/en/3/31/Athens_Kallithea_FC_logo.svg",
  "Lamia": "https://upload.wikimedia.org/wikipedia/en/a/a2/PAS_Lamia_1964_logo.svg",
  "Levadiakos": "https://upload.wikimedia.org/wikipedia/en/a/a6/Levadiakos_FC_logo.svg",
  "OFI": "https://upload.wikimedia.org/wikipedia/en/8/8c/OFI_Crete_FC_logo.svg",
  "Olympiacos": "https://upload.wikimedia.org/wikipedia/en/f/f1/Olympiacos_FC_logo.svg",
  "Panetolikos": "https://upload.wikimedia.org/wikipedia/en/f/f2/Panetolikos_FC_logo.svg",
  "Panathinaikos": "https://upload.wikimedia.org/wikipedia/en/1/12/Panathinaikos_FC_logo.svg",
  "Panserraikos": "https://upload.wikimedia.org/wikipedia/en/d/df/Panserraikos_FC_logo.svg",
  "PAOK": "https://upload.wikimedia.org/wikipedia/en/a/a9/PAOK_FC_logo.svg",
  "Volos": "https://upload.wikimedia.org/wikipedia/en/8/8e/Volos_NFC_logo.svg",

  // Belgium Pro League
  "Anderlecht": "https://upload.wikimedia.org/wikipedia/en/7/78/RSC_Anderlecht_logo.svg",
  "Beerschot": "https://upload.wikimedia.org/wikipedia/en/3/3d/K.Beerschot_V.A._logo.svg",
  "Cercle Brugge": "https://upload.wikimedia.org/wikipedia/en/9/91/Cercle_Brugge_KSV_logo.svg",
  "Charleroi": "https://upload.wikimedia.org/wikipedia/en/f/f7/R._Charleroi_S.C._logo.svg",
  "Club Brugge": "https://upload.wikimedia.org/wikipedia/en/d/d0/Club_Brugge_KV_logo.svg",
  "Dender": "https://upload.wikimedia.org/wikipedia/en/a/a1/FC_Vigor_Wuitens_Hamme_logo.svg",
  "Genk": "https://upload.wikimedia.org/wikipedia/en/f/f6/KRC_Genk_logo.svg",
  "Gent": "https://upload.wikimedia.org/wikipedia/en/f/f4/KAA_Gent_logo.svg",
  "Kortrijk": "https://upload.wikimedia.org/wikipedia/en/8/8d/KV_Kortrijk_logo.svg",
  "OH Leuven": "https://upload.wikimedia.org/wikipedia/en/9/9f/OH_Leuven_logo.svg",
  "Mechelen": "https://upload.wikimedia.org/wikipedia/en/d/d4/KV_Mechelen_logo.svg",
  "Antwerp": "https://upload.wikimedia.org/wikipedia/en/d/df/Royal_Antwerp_FC_logo.svg",
  "Sint-Truiden": "https://upload.wikimedia.org/wikipedia/en/a/a2/STVV_logo.svg",
  "Standard Liège": "https://upload.wikimedia.org/wikipedia/en/1/14/Standard_Li%C3%A8ge_logo.svg",
  "Union SG": "https://upload.wikimedia.org/wikipedia/en/a/ab/Royale_Union_Saint-Gilloise_logo.svg",
  "Westerlo": "https://upload.wikimedia.org/wikipedia/en/2/20/KVC_Westerlo_logo.svg",

  // Ligue 1
  "Angers": "https://upload.wikimedia.org/wikipedia/en/d/d4/Angers_SCO_logo.svg",
  "Auxerre": "https://upload.wikimedia.org/wikipedia/en/8/82/AJ_Auxerre_logo.svg",
  "Brest": "https://upload.wikimedia.org/wikipedia/en/0/05/Stade_Brestois_29_logo.svg",
  "Le Havre": "https://upload.wikimedia.org/wikipedia/en/3/38/Le_Havre_AC_logo.svg",
  "Lens": "https://upload.wikimedia.org/wikipedia/en/3/3c/RC_Lens_logo.svg",
  "Lille": "https://upload.wikimedia.org/wikipedia/en/6/6f/LOSC_Lille_logo.svg",
  "Lyon": "https://upload.wikimedia.org/wikipedia/en/c/c6/Olympique_Lyonnais_logo.svg",
  "Marseille": "https://upload.wikimedia.org/wikipedia/en/4/43/Olympique_de_Marseille_logo.svg",
  "Monaco": "https://upload.wikimedia.org/wikipedia/en/a/ba/AS_Monaco_FC_logo.svg",
  "Montpellier": "https://upload.wikimedia.org/wikipedia/en/a/a8/Montpellier_HSC_logo.svg",
  "Nantes": "https://upload.wikimedia.org/wikipedia/en/2/2b/FC_Nantes_logo.svg",
  "Nice": "https://upload.wikimedia.org/wikipedia/en/2/2e/OGC_Nice_logo.svg",
  "Paris Saint-Germain": "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg",
  "Reims": "https://upload.wikimedia.org/wikipedia/en/2/2e/Stade_de_Reims_logo.svg",
  "Rennes": "https://upload.wikimedia.org/wikipedia/en/9/9e/Stade_Rennais_FC_logo.svg",
  "Saint-Étienne": "https://upload.wikimedia.org/wikipedia/en/2/2c/AS_Saint-E%C3%B1ienne_logo.svg",
  "Strasbourg": "https://upload.wikimedia.org/wikipedia/en/8/80/RC_Strasbourg_Alsace_logo.svg",
  "Toulouse": "https://upload.wikimedia.org/wikipedia/en/8/8b/Toulouse_FC_logo.svg"
};

const slugify = (text) => 
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

// Create default fallback shield SVG
const DEFAULT_SHIELD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6B7280" width="64" height="64"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8s0 .01 0 .01z"/></svg>`;
fs.writeFileSync(path.join(LOGOS_DIR, 'default.svg'), DEFAULT_SHIELD);

// Download function
const options = { headers: { 'User-Agent': 'NexusBetInstaller/1.0' } };

// Function to download a single SVG with required headers to prevent rate limits
function downloadLogo(teamName, url) {
  return new Promise((resolve) => {
    const slug = teamName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");

    const filePath = path.join(LOGOS_DIR, `${slug}.svg`);

    // Skip if already downloaded
    if (fs.existsSync(filePath)) {
      return resolve();
    }

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NexusBetLogoDownloader/1.0'
      }
    };

    https.get(url, options, (res) => {
      // Handle HTTP Redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadLogo(teamName, res.headers.location).then(resolve);
      }

      if (res.statusCode !== 200) {
        console.error(`[FAIL ${res.statusCode}] Could not fetch: ${teamName}`);
        return resolve();
      }

      const fileStream = fs.createWriteStream(filePath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`[DOWNLOADED] ${slug}.svg`);
        resolve();
      });
    }).on('error', (err) => {
      console.error(`[ERROR] ${teamName}: ${err.message}`);
      resolve();
    });
  });
}

async function run() {
  console.log("Starting download for all 194 team crests...");
  
  // Download logos sequentially with a 150ms delay to avoid Wikimedia bans
  for (const [team, url] of Object.entries(TEAM_CRESTS)) {
    await downloadLogo(team, url);
    await new Promise((r) => setTimeout(r, 150));
  }

  // Regenerate getLogo.js utility without whitelist restrictions
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
  console.log("Finished downloading all logos and creating getLogo.js!");
}

run();