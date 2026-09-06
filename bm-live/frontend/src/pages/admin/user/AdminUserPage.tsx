import React, { useEffect, useMemo, useState } from "react";

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

type RoleAction = {
  label: string;
  color: string;
  targetAuthFlg: number;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

// authFlg: 1 = 管理者 / 2 = 担当者(管理者サブ) / それ以外 = 一般ユーザー
const ACTIONS_BY_ROLE: Record<number, RoleAction[]> = {
  1: [
    { label: "担当者にする", color: "#d97706", targetAuthFlg: 2 },
    { label: "一般ユーザーにする", color: "#6b7280", targetAuthFlg: 3 },
  ],
  2: [
    { label: "管理者にする", color: "#dc2626", targetAuthFlg: 1 },
    { label: "一般ユーザーにする", color: "#6b7280", targetAuthFlg: 3 },
  ],
  3: [
    { label: "管理者にする", color: "#dc2626", targetAuthFlg: 1 },
    { label: "担当者にする", color: "#d97706", targetAuthFlg: 2 },
  ],
};

function roleKey(authFlg?: number): 1 | 2 | 3 {
  if (authFlg === 1) return 1;
  if (authFlg === 2) return 2;
  return 3;
}

function actionsFor(user: UserItem): RoleAction[] {
  return ACTIONS_BY_ROLE[roleKey(user.authFlg)];
}

function authRoleInfo(authFlg?: number): { label: string; bg: string; fg: string } {
  switch (roleKey(authFlg)) {
    case 1:
      return { label: "管理者", bg: "#fee2e2", fg: "#991b1b" };
    case 2:
      return { label: "担当者", bg: "#dcfce7", fg: "#166534" };
    default:
      return { label: "一般ユーザー", bg: "#dbeafe", fg: "#1d4ed8" };
  }
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
  const [loading, setLoading] = useState(false);
  const [runningUserId, setRunningUserId] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");

  const loadUsers = async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await getJsonSafe<UserListResponse>(`${API_BASE}/v1/api/admin/users`);
      setUsers(data.users ?? []);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
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

  const admins = useMemo(() => filteredUsers.filter((u) => roleKey(u.authFlg) === 1), [filteredUsers]);

  const managers = useMemo(() => filteredUsers.filter((u) => roleKey(u.authFlg) === 2), [filteredUsers]);

  const generalUsers = useMemo(() => filteredUsers.filter((u) => roleKey(u.authFlg) === 3), [filteredUsers]);

  const updateAuthFlg = async (userId: number, authFlg: number) => {
    setRunningUserId(userId);
    setMessage("");

    try {
      const res = await postJsonSafe<ActionResponse>(`${API_BASE}/v1/api/admin/users/auth-flg`, { userId, authFlg });
      setMessage(res.message ?? "更新しました。");
      await loadUsers();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setRunningUserId(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>ユーザー管理</h1>
        <div style={{ color: "#6b7280", fontSize: 14 }}>システム利用ユーザーの確認と、権限(管理者/担当者/一般ユーザー)の切り替えを行います。</div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="名前 / email / 権限で検索"
          style={{
            minWidth: 320,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />
        <button onClick={loadUsers} disabled={loading} style={buttonSecondaryStyle}>
          {loading ? "読込中..." : "再読込"}
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: "#f3f4f6",
            color: "#111827",
            fontSize: 14,
          }}
        >
          {message}
        </div>
      )}

      <SectionCard title="〜管理者〜" count={admins.length} emptyMessage="管理者ユーザーはいません。">
        {admins.map((u) => (
          <UserRow key={u.userId} user={u} running={runningUserId === u.userId} actions={actionsFor(u)} onAction={(target) => u.userId && updateAuthFlg(u.userId, target)} />
        ))}
      </SectionCard>

      <SectionCard title="〜担当者〜" count={managers.length} emptyMessage="担当者はいません。">
        {managers.map((u) => (
          <UserRow key={u.userId} user={u} running={runningUserId === u.userId} actions={actionsFor(u)} onAction={(target) => u.userId && updateAuthFlg(u.userId, target)} />
        ))}
      </SectionCard>

      <SectionCard title="〜一般ユーザー〜" count={generalUsers.length} emptyMessage="一般ユーザーはいません。">
        {generalUsers.map((u) => (
          <UserRow key={u.userId} user={u} running={runningUserId === u.userId} actions={actionsFor(u)} onAction={(target) => u.userId && updateAuthFlg(u.userId, target)} />
        ))}
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, count, emptyMessage, children }: { title: string; count: number; emptyMessage: string; children: React.ReactNode }) {
  const childArray = React.Children.toArray(children);

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #f3f4f6",
          background: "#f9fafb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 18 }}>{title}</div>
        <div
          style={{
            fontSize: 12,
            padding: "4px 10px",
            borderRadius: 999,
            background: "#e5e7eb",
            color: "#374151",
            fontWeight: 700,
          }}
        >
          {count}件
        </div>
      </div>

      <div style={{ display: "grid" }}>{childArray.length > 0 ? childArray : <div style={{ padding: 16, color: "#6b7280", fontSize: 14 }}>{emptyMessage}</div>}</div>
    </div>
  );
}

function UserRow({ user, running, actions, onAction }: { user: UserItem; running: boolean; actions: RoleAction[]; onAction: (targetAuthFlg: number) => void }) {
  const role = authRoleInfo(user.authFlg);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 16,
        alignItems: "center",
        padding: 16,
        borderTop: "1px solid #f3f4f6",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 6,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{displayName(user)}</div>

          <span
            style={{
              display: "inline-block",
              padding: "3px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              background: role.bg,
              color: role.fg,
            }}
          >
            {role.label}
          </span>
        </div>

        <div style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>Email: {user.email ?? "-"}</div>

        <div style={{ fontSize: 12, color: "#6b7280" }}>
          登録日時: {user.registerTime ?? "-"} ／ 更新日時: {user.updateTime ?? "-"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {actions.map((a) => (
          <button
            key={a.targetAuthFlg}
            disabled={running || user.userId == null}
            onClick={() => onAction(a.targetAuthFlg)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: a.color,
              color: "white",
              fontWeight: 700,
              cursor: running ? "default" : "pointer",
              opacity: running ? 0.6 : 1,
              minWidth: 140,
            }}
          >
            {running ? "更新中..." : a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const buttonSecondaryStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "white",
  color: "#111827",
  fontWeight: 700,
  cursor: "pointer",
};
