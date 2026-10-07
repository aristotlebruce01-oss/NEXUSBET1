// Generated automatically for NexusBet
const SUPPORTED_SLUGS = new Set(["arsenal","aston_villa","bournemouth","brentford","brighton_hove_albion","chelsea","crystal_palace","everton","fulham","ipswich_town","leicester_city","liverpool","manchester_city","manchester_united","newcastle_united","nottingham_forest","southampton","tottenham_hotspur","west_ham_united","wolverhampton_wanderers","athletic_bilbao","atletico_madrid","barcelona","celta_vigo","espanyol","getafe","girona","las_palmas","leganes","mallorca","osasuna","rayo_vallecano","real_betis","real_madrid","real_sociedad","sevilla","valencia","real_valladolid","villarreal","alaves","augsburg","bayer_leverkusen","bayern_munich","bochum","borussia_dortmund","borussia_monchengladbach","eintracht_frankfurt","fc_st_pauli","freiburg","heidenheim","hoffenheim","holstein_kiel","mainz_05","rb_leipzig","stuttgart","union_berlin","werder_bremen","wolfsburg","atalanta","bologna","cagliari","como","empoli","fiorentina","genoa","inter_milan","juventus","lazio","lecce","ac_milan","monza","napoli","parma","roma","torino","udinese","venezia","verona","arouca","avs","benfica","boavista","braga","casa_pia","estoril","estrela_da_amadora","famalicao","farense","gil_vicente","moreirense","nacional","porto","rio_ave","santa_clara","sporting_cp","vitoria_de_guimaraes","ajax","az_alkmaar","feyenoord","fortuna_sittard","go_ahead_eagles","groningen","heerenveen","heracles_almelo","nac_breda","nec_nijmegen","pec_zwolle","psv_eindhoven","rkc_waalwijk","sparta_rotterdam","twente","utrecht","willem_ii","almere_city","aberdeen","celtic","dundee","dundee_united","hearts","hibernian","kilmarnock","motherwell","rangers","ross_county","st_johnstone","st_mirren","adana_demirspor","alanyaspor","antalyaspor","besiktas","bodrum","rizespor","eyupspor","fenerbahce","galatasaray","gaziantep","goztepe","hatayspor","basaksehir","kas_mpasa","kayserispor","konyaspor","samsunspor","sivasspor","trabzonspor","aek_athens","aris_thessaloniki","asteras_tripolis","atromitos","athens_kallithea","lamia","levadiakos","ofi","olympiacos","panetolikos","panathinaikos","panserraikos","paok","volos","anderlecht","beerschot","cercle_brugge","charleroi","club_brugge","dender","genk","gent","kortrijk","oh_leuven","mechelen","antwerp","sint_truiden","standard_liege","union_sg","westerlo","angers","auxerre","brest","le_havre","lens","lille","lyon","marseille","monaco","montpellier","nantes","nice","paris_saint_germain","reims","rennes","saint_etienne","strasbourg","toulouse"]);

export const getTeamLogo = (teamName) => {
  if (!teamName) return "/logos/default.svg";

  const slug = teamName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  if (!SUPPORTED_SLUGS.has(slug)) {
    return "/logos/default.svg";
  }

  return `/logos/${slug}.svg`;
};
