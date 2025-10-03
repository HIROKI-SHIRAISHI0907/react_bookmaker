// frontend/src/components/LeagueLink.tsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { fetchLeaguesGrouped, type LeagueGrouped } from "../api/leagues";

/**
 * ヘッダー内に“ボタン”だけ置き、オーバーレイ＆パネルは Portal で body 直下へ。
 * - 背景：暗い単色（＋薄いラジアルで立体感）
 * - パネル：左スライド、ヘッダー固定、本文のみ縦スクロール
 * - 行：段階的に左からスライド
 * - 開いている間は body スクロールをロック
 */
export default function LeagueMenu() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false); // マウント後にトランジション開始
  const panelRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const { data, isLoading, error } = useQuery<LeagueGrouped[]>({
    queryKey: ["leagues-grouped"],
    queryFn: fetchLeaguesGrouped,
    staleTime: 60_000,
  });

  // open → 次フレームで ready=true（確実にtransitionを走らせる）
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(id);
    } else {
      setReady(false);
    }
  }, [open]);

  // 外側クリック・Escで閉じる
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keyup", onKey);
    };
  }, [open]);

  // メニュー開いている間は背景スクロールをロック
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="relative">
      {/* ヘッダーに置くのはこのボタンだけ */}
      <button ref={btnRef} onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-accent" aria-expanded={open} aria-haspopup="menu">
        <Menu className="w-4 h-4" />
        リーグ
      </button>

      {/* オーバーレイとパネルは Portal で body 直下へ */}
      {open &&
        createPortal(
          <>
            {/* 暗幕（単色＋薄いラジアル） */}
            <div className={`fixed inset-0 z-[1000] transition-opacity duration-250 ${ready ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} aria-hidden="true">
              <div className="absolute inset-0 bg-black/70" />
              <div
                className="absolute inset-0 pointer-events-none
                 bg-[radial-gradient(60%_60%_at_20%_10%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(70%_70%_at_100%_100%,rgba(255,255,255,0.04),transparent_60%)]"
              />
            </div>

            {/* 左スライドのパネル（本文スクロール） */}
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
                {/* 固定ヘッダー */}
                <div className="shrink-0 flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="font-semibold">Leagues</span>
                  <button onClick={() => setOpen(false)} className="rounded-md border px-2 py-1 text-sm hover:bg-accent">
                    閉じる
                  </button>
                </div>

                {/* 本文だけ縦スクロール */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                  {isLoading && <div className="p-2 text-sm text-muted-foreground">Loading...</div>}
                  {error && <div className="p-2 text-sm text-destructive">読み込みに失敗しました</div>}

                  {data?.map((g, gi) => (
                    <details key={g.country} className="group" open={gi === 0}>
                      <summary className="cursor-pointer list-none rounded px-2 py-1 hover:bg-accent animate-in-left" style={{ animationDelay: `${gi * 45}ms` }}>
                        <span className="font-medium">{g.country}</span>
                      </summary>

                      <ul className="ml-2 mt-1 space-y-1">
                        {g.leagues.map((l, li) => {
                          const to = l.path?.startsWith("/") ? l.path : `/${encodeURIComponent(g.country)}/${encodeURIComponent(l.name)}`;
                          return (
                            <li key={`${g.country}-${l.name}`}>
                              <Link
                                to={to}
                                onClick={() => setOpen(false)}
                                className="block rounded px-2 py-1 text-sm hover:bg-accent animate-in-left"
                                style={{ animationDelay: `${gi * 45 + li * 25}ms` }}
                              >
                                {l.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  ))}
                  <div className="h-2" />
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
