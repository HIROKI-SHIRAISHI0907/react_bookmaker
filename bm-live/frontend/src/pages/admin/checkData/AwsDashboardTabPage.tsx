import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  type DynamoSummary,
  type Ec2Summary,
  type EventBridgeSummary,
  type EcsSummary,
  type HostedZone,
  type IamSummary,
  type LambdaSummary,
  type Overview,
  type RdsSummary,
  type RdsTables,
  type RecordSet,
  type Route53Summary,
  type S3Summary,
  type VpcSummary,
  fmtBytes,
  fmtDate,
  fmtNum,
  useAwsApi,
} from "../../../api/checkData";
import { Badge, DataTable, HourlyBars, Mono, Note, Panel, Section, SmallButton, Stat, StatRow, type Tone, colors } from "./AwsDashboardCommonPage";

/** 各タブ共通の props */
export type TabProps = {
  date: string;
  reload: number;
  onSelectTab: (id: TabId) => void;
  onAccount: (info: { accountId: string | null; region: string }) => void;
};

export type TabId = "overview" | "ecs" | "eventbridge" | "s3" | "rds" | "iam" | "lambda" | "dynamodb" | "ec2" | "vpc" | "route53" | "report";

// =====================================================================
// 概要
// =====================================================================

const SERVICE_TAB: Record<string, TabId> = {
  ECS: "ecs",
  S3: "s3",
  RDS: "rds",
  IAM: "iam",
  Lambda: "lambda",
  DynamoDB: "dynamodb",
  EC2: "ec2",
  Route53: "route53",
  EventBridge: "eventbridge",
  VPC: "vpc",
};

