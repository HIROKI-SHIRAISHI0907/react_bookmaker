// src/components/LeagueLink.tsx
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Menu, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { fetchLeaguesGrouped, type LeagueGrouped, type LeagueInfo, type SubLeagueInfo } from "../api/leagues";

function normalizeText(v?: string | null) {
  return (v ?? "").trim();
}

function normalizeCount(v?: number | null) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function normalizePath(v?: string | null) {
  const s = normalizeText(v);
  return s || "#";
}

/**
 * backend の linkEnabled / seasonEnded を優先。
 * 念のため endSeasonDate でも後方互換fallback。
 */
function isLeagueEnded(league?: LeagueInfo | null) {
  if (typeof league?.seasonEnded === "boolean") {
    return league.seasonEnded;
  }
  if (typeof league?.linkEnabled === "boolean") {
    return !league.linkEnabled;
  }
  return !normalizeText(league?.endSeasonDate);
}

function isLeagueLinkEnabled(league?: LeagueInfo | null) {
  if (typeof league?.linkEnabled === "boolean") {
    return league.linkEnabled;
  }
  if (typeof league?.seasonEnded === "boolean") {
    return !league.seasonEnded;
  }
  return !!normalizeText(league?.endSeasonDate);
}

function getSeasonEndedLabel(league?: LeagueInfo | null) {
  return normalizeText(league?.seasonEndedLabel) || "シーズン終了";
}

function getSubLeagueValue(sub?: SubLeagueInfo | null) {
  const rawName = normalizeText(sub?.rawName);
  if (rawName && rawName !== "未設定") return rawName;

  const name = normalizeText(sub?.name).replace(/^▶︎+/, "").trim();
  if (name && name !== "未設定") return name;

  return "";
}

function normalizeSubLeagueLabel(sub?: SubLeagueInfo | null) {
  const raw = getSubLeagueValue(sub);
  if (!raw) return "";
  return raw.startsWith("▶︎") ? raw : `▶︎${raw}`;
}

