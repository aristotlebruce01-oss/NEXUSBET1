// These are the crest files that are actually packaged in public/logos.
// Keeping this allow-list prevents the UI from ever trying to fetch a
// non-existent/remote crest and then flashing to the generic shield.
const LOCAL_LOGOS = new Set([
  "ac_milan", "aek_athens", "ajax", "arsenal", "barcelona",
  "bayern_munich", "bayer_leverkusen", "benfica", "bochum",
  "borussia_dortmund", "bournemouth", "braga", "brentford", "brest",
  "cagliari", "celta_vigo", "chelsea", "club_brugge", "everton",
  "freiburg", "fulham", "heidenheim", "inter_milan", "ipswich_town",
  "lazio", "manchester_city", "montpellier", "newcastle_united", "nice",
  "paris_saint_germain", "psv_eindhoven", "rangers", "rb_leipzig",
  "real_madrid", "real_sociedad", "roma", "sevilla", "southampton",
  "tottenham_hotspur", "udinese", "union_berlin", "valencia",
  "west_ham_united", "wolverhampton_wanderers"
]);

const ALIASES = {
  "ac_milan": "ac_milan",
  "afc_bournemouth": "bournemouth",
  "bournemouth": "bournemouth",
  "fc_barcelona": "barcelona",
  "barcelona": "barcelona",
  "celta": "celta_vigo",
  "athletico_madrid": "atletico_madrid",
  "atletico_madrid": "atletico_madrid",
  "athletic_bilbao": "athletic_bilbao",
  "bayern_munich": "bayern_munich",
  "inter": "inter_milan",
  "internazionale": "inter_milan",
  "inter_milan": "inter_milan",
  "manchester_city": "manchester_city",
  "psg": "paris_saint_germain",
  "paris_sg": "paris_saint_germain",
  "real_madrid": "real_madrid",
  "valencia": "valencia",
  "valencia_cf": "valencia",
  "west_ham": "west_ham_united",
  "west_ham_united": "west_ham_united",
  "wolverhampton": "wolverhampton_wanderers",
  "wolverhampton_wanderers": "wolverhampton_wanderers",
  "tottenham": "tottenham_hotspur",
  "tottenham_hotspur": "tottenham_hotspur",
  "ipswich": "ipswich_town",
  "ipswich_town": "ipswich_town",
  "newcastle": "newcastle_united",
  "newcastle_united": "newcastle_united",
  "manchester_city": "manchester_city",
  "real_sociedad": "real_sociedad",
  "rb_leipzig": "rb_leipzig",
  "paris_saint_germain": "paris_saint_germain",
};

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export const getLogo = (teamName) => {
  const normalized = normalize(teamName);
  if (!normalized) return "/logos/default.svg";

  const slug = ALIASES[normalized] || normalized;
  return LOCAL_LOGOS.has(slug) ? `/logos/${slug}.svg` : "/logos/default.svg";
};

export default getLogo;
