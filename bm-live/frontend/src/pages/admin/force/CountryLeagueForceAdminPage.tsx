import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

/** ================= Types ================= */
type CountryLeagueDTO = {
  id: string;
  country: string;
  league: string;
  team: string;
  link: string;
  delFlg: string; // "0" or "1"
};

type ForceAdminRequest = { country: string; league: string; team: string; delFlg: "0" | "1" };
type ForceAdminResponse = { responseCode: string; message: string };

/** ================= API ================= */
async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text().catch(() => "")}`);
  return res.json();
}
async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text().catch(() => "")}`);
  return res.json();
}

/** ================= Utils ================= */
function uniqSorted(arr: string[]) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b, "ja"));
}
function makeKey(country: string, league: string) {
  return `${country}__${league}`;
}
function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e ?? "");
}

/** ================= UI (small components) ================= */
type CardProps = { children: React.ReactNode; className?: string };
const Card = ({ children, className = "" }: CardProps) => <div className={`bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-100 ${className}`}>{children}</div>;

type BadgeTone = "gray" | "blue" | "emerald" | "amber" | "rose";
const Badge = ({ children, tone = "gray" }: { children: React.ReactNode; tone?: BadgeTone }) => {
  const classes: Record<BadgeTone, string> = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    rose: "bg-rose-100 text-rose-800 border-rose-200",
  };
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${classes[tone]}`}>{children}</span>;
};

type ButtonVariant = "primary" | "secondary" | "danger";
const Button = ({
  children,
  onClick,
  variant = "primary",
  disabled,
  loading,
  className = "",
  icon,
}: {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
}) => {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 focus:ring-blue-500",
    secondary: "bg-gray-50 hover:bg-gray-100 text-gray-900 border-gray-200 focus:ring-gray-300",
    danger: "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 focus:ring-rose-500",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold
        transition-all duration-200 shadow-sm hover:shadow-md
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${variants[variant]}
        ${className}
      `}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && icon}
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder = "", className = "" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) => (
  <div className={className}>
    <label className="block text-sm font-semibold text-gray-800 mb-2">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="
        w-full px-4 py-3 rounded-xl border border-gray-200 bg-white
        transition-colors duration-200
        hover:border-gray-300
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      "
    />
  </div>
);

type AlertType = "info" | "success" | "error";
const Alert = ({ type, title, message, onClose }: { type: AlertType; title: string; message: string; onClose?: () => void }) => {
  const classes: Record<AlertType, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    error: "bg-rose-50 border-rose-200 text-rose-900",
  };

  return (
    <div className={`border rounded-2xl p-4 flex gap-3 items-start ${classes[type]}`}>
      <div className="mt-0.5">
        {type === "info" && "💡"}
        {type === "success" && "✅"}
        {type === "error" && "❌"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm">{title}</div>
        <pre className="mt-1 whitespace-pre-wrap text-xs leading-relaxed">{message}</pre>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
          ✕
        </button>
      )}
    </div>
  );
};