function buildSubLeaguePath(league: LeagueInfo, sub?: SubLeagueInfo | null) {
  const subRouting = normalizeText(sub?.routingPath);
  if (subRouting) return subRouting;

  const base = normalizeText(league.routingPath) || normalizeText(league.path);
  if (!base) return "#";

  const rawSub = getSubLeagueValue(sub);
  if (!rawSub) return base;

  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}subLeague=${encodeURIComponent(rawSub)}`;
}

function getVisibleSubLeagues(league: LeagueInfo): SubLeagueInfo[] {
  return (league.subLeagues ?? []).filter((sub) => !!getSubLeagueValue(sub));
}

function hasVisibleSubLeagues(league: LeagueInfo): boolean {
  return getVisibleSubLeagues(league).length > 0;
}

function isSubLeagueLinkEnabled(sub?: SubLeagueInfo | null, league?: LeagueInfo | null) {
  if (typeof sub?.linkEnabled === "boolean") {
    return sub.linkEnabled;
  }
  if (typeof sub?.seasonEnded === "boolean") {
    return !sub.seasonEnded;
  }
  return isLeagueLinkEnabled(league);
}

function getSubLeagueEndedLabel(sub?: SubLeagueInfo | null, league?: LeagueInfo | null) {
  return normalizeText(sub?.seasonEndedLabel) || getSeasonEndedLabel(league);
}

function SeasonEndedBadge({ label }: { label?: string | null }) {
  return <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{normalizeText(label) || "シーズン終了"}</span>;
}

function LeagueLeafLink(props: { to: string; label: string; meta?: ReactNode; onClick: () => void; animationDelayMs?: number }) {
  const { to, label, meta, onClick, animationDelayMs = 0 } = props;

  return (
    <Link to={to} onClick={onClick} className="block rounded px-2 py-1 text-sm hover:bg-accent animate-in-left" style={{ animationDelay: `${animationDelayMs}ms` }}>
      <span className="inline-flex items-center gap-2">
        <span>{label}</span>
        {meta}
      </span>
    </Link>
  );
}

function DisabledLeafItem(props: { label: string; meta?: ReactNode; badgeLabel?: string | null; animationDelayMs?: number }) {
  const { label, meta, badgeLabel, animationDelayMs = 0 } = props;

  return (
    <span className="block cursor-not-allowed rounded px-2 py-1 text-sm text-muted-foreground opacity-60 animate-in-left" style={{ animationDelay: `${animationDelayMs}ms` }} aria-disabled="true">
      <span className="inline-flex items-center gap-2">
        <span>{label}</span>
        {meta}
        <SeasonEndedBadge label={badgeLabel} />
      </span>
    </span>
  );
}

export default function LeagueMenu() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [expandedLeagueMap, setExpandedLeagueMap] = useState<Record<string, boolean>>({});
  const panelRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const { data, isLoading, error } = useQuery<LeagueGrouped[]>({
    queryKey: ["leagues-grouped"],
    queryFn: fetchLeaguesGrouped,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(id);
    }
    setReady(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keyup", onKey);

    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keyup", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const toggleLeagueOpen = (leagueKey: string) => {
    setExpandedLeagueMap((prev) => ({
      ...prev,
      [leagueKey]: !prev[leagueKey],
    }));
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 hover:bg-accent"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Menu className="h-4 w-4" />
        リーグ
      </button>

      {open &&
        createPortal(
          <>
            <div className={`fixed inset-0 z-[1000] transition-opacity duration-250 ${ready ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} aria-hidden="true">
              <div className="absolute inset-0 bg-black/70" />
              <div
                className="pointer-events-none absolute inset-0
                bg-[radial-gradient(60%_60%_at_20%_10%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(70%_70%_at_100%_100%,rgba(255,255,255,0.04),transparent_60%)]"
              />
            </div>

            <div
              ref={panelRef}
              role="menu"
              aria-modal="true"
              className={`fixed left-0 top-0 z-[1001] h-full w-[min(88vw,380px)]
              border-r bg-popover text-foreground shadow-2xl
              transition-transform duration-300 will-change-transform
              ${ready ? "translate-x-0" : "-translate-x-full"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-full flex-col">
                <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
                  <span className="font-semibold">Leagues</span>
                  <button onClick={() => setOpen(false)} className="rounded-md border px-2 py-1 text-sm hover:bg-accent">
                    閉じる
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                  {isLoading && <div className="p-2 text-sm text-muted-foreground">Loading...</div>}

                  {error && <div className="p-2 text-sm text-destructive">読み込みに失敗しました</div>}

                  {data?.map((g, gi) => (
                    <details key={g.country} className="group" open={gi === 0}>
                      <summary className="list-none cursor-pointer rounded px-2 py-1 hover:bg-accent animate-in-left" style={{ animationDelay: `${gi * 45}ms` }}>
                        <span className="font-medium">{g.country}</span>
                      </summary>

                      <ul className="ml-2 mt-1 space-y-1">
                        {g.leagues.map((l: LeagueInfo, li: number) => {
                          const leagueTo = normalizePath(l.routingPath || l.path);
                          const leagueKey = `${g.country}__${l.name}__${leagueTo}__${li}`;
                          const teamCount = normalizeCount(l.teamCount);
                          const variantCount = normalizeCount(l.variantCount);
                          const ended = isLeagueEnded(l);
                          const linkEnabled = isLeagueLinkEnabled(l);
                          const endedLabel = getSeasonEndedLabel(l);
                          const visibleSubLeagues = getVisibleSubLeagues(l);

                          if (!hasVisibleSubLeagues(l)) {
                            return (
                              <li key={leagueKey}>
                                {!linkEnabled ? (
                                  <DisabledLeafItem
                                    label={l.name}
                                    badgeLabel={endedLabel}
                                    animationDelayMs={gi * 45 + li * 25}
                                    meta={
                                      <>
                                        <span className="ml-1 opacity-60">({teamCount})</span>
                                        {variantCount > 0 ? <span className="text-xs opacity-60">({variantCount})</span> : null}
                                      </>
                                    }
                                  />
                                ) : (
                                  <LeagueLeafLink
                                    to={leagueTo}
                                    onClick={() => setOpen(false)}
                                    label={l.name}
                                    animationDelayMs={gi * 45 + li * 25}
                                    meta={
                                      <>
                                        <span className="ml-1 opacity-60">({teamCount})</span>
                                        {variantCount > 0 ? <span className="text-xs opacity-60">({variantCount})</span> : null}
                                      </>
                                    }
                                  />
                                )}
                              </li>
                            );
                          }

                          const isExpanded = !!expandedLeagueMap[leagueKey];

                          return (
                            <li key={leagueKey} className="animate-in-left" style={{ animationDelay: `${gi * 45 + li * 25}ms` }}>
                              <div className={`rounded px-2 py-1 text-sm ${ended ? "text-muted-foreground opacity-60" : ""}`}>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleLeagueOpen(leagueKey)}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-accent"
                                    aria-expanded={isExpanded}
                                    aria-label={`${l.name} のサブリーグを${isExpanded ? "閉じる" : "開く"}`}
                                  >
                                    <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                  </button>

                                  <div className="min-w-0 flex-1">
                                    {!linkEnabled ? (
                                      <span className="inline-flex items-center gap-2">
                                        <span>{l.name}</span>
                                        <span className="ml-1 opacity-60">({teamCount})</span>
                                        {variantCount > 0 ? <span className="text-xs opacity-60">({variantCount})</span> : null}
                                        <SeasonEndedBadge label={endedLabel} />
                                      </span>
                                    ) : (
                                      <Link to={leagueTo} onClick={() => setOpen(false)} className="inline-flex items-center gap-2 rounded px-1 py-0.5 hover:bg-accent">
                                        <span>{l.name}</span>
                                        <span className="ml-1 opacity-60">({teamCount})</span>
                                        {variantCount > 0 ? <span className="text-xs opacity-60">({variantCount})</span> : null}
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {isExpanded && (
                                <ul className="ml-7 mt-1 space-y-1 border-l border-border pl-2">
                                  {visibleSubLeagues.map((s: SubLeagueInfo, si: number) => {
                                    const subLabel = normalizeSubLeagueLabel(s);
                                    const subTo = buildSubLeaguePath(l, s);
                                    const subKey = `${leagueKey}__${normalizeText(s.rawName || s.name || String(si))}`;
                                    const subLinkEnabled = isSubLeagueLinkEnabled(s, l);
                                    const subEndedLabel = getSubLeagueEndedLabel(s, l);

                                    return (
                                      <li key={subKey}>
                                        {!subLinkEnabled ? (
                                          <DisabledLeafItem
                                            label={subLabel}
                                            badgeLabel={subEndedLabel}
                                            animationDelayMs={gi * 45 + li * 25 + si * 20}
                                            meta={<span className="ml-1 opacity-60">({normalizeCount(s.teamCount)})</span>}
                                          />
                                        ) : (
                                          <LeagueLeafLink
                                            to={subTo}
                                            onClick={() => setOpen(false)}
                                            label={subLabel}
                                            animationDelayMs={gi * 45 + li * 25 + si * 20}
                                            meta={<span className="ml-1 opacity-60">({normalizeCount(s.teamCount)})</span>}
                                          />
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  ))}

                  {!isLoading && !error && (!data || data.length === 0) && <div className="p-2 text-sm text-muted-foreground">データがありません</div>}

                  <div className="h-2" />
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