export function OverviewTab({ date, reload, onSelectTab, onAccount }: TabProps) {
  const state = useAwsApi<Overview>("overview", { date, reload });

  useEffect(() => {
    if (state.data) onAccount({ accountId: state.data.accountId, region: state.data.region });
  }, [state.data, onAccount]);

  return (
    <Panel state={state}>
      {(d) => (
        <Section title={`${d.date} の概要`} right={<Note>ECS / Lambda の回数は対象日、それ以外は現在の状態</Note>}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {d.items.map((it) => (
              <button
                key={it.service}
                type="button"
                onClick={() => onSelectTab(SERVICE_TAB[it.service] ?? "overview")}
                style={{
                  textAlign: "left",
                  font: "inherit",
                  color: colors.text,
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  {it.service}
                  {it.ok ? <Badge tone="ok">OK</Badge> : <Badge tone="bad">エラー</Badge>}
                </div>
                {it.ok ? (
                  <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "1fr auto", gap: "4px 12px" }}>
                    {Object.entries(it.metrics).map(([k, v]) => (
                      <React.Fragment key={k}>
                        <dt style={{ color: colors.muted }}>{k}</dt>
                        <dd style={{ margin: 0, textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{typeof v === "number" ? fmtNum(v) : String(v)}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                ) : (
                  <span style={{ color: colors.bad, fontSize: 12.5, wordBreak: "break-all" }}>{it.error}</span>
                )}
              </button>
            ))}
          </div>
        </Section>
      )}
    </Panel>
  );
}

// =====================================================================
// ECS
// =====================================================================

export function EcsTab({ date, reload }: TabProps) {
  const state = useAwsApi<EcsSummary>("ecs", { date, reload });

  return (
    <Panel state={state}>
      {(d) => (
        <>
          <StatRow>
            <Stat label={`${d.date} の実行回数 (RunTask)`} value={fmtNum(d.runCount)} />
            <Stat label="起動したタスク数" value={fmtNum(d.launchedTaskCount)} />
            <Stat label="失敗した実行" value={fmtNum(d.failedRunCount)} tone={d.failedRunCount > 0 ? "bad" : undefined} />
            <Stat label="クラスター数" value={fmtNum(d.clusters.length)} />
          </StatRow>

          <Section title="時間帯別の実行回数" right={<Note>CloudTrail の反映は最大15分ほど遅れます</Note>}>
            <HourlyBars values={d.hourly} />
          </Section>

          <Section title="タスク定義別">
            <DataTable
              rows={d.byTaskDefinition}
              rowKey={(r) => r.taskDefinition}
              initialSort={{ key: "runs", dir: "desc" }}
              columns={[
                { key: "taskDefinition", label: "タスク定義", render: (r) => <Mono>{r.taskDefinition}</Mono> },
                { key: "runs", label: "実行回数", align: "right", render: (r) => fmtNum(r.runs) },
                { key: "launchedTasks", label: "起動タスク", align: "right", render: (r) => fmtNum(r.launchedTasks) },
                {
                  key: "failedRuns",
                  label: "失敗",
                  align: "right",
                  render: (r) => (r.failedRuns > 0 ? <Badge tone="bad">{r.failedRuns}</Badge> : "0"),
                },
              ]}
            />
          </Section>

          <Section title="実行履歴">
            <DataTable
              rows={d.runs}
              searchKeys={["taskDefinition", "cluster", "startedBy", "invokedBy", "errorCode"]}
              initialSort={{ key: "eventTime", dir: "desc" }}
              columns={[
                { key: "eventTime", label: "時刻", render: (r) => fmtDate(r.eventTime) },
                { key: "cluster", label: "クラスター" },
                { key: "taskDefinition", label: "タスク定義", render: (r) => <Mono>{r.taskDefinition}</Mono> },
                {
                  key: "invokedBy",
                  label: "実行元",
                  render: (r) => <Mono>{r.startedBy || r.invokedBy || "—"}</Mono>,
                },
                { key: "launchedTasks", label: "タスク", align: "right", render: (r) => String(r.launchedTasks) },
                {
                  key: "errorCode",
                  label: "結果",
                  sortValue: (r) => r.errorCode ?? (r.failures > 0 && r.launchedTasks === 0 ? "起動失敗" : ""),
                  render: (r) =>
                    r.errorCode ? <Badge tone="bad">{r.errorCode}</Badge> : r.failures > 0 && r.launchedTasks === 0 ? <Badge tone="bad">起動失敗 {r.failures}</Badge> : <Badge tone="ok">成功</Badge>,
                },
              ]}
            />
          </Section>

          <Section title="クラスター（現在）">
            <DataTable
              rows={d.clusters}
              rowKey={(r) => r.name}
              columns={[
                { key: "name", label: "クラスター" },
                {
                  key: "status",
                  label: "状態",
                  render: (r) => <Badge tone={r.status === "ACTIVE" ? "ok" : "neutral"}>{r.status}</Badge>,
                },
                { key: "runningTasks", label: "実行中タスク", align: "right", render: (r) => String(r.runningTasks) },
                { key: "pendingTasks", label: "保留タスク", align: "right", render: (r) => String(r.pendingTasks) },
                { key: "activeServices", label: "サービス", align: "right", render: (r) => String(r.activeServices) },
              ]}
            />
          </Section>
        </>
      )}
    </Panel>
  );
}

// =====================================================================
// S3
// =====================================================================

export function S3Tab({ reload }: TabProps) {
  const state = useAwsApi<S3Summary>("s3", { reload });

  return (
    <Panel state={state}>
      {(d) => (
        <>
          <StatRow>
            <Stat label="バケット数" value={fmtNum(d.bucketCount)} />
            {Object.entries(d.byRegion).map(([region, n]) => (
              <Stat key={region} label={region} value={fmtNum(n)} />
            ))}
          </StatRow>
          <Section title="バケット一覧">
            <DataTable
              rows={d.buckets}
              rowKey={(r) => r.name}
              searchKeys={["name", "region"]}
              columns={[
                { key: "name", label: "バケット名", render: (r) => <Mono>{r.name}</Mono> },
                { key: "region", label: "リージョン" },
                { key: "creationDate", label: "作成日時", render: (r) => fmtDate(r.creationDate) },
              ]}
            />
          </Section>
        </>
      )}
    </Panel>
  );
}

// =====================================================================
// RDS
// =====================================================================

export function RdsTab({ reload }: TabProps) {
  const state = useAwsApi<RdsSummary>("rds", { reload });
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <Panel state={state}>
      {(d) => {
        // 選択中の DB（URL の ?db= に保持。無ければ先頭の DB）
        const dbParam = searchParams.get("db");
        const selected = d.databases.find((x) => x.key === dbParam) ?? d.databases.find((x) => !x.error) ?? null;
        const selectDb = (key: string) => {
          const next = new URLSearchParams(searchParams);
          next.set("db", key);
          next.delete("schema");
          setSearchParams(next, { replace: true });
        };

        return (
          <>
            <StatRow>
              <Stat label="インスタンス数" value={fmtNum(d.instanceCount)} />
              <Stat label="データベース数" value={fmtNum(d.databases.length)} />
            </StatRow>

            <Section title="インスタンス">
              <DataTable
                rows={d.instances}
                rowKey={(r) => r.identifier}
                columns={[
                  { key: "identifier", label: "識別子", render: (r) => <Mono>{r.identifier}</Mono> },
                  { key: "engine", label: "エンジン", render: (r) => `${r.engine} ${r.engineVersion ?? ""}` },
                  { key: "instanceClass", label: "クラス" },
                  {
                    key: "status",
                    label: "状態",
                    render: (r) => <Badge tone={r.status === "available" ? "ok" : "warn"}>{r.status}</Badge>,
                  },
                  { key: "multiAz", label: "Multi-AZ", render: (r) => (r.multiAz ? "あり" : "なし") },
                  {
                    key: "allocatedStorageGb",
                    label: "ストレージ",
                    align: "right",
                    render: (r) => (r.allocatedStorageGb ? `${r.allocatedStorageGb} GB` : "—"),
                  },
                  {
                    key: "endpoint",
                    label: "エンドポイント",
                    render: (r) => <Mono>{r.endpoint ? `${r.endpoint}:${r.port}` : "—"}</Mono>,
                  },
                ]}
              />
            </Section>

            <Section
              title="テーブル別レコード件数"
              right={
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} role="group" aria-label="データベース">
                  {d.databases.map((db) => (
                    <SmallButton key={db.key} active={selected?.key === db.key} onClick={() => selectDb(db.key)}>
                      {db.database}
                      {db.error ? " ⚠" : ""}
                    </SmallButton>
                  ))}
                </div>
              }
            >
              {selected?.error && <ErrorBox>接続に失敗: {selected.error}</ErrorBox>}
              {selected && !selected.error ? (
                <RdsTablesView dbKey={selected.key} reload={reload} />
              ) : (
                !selected && <div style={{ padding: "48px 0", textAlign: "center", color: colors.muted }}>接続できる DB がありません</div>
              )}
            </Section>
          </>
        );
      }}
    </Panel>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: colors.bad,
        background: colors.badSoft,
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 12,
        wordBreak: "break-all",
      }}
    >
      {children}
    </div>
  );
}

/** 1 DB 分のテーブル件数。スキーマは「すべて / 各スキーマ」で切り替え（URL の ?schema= に保持） */
function RdsTablesView({ dbKey, reload }: { dbKey: string; reload: number }) {
  const state = useAwsApi<RdsTables>(`rds/tables?db=${encodeURIComponent(dbKey)}`, { reload });
  const [searchParams, setSearchParams] = useSearchParams();
  const schemaParam = searchParams.get("schema");

  const selectSchema = (schema: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (schema) next.set("schema", schema);
    else next.delete("schema");
    setSearchParams(next, { replace: true });
  };

  return (
    <Panel state={state}>
      {(t) => {
        const schema = schemaParam && t.schemas.includes(schemaParam) ? schemaParam : null;
        const rows = schema ? t.tables.filter((x) => x.schema === schema) : t.tables;
        const total = rows.reduce((sum, x) => sum + x.rows, 0);
        const estimated = rows.filter((x) => x.estimated).length;

        return (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={{ color: colors.muted, fontSize: 12.5, marginRight: 4 }}>スキーマ</span>
              <SmallButton active={schema === null} onClick={() => selectSchema(null)}>
                すべて（{t.schemas.length}）
              </SmallButton>
              {t.schemas.map((sc) => (
                <SmallButton key={sc} active={schema === sc} onClick={() => selectSchema(sc)}>
                  {sc}
                </SmallButton>
              ))}
            </div>

            <StatRow>
              <Stat label="テーブル数" value={fmtNum(rows.length)} />
              <Stat label={`総レコード数${estimated > 0 ? "（一部推定）" : ""}`} value={fmtNum(total)} />
            </StatRow>

            <div style={{ marginBottom: 8 }}>
              <Note>
                {t.database}
                {t.product ? `（${t.product}）` : ""} ・{" "}
                {t.exactCountEnabled ? `${fmtNum(t.maxExactRows)} 行以下のテーブルは COUNT(*)、それより大きいテーブルは統計情報の推定値` : "すべて統計情報の推定値"}
              </Note>
            </div>

            <DataTable
              key={`${t.key}|${schema ?? ""}`}
              rows={rows}
              rowKey={(r) => `${r.schema}.${r.table}`}
              searchKeys={["table", "schema"]}
              initialSort={{ key: "rows", dir: "desc" }}
              columns={[
                { key: "schema", label: "スキーマ", render: (r) => <Mono>{r.schema}</Mono> },
                { key: "table", label: "テーブル", render: (r) => <Mono>{r.table}</Mono> },
                {
                  key: "rows",
                  label: "件数",
                  align: "right",
                  render: (r) => (
                    <>
                      {r.estimated && (
                        <span style={{ marginRight: 6 }}>
                          <Badge tone="warn">推定</Badge>
                        </span>
                      )}
                      {r.estimated ? "約 " : ""}
                      {fmtNum(r.rows)}
                    </>
                  ),
                },
              ]}
            />
          </>
        );
      }}
    </Panel>
  );
}

// =====================================================================
// IAM
// =====================================================================

const IAM_LABELS: Record<string, string> = {
  Users: "ユーザー",
  Roles: "ロール",
  Groups: "グループ",
  Policies: "カスタムポリシー",
  MFADevices: "MFA デバイス",
  MFADevicesInUse: "使用中 MFA",
  AccountMFAEnabled: "ルート MFA",
  Providers: "ID プロバイダ",
  InstanceProfiles: "インスタンスプロファイル",
  AccessKeysPerUserQuota: "キー上限/ユーザー",
};

export function IamTab({ reload }: TabProps) {
  const state = useAwsApi<IamSummary>("iam", { reload });
  const [view, setView] = useState<"roles" | "users">("roles");

  return (
    <Panel state={state}>
      {(d) => (
        <>
          <StatRow>
            {Object.entries(d.accountSummary).map(([k, v]) => (
              <Stat
                key={k}
                label={IAM_LABELS[k] ?? k}
                value={k === "AccountMFAEnabled" ? (v === 1 ? "有効" : "無効") : fmtNum(v)}
                tone={k === "AccountMFAEnabled" ? (v === 1 ? "ok" : "bad") : undefined}
              />
            ))}
          </StatRow>

          <Section
            title={view === "roles" ? `ロール（${d.roles.length}）` : `ユーザー（${d.users.length}）`}
            right={
              <div style={{ display: "flex", gap: 6 }}>
                <SmallButton active={view === "roles"} onClick={() => setView("roles")}>
                  ロール
                </SmallButton>
                <SmallButton active={view === "users"} onClick={() => setView("users")}>
                  ユーザー
                </SmallButton>
              </div>
            }
          >
            {view === "roles" ? (
              <DataTable
                key="roles"
                rows={d.roles}
                rowKey={(r) => r.name}
                searchKeys={["name", "path", "description"]}
                columns={[
                  { key: "name", label: "ロール名", render: (r) => <Mono>{r.name}</Mono> },
                  { key: "path", label: "パス", render: (r) => <Mono>{r.path}</Mono> },
                  { key: "description", label: "説明", render: (r) => r.description ?? "—" },
                  { key: "createDate", label: "作成日時", render: (r) => fmtDate(r.createDate) },
                ]}
              />
            ) : (
              <DataTable
                key="users"
                rows={d.users}
                rowKey={(r) => r.name}
                searchKeys={["name"]}
                columns={[
                  { key: "name", label: "ユーザー名", render: (r) => <Mono>{r.name}</Mono> },
                  { key: "createDate", label: "作成日時", render: (r) => fmtDate(r.createDate) },
                  { key: "passwordLastUsed", label: "最終ログイン", render: (r) => fmtDate(r.passwordLastUsed) },
                ]}
              />
            )}
          </Section>
        </>
      )}
    </Panel>
  );
}

// =====================================================================
// Lambda
// =====================================================================

export function LambdaTab({ date, reload }: TabProps) {
  const state = useAwsApi<LambdaSummary>("lambda", { date, reload });

  return (
    <Panel state={state}>
      {(d) => (
        <>
          <StatRow>
            <Stat label="関数数" value={fmtNum(d.functionCount)} />
            <Stat label={`${d.date} の実行回数`} value={fmtNum(d.totalInvocations)} />
            <Stat label="エラー数" value={fmtNum(d.totalErrors)} tone={d.totalErrors > 0 ? "bad" : undefined} />
          </StatRow>
          <Section title="関数一覧" right={<Note>実行回数は CloudWatch メトリクス（Invocations / Errors）</Note>}>
            <DataTable
              rows={d.functions}
              rowKey={(r) => r.name}
              searchKeys={["name", "runtime", "handler"]}
              initialSort={{ key: "invocations", dir: "desc" }}
              columns={[
                { key: "name", label: "関数名", render: (r) => <Mono>{r.name}</Mono> },
                { key: "runtime", label: "ランタイム", render: (r) => r.runtime ?? "—" },
                { key: "invocations", label: "実行回数", align: "right", render: (r) => fmtNum(r.invocations) },
                {
                  key: "errors",
                  label: "エラー",
                  align: "right",
                  render: (r) => (r.errors > 0 ? <Badge tone="bad">{fmtNum(r.errors)}</Badge> : "0"),
                },
                { key: "memoryMb", label: "メモリ", align: "right", render: (r) => `${r.memoryMb ?? "—"} MB` },
                { key: "timeoutSec", label: "タイムアウト", align: "right", render: (r) => `${r.timeoutSec ?? "—"} 秒` },
                { key: "codeSizeBytes", label: "コード", align: "right", render: (r) => fmtBytes(r.codeSizeBytes) },
                { key: "lastModified", label: "最終更新", render: (r) => fmtDate(r.lastModified) },
              ]}
            />
          </Section>
        </>
      )}
    </Panel>
  );
}

// =====================================================================
// DynamoDB
// =====================================================================

export function DynamoDbTab({ reload }: TabProps) {
  const state = useAwsApi<DynamoSummary>("dynamodb", { reload });

  return (
    <Panel state={state}>
      {(d) => (
        <>
          <StatRow>
            <Stat label="テーブル数" value={fmtNum(d.tableCount)} />
            <Stat label="アイテム数（概算）" value={fmtNum(d.totalItems)} />
          </StatRow>
          <Section title="テーブル一覧" right={<Note>アイテム数・サイズは AWS 側で約6時間ごとに更新</Note>}>
            <DataTable
              rows={d.tables}
              rowKey={(r) => r.name}
              searchKeys={["name", "billingMode"]}
              columns={[
                { key: "name", label: "テーブル名", render: (r) => <Mono>{r.name}</Mono> },
                {
                  key: "status",
                  label: "状態",
                  render: (r) => <Badge tone={r.status === "ACTIVE" ? "ok" : "warn"}>{r.status}</Badge>,
                },
                { key: "itemCount", label: "アイテム数", align: "right", render: (r) => fmtNum(r.itemCount) },
                { key: "sizeBytes", label: "サイズ", align: "right", render: (r) => fmtBytes(r.sizeBytes) },
                { key: "billingMode", label: "課金モード" },
                { key: "creationDate", label: "作成日時", render: (r) => fmtDate(r.creationDate) },
              ]}
            />
          </Section>
        </>
      )}
    </Panel>
  );
}

// =====================================================================
// EC2
// =====================================================================

const EC2_TONE: Record<string, Tone> = {
  running: "ok",
  stopped: "neutral",
  pending: "warn",
  stopping: "warn",
  "shutting-down": "warn",
  terminated: "bad",
};

export function Ec2Tab({ reload }: TabProps) {
  const state = useAwsApi<Ec2Summary>("ec2", { reload });

  return (
    <Panel state={state}>
      {(d) => (
        <>
          <StatRow>
            <Stat label="インスタンス数" value={fmtNum(d.instanceCount)} />
            {Object.entries(d.byState).map(([s, n]) => (
              <Stat key={s} label={s} value={fmtNum(n)} tone={s === "running" ? "ok" : undefined} />
            ))}
          </StatRow>
          <Section title="インスタンス一覧">
            <DataTable
              rows={d.instances}
              rowKey={(r) => r.instanceId}
              searchKeys={["instanceId", "name", "type", "state", "privateIp", "publicIp"]}
              columns={[
                { key: "name", label: "Name", render: (r) => r.name ?? "—" },
                { key: "instanceId", label: "ID", render: (r) => <Mono>{r.instanceId}</Mono> },
                { key: "type", label: "タイプ" },
                {
                  key: "state",
                  label: "状態",
                  render: (r) => <Badge tone={EC2_TONE[r.state] ?? "neutral"}>{r.state}</Badge>,
                },
                { key: "az", label: "AZ", render: (r) => r.az ?? "—" },
                { key: "privateIp", label: "プライベートIP", render: (r) => <Mono>{r.privateIp ?? "—"}</Mono> },
                { key: "publicIp", label: "パブリックIP", render: (r) => <Mono>{r.publicIp ?? "—"}</Mono> },
                { key: "platform", label: "プラットフォーム", render: (r) => r.platform ?? "—" },
                { key: "launchTime", label: "起動日時", render: (r) => fmtDate(r.launchTime) },
              ]}
            />
          </Section>
        </>
      )}
    </Panel>
  );
}

// =====================================================================
// Route53
// =====================================================================

export function Route53Tab({ reload }: TabProps) {
  const state = useAwsApi<Route53Summary>("route53", { reload });
  const [zone, setZone] = useState<HostedZone | null>(null);

  return (
    <Panel state={state}>
      {(d) => (
        <>
          <StatRow>
            <Stat label="ホストゾーン数" value={fmtNum(d.zoneCount)} />
            <Stat label="レコード総数" value={fmtNum(d.totalRecords)} />
          </StatRow>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: 16,
              alignItems: "start",
            }}
          >
            <Section title="ホストゾーン" right={<Note>行をクリックでレコード表示</Note>}>
              <DataTable
                rows={d.zones}
                rowKey={(r) => r.id}
                selectedKey={zone?.id ?? null}
                onRowClick={setZone}
                searchKeys={["name", "id"]}
                columns={[
                  { key: "name", label: "ドメイン", render: (r) => <Mono>{r.name}</Mono> },
                  {
                    key: "privateZone",
                    label: "種別",
                    render: (r) => <Badge tone={r.privateZone ? "warn" : "ok"}>{r.privateZone ? "プライベート" : "パブリック"}</Badge>,
                  },
                  { key: "recordCount", label: "レコード", align: "right", render: (r) => fmtNum(r.recordCount) },
                ]}
              />
            </Section>
            <Section title={zone ? `レコード: ${zone.name}` : "レコード"}>
              {zone ? <Route53Records zoneId={zone.id} reload={reload} /> : <div style={{ padding: "48px 0", textAlign: "center", color: colors.muted }}>ホストゾーンを選択してください</div>}
            </Section>
          </div>
        </>
      )}
    </Panel>
  );
}

