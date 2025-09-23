// server/src/routes/matches.ts
import { Router } from "express";

const r = Router();

r.get("/:id/details", (_req, res) => {
  res.json({
    match: {
      id: "match1",
      competition: "Sample League",
      status: "LIVE",
      matchTime: "67'",
      homeTeam: { name: "Home United", shortName: "HOM" },
      awayTeam: { name: "Away City", shortName: "AWA" },
      homeScore: 2,
      awayScore: 1,
    },
    stats: [
      { id: "shotsOnTarget", label: "Shots on Target", home: 6, away: 3 },
      { id: "totalShots", label: "Total Shots", home: 12, away: 9 },
      { id: "possession", label: "Possession", home: 56, away: 44, unit: "%" },
      { id: "passes", label: "Passes", home: 420, away: 365 },
      { id: "dribbles", label: "Dribbles", home: 8, away: 6 },
      { id: "tackles", label: "Tackles", home: 14, away: 11 },
      { id: "corners", label: "Corners", home: 7, away: 4 },
      { id: "fouls", label: "Fouls", home: 9, away: 12 },
      { id: "offsides", label: "Offsides", home: 2, away: 1 },
    ],
  });
});

export default r;
