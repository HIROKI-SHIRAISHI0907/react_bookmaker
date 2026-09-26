import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { todayJst } from "../../../api/checkData";
import { colors } from "./AwsDashboardCommonPage";
import { DynamoDbTab, Ec2Tab, EcsTab, EventBridgeTab, IamTab, LambdaTab, OverviewTab, RdsTab, Route53Tab, S3Tab, VpcTab, type TabId, type TabProps } from "./AwsDashboardTabPage";

/**
 * AWS リソース状況（管理者のみ）
 *
 * - 対象日を選ぶと ECS の実行回数 / Lambda の実行回数がその日の値になる
 * - それ以外（EventBridge・S3・RDS・IAM・DynamoDB・EC2・VPC・Route53）は現在の状態
 * - 選択中のタブは URL の ?tab= に保持（リロードしても同じタブを開く）
 */

const TABS: { id: TabId; label: string; Comp: (p: TabProps) => React.ReactElement }[] = [
  { id: "overview", label: "概要", Comp: OverviewTab },
  { id: "ecs", label: "ECS", Comp: EcsTab },
  { id: "eventbridge", label: "EventBridge", Comp: EventBridgeTab },
  { id: "s3", label: "S3", Comp: S3Tab },
  { id: "rds", label: "RDS", Comp: RdsTab },
  { id: "iam", label: "IAM", Comp: IamTab },
  { id: "lambda", label: "Lambda", Comp: LambdaTab },
  { id: "dynamodb", label: "DynamoDB", Comp: DynamoDbTab },
  { id: "ec2", label: "EC2", Comp: Ec2Tab },
  { id: "vpc", label: "VPC", Comp: VpcTab },
  { id: "route53", label: "Route53", Comp: Route53Tab },
];

function isTabId(v: string | null): v is TabId {
  return v !== null && TABS.some((t) => t.id === v);
}

export default function AwsDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: TabId = isTabId(tabParam) ? tabParam : "overview";

  const [date, setDate] = useState<string>(todayJst);
  const [reload, setReload] = useState(0);
  const [account, setAccount] = useState<{ accountId: string | null; region: string } | null>(null);

  const selectTab = (id: TabId) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", id);
    setSearchParams(next, { replace: true });
  };

  const current = TABS.find((t) => t.id === tab) ?? TABS[0];
  const Current = current.Comp;

  const btn: React.CSSProperties = {
    font: "inherit",
    padding: "6px 12px",
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.text,
    cursor: "pointer",
  };

  return (
    <div style={{ color: colors.text, fontSize: 14 }}>
      {/* ===== ヘッダー ===== */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>AWS リソース状況</div>
          {account && (
            <div style={{ color: colors.muted, fontSize: 12.5, fontFamily: "ui-monospace, Menlo, Consolas, monospace" }}>
              {account.accountId ?? "—"} / {account.region}
            </div>
          )}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <label htmlFor="aws-dashboard-date" style={{ color: colors.muted, fontSize: 12.5 }}>
            対象日
          </label>
          <input id="aws-dashboard-date" type="date" value={date} max={todayJst()} onChange={(e) => e.target.value && setDate(e.target.value)} style={{ ...btn, cursor: "auto" }} />
          <button type="button" style={btn} onClick={() => setDate(todayJst())}>
            今日
          </button>
          <button type="button" style={{ ...btn, background: colors.accent, borderColor: colors.accent, color: "#fff", fontWeight: 700 }} onClick={() => setReload((n) => n + 1)}>
            再取得
          </button>
        </div>
      </div>

      {/* ===== タブ ===== */}
      <div
        role="tablist"
        aria-label="AWS サービス"
        style={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: 20,
        }}
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(t.id)}
              style={{
                font: "inherit",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${active ? colors.accent : "transparent"}`,
                color: active ? colors.accent : colors.muted,
                fontWeight: active ? 700 : 500,
                padding: "8px 14px 10px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ===== 本体 ===== */}
      <div role="tabpanel">
        <Current date={date} reload={reload} onSelectTab={selectTab} onAccount={setAccount} />
      </div>
    </div>
  );
}
