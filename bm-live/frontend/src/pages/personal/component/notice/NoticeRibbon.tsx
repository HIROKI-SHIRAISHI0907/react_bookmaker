import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type Notice = {
  id: number;
  title: string;
  body: string;
  featuredMatchId?: number | null; // ★ future_master.id が入る想定
};

async function fetchActiveNotices(): Promise<Notice[]> {
  const res = await fetch("/v1/api/notices?active=true", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// ★ デフォルト表示（注目対戦）
// ここは将来、バックエンドで「注目試合（future_master）」から1件選んで返すAPIに置き換え可能
function defaultFeatured(): Notice[] {
  return [
    {
      id: 0,
      title: "注目！！鹿島 vs 広島",
      body: "本日の注目対戦です！",
      featuredMatchId: null,
    },
  ];
}

function sleep(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}

export default function NoticeRibbon() {
  const ribbonRef = useRef<HTMLDivElement | null>(null);
  const itemRef = useRef<HTMLDivElement | null>(null);

  // 速度・停止など（調整しやすいように定数化）
  const SPEED_PX_PER_SEC = 240;
  const HOLD_MS = 3200; // 左端で止める時間
  const FADE_MS = 250; // 消える時間
  const GAP_MS = 350; // 次の表示まで

  const { data } = useQuery({
    queryKey: ["notices-active"],
    queryFn: fetchActiveNotices,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const queue = useMemo(() => {
    if (data && data.length > 0) return data;
    return defaultFeatured();
  }, [data]);

  const [idx, setIdx] = useState(0);

  const current = useMemo(() => {
    if (!queue || queue.length === 0) return null;
    return queue[idx % queue.length];
  }, [queue, idx]);

  useEffect(() => {
    if (!current) return;
    const ribbon = ribbonRef.current;
    const item = itemRef.current;
    if (!ribbon || !item) return;

    let cancelled = false;

    const run = async () => {
      // 表示テキスト（title + body）
      const text = `${current.title ?? ""}${current.body ? "　" + current.body : ""}`;
      item.textContent = text;

      // 初期化
      item.style.transition = "none";
      item.style.opacity = "1";

      // 右外スタート位置
      const ribbonWidth = ribbon.clientWidth;
      const itemWidth = item.scrollWidth;
      item.style.transform = `translateX(${ribbonWidth + itemWidth}px)`;

      // reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      item.offsetHeight;

      const distance = ribbonWidth + itemWidth;
      const moveMs = Math.max(1200, Math.min(6500, Math.round((distance / SPEED_PX_PER_SEC) * 1000)));

      // 移動開始（左端=0）
      item.style.transition = `transform ${moveMs}ms linear, opacity ${FADE_MS}ms ease`;
      item.style.transform = "translateX(0px)";

      await sleep(moveMs);
      if (cancelled) return;

      // 左端で停止
      await sleep(HOLD_MS);
      if (cancelled) return;

      // フェードアウト
      item.style.opacity = "0";
      await sleep(FADE_MS + GAP_MS);
      if (cancelled) return;

      setIdx((v) => v + 1);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [current]);

  // UI（Tailwindベース。あなたの画面の雰囲気に寄せた）
  return (
    <div ref={ribbonRef} className="w-full h-10 overflow-hidden flex items-center border-b bg-amber-50" aria-live="polite">
      <div className="relative w-full h-full">
        <div ref={itemRef} className="absolute left-0 top-0 h-full flex items-center whitespace-nowrap px-4 font-bold opacity-0" />
      </div>
    </div>
  );
}
