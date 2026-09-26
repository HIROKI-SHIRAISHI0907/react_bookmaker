import { useEffect, useRef, useState } from "react";

/**
 * AWS ダッシュボード API（Spring Boot: AwsDashboardController）の呼び出しと型定義。
 *
 * バックエンドは /api/aws/** にマッピングしている。
 * フロントは他の API（例: /v1/api/auth/logout）と同じく /v1 を前置する想定。
 * 実際のベースパスが違う場合はここだけ直す。
 */
export const AWS_API_BASE = "/v1/api/aws";

// =====================================================================
// 型定義（Java 側 DashboardDtos と 1:1 対応）
// =====================================================================

/** 全 API 共通レスポンス（ApiResult） */
export type ApiResult<T> = {
  ok: boolean;
  data: T | null;
  error: string | null;
  fetchedAt: string | null;
};

// ----- 概要 -----
export type OverviewItem = {
  service: string;
  ok: boolean;
  metrics: Record<string, number | string>;
  error: string | null;
};
export type Overview = {
  date: string;
  accountId: string | null;
  region: string;
  items: OverviewItem[];
};

// ----- ECS -----
export type EcsCluster = {
  name: string;
  status: string;
  runningTasks: number;
  pendingTasks: number;
  activeServices: number;
};
export type EcsRun = {
  eventTime: string;
  cluster: string;
  taskDefinition: string;
  startedBy: string | null;
  invokedBy: string | null;
  launchedTasks: number;
  failures: number;
  errorCode: string | null;
};
export type EcsTaskDefCount = {
  taskDefinition: string;
  runs: number;
  launchedTasks: number;
  failedRuns: number;
};
export type EcsSummary = {
  date: string;
  runCount: number;
  launchedTaskCount: number;
  failedRunCount: number;
  hourly: number[];
  byTaskDefinition: EcsTaskDefCount[];
  runs: EcsRun[];
  clusters: EcsCluster[];
};

// ----- S3 -----
export type S3Bucket = { name: string; region: string; creationDate: string | null };
export type S3Summary = {
  bucketCount: number;
  byRegion: Record<string, number>;
  buckets: S3Bucket[];
};

// ----- RDS -----
export type RdsInstance = {
  identifier: string;
  engine: string;
  engineVersion: string | null;
  instanceClass: string;
  status: string;
  endpoint: string | null;
  port: number | null;
  multiAz: boolean;
  allocatedStorageGb: number | null;
};
/** 接続先 DB（アプリの DataSource ごと） */
export type RdsDatabaseRef = {
  key: string;
  database: string;
  product: string | null;
  beanName: string;
  error: string | null;
};
export type RdsSummary = {
  instanceCount: number;
  instances: RdsInstance[];
  databases: RdsDatabaseRef[];
};
/** estimated=true は統計情報からの推定値 */
export type TableCount = { schema: string; table: string; rows: number; estimated: boolean };
export type RdsTables = {
  key: string;
  database: string;
  product: string | null;
  schemas: string[];
  tableCount: number;
  totalRows: number;
  estimatedTableCount: number;
  exactCountEnabled: boolean;
  maxExactRows: number;
  tables: TableCount[];
};

// ----- IAM -----
export type IamUser = { name: string; createDate: string | null; passwordLastUsed: string | null };
export type IamRole = { name: string; path: string; createDate: string | null; description: string | null };
export type IamSummary = {
  accountSummary: Record<string, number>;
  users: IamUser[];
  roles: IamRole[];
};

// ----- Lambda -----
export type LambdaFunction = {
  name: string;
  runtime: string | null;
  memoryMb: number | null;
  timeoutSec: number | null;
  codeSizeBytes: number | null;
  lastModified: string | null;
  handler: string | null;
  invocations: number;
  errors: number;
};
export type LambdaSummary = {
  date: string;
  functionCount: number;
  totalInvocations: number;
  totalErrors: number;
  functions: LambdaFunction[];
};

// ----- DynamoDB -----
export type DynamoTable = {
  name: string;
  status: string;
  itemCount: number | null;
  sizeBytes: number | null;
  billingMode: string;
  creationDate: string | null;
};
export type DynamoSummary = { tableCount: number; totalItems: number; tables: DynamoTable[] };

// ----- EC2 -----
export type Ec2Instance = {
  instanceId: string;
  name: string | null;
  type: string;
  state: string;
  az: string | null;
  privateIp: string | null;
  publicIp: string | null;
  launchTime: string | null;
  platform: string | null;
};
export type Ec2Summary = {
  instanceCount: number;
  byState: Record<string, number>;
  instances: Ec2Instance[];
};

// ----- Route53 -----
export type HostedZone = {
  id: string;
  name: string;
  privateZone: boolean;
  recordCount: number | null;
  comment: string | null;
};
export type RecordSet = {
  name: string;
  type: string;
  ttl: number | null;
  values: string[];
  aliasTarget: string | null;
};
export type Route53Summary = { zoneCount: number; totalRecords: number; zones: HostedZone[] };

