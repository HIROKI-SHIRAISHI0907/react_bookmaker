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

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

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
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${txt ? `: ${txt}` : ""}`);
  }
  return (await res.json()) as T;
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
      const aOrder = a.authFlg === 1 ? 0 : 1;
      const bOrder = b.authFlg === 1 ? 0 : 1;
      if (aOrder !== bOrder) return aOrder - bOrder;

      const aName = displayName(a).toLowerCase();
      const bName = displayName(b).toLowerCase();
      if (aName < bName) return -1;
      if (aName > bName) return 1;

      return (a.userId ?? 0) - (b.userId ?? 0);
    });

    if (!k) return sorted;

    return sorted.filter((u) => [u.name ?? "", u.email ?? "", u.authLabel ?? "", u.authFlg === 1 ? "管理者" : "一般ユーザー"].join(" ").toLowerCase().includes(k));
  }, [users, keyword]);

  const admins = useMemo(() => filteredUsers.filter((u) => u.authFlg === 1), [filteredUsers]);

  const generalUsers = useMemo(() => filteredUsers.filter((u) => u.authFlg !== 1), [filteredUsers]);

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
        <div style={{ color: "#6b7280", fontSize: 14 }}>システム利用ユーザーの確認と、管理者権限の切り替えを行います。</div>
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
          <UserRow key={u.userId} user={u} running={runningUserId === u.userId} actionLabel="一般ユーザーに変更" actionColor="#dc2626" onAction={() => u.userId && updateAuthFlg(u.userId, 2)} />
        ))}
      </SectionCard>

      <SectionCard title="〜一般ユーザー〜" count={generalUsers.length} emptyMessage="一般ユーザーはいません。">
        {generalUsers.map((u) => (
          <UserRow key={u.userId} user={u} running={runningUserId === u.userId} actionLabel="管理者に設定" actionColor="#2563eb" onAction={() => u.userId && updateAuthFlg(u.userId, 1)} />
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

function UserRow({ user, running, actionLabel, actionColor, onAction }: { user: UserItem; running: boolean; actionLabel: string; actionColor: string; onAction: () => void }) {
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
              background: user.authFlg === 1 ? "#fee2e2" : "#dbeafe",
              color: user.authFlg === 1 ? "#991b1b" : "#1d4ed8",
            }}
          >
            {user.authFlg === 1 ? "管理者" : "一般ユーザー"}
          </span>
        </div>

        <div style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>Email: {user.email ?? "-"}</div>

        <div style={{ fontSize: 12, color: "#6b7280" }}>
          登録日時: {user.registerTime ?? "-"} ／ 更新日時: {user.updateTime ?? "-"}
        </div>
      </div>

      <div>
        <button
          disabled={running || user.userId == null}
          onClick={onAction}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: actionColor,
            color: "white",
            fontWeight: 700,
            cursor: running ? "default" : "pointer",
            opacity: running ? 0.6 : 1,
            minWidth: 160,
          }}
        >
          {running ? "更新中..." : actionLabel}
        </button>
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