const Pill = ({ active, children, onClick, disabled }: { active: boolean; children: React.ReactNode; onClick: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-3 py-1.5 rounded-full border text-sm font-semibold transition-all duration-200
      ${active ? "bg-gray-900 text-white border-gray-900 shadow-sm" : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"}
      disabled:opacity-50 disabled:cursor-not-allowed
    `}
  >
    {children}
  </button>
);

/** ================= Page ================= */
export default function CountryLeagueForceAdminPage() {
  const {
    data: rows,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["countryLeagueMasterAll"],
    queryFn: () => getJson<CountryLeagueDTO[]>("/v1/api/country-league-master"),
  });

  /** 全件（delFlg=1含む） */
  const allRows = useMemo(() => rows ?? [], [rows]);

  /** サイドバー用（国一覧） */
  const countries = useMemo(() => uniqSorted(allRows.map((r) => r.country)), [allRows]);

  const leaguesByCountry = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const r of allRows) map.set(r.country, [...(map.get(r.country) ?? []), r.league]);
    for (const [k, v] of map.entries()) map.set(k, uniqSorted(v));
    return map;
  }, [allRows]);

  /** 国×リーグ → チームDTO[] */
  const teamsByCountryLeague = useMemo(() => {
    const map = new Map<string, CountryLeagueDTO[]>();
    for (const r of allRows) {
      const key = makeKey(r.country, r.league);
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    for (const [k, v] of map.entries()) {
      map.set(
        k,
        v.slice().sort((a, b) => {
          const t = a.team.localeCompare(b.team, "ja");
          if (t !== 0) return t;
          return a.delFlg.localeCompare(b.delFlg); // "0" が先
        }),
      );
    }
    return map;
  }, [allRows]);

  /** ===== selection state ===== */
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  /** ===== UI state ===== */
  const [countryFilter, setCountryFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [onlyHidden, setOnlyHidden] = useState(false);
  const [toast, setToast] = useState<{ type: AlertType; title: string; message: string } | null>(null);

  /** 初期国 */
  useEffect(() => {
    if (!countries.length) return;
    if (!selectedCountry) setSelectedCountry(countries[0]);
  }, [countries, selectedCountry]);

  /** 国に応じてリーグの初期選択 */
  useEffect(() => {
    if (!selectedCountry) return;
    const leagues = leaguesByCountry.get(selectedCountry) ?? [];
    if (!leagues.length) {
      setSelectedLeague(null);
      return;
    }
    if (!selectedLeague || !leagues.includes(selectedLeague)) setSelectedLeague(leagues[0]);
  }, [selectedCountry, selectedLeague, leaguesByCountry]);

  const currentLeagues = useMemo(() => {
    if (!selectedCountry) return [];
    return leaguesByCountry.get(selectedCountry) ?? [];
  }, [selectedCountry, leaguesByCountry]);

  const currentTeamRowsRaw = useMemo(() => {
    if (!selectedCountry || !selectedLeague) return [];
    return teamsByCountryLeague.get(makeKey(selectedCountry, selectedLeague)) ?? [];
  }, [selectedCountry, selectedLeague, teamsByCountryLeague]);

  const currentTeamRows = useMemo(() => {
    const tf = teamFilter.trim().toLowerCase();
    return currentTeamRowsRaw.filter((r) => {
      if (onlyHidden && r.delFlg !== "1") return false;
      if (!tf) return true;
      return r.team.toLowerCase().includes(tf) || (r.link ?? "").toLowerCase().includes(tf);
    });
  }, [currentTeamRowsRaw, teamFilter, onlyHidden]);

  /** counts */
  const hiddenCount = useMemo(() => currentTeamRowsRaw.filter((r) => r.delFlg === "1").length, [currentTeamRowsRaw]);
  const totalCount = currentTeamRowsRaw.length;

  /** ===== mutation ===== */
  const toggleMutation = useMutation({
    mutationFn: async (req: ForceAdminRequest) => postJson<ForceAdminResponse>("/v1/api/admin/force/update/control", req),
    onSuccess: async () => {
      await refetch();
    },
  });

  const saving = toggleMutation.isPending;

  async function toggleDelFlg(row: CountryLeagueDTO) {
    const next: "0" | "1" = row.delFlg === "0" ? "1" : "0";
    const ok = window.confirm(`${row.country} / ${row.league} / ${row.team}\nを ${next === "1" ? "非表示(del_flg=1)" : "表示に戻す(del_flg=0)"} に更新します。\nよろしいですか？`);
    if (!ok) return;

    try {
      const res = await toggleMutation.mutateAsync({
        country: row.country,
        league: row.league,
        team: row.team,
        delFlg: next,
      });

      if (res.responseCode !== "0") {
        setToast({ type: "error", title: "更新失敗", message: res.message });
        return;
      }

      setToast({
        type: "success",
        title: "更新完了",
        message: `${row.team} を ${next === "1" ? "非表示" : "表示"} にしました`,
      });
    } catch (e) {
      setToast({ type: "error", title: "更新失敗", message: getErrorMessage(e) });
    }
  }

  /** ===== filtered countries (sidebar) ===== */
  const filteredCountries = useMemo(() => {
    const f = countryFilter.trim().toLowerCase();
    if (!f) return countries;
    return countries.filter((c) => c.toLowerCase().includes(f));
  }, [countries, countryFilter]);

  /** ===== loading / error ===== */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <Card className="p-6">
            <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="mt-3 h-4 w-96 bg-gray-200 rounded animate-pulse" />
          </Card>
          <Card className="p-6">
            <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
          </Card>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Alert type="error" title="読み込みに失敗" message={(error as Error)?.message ?? "unknown error"} />
          <div className="mt-4">
            <Button onClick={() => refetch()} variant="primary" icon="🔄">
              再読み込み
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /** ===== main ===== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white p-3 rounded-2xl shadow-lg">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 00-4-4H3m6 6h6m6 0a4 4 0 00-4-4h-2m6 6v-2a4 4 0 00-4-4h-1" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">国リーグ 強制制御（del_flg）</h1>
              <p className="text-sm text-gray-600 mt-1">del_flg=1 は「非表示」扱い。必要に応じて表示/非表示を切り替えます。</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={isFetching ? "amber" : "emerald"}>{isFetching ? "更新中…" : "最新"}</Badge>
            <Badge tone="blue">全レコード: {allRows.length}</Badge>
            <Button variant="secondary" onClick={() => refetch()} icon="🔄" disabled={saving}>
              再取得
            </Button>
          </div>
        </div>

        {/* Toast */}
        {toast && <Alert type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />}

        {/* Layout: sidebar + main */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-gray-900">国</div>
              <Badge tone="gray">
                {filteredCountries.length}/{countries.length}
              </Badge>
            </div>

            <div className="mt-4">
              <Input label="国フィルター" value={countryFilter} onChange={setCountryFilter} placeholder="例: Japan / JP" />
            </div>

            <div className="mt-4 max-h-[60vh] overflow-auto pr-1">
              {filteredCountries.length === 0 && <div className="text-sm text-gray-500 p-3 rounded-xl border border-gray-100 bg-gray-50">該当する国がありません</div>}

              <div className="space-y-2">
                {filteredCountries.map((c) => {
                  const active = c === selectedCountry;
                  const leagues = leaguesByCountry.get(c) ?? [];
                  return (
                    <button
                      key={c}
                      onClick={() => startTransition(() => setSelectedCountry(c))}
                      disabled={saving}
                      className={`
                        w-full text-left p-3 rounded-2xl border transition-all duration-200
                        ${active ? "bg-gray-900 text-white border-gray-900 shadow-sm" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"}
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold truncate">{c}</div>
                        <span className={`text-xs font-semibold ${active ? "text-white/80" : "text-gray-500"}`}>leagues: {leagues.length}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Main */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
                <div>
                  <div className="text-xs text-gray-500">選択中</div>
                  <div className="mt-1 text-xl font-extrabold text-gray-900">
                    {selectedCountry ?? "-"} / {selectedLeague ?? "-"}
                    {isPending ? <span className="ml-2 text-sm text-gray-500">（切替中…）</span> : null}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-semibold">非表示</span> はグレー表示・取り消し線。ボタンで即切替します。
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone={hiddenCount > 0 ? "amber" : "emerald"}>非表示: {hiddenCount}</Badge>
                  <Badge tone="blue">総数: {totalCount}</Badge>
                  {saving && <Badge tone="amber">更新中…</Badge>}
                </div>
              </div>

              {/* league pills */}
              <div className="mt-5">
                <div className="text-sm font-bold text-gray-900 mb-2">リーグ</div>
                <div className="flex flex-wrap gap-2">
                  {currentLeagues.length === 0 && <span className="text-sm text-gray-500">リーグがありません</span>}
                  {currentLeagues.map((lg) => (
                    <Pill key={lg} active={lg === selectedLeague} onClick={() => startTransition(() => setSelectedLeague(lg))} disabled={saving}>
                      {lg}
                    </Pill>
                  ))}
                </div>
              </div>

              {/* filters */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="チーム/リンク フィルター" value={teamFilter} onChange={setTeamFilter} placeholder="例: Reds / urawa / https..." className="md:col-span-2" />
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">表示</label>
                  <button
                    onClick={() => setOnlyHidden((p) => !p)}
                    disabled={saving}
                    className={`
                      w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all
                      ${onlyHidden ? "bg-amber-100 text-amber-900 border-amber-200" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"}
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {onlyHidden ? "非表示のみ" : "全て"}
                  </button>
                </div>
              </div>
            </Card>

            {/* Team grid */}
            <Card className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="text-lg font-extrabold text-gray-900">チーム</div>
                <div className="text-sm text-gray-500">
                  表示中: {currentTeamRows.length} 件（総数 {totalCount}）
                </div>
              </div>

              {toggleMutation.isError && (
                <div className="mt-4">
                  <Alert type="error" title="更新に失敗" message={(toggleMutation.error as Error)?.message ?? "unknown error"} />
                </div>
              )}

              <div className="mt-5">
                {currentTeamRowsRaw.length === 0 ? (
                  <div className="text-sm text-gray-500 p-4 rounded-2xl border border-gray-100 bg-gray-50">チームがありません</div>
                ) : currentTeamRows.length === 0 ? (
                  <div className="text-sm text-gray-500 p-4 rounded-2xl border border-gray-100 bg-gray-50">フィルター条件に一致するチームがありません</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {currentTeamRows.map((r) => {
                      const hidden = r.delFlg === "1";
                      return (
                        <div
                          key={r.id}
                          className={`
                            rounded-2xl border p-4 flex items-start justify-between gap-4
                            transition-all duration-200
                            ${hidden ? "bg-gray-50 border-gray-200 opacity-75" : "bg-white border-gray-200 hover:shadow-sm"}
                          `}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className={`font-extrabold text-gray-900 truncate ${hidden ? "line-through" : ""}`}>{r.team}</div>
                              {hidden ? <Badge tone="gray">非表示</Badge> : <Badge tone="emerald">表示</Badge>}
                            </div>

                            {r.link ? (
                              <div className="mt-2 text-xs text-gray-500 truncate">
                                <span className="font-semibold text-gray-600">link:</span> {r.link}
                              </div>
                            ) : (
                              <div className="mt-2 text-xs text-gray-400">link: -</div>
                            )}

                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                              <Badge tone="blue">{r.country}</Badge>
                              <Badge tone="blue">{r.league}</Badge>
                              <Badge tone="gray">id: {r.id}</Badge>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 shrink-0">
                            <Button onClick={() => toggleDelFlg(r)} disabled={saving} loading={saving && toggleMutation.variables?.team === r.team} variant={hidden ? "primary" : "secondary"}>
                              {hidden ? "表示に戻す" : "非表示にする"}
                            </Button>

                            <Button variant="secondary" disabled={!r.link} onClick={() => r.link && navigator.clipboard.writeText(r.link)} className="px-3 py-2 text-xs">
                              linkコピー
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-6 text-xs text-gray-500">
                ※ 更新ボタンは <span className="font-semibold">country/league/team</span> をキーとして API に送ります（あなたの実装のまま）。
              </div>
            </Card>

            {/* Footer note */}
            <div className="text-center text-xs text-gray-500">反映されない場合は、API側の認可（管理者権限）・CORS・セッション（credentials: include）をご確認ください。</div>
          </div>
        </div>
      </div>
    </div>
  );
}
