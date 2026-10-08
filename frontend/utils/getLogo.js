// Generated automatically for NexusBet
import fs from 'fs';

export const getLogo = (teamName) => {
  if (!teamName) return "/logos/default.svg";

  const slug = teamName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  // Checks for direct match in public folder or defaults
  return "/logos/" + slug + ".png";
};