function Route53Records({ zoneId, reload }: { zoneId: string; reload: number }) {
  const state = useAwsApi<RecordSet[]>(`route53/zones/${encodeURIComponent(zoneId)}/records`, { reload });
  return (
    <Panel state={state}>
      {(rows) => (
        <DataTable
          rows={rows}
          rowKey={(r) => `${r.name}|${r.type}|${r.values.join(",")}|${r.aliasTarget ?? ""}`}
          searchKeys={["name", "type"]}
          columns={[
            { key: "name", label: "名前", render: (r) => <Mono>{r.name}</Mono> },
            { key: "type", label: "タイプ", render: (r) => <Badge>{r.type}</Badge> },
            {
              key: "ttl",
              label: "TTL",
              align: "right",
              render: (r) => (r.ttl != null ? String(r.ttl) : r.aliasTarget ? "Alias" : "—"),
            },
            {
              key: "values",
              label: "値",
              sortValue: (r) => r.aliasTarget ?? r.values.join(","),
              render: (r) => (
                <span
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                    fontSize: 12.5,
                    wordBreak: "break-all",
                    whiteSpace: "pre-line",
                  }}
                >
                  {r.aliasTarget ? `→ ${r.aliasTarget}` : r.values.join("\n")}
                </span>
              ),
            },
          ]}
        />
      )}
    </Panel>
  );
}

