export const getLogo = (teamName) => {
  if (!teamName) return "/logos/default.svg";

  // Convert team name to lowercase and replace spaces/special characters with underscores
  const slug = teamName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `/logos/${slug}.svg`;
};