// frontend/src/components/layout/AppHeader.tsx
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, Home, LogIn, LogOut } from "lucide-react";
import LeagueLink from "../LeagueLink";
import ThemeToggle from "../../components/ThemeToggle";

type Props = {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
};

type AuthSession = {
  accessToken?: string;
};

const AUTH_STORAGE_KEY = "authSession";

function loadAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function isLoggedIn(): boolean {
  return !!loadAuthSession()?.accessToken;
}

function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function navClass(active: boolean) {
  return ["inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition", active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-accent"].join(
    " ",
  );
}

export default function AppHeader({ title, subtitle, rightSlot }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const currentPath = location.pathname;
  const currentFullPath = location.pathname + location.search + location.hash;

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 左：ハンバーガー＋タイトル */}
          <div className="flex items-center gap-3">
            <LeagueLink />
            <div>
              {title && <h1 className="text-2xl font-bold">{title}</h1>}
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </div>

          {/* 右：共通導線 + ページ固有操作 */}
          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-2 md:flex">
              <Link to="/top" className={navClass(currentPath === "/top")}>
                <Home className="h-4 w-4" />
                トップ
              </Link>

              {loggedIn ? (
                <Link to="/favorite" className={navClass(currentPath === "/favorite")}>
                  <Heart className="h-4 w-4" />
                  お気に入り
                </Link>
              ) : (
                <Link to="/login" state={{ from: "/favorite" }} className={navClass(false)}>
                  <Heart className="h-4 w-4" />
                  お気に入り
                </Link>
              )}
            </nav>

            {rightSlot}

            {loggedIn ? (
              <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent">
                <LogOut className="h-4 w-4" />
                ログアウト
              </button>
            ) : (
              <Link to="/login" state={{ from: currentFullPath }} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent">
                <LogIn className="h-4 w-4" />
                ログイン
              </Link>
            )}

            <ThemeToggle />
          </div>
        </div>

        {/* モバイル用 */}
        <nav className="mt-3 flex items-center gap-2 md:hidden">
          <Link to="/top" className={navClass(currentPath === "/top")}>
            <Home className="h-4 w-4" />
            トップ
          </Link>

          {loggedIn ? (
            <Link to="/favorite" className={navClass(currentPath === "/favorite")}>
              <Heart className="h-4 w-4" />
              お気に入り
            </Link>
          ) : (
            <Link to="/login" state={{ from: "/favorite" }} className={navClass(false)}>
              <Heart className="h-4 w-4" />
              お気に入り
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