// ----- EventBridge -----
export type EventBridgeSchedule = {
  group: string | null;
  name: string;
  state: string;
  expression: string | null;
  timezone: string | null;
  target: string | null;
  taskDefinition: string | null;
  flexibleWindow: string | null;
  description: string | null;
  lastModified: string | null;
};
export type EventBridgeRule = {
  bus: string;
  name: string;
  state: string;
  scheduleExpression: string | null;
  eventPattern: boolean;
  description: string | null;
  managedBy: string | null;
  targets: string[];
};
export type EventBridgeSummary = {
  scheduleCount: number;
  enabledScheduleCount: number;
  busCount: number;
  ruleCount: number;
  enabledRuleCount: number;
  schedules: EventBridgeSchedule[];
  rules: EventBridgeRule[];
  scheduleError: string | null;
  ruleError: string | null;
};

// ----- VPC -----
export type VpcInfo = {
  vpcId: string;
  name: string | null;
  cidr: string;
  state: string;
  defaultVpc: boolean;
  subnetCount: number;
  securityGroupCount: number;
  internetGatewayId: string | null;
};
export type SubnetInfo = {
  subnetId: string;
  name: string | null;
  vpcId: string;
  cidr: string;
  az: string | null;
  availableIps: number | null;
  publicOnLaunch: boolean;
};
export type SecurityGroupInfo = {
  groupId: string;
  name: string;
  vpcId: string | null;
  description: string | null;
  inbound: string[];
  outboundRuleCount: number;
  openToWorld: boolean;
};
export type NatGatewayInfo = {
  natGatewayId: string;
  name: string | null;
  vpcId: string | null;
  subnetId: string | null;
  state: string;
  connectivity: string | null;
  publicIp: string | null;
};
export type VpcEndpointInfo = {
  endpointId: string;
  vpcId: string | null;
  serviceName: string;
  type: string | null;
  state: string | null;
};
export type ElasticIpInfo = {
  publicIp: string;
  allocationId: string | null;
  name: string | null;
  associated: boolean;
  instanceId: string | null;
  networkInterfaceId: string | null;
};
export type VpcSummary = {
  vpcCount: number;
  subnetCount: number;
  securityGroupCount: number;
  openSecurityGroupCount: number;
  internetGatewayCount: number;
  activeNatGatewayCount: number;
  endpointCount: number;
  elasticIpCount: number;
  unassociatedElasticIpCount: number;
  vpcs: VpcInfo[];
  subnets: SubnetInfo[];
  securityGroups: SecurityGroupInfo[];
  natGateways: NatGatewayInfo[];
  endpoints: VpcEndpointInfo[];
  elasticIps: ElasticIpInfo[];
};

// =====================================================================
// 通信
// =====================================================================

/**
 * 認証ヘッダー。
 * 既存画面と同じ方法で JWT を付ける。トークンの保存場所が違う場合はここだけ直す
 * （既存の共通 fetch / axios インスタンスがあるなら、そちらに差し替えてもOK）。
 */
function authHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export type ApiState<T> = {
  loading: boolean;
  data: T | null;
  error: string | null;
  fetchedAt: string | null;
};

/**
 * API を呼ぶフック。
 * - date   : 日付指定が必要な API（overview / ecs / lambda）に付ける
 * - reload : 値が変わったときだけ refresh=true で再取得（サーバー側キャッシュを無視）
 */
export function useAwsApi<T>(path: string | null, opts: { date?: string; reload?: number } = {}): ApiState<T> {
  const { date, reload = 0 } = opts;
  const [state, setState] = useState<ApiState<T>>({ loading: true, data: null, error: null, fetchedAt: null });
  const lastReload = useRef<number>(reload);

  useEffect(() => {
    if (!path) return undefined;
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (reload !== lastReload.current) params.set("refresh", "true");
    lastReload.current = reload;
    const qs = params.toString();
    const sep = path.includes("?") ? "&" : "?";
    const url = `${AWS_API_BASE}/${path}${qs ? `${sep}${qs}` : ""}`;

    setState((s) => ({ ...s, loading: true, error: null }));
    fetch(url, { signal: ctrl.signal, headers: authHeaders(), credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as ApiResult<T>;
      })
      .then((body) => {
        if (body.ok) {
          setState({ loading: false, data: body.data, error: null, fetchedAt: body.fetchedAt });
        } else {
          setState({ loading: false, data: null, error: body.error ?? "取得に失敗しました", fetchedAt: body.fetchedAt });
        }
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setState({ loading: false, data: null, error: e instanceof Error ? e.message : String(e), fetchedAt: null });
      });

    return () => ctrl.abort();
  }, [path, date, reload]);

  return state;
}

// =====================================================================
// 表示用フォーマッタ
// =====================================================================

const nf = new Intl.NumberFormat("ja-JP");

export const fmtNum = (v: number | null | undefined): string => (v === null || v === undefined ? "—" : nf.format(v));

export function fmtBytes(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = Number(v);
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** ISO 文字列 → YYYY/MM/DD HH:mm（JST） */
export function fmtDate(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 今日（JST）を YYYY-MM-DD で返す */
export function todayJst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}
