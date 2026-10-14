import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  BadgeTone,
  ConsoleButton,
  ConsoleButtonVariant,
  ConsoleColumn,
  ConsoleInput,
  ConsoleNotice,
  ConsoleTable,
  ConsoleToolbar,
  SegmentedTabs,
  StatChips,
  StatusBadge,
} from "../../../api/commonAdminDesign";

type UserItem = {
  userId?: number;
  email?: string;
  name?: string;
  authFlg?: number;
  authLabel?: string;
  registerTime?: string;
  updateTime?: string;
};

type UserListResponse = {
  responseCode?: string;
  message?: string;
  users?: UserItem[];
};

type ActionResponse = {
  responseCode?: string;
  message?: string;
};

type RoleKey = 1 | 2 | 3;

type RoleAction = {
  label: string;
  variant: ConsoleButtonVariant;
  targetAuthFlg: number;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

// authFlg: 1 = 管理者 / 2 = 担当者(管理者サブ) / それ以外 = 一般ユーザー
const ACTIONS_BY_ROLE: Record<RoleKey, RoleAction[]> = {
  1: [
    { label: "担当者にする", variant: "default", targetAuthFlg: 2 },
    { label: "一般ユーザーにする", variant: "default", targetAuthFlg: 3 },
  ],
  2: [
    { label: "管理者にする", variant: "danger", targetAuthFlg: 1 },
    { label: "一般ユーザーにする", variant: "default", targetAuthFlg: 3 },
  ],
  3: [
    { label: "管理者にする", variant: "danger", targetAuthFlg: 1 },
    { label: "担当者にする", variant: "default", targetAuthFlg: 2 },
  ],
};

const ROLE_INFO: Record<RoleKey, { label: string; tone: BadgeTone }> = {
  1: { label: "管理者", tone: "ng" },
  2: { label: "担当者", tone: "ok" },
  3: { label: "一般ユーザー", tone: "info" },
};

type RoleFilter = "all" | "1" | "2" | "3";

function roleKey(authFlg?: number): RoleKey {
  if (authFlg === 1) return 1;
  if (authFlg === 2) return 2;
  return 3;
}

function actionsFor(user: UserItem): RoleAction[] {
  return ACTIONS_BY_ROLE[roleKey(user.authFlg)];
}

function authRoleInfo(authFlg?: number) {
  return ROLE_INFO[roleKey(authFlg)];
}

async function getJsonSafe<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${txt ? `: ${txt}` : ""}`);
  }
  return (await res.json()) as T;
}

async function postJsonSafe<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body ?? {}),
  });
  // レスポンスボディはエラー時も含めてJSONとして読む(バックエンドが409等でも
  // { responseCode, message } の形で理由を返してくるため、それをそのまま表示に使う)
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const serverMessage = data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string" ? (data as { message: string }).message : undefined;
    throw new Error(serverMessage ?? `HTTP ${res.status}`);
  }
  return data as T;
}

function displayName(user: UserItem): string {
  const name = (user.name ?? "").trim();
  if (name) return name;
  return user.email ?? "-";
}

export default function UserAdminPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [loading, setLoading] = useState(false);
  const [runningUserId, setRunningUserId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "ng"; text: string } | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await getJsonSafe<UserListResponse>(`${API_BASE}/v1/api/admin/users`);
      setUsers(data.users ?? []);
    } catch (e) {
      setMessage({ tone: "ng", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    const sorted = [...users].sort((a, b) => {
      const aOrder = roleKey(a.authFlg);
      const bOrder = roleKey(b.authFlg);
      if (aOrder !== bOrder) return aOrder - bOrder;

      const aName = displayName(a).toLowerCase();
      const bName = displayName(b).toLowerCase();
      if (aName < bName) return -1;
      if (aName > bName) return 1;

      return (a.userId ?? 0) - (b.userId ?? 0);
    });

    if (!k) return sorted;

    return sorted.filter((u) => [u.name ?? "", u.email ?? "", u.authLabel ?? "", authRoleInfo(u.authFlg).label].join(" ").toLowerCase().includes(k));
  }, [users, keyword]);

  const counts = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0 } as Record<RoleKey, number>;
    filteredUsers.forEach((u) => (c[roleKey(u.authFlg)] += 1));
    return c;
  }, [filteredUsers]);

  const visibleUsers = useMemo(() => (roleFilter === "all" ? filteredUsers : filteredUsers.filter((u) => String(roleKey(u.authFlg)) === roleFilter)), [filteredUsers, roleFilter]);

  const updateAuthFlg = async (userId: number, authFlg: number) => {
    setRunningUserId(userId);
    setMessage(null);

    try {
      const res = await postJsonSafe<ActionResponse>(`${API_BASE}/v1/api/admin/users/auth-flg`, { userId, authFlg });
      setMessage({ tone: "ok", text: res.message ?? "更新しました。" });
      await loadUsers();
    } catch (e) {
      setMessage({ tone: "ng", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setRunningUserId(null);
    }
  };

  const columns: ConsoleColumn<UserItem>[] = [
    {
      key: "role",
      header: "権限",
      cell: (u) => {
        const r = authRoleInfo(u.authFlg);
        return <StatusBadge tone={r.tone}>{r.label}</StatusBadge>;
      },
    },
    { key: "name", header: "名前", cell: (u) => <b>{displayName(u)}</b> },
    { key: "email", header: "Email", mono: true, className: "text-gray-700", cell: (u) => u.email ?? "-" },
    { key: "registerTime", header: "登録日時", mono: true, className: "text-gray-500", cell: (u) => u.registerTime ?? "-" },
    { key: "updateTime", header: "更新日時", mono: true, className: "text-gray-500", cell: (u) => u.updateTime ?? "-" },
    {
      key: "ops",
      header: "権限の切り替え",
      align: "right",
      cell: (u) => {
        const running = runningUserId === u.userId;
        return (
          <span className="inline-flex gap-1.5">
            {actionsFor(u).map((a) => (
              <ConsoleButton
                key={a.targetAuthFlg}
                size="sm"
                variant={a.variant}
                disabled={runningUserId != null || u.userId == null}
                loading={running}
                onClick={() => u.userId && void updateAuthFlg(u.userId, a.targetAuthFlg)}
              >
                {a.label}
              </ConsoleButton>
            ))}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <ConsoleToolbar title="ユーザー管理" info="システム利用ユーザーの確認と、権限（管理者 / 担当者 / 一般ユーザー）の切り替え">
        <ConsoleInput value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="名前 / email / 権限で検索" className="w-72" />
        <ConsoleButton variant="primary" onClick={() => void loadUsers()} loading={loading}>
          {!loading && <RefreshCw className="h-3.5 w-3.5" />}
          再読み込み
        </ConsoleButton>
      </ConsoleToolbar>

      {message && <ConsoleNotice tone={message.tone} title={message.text} onClose={() => setMessage(null)} />}

      <div className="flex flex-wrap items-start gap-2">
        <StatChips
          loading={loading && users.length === 0}
          items={[
            { label: "全ユーザー", value: filteredUsers.length },
            { label: "管理者", value: counts[1], tone: "ng" },
            { label: "担当者", value: counts[2], tone: "ok" },
            { label: "一般ユーザー", value: counts[3], tone: "info" },
          ]}
        />
        <div className="mb-2.5 ml-auto">
          <SegmentedTabs<RoleFilter>
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: "all", label: "すべて", count: filteredUsers.length },
              { value: "1", label: "管理者", count: counts[1] },
              { value: "2", label: "担当者", count: counts[2] },
              { value: "3", label: "一般", count: counts[3] },
            ]}
          />
        </div>
      </div>

      <ConsoleTable
        columns={columns}
        rows={visibleUsers}
        rowKey={(u, i) => u.userId ?? `u-${i}`}
        loading={loading}
        emptyText={roleFilter === "all" ? "ユーザーはいません。" : `${ROLE_INFO[Number(roleFilter) as RoleKey].label}はいません。`}
      />
    </div>
  );
}
