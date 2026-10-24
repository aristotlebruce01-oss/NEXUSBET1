import React from "react";
import TeamLogo from "@/components/TeamLogo";

export default function LeagueCrest({ name, logoUrl, size = 42 }) {
  return <TeamLogo name={name} logoUrl={logoUrl} size={size} />;
}
