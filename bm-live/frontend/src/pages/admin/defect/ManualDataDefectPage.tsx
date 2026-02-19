"use client";

import React, { useMemo, useState } from "react";

/** ============ 共通 ============ */
type TabKey = "season" | "league" | "member";

function hasText(s: unknown): boolean {
  return s != null && String(s).trim() !== "";
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return (await res.json()) as T;
}

function buildQuery(params: Record<string, unknown>) {
  const q = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v == null) return;
    const s = String(v).trim();
    if (s === "") return;
    q.set(k, s);
  });
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

async function getJson<T>(url: string, params: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${url}${buildQuery(params ?? {})}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return (await res.json()) as T;
}

function normalizeInputValue(v: unknown): string {
  return v == null ? "" : String(v);
}

function toNullableString(v: string): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e ?? "");
}

/** ============ 共通UIコンポーネント ============ */

type CardProps = { children: React.ReactNode; className?: string };
const Card = ({ children, className = "" }: CardProps) => <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>{children}</div>;

type ButtonVariant = "primary" | "secondary" | "success" | "danger";
type ButtonSize = "sm" | "md" | "lg";
type ButtonProps = {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
};
const Button = ({ children, onClick, variant = "primary", size = "md", disabled = false, loading = false, icon }: ButtonProps) => {
  const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600",
    secondary: "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200",
    success: "bg-green-600 hover:bg-green-700 text-white border-green-600",
    danger: "bg-red-600 hover:bg-red-700 text-white border-red-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg border font-medium
        transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50
        disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2
        focus:ring-blue-500 ${sizeClasses[size]} ${variantClasses[variant]}
      `}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {icon && !loading && icon}
      {children}
    </button>
  );
};

type InputProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
};
const Input = ({ label, value, onChange, placeholder = "", error = "", className = "", onKeyDown }: InputProps) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={`
        w-full px-4 py-3 border rounded-lg transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        ${error ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"}
      `}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

type AlertType = "info" | "success" | "error" | "warning";
type AlertProps = { message: string; type?: AlertType; onClose?: () => void };
const Alert = ({ message, type = "info", onClose }: AlertProps) => {
  const typeClasses: Record<AlertType, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };

  const icons: Record<AlertType, string> = {
    info: "💡",
    success: "✅",
    error: "❌",
    warning: "⚠️",
  };

  return (
    <div className={`border rounded-lg p-4 flex items-start gap-3 relative ${typeClasses[type]}`}>
      <span className="text-lg">{icons[type]}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          ✕
        </button>
      )}
    </div>
  );
};

type TabButtonProps = { active: boolean; children: React.ReactNode; onClick: () => void };
const TabButton = ({ active, children, onClick }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`
      px-4 py-2 rounded-lg border font-medium transition-all duration-200
      ${active ? "bg-blue-100 border-blue-300 text-blue-800 shadow-sm" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}
    `}
  >
    {children}
  </button>
);

type StatusBadgeProps = { count: number };
const StatusBadge = ({ count }: StatusBadgeProps) => (
  <div
    className={`
    inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
    ${count > 0 ? "bg-yellow-100 text-yellow-800 border border-yellow-200" : "bg-gray-100 text-gray-600 border border-gray-200"}
  `}
  >
    {count > 0 ? (
      <>
        <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse" />
        変更あり {count}件
      </>
    ) : (
      "変更なし"
    )}
  </div>
);

/** ============ データ型 ============ */

type SeasonCond = { country: string; league: string; seasonYear: string; path: string; delFlg: string };
type LeagueCond = { country: string; league: string; team: string; link: string; delFlg: string };
type MemberCond = { country: string; league: string; team: string; member: string; position: string; delFlg: string };

type SeasonRow = { id: string; country: string | null; league: string | null; seasonYear: string | null; path: string | null; delFlg: string | null };
type LeagueRow = { id: string; country: string | null; league: string | null; team: string | null; link: string | null; delFlg: string | null };
type MemberRow = {
  id: string;
  country: string | null;
  league: string | null;
  team: string | null;
  jersey: string | null;
  member: string | null;
  position: string | null;
  birth: string | null;
  age: string | null;
  height: string | null;
  weight: string | null;
  marketValue: string | null;
  injury: string | null;
  delFlg: string | null;
};

type SeasonRowUi = SeasonRow & { _dirty: boolean };
type LeagueRowUi = LeagueRow & { _dirty: boolean };
type MemberRowUi = MemberRow & { _dirty: boolean };

type SeasonKey = keyof SeasonRow;
type LeagueKey = keyof LeagueRow;
type MemberKey = keyof MemberRow;

/** ============ Search Forms ============ */

type SeasonSearchFormProps = { cond: SeasonCond; onChange: (next: SeasonCond) => void };
const SeasonSearchForm = ({ cond, onChange }: SeasonSearchFormProps) => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
    <Input label="🏳️ Country" value={cond.country} onChange={(value) => onChange({ ...cond, country: value })} placeholder="例: Japan" />
    <Input label="🏆 League" value={cond.league} onChange={(value) => onChange({ ...cond, league: value })} placeholder="例: J1 League" />
    <Input label="📅 Season Year" value={cond.seasonYear} onChange={(value) => onChange({ ...cond, seasonYear: value })} placeholder="例: 2024" />
    <Input label="🔗 Path" value={cond.path} onChange={(value) => onChange({ ...cond, path: value })} placeholder="部分一致" />
    <Input label="🗑️ Del Flag" value={cond.delFlg} onChange={(value) => onChange({ ...cond, delFlg: value })} placeholder="0/1" />
  </div>
);

type LeagueSearchFormProps = { cond: LeagueCond; onChange: (next: LeagueCond) => void };
const LeagueSearchForm = ({ cond, onChange }: LeagueSearchFormProps) => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
    <Input label="🏳️ Country" value={cond.country} onChange={(value) => onChange({ ...cond, country: value })} placeholder="例: Japan" />
    <Input label="🏆 League" value={cond.league} onChange={(value) => onChange({ ...cond, league: value })} placeholder="例: J1 League" />
    <Input label="👥 Team" value={cond.team} onChange={(value) => onChange({ ...cond, team: value })} placeholder="例: Urawa Reds" />
    <Input label="🔗 Link" value={cond.link} onChange={(value) => onChange({ ...cond, link: value })} placeholder="部分一致" />
    <Input label="🗑️ Del Flag" value={cond.delFlg} onChange={(value) => onChange({ ...cond, delFlg: value })} placeholder="0/1" />
  </div>
);

type MemberSearchFormProps = { cond: MemberCond; onChange: (next: MemberCond) => void };
const MemberSearchForm = ({ cond, onChange }: MemberSearchFormProps) => (
  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
    <Input label="🏳️ Country" value={cond.country} onChange={(value) => onChange({ ...cond, country: value })} placeholder="例: Japan" />
    <Input label="🏆 League" value={cond.league} onChange={(value) => onChange({ ...cond, league: value })} placeholder="例: J1 League" />
    <Input label="👥 Team" value={cond.team} onChange={(value) => onChange({ ...cond, team: value })} placeholder="例: Urawa Reds" />
    <Input label="👤 Member" value={cond.member} onChange={(value) => onChange({ ...cond, member: value })} placeholder="部分一致" />
    <Input label="⚽ Position" value={cond.position} onChange={(value) => onChange({ ...cond, position: value })} placeholder="例: Forward" />
    <Input label="🗑️ Del Flag" value={cond.delFlg} onChange={(value) => onChange({ ...cond, delFlg: value })} placeholder="0/1" />
  </div>
);

/** ============ Tables ============ */

type SeasonTableProps = {
  rows: SeasonRowUi[];
  onCellUpdate: (index: number, key: SeasonKey, value: string) => void;
};
const SeasonTable = ({ rows, onCellUpdate }: SeasonTableProps) => {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📅</div>
        <p className="text-gray-500 text-lg">シーズンデータがここに表示されます</p>
        <p className="text-gray-400 text-sm mt-2">条件を入力して検索ボタンをクリックしてください</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ID</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Country</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">League</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Season Year</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Path</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Del Flag</th>
            <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className={`
                border-b border-gray-100 transition-colors duration-150
                ${row._dirty ? "bg-yellow-50 border-yellow-200" : "hover:bg-gray-50"}
              `}
            >
              <td className="px-6 py-4">
                <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{row.id}</div>
              </td>

              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.country)}
                  onChange={(e) => onCellUpdate(index, "country", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>

              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.league)}
                  onChange={(e) => onCellUpdate(index, "league", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>

              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.seasonYear)}
                  onChange={(e) => onCellUpdate(index, "seasonYear", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>

              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.path)}
                  onChange={(e) => onCellUpdate(index, "path", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>

              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.delFlg)}
                  onChange={(e) => onCellUpdate(index, "delFlg", e.target.value)}
                  placeholder="0/1"
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>

              <td className="px-6 py-4 text-center">
                {row._dirty ? (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1 animate-pulse" />
                    編集中
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">－</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

type LeagueTableProps = {
  rows: LeagueRowUi[];
  onCellUpdate: (index: number, key: LeagueKey, value: string) => void;
};
const LeagueTable = ({ rows, onCellUpdate }: LeagueTableProps) => {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🏆</div>
        <p className="text-gray-500 text-lg">リーグデータがここに表示されます</p>
        <p className="text-gray-400 text-sm mt-2">条件を入力して検索ボタンをクリックしてください</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ID</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Country</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">League</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Team</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Link</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Del Flag</th>
            <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className={`
                border-b border-gray-100 transition-colors duration-150
                ${row._dirty ? "bg-yellow-50 border-yellow-200" : "hover:bg-gray-50"}
              `}
            >
              <td className="px-6 py-4">
                <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{row.id}</div>
              </td>

              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.country)}
                  onChange={(e) => onCellUpdate(index, "country", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>

              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.league)}
                  onChange={(e) => onCellUpdate(index, "league", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>

              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.team)}
                  onChange={(e) => onCellUpdate(index, "team", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>

              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.link)}
                  onChange={(e) => onCellUpdate(index, "link", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>

              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.delFlg)}
                  onChange={(e) => onCellUpdate(index, "delFlg", e.target.value)}
                  placeholder="0/1"
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>

              <td className="px-6 py-4 text-center">
                {row._dirty ? (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1 animate-pulse" />
                    編集中
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">－</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

type MemberTableProps = {
  rows: MemberRowUi[];
  onCellUpdate: (index: number, key: MemberKey, value: string) => void;
};
const MemberTable = ({ rows, onCellUpdate }: MemberTableProps) => {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">👥</div>
        <p className="text-gray-500 text-lg">メンバーデータがここに表示されます</p>
        <p className="text-gray-400 text-sm mt-2">条件を入力して検索ボタンをクリックしてください</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ID</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Country</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">League</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Team</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Jersey</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Member</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Position</th>
            <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className={`
                border-b border-gray-100 transition-colors duration-150
                ${row._dirty ? "bg-yellow-50 border-yellow-200" : "hover:bg-gray-50"}
              `}
            >
              <td className="px-6 py-4">
                <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{row.id}</div>
              </td>

              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.country)}
                  onChange={(e) => onCellUpdate(index, "country", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>

              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.league)}
                  onChange={(e) => onCellUpdate(index, "league", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>

              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.team)}
                  onChange={(e) => onCellUpdate(index, "team", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>

              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.jersey)}
                  onChange={(e) => onCellUpdate(index, "jersey", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>

              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.member)}
                  onChange={(e) => onCellUpdate(index, "member", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>

              <td className="px-6 py-4">
                <input
                  type="text"
                  value={normalizeInputValue(row.position)}
                  onChange={(e) => onCellUpdate(index, "position", e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-lg transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${row._dirty ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}
                  `}
                />
              </td>

              <td className="px-6 py-4 text-center">
                {row._dirty ? (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1 animate-pulse" />
                    編集中
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">－</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** ============ メインページ ============ */
export default function ScrapeDefectPage() {
  const [tab, setTab] = useState<TabKey>("season");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  /** ===== Season state ===== */
  const [seasonCond, setSeasonCond] = useState<SeasonCond>({
    country: "",
    league: "",
    seasonYear: "",
    path: "",
    delFlg: "",
  });
  const [seasonRows, setSeasonRows] = useState<SeasonRowUi[]>([]);

  /** ===== League state ===== */
  const [leagueCond, setLeagueCond] = useState<LeagueCond>({
    country: "",
    league: "",
    team: "",
    link: "",
    delFlg: "",
  });
  const [leagueRows, setLeagueRows] = useState<LeagueRowUi[]>([]);

  /** ===== Member state ===== */
  const [memberCond, setMemberCond] = useState<MemberCond>({
    country: "",
    league: "",
    team: "",
    member: "",
    position: "",
    delFlg: "",
  });
  const [memberRows, setMemberRows] = useState<MemberRowUi[]>([]);

  const dirtyCount = useMemo<number>(() => {
    if (tab === "season") return seasonRows.filter((r) => r._dirty).length;
    if (tab === "league") return leagueRows.filter((r) => r._dirty).length;
    return memberRows.filter((r) => r._dirty).length;
  }, [tab, seasonRows, leagueRows, memberRows]);

  /** ========================= 検索 ========================= */
  async function onSearch(): Promise<void> {
    setLoading(true);
    setMessage("");
    try {
      if (tab === "season") {
        const data = await getJson<SeasonRow[]>("/v1/api/country-league-season-master/search", seasonCond);
        setSeasonRows(data.map((r) => ({ ...r, _dirty: false })));
        setMessage(`Season 検索結果: ${data.length}件`);
      } else if (tab === "league") {
        const data = await getJson<LeagueRow[]>("/v1/api/country-league-master/search", leagueCond);
        setLeagueRows(data.map((r) => ({ ...r, _dirty: false })));
        setMessage(`League 検索結果: ${data.length}件`);
      } else {
        const data = await getJson<MemberRow[]>("/v1/api/team-member-master/search", memberCond);
        setMemberRows(data.map((r) => ({ ...r, _dirty: false })));
        setMessage(`Member 検索結果: ${data.length}件`);
      }
    } catch (e: unknown) {
      setMessage(getErrorMessage(e) || "検索でエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  /** ========================= 保存（dirtyのみ） ========================= */
  async function onSaveDirty(): Promise<void> {
    setLoading(true);
    setMessage("");
    try {
      if (tab === "season") {
        const dirty = seasonRows.filter((r) => r._dirty);
        for (const r of dirty) {
          await postJson<unknown>("/v1/api/country-league-season-master/update", {
            ...r,
            country: toNullableString(normalizeInputValue(r.country)),
            league: toNullableString(normalizeInputValue(r.league)),
            seasonYear: toNullableString(normalizeInputValue(r.seasonYear)),
            path: toNullableString(normalizeInputValue(r.path)),
            delFlg: toNullableString(normalizeInputValue(r.delFlg)),
          });
        }
        await onSearch();
        setMessage(`Season 保存完了: ${dirty.length}件`);
      } else if (tab === "league") {
        const dirty = leagueRows.filter((r) => r._dirty);
        for (const r of dirty) {
          await postJson<unknown>("/v1/api/country-league-master/update", {
            ...r,
            country: toNullableString(normalizeInputValue(r.country)),
            league: toNullableString(normalizeInputValue(r.league)),
            team: toNullableString(normalizeInputValue(r.team)),
            link: toNullableString(normalizeInputValue(r.link)),
            delFlg: toNullableString(normalizeInputValue(r.delFlg)),
          });
        }
        await onSearch();
        setMessage(`League 保存完了: ${dirty.length}件`);
      } else {
        const dirty = memberRows.filter((r) => r._dirty);
        for (const r of dirty) {
          await postJson<unknown>("/v1/api/team-member-master/update", {
            ...r,
            country: toNullableString(normalizeInputValue(r.country)),
            league: toNullableString(normalizeInputValue(r.league)),
            team: toNullableString(normalizeInputValue(r.team)),
            jersey: toNullableString(normalizeInputValue(r.jersey)),
            member: toNullableString(normalizeInputValue(r.member)),
            position: toNullableString(normalizeInputValue(r.position)),
            birth: toNullableString(normalizeInputValue(r.birth)),
            age: toNullableString(normalizeInputValue(r.age)),
            height: toNullableString(normalizeInputValue(r.height)),
            weight: toNullableString(normalizeInputValue(r.weight)),
            marketValue: toNullableString(normalizeInputValue(r.marketValue)),
            injury: toNullableString(normalizeInputValue(r.injury)),
            delFlg: toNullableString(normalizeInputValue(r.delFlg)),
          });
        }
        await onSearch();
        setMessage(`Member 保存完了: ${dirty.length}件`);
      }
    } catch (e: unknown) {
      setMessage(getErrorMessage(e) || "保存でエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  /** ========================= セル更新 ========================= */
  function updateSeasonCell(index: number, key: SeasonKey, value: string): void {
    setSeasonRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value, _dirty: true };
      return next;
    });
  }

  function updateLeagueCell(index: number, key: LeagueKey, value: string): void {
    setLeagueRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value, _dirty: true };
      return next;
    });
  }

  function updateMemberCell(index: number, key: MemberKey, value: string): void {
    setMemberRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value, _dirty: true };
      return next;
    });
  }

  /** ========================= 画面 ========================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-xl shadow-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">スクレイピングデータ管理</h1>
              <p className="text-gray-600 mt-1">欠陥値設定とデータメンテナンス</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge count={dirtyCount} />
            <Button onClick={onSaveDirty} variant="success" disabled={loading || dirtyCount === 0} loading={loading} icon="💾">
              変更を保存 ({dirtyCount}件)
            </Button>
          </div>
        </div>

        {/* Message Alert */}
        {message && <Alert message={message} type={message.includes("エラー") ? "error" : message.includes("完了") ? "success" : "info"} onClose={() => setMessage("")} />}

        {/* Tabs */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <TabButton active={tab === "season"} onClick={() => setTab("season")}>
                📅 Season Master
              </TabButton>
              <TabButton active={tab === "league"} onClick={() => setTab("league")}>
                🏆 League Master
              </TabButton>
              <TabButton active={tab === "member"} onClick={() => setTab("member")}>
                👥 Member Master
              </TabButton>
            </div>
            <div className="flex gap-3">
              <Button onClick={onSearch} loading={loading} icon="🔍">
                検索
              </Button>
            </div>
          </div>

          {/* Search Forms */}
          {tab === "season" && <SeasonSearchForm cond={seasonCond} onChange={setSeasonCond} />}
          {tab === "league" && <LeagueSearchForm cond={leagueCond} onChange={setLeagueCond} />}
          {tab === "member" && <MemberSearchForm cond={memberCond} onChange={setMemberCond} />}
        </Card>

        {/* Data Tables */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {tab === "season" && (
                <>
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Season データ</h2>
                </>
              )}
              {tab === "league" && (
                <>
                  <div className="bg-green-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-6 0h6"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">League データ</h2>
                </>
              )}
              {tab === "member" && (
                <>
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Member データ</h2>
                </>
              )}
            </div>
            <div className="text-sm text-gray-500">全 {tab === "season" ? seasonRows.length : tab === "league" ? leagueRows.length : memberRows.length} 件</div>
          </div>

          {tab === "season" && <SeasonTable rows={seasonRows} onCellUpdate={updateSeasonCell} />}
          {tab === "league" && <LeagueTable rows={leagueRows} onCellUpdate={updateLeagueCell} />}
          {tab === "member" && <MemberTable rows={memberRows} onCellUpdate={updateMemberCell} />}
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>
            空欄で保存すると <span className="font-medium">NULL</span> として更新されます
          </p>
          <p className="mt-1">変更がある場合は必ず「変更を保存」ボタンをクリックしてください</p>
        </div>
      </div>
    </div>
  );
}
