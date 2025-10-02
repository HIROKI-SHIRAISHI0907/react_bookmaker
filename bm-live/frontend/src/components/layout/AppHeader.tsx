// frontend/src/components/layout/AppHeader.tsx
import type { ReactNode } from "react";
import LeagueLink from "../LeagueLink";
import ThemeToggle from "../../components/ThemeToggle"; // ある場合
// 必要なら他の右側アイコンも props で受けられるようにする

type Props = {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode; // ページ固有の操作（Refreshなど）を差し込む
};

export default function AppHeader({ title, subtitle, rightSlot }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* 左：ハンバーガー＋タイトル */}
          <div className="flex items-center gap-3">
            <LeagueLink />
            <div>
              {title && <h1 className="text-2xl font-bold">{title}</h1>}
              {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
            </div>
          </div>

          {/* 右：ページ固有 or 共通操作 */}
          <div className="flex items-center gap-3">
            {rightSlot}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
