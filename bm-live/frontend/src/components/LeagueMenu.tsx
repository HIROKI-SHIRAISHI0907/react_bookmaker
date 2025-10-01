import { useQuery } from "@tanstack/react-query";
import { fetchLeaguesGrouped, type LeagueGrouped } from "../../server/src/api/leagues";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState } from "react";

export default function LeagueMenu() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useQuery<LeagueGrouped[]>({
    queryKey: ["leagues-grouped"],
    queryFn: fetchLeaguesGrouped,
    staleTime: 60_000,
  });

  return (
    <div className="relative">
      <button className="inline-flex items-center gap-2 border rounded px-3 py-2" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu">
        <Menu className="w-4 h-4" />
        リーグ
      </button>

      {open && (
        <div role="menu" className="absolute z-50 mt-2 w-72 max-h-[60vh] overflow-auto rounded border bg-popover p-2 shadow">
          {isLoading && <div className="p-2 text-sm text-muted-foreground">Loading...</div>}
          {error && <div className="p-2 text-sm text-red-500">読み込みに失敗しました</div>}
          {data?.map((g) => (
            <details key={g.country} className="group">
              <summary className="cursor-pointer list-none rounded px-2 py-1 hover:bg-accent">
                <span className="font-medium">{g.country}</span>
              </summary>
              <ul className="ml-2 mt-1 space-y-1">
                {g.leagues.map((l) => (
                  <li key={`${g.country}-${l.name}`}>
                    <Link to={l.path} className="block rounded px-2 py-1 text-sm hover:bg-accent" onClick={() => setOpen(false)}>
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
