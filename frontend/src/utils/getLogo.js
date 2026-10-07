export const getLogo = (teamName) => {
  if (!teamName) return "/logos/default.svg";

  // Convert team name to lowercase and replace spaces/special characters with hyphens
  const slug = teamName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `/logos/${slug}.svg`;
};