// =====================================================================
// EventBridge
// =====================================================================

/** cron(0 10 * * ? *) などをそのまま等幅で表示 */
function Expr({ v }: { v: string | null }) {
  return v ? <Mono>{v}</Mono> : <>—</>;
}

export function EventBridgeTab({ reload }: TabProps) {
  const state = useAwsApi<EventBridgeSummary>("eventbridge", { reload });
  const [view, setView] = useState<"schedules" | "rules">("schedules");

  return (
    <Panel state={state}>
      {(d) => (
        <>
          <StatRow>
            <Stat label="スケジュール（Scheduler）" value={fmtNum(d.scheduleCount)} />
            <Stat label="有効なスケジュール" value={fmtNum(d.enabledScheduleCount)} tone="ok" />
            <Stat label="ルール" value={fmtNum(d.ruleCount)} />
            <Stat label="有効なルール" value={fmtNum(d.enabledRuleCount)} tone="ok" />
            <Stat label="イベントバス" value={fmtNum(d.busCount)} />
          </StatRow>

          <Section
            title={view === "schedules" ? `スケジュール（${d.schedules.length}）` : `ルール（${d.rules.length}）`}
            right={
              <div style={{ display: "flex", gap: 6 }}>
                <SmallButton active={view === "schedules"} onClick={() => setView("schedules")}>
                  スケジュール
                </SmallButton>
                <SmallButton active={view === "rules"} onClick={() => setView("rules")}>
                  ルール
                </SmallButton>
              </div>
            }
          >
            {view === "schedules" ? (
              <>
                {d.scheduleError && <ErrorBox>スケジュールの取得に失敗: {d.scheduleError}</ErrorBox>}
                <DataTable
                  key="schedules"
                  rows={d.schedules}
                  rowKey={(r) => `${r.group ?? ""}/${r.name}`}
                  searchKeys={["name", "group", "expression", "target", "taskDefinition"]}
                  columns={[
                    { key: "name", label: "名前", render: (r) => <Mono>{r.name}</Mono> },
                    { key: "group", label: "グループ", render: (r) => r.group ?? "—" },
                    {
                      key: "state",
                      label: "状態",
                      render: (r) => <Badge tone={r.state === "ENABLED" ? "ok" : "neutral"}>{r.state}</Badge>,
                    },
                    { key: "expression", label: "スケジュール式", render: (r) => <Expr v={r.expression} /> },
                    { key: "timezone", label: "タイムゾーン", render: (r) => r.timezone ?? "UTC" },
                    { key: "taskDefinition", label: "タスク定義", render: (r) => <Mono>{r.taskDefinition ?? "—"}</Mono> },
                    { key: "target", label: "起動先", render: (r) => <Mono>{r.target ?? "—"}</Mono> },
                    { key: "lastModified", label: "最終更新", render: (r) => fmtDate(r.lastModified) },
                  ]}
                />
              </>
            ) : (
              <>
                {d.ruleError && <ErrorBox>ルールの取得に失敗: {d.ruleError}</ErrorBox>}
                <DataTable
                  key="rules"
                  rows={d.rules}
                  rowKey={(r) => `${r.bus}/${r.name}`}
                  searchKeys={["name", "bus", "scheduleExpression", "managedBy"]}
                  columns={[
                    { key: "name", label: "ルール名", render: (r) => <Mono>{r.name}</Mono> },
                    { key: "bus", label: "イベントバス" },
                    {
                      key: "state",
                      label: "状態",
                      render: (r) => <Badge tone={r.state === "ENABLED" ? "ok" : "neutral"}>{r.state}</Badge>,
                    },
                    {
                      key: "scheduleExpression",
                      label: "起動条件",
                      sortValue: (r) => r.scheduleExpression ?? (r.eventPattern ? "イベント" : ""),
                      render: (r) => (r.scheduleExpression ? <Expr v={r.scheduleExpression} /> : r.eventPattern ? <Badge>イベントパターン</Badge> : "—"),
                    },
                    {
                      key: "targets",
                      label: "ターゲット",
                      sortValue: (r) => r.targets.join(","),
                      render: (r) => (
                        <span style={{ whiteSpace: "pre-line", wordBreak: "break-all" }}>
                          <Mono>{r.targets.length ? r.targets.join("\n") : "—"}</Mono>
                        </span>
                      ),
                    },
                    { key: "managedBy", label: "管理元", render: (r) => r.managedBy ?? "—" },
                  ]}
                />
              </>
            )}
          </Section>
        </>
      )}
    </Panel>
  );
}

