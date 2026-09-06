import React from "react";
import { useCurrentRole } from "../hooks/useCurrentRole";

/**
 * 指定したロール(ADMIN / ADMIN_SUB)のユーザーだけに子要素を表示するガード。
 * ルート定義側で使う想定:
 *   <Route path="approve/requests" element={<RequireRole role="ADMIN"><RequestReviewPage /></RequireRole>} />
 *
 * メニュー側で既に出し分けていても、URLを直接叩けば別ロールの画面に入れてしまうため、
 * ページ本体の保護として併用してください。
 */
export default function RequireRole({
  role,
  children,
}: {
  role: "ADMIN" | "ADMIN_SUB";
  children: React.ReactNode;
}) {
  const currentRole = useCurrentRole();

  if (currentRole !== role) {
    return (
      <div style={{ padding: 40, color: "#6b7280", fontSize: 14 }}>
        このページを表示する権限がありません。
      </div>
    );
  }

  return <>{children}</>;
}
