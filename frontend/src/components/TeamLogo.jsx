import React from "react";
import { getLogo } from "../utils/getLogo";

const TeamLogo = ({ teamName, className = "w-6 h-6 inline-block" }) => {
  const logoUrl = getLogo(teamName);

  return (
    <img
      src={logoUrl}
      alt={teamName || "Team Logo"}
      className={className}
      onError={(e) => {
        // Fallback to default generic crest if asset isn't matched
        e.target.onerror = null;
        e.target.src = "/logos/default.svg";
      }}
    />
  );
};

export default TeamLogo;