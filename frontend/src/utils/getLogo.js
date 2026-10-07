const ALIASES = {
  // Add mapping overrides here if the slug doesn't match the filename
  "barcelona": "barcelona", // change right side if file is fc_barcelona
  "leeds_united": "leeds_united", // change right side if file is leeds
  "leicester_city": "leicester_city", // change right side if file is leicester
  "valencia": "valencia",
  "fenerbahce": "fenerbahce",
  "kasimpasa": "kasimpasa",
};

export const getLogo = (teamName) => {
  if (!teamName) return "/logos/default.svg";

  let slug = teamName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
    
    
    
    

  if (ALIASES[slug]) {
    slug = ALIASES[slug];
  }

  return `/logos/${slug}.svg`;
};