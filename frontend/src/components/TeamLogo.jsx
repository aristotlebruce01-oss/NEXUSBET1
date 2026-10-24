import React from "react";
import { getLogo } from "../utils/getLogo";

/**
 * Static team crest renderer.
 *
 * IMPORTANT: supported crests are served from /public/logos only.
 * No remote URL rotation/fallback is used, so the crest cannot blink
 * because of network loading or repeated React state changes.
 */
const TeamLogo = ({
  name,
  teamName,
  logoUrl,
  size,
  className = "w-6 h-6 inline-block",
}) => {
  const team = teamName || name || "";

  // Only accept an explicitly supplied LOCAL logo path. Never use an
  // external logo URL here because external loading was contributing to
  // the unstable/blinking behaviour.
  const localProvidedLogo =
    typeof logoUrl === "string" && logoUrl.startsWith("/logos/")
      ? logoUrl
      : null;

  const src = localProvidedLogo || getLogo(team);
  const numericSize = Number(size);
  const style = Number.isFinite(numericSize) && numericSize > 0
    ? { width: numericSize, height: numericSize, flexShrink: 0 }
    : { flexShrink: 0 };

  return (
    <img
      src={src}
      alt={team || "Team Logo"}
      className={className}
      style={style}
      width={Number.isFinite(numericSize) && numericSize > 0 ? numericSize : undefined}
      height={Number.isFinite(numericSize) && numericSize > 0 ? numericSize : undefined}
      loading="eager"
      decoding="sync"
      draggable="false"
    />
  );
};

export default TeamLogo;