// =====================================================================
// VPC
// =====================================================================

type VpcView = "vpcs" | "subnets" | "sg" | "nat" | "endpoints" | "eip";

export function VpcTab({ reload }: TabProps) {
  const state = useAwsApi<VpcSummary>("vpc", { reload });
  const [view, setView] = useState<VpcView>("vpcs");

  return (
    <Panel state={state}>
      {(d) => {
        const views: { id: VpcView; label: string }[] = [
          { id: "vpcs", label: `VPC（${d.vpcCount}）` },
          { id: "subnets", label: `サブネット（${d.subnetCount}）` },
          { id: "sg", label: `セキュリティグループ（${d.securityGroupCount}）` },
          { id: "nat", label: `NAT ゲートウェイ（${d.natGateways.length}）` },
          { id: "endpoints", label: `エンドポイント（${d.endpointCount}）` },
          { id: "eip", label: `Elastic IP（${d.elasticIpCount}）` },
        ];

        return (
          <>
            <StatRow>
              <Stat label="VPC" value={fmtNum(d.vpcCount)} />
              <Stat label="サブネット" value={fmtNum(d.subnetCount)} />
              <Stat label="セキュリティグループ" value={fmtNum(d.securityGroupCount)} />
              <Stat label="全開放ルールのある SG" value={fmtNum(d.openSecurityGroupCount)} tone={d.openSecurityGroupCount > 0 ? "bad" : undefined} />
              <Stat label="稼働中の NAT ゲートウェイ（課金）" value={fmtNum(d.activeNatGatewayCount)} />
              <Stat label="未使用の Elastic IP（課金）" value={fmtNum(d.unassociatedElasticIpCount)} tone={d.unassociatedElasticIpCount > 0 ? "bad" : undefined} />
            </StatRow>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }} role="group" aria-label="表示">
              {views.map((v) => (
                <SmallButton key={v.id} active={view === v.id} onClick={() => setView(v.id)}>
                  {v.label}
                </SmallButton>
              ))}
            </div>

            {view === "vpcs" && (
              <DataTable
                key="vpcs"
                rows={d.vpcs}
                rowKey={(r) => r.vpcId}
                searchKeys={["vpcId", "name", "cidr"]}
                columns={[
                  { key: "name", label: "Name", render: (r) => r.name ?? "—" },
                  { key: "vpcId", label: "VPC ID", render: (r) => <Mono>{r.vpcId}</Mono> },
                  { key: "cidr", label: "CIDR", render: (r) => <Mono>{r.cidr}</Mono> },
                  {
                    key: "state",
                    label: "状態",
                    render: (r) => <Badge tone={r.state === "available" ? "ok" : "warn"}>{r.state}</Badge>,
                  },
                  { key: "defaultVpc", label: "デフォルト", render: (r) => (r.defaultVpc ? <Badge>デフォルト</Badge> : "—") },
                  { key: "subnetCount", label: "サブネット", align: "right", render: (r) => String(r.subnetCount) },
                  { key: "securityGroupCount", label: "SG", align: "right", render: (r) => String(r.securityGroupCount) },
                  { key: "internetGatewayId", label: "IGW", render: (r) => <Mono>{r.internetGatewayId ?? "なし"}</Mono> },
                ]}
              />
            )}

            {view === "subnets" && (
              <DataTable
                key="subnets"
                rows={d.subnets}
                rowKey={(r) => r.subnetId}
                searchKeys={["subnetId", "name", "vpcId", "cidr", "az"]}
                columns={[
                  { key: "name", label: "Name", render: (r) => r.name ?? "—" },
                  { key: "subnetId", label: "サブネット ID", render: (r) => <Mono>{r.subnetId}</Mono> },
                  { key: "vpcId", label: "VPC", render: (r) => <Mono>{r.vpcId}</Mono> },
                  { key: "cidr", label: "CIDR", render: (r) => <Mono>{r.cidr}</Mono> },
                  { key: "az", label: "AZ", render: (r) => r.az ?? "—" },
                  { key: "availableIps", label: "空き IP", align: "right", render: (r) => fmtNum(r.availableIps) },
                  {
                    key: "publicOnLaunch",
                    label: "パブリック IP 自動割当",
                    render: (r) => (r.publicOnLaunch ? <Badge tone="warn">あり</Badge> : "なし"),
                  },
                ]}
              />
            )}

            {view === "sg" && (
              <DataTable
                key="sg"
                rows={d.securityGroups}
                rowKey={(r) => r.groupId}
                searchKeys={["groupId", "name", "vpcId", "description"]}
                initialSort={{ key: "openToWorld", dir: "desc" }}
                columns={[
                  { key: "name", label: "グループ名", render: (r) => <Mono>{r.name}</Mono> },
                  { key: "groupId", label: "ID", render: (r) => <Mono>{r.groupId}</Mono> },
                  { key: "vpcId", label: "VPC", render: (r) => <Mono>{r.vpcId ?? "—"}</Mono> },
                  {
                    key: "openToWorld",
                    label: "全開放",
                    sortValue: (r) => (r.openToWorld ? 1 : 0),
                    render: (r) => (r.openToWorld ? <Badge tone="bad">0.0.0.0/0 あり</Badge> : "—"),
                  },
                  {
                    key: "inbound",
                    label: "インバウンド",
                    sortValue: (r) => r.inbound.length,
                    render: (r) => (
                      <span style={{ whiteSpace: "pre-line" }}>
                        <Mono>{r.inbound.length ? r.inbound.join("\n") : "（なし）"}</Mono>
                      </span>
                    ),
                  },
                  { key: "outboundRuleCount", label: "アウトバウンド", align: "right", render: (r) => `${r.outboundRuleCount} 件` },
                  { key: "description", label: "説明", render: (r) => r.description ?? "—" },
                ]}
              />
            )}

            {view === "nat" && (
              <DataTable
                key="nat"
                rows={d.natGateways}
                rowKey={(r) => r.natGatewayId}
                empty="NAT ゲートウェイはありません"
                columns={[
                  { key: "name", label: "Name", render: (r) => r.name ?? "—" },
                  { key: "natGatewayId", label: "ID", render: (r) => <Mono>{r.natGatewayId}</Mono> },
                  {
                    key: "state",
                    label: "状態",
                    render: (r) => <Badge tone={r.state === "available" ? "ok" : "warn"}>{r.state}</Badge>,
                  },
                  { key: "connectivity", label: "種別", render: (r) => r.connectivity ?? "—" },
                  { key: "publicIp", label: "パブリック IP", render: (r) => <Mono>{r.publicIp ?? "—"}</Mono> },
                  { key: "vpcId", label: "VPC", render: (r) => <Mono>{r.vpcId ?? "—"}</Mono> },
                  { key: "subnetId", label: "サブネット", render: (r) => <Mono>{r.subnetId ?? "—"}</Mono> },
                ]}
              />
            )}

            {view === "endpoints" && (
              <DataTable
                key="endpoints"
                rows={d.endpoints}
                rowKey={(r) => r.endpointId}
                searchKeys={["serviceName", "endpointId", "vpcId"]}
                empty="VPC エンドポイントはありません"
                columns={[
                  { key: "serviceName", label: "サービス", render: (r) => <Mono>{r.serviceName}</Mono> },
                  { key: "type", label: "種別", render: (r) => r.type ?? "—" },
                  {
                    key: "state",
                    label: "状態",
                    render: (r) => <Badge tone={(r.state ?? "").toLowerCase() === "available" ? "ok" : "warn"}>{r.state ?? "—"}</Badge>,
                  },
                  { key: "endpointId", label: "ID", render: (r) => <Mono>{r.endpointId}</Mono> },
                  { key: "vpcId", label: "VPC", render: (r) => <Mono>{r.vpcId ?? "—"}</Mono> },
                ]}
              />
            )}

            {view === "eip" && (
              <DataTable
                key="eip"
                rows={d.elasticIps}
                rowKey={(r) => r.allocationId ?? r.publicIp}
                empty="Elastic IP はありません"
                initialSort={{ key: "associated", dir: "asc" }}
                columns={[
                  { key: "publicIp", label: "パブリック IP", render: (r) => <Mono>{r.publicIp}</Mono> },
                  { key: "name", label: "Name", render: (r) => r.name ?? "—" },
                  {
                    key: "associated",
                    label: "状態",
                    sortValue: (r) => (r.associated ? 1 : 0),
                    render: (r) => (r.associated ? <Badge tone="ok">使用中</Badge> : <Badge tone="bad">未使用（課金中）</Badge>),
                  },
                  { key: "instanceId", label: "インスタンス", render: (r) => <Mono>{r.instanceId ?? "—"}</Mono> },
                  { key: "networkInterfaceId", label: "ENI", render: (r) => <Mono>{r.networkInterfaceId ?? "—"}</Mono> },
                  { key: "allocationId", label: "割り当て ID", render: (r) => <Mono>{r.allocationId ?? "—"}</Mono> },
                ]}
              />
            )}
          </>
        );
      }}
    </Panel>
  );
}
