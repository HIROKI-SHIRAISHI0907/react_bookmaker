import React, { useEffect, useRef, useState } from "react";
import { type MonthlyReport, type NamedSeries, type RdsSchemaMonthly, type RdsTableMonthly, type StatsStatus, fmtDate, postAwsApi, thisMonthJst, useAwsApi } from "../../../api/checkData";
import { Badge, Note, Panel, Section, SmallButton, colors } from "./AwsDashboardCommonPage";
import { DailyBarChart, LineChart, MiniBars, MonthlyBarChart, ShareBar, Sparkline, chart, reportNumber as n } from "./AwsReportCharts";
import type { TabProps } from "./AwsDashboardTabPage";

/**
 * 月次レポート（PDF ダウンロード）
 *
 * - サーバーの aws_daily_stats（毎日 00:30 に前日分を記録）から 1 か月分を表示
 * - 「PDF をダウンロード」でプレビューと同じ内容を A4 縦の PDF にする（ブラウザ内で生成）
 */

const LABEL: Record<string, string> = {
  ECS_TOTAL: "ECS 実行回数",
  ECS_TASKDEF: "ECS タスク定義別",
  LAMBDA: "Lambda 実行回数",
  RDS_TABLE: "RDS テーブル件数",
};

/** 表を PDF の 1 ページに収まる行数ずつに分ける */
function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out.length ? out : [[]];
}

export default function AwsReportTab({ reload }: TabProps) {
  const [month, setMonth] = useState<string>(thisMonthJst);
  const [statusReload, setStatusReload] = useState(0);
  const [reportReload, setReportReload] = useState(0);
  const status = useAwsApi<StatsStatus>("stats/status", { reload: reload + statusReload });
  const report = useAwsApi<MonthlyReport>(`report/monthly?month=${encodeURIComponent(month)}`, { reload: reload + reportReload });
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  // 取り込み中は 5 秒ごとに状況を取り直す
  const running = status.data?.running ?? false;
  const wasRunning = useRef(false);
  useEffect(() => {
    // 取り込みが終わったらレポートも取り直す
    if (wasRunning.current && !running) setReportReload((x) => x + 1);
    wasRunning.current = running;
    if (!running) return undefined;
    const t = window.setInterval(() => setStatusReload((x) => x + 1), 5000);
    return () => window.clearInterval(t);
  }, [running]);

  const call = async (label: string, path: string) => {
    setBusy(label);
    setNotice(null);
    try {
      const r = await postAwsApi<string>(path);
      setNotice(r.ok ? r.data : r.error);
      setStatusReload((x) => x + 1);
      setReportReload((x) => x + 1);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const download = async () => {
    if (!docRef.current || !report.data) return;
    setBusy("pdf");
    setNotice(null);
    try {
      await exportPdf(docRef.current, `aws-monthly-report-${report.data.month}.pdf`);
    } catch (e) {
      setNotice(`PDF の作成に失敗しました: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {/* ===== 操作 ===== */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <label htmlFor="report-month" style={{ color: colors.muted, fontSize: 12.5 }}>
          対象月
        </label>
        <input
          id="report-month"
          type="month"
          value={month}
          max={thisMonthJst()}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
          style={{ font: "inherit", padding: "6px 10px", border: `1px solid ${colors.border}`, borderRadius: 8 }}
        />
        <button
          type="button"
          onClick={download}
          disabled={!report.data || busy !== null}
          style={{
            font: "inherit",
            fontWeight: 700,
            padding: "7px 14px",
            borderRadius: 8,
            border: `1px solid ${colors.accent}`,
            background: colors.accent,
            color: "#fff",
            cursor: !report.data || busy ? "default" : "pointer",
            opacity: !report.data || busy ? 0.6 : 1,
          }}
        >
          {busy === "pdf" ? "PDF を作成中…" : "PDF をダウンロード"}
        </button>
      </div>

      {/* ===== 集計状況 ===== */}
      <Section title="日次データの記録状況" right={<Note>毎日 00:30 に前日分を自動で記録します</Note>}>
        <Panel state={status}>
          {(s) => (
            <div
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 14,
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {(["ECS_TOTAL", "LAMBDA", "RDS_TABLE"] as const).map((c) => {
                  const cov = s.coverage.find((x) => x.category === c);
                  return (
                    <div key={c} style={{ minWidth: 200 }}>
                      <div style={{ color: colors.muted, fontSize: 12.5 }}>{LABEL[c]}</div>
                      <div style={{ fontWeight: 700 }}>{cov ? `${cov.from} 〜 ${cov.to}（${cov.days} 日分）` : "まだ記録なし"}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <SmallButton onClick={() => call("backfill", "stats/backfill")}>{busy === "backfill" ? "開始中…" : "過去分を取り込む（ECS 90日・Lambda）"}</SmallButton>
                <SmallButton onClick={() => call("snapshot", "stats/snapshot")}>{busy === "snapshot" ? "記録中…" : "今日の RDS 件数を記録"}</SmallButton>
                {s.running && <Badge tone="warn">取り込み中</Badge>}
                {!s.enabled && <Badge tone="bad">日次集計は無効（stats-enabled=false）</Badge>}
              </div>
              <div style={{ color: colors.muted, fontSize: 12.5 }}>
                {notice ?? s.lastMessage}
                {s.lastRunAt ? `（${fmtDate(s.lastRunAt)}）` : ""}
              </div>
              <div style={{ color: colors.muted, fontSize: 12 }}>RDS の件数は過去に遡れないため、記録を始めた日からのデータになります。ECS は CloudTrail の保存期間（約 90 日）まで遡れます。</div>
            </div>
          )}
        </Panel>
      </Section>

      {/* ===== プレビュー（この中身がそのまま PDF になる） ===== */}
      <Section title="プレビュー">
        <Panel state={report}>
          {(r) => (
            <div style={{ background: "#f3f3f1", borderRadius: 12, padding: 16, overflowX: "auto" }}>
              <div ref={docRef} style={{ width: 760, margin: "0 auto" }}>
                <ReportDocument r={r} />
              </div>
            </div>
          )}
        </Panel>
      </Section>
    </>
  );
}

// =====================================================================
// レポート本体（data-pdf-block ごとに画像化して PDF に並べる）
// =====================================================================

const page: React.CSSProperties = {
  background: chart.surface,
  color: chart.text,
  padding: "18px 20px",
  marginBottom: 12,
  fontFamily: 'system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Yu Gothic UI", sans-serif',
  fontSize: 12.5,
  lineHeight: 1.5,
  border: `1px solid ${chart.grid}`,
};
const h2: React.CSSProperties = { fontSize: 15, fontWeight: 700, margin: "0 0 4px" };
const sub: React.CSSProperties = { color: chart.text2, fontSize: 11.5, margin: "0 0 10px" };
const th: React.CSSProperties = {
  textAlign: "left",
  fontSize: 11,
  color: chart.text2,
  fontWeight: 600,
  padding: "5px 6px",
  borderBottom: `1px solid ${chart.axis}`,
};
const td: React.CSSProperties = { padding: "5px 6px", borderBottom: `1px solid ${chart.grid}`, verticalAlign: "middle" };
const num: React.CSSProperties = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 11.5 };

function Block({ children, breakBefore }: { children: React.ReactNode; breakBefore?: boolean }) {
  return (
    <div data-pdf-block="" data-pdf-break={breakBefore ? "before" : undefined} style={page}>
      {children}
    </div>
  );
}

function Tile({ label, value, sub: s }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ border: `1px solid ${chart.grid}`, borderRadius: 8, padding: "8px 10px" }}>
      <div style={{ color: chart.text2, fontSize: 11 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {s && <div style={{ color: chart.muted, fontSize: 10.5 }}>{s}</div>}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ color: chart.text2, padding: "18px 0", textAlign: "center" }}>{children}</div>;
}

function signed(v: number | null): string {
  if (v === null) return "—";
  return v > 0 ? `+${n(v)}` : n(v);
}

function ReportDocument({ r }: { r: MonthlyReport }) {
  const [y, m] = r.month.split("-");
  const title = `${y}年${Number(m)}月`;
  const nDays = r.days.length;

  return (
    <>
      {/* ---------- 表紙・サマリー ---------- */}
      <Block>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>AWS 月次レポート {title}</div>
          <div style={{ color: chart.text2, fontSize: 11 }}>作成: {fmtDate(r.generatedAt)}</div>
        </div>
        <div style={{ color: chart.text2, fontSize: 11.5, marginBottom: 12 }}>
          アカウント {r.accountId ?? "—"} ・ {r.region} ・ 対象期間 {r.days[0]} 〜 {r.days[nDays - 1]}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          <Tile label="ECS 実行回数（月合計）" value={n(r.ecs.total)} sub={`失敗 ${n(r.ecs.failed)} 回 ・ ${r.ecs.dataDays}/${nDays} 日分`} />
          <Tile label="ECS タスク定義" value={n(r.ecs.taskDefinitions.length)} sub="月内に実行があった数" />
          <Tile label="Lambda 実行回数（月合計）" value={n(r.lambda.totalInvocations)} sub={`エラー ${n(r.lambda.totalErrors)} 回 ・ ${r.lambda.dataDays}/${nDays} 日分`} />
          <Tile label="RDS 件数の記録" value={`${r.rds.snapshotDays} 日`} sub={`${r.rds.databases.length} DB`} />
        </div>
      </Block>

      {/* ---------- ECS ---------- */}
      <Block>
        <div style={h2}>ECS 日別の実行回数</div>
        <div style={sub}>
          CloudTrail の RunTask 件数。月合計 {n(r.ecs.total)} 回（うち失敗 {n(r.ecs.failed)} 回）。破線の日は未集計。
        </div>
        {r.ecs.dataDays === 0 ? (
          <Empty>この月の ECS データはまだありません（「過去分を取り込む」で約 90 日前まで取得できます）</Empty>
        ) : (
          <DailyBarChart values={r.ecs.daily} covered={r.ecs.covered} days={r.days} />
        )}
      </Block>

      <Block>
        <div style={h2}>ECS 月別の合計実行回数（直近 6 か月）</div>
        <div style={sub}>濃い棒が対象月。「—」はデータがない月。</div>
        <MonthlyBarChart items={r.ecs.monthlyTotals} highlight={r.month} />
      </Block>

      {chunk(r.ecs.taskDefinitions, 22).map((rows, k) => (
        <Block key={`td${k}`}>
          <div style={h2}>ECS タスク定義別{k > 0 ? "（続き）" : ""}</div>
          {r.ecs.taskDefinitions.length === 0 ? (
            <Empty>この月に実行されたタスク定義はありません</Empty>
          ) : (
            <SeriesTable rows={rows} max={r.ecs.taskDefinitions[0]?.total ?? 0} total={r.ecs.total} secondaryLabel="失敗" />
          )}
        </Block>
      ))}

      {/* ---------- Lambda ---------- */}
      <Block breakBefore>
        <div style={h2}>Lambda 日別の実行回数（全関数の合計）</div>
        <div style={sub}>
          CloudWatch の Invocations。月合計 {n(r.lambda.totalInvocations)} 回（エラー {n(r.lambda.totalErrors)} 回）。
        </div>
        {r.lambda.dataDays === 0 ? (
          <Empty>この月の Lambda データはまだありません（「過去分を取り込む」で取得できます）</Empty>
        ) : (
          <DailyBarChart values={r.lambda.daily} covered={r.lambda.covered} days={r.days} />
        )}
      </Block>

      {chunk(r.lambda.functions, 22).map((rows, k) => (
        <Block key={`fn${k}`}>
          <div style={h2}>Lambda 関数別の実行回数{k > 0 ? "（続き）" : ""}</div>
          {r.lambda.functions.length === 0 ? (
            <Empty>関数のデータはありません</Empty>
          ) : (
            <SeriesTable rows={rows} max={r.lambda.functions[0]?.total ?? 0} total={r.lambda.totalInvocations} secondaryLabel="エラー" />
          )}
        </Block>
      ))}

      {/* ---------- RDS ---------- */}
      <Block breakBefore>
        <div style={h2}>RDS テーブル件数の推移</div>
        <div style={sub}>
          毎日 1 回記録したレコード件数（その日時点の累積件数）。スキーマごとに合計の推移と、テーブル別の月初・月末・増減を示します。
          {nDays > 0 && ` 記録 ${r.rds.snapshotDays}/${nDays} 日。`}
        </div>
        {r.rds.snapshotDays === 0 && <Empty>この月の RDS 件数はまだ記録されていません</Empty>}
        {r.rds.databases.map((db) => (
          <div key={db.database} style={{ ...mono, color: chart.text2 }}>
            ・{db.database}（{db.schemas.map((s) => s.schema).join(", ")}）
          </div>
        ))}
      </Block>

      {r.rds.databases.map((db) => db.schemas.map((sc) => <SchemaBlocks key={`${db.database}.${sc.schema}`} database={db.database} sc={sc} days={r.days} />))}
    </>
  );
}

function SeriesTable({ rows, max, total, secondaryLabel }: { rows: NamedSeries[]; max: number; total: number; secondaryLabel: string }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={th}>名前</th>
          <th style={{ ...th, textAlign: "right" }}>月合計</th>
          <th style={{ ...th, textAlign: "right" }}>割合</th>
          <th style={th} />
          <th style={{ ...th, textAlign: "right" }}>{secondaryLabel}</th>
          <th style={th}>日別</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => (
          <tr key={s.name}>
            <td style={{ ...td, ...mono, wordBreak: "break-all" }}>{s.name}</td>
            <td style={num}>{n(s.total)}</td>
            <td style={{ ...num, color: chart.text2 }}>{total > 0 ? `${((s.total / total) * 100).toFixed(1)}%` : "—"}</td>
            <td style={td}>
              <ShareBar value={s.total} max={max} width={90} />
            </td>
            <td style={{ ...num, color: s.secondaryTotal > 0 ? "#b91c1c" : chart.text2 }}>{n(s.secondaryTotal)}</td>
            <td style={td}>
              <MiniBars values={s.daily} width={150} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SchemaBlocks({ database, sc, days }: { database: string; sc: RdsSchemaMonthly; days: string[] }) {
  const parts = chunk<RdsTableMonthly>(sc.tables, 24);
  return (
    <>
      <Block>
        <div style={h2}>
          <span style={mono}>{database}</span> / <span style={mono}>{sc.schema}</span> ・ 合計件数の推移
        </div>
        <div style={sub}>
          月初 {sc.first === null ? "—" : n(sc.first)} 件 → 月末 {sc.last === null ? "—" : n(sc.last)} 件（増減 {signed(sc.delta)}）・ テーブル {sc.tables.length}
        </div>
        <LineChart values={sc.daily} days={days} />
      </Block>
      {parts.map((rows, k) => (
        <Block key={k}>
          <div style={h2}>
            <span style={mono}>
              {database}.{sc.schema}
            </span>{" "}
            テーブル別{k > 0 ? "（続き）" : ""}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>テーブル</th>
                <th style={{ ...th, textAlign: "right" }}>月初</th>
                <th style={{ ...th, textAlign: "right" }}>月末</th>
                <th style={{ ...th, textAlign: "right" }}>増減</th>
                <th style={th}>推移</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.table}>
                  <td style={{ ...td, ...mono, wordBreak: "break-all" }}>
                    {t.table}
                    {t.estimated && <span style={{ marginLeft: 6, color: chart.text2, fontSize: 10 }}>（推定値）</span>}
                  </td>
                  <td style={num}>{t.first === null ? "—" : n(t.first)}</td>
                  <td style={num}>{t.last === null ? "—" : n(t.last)}</td>
                  <td style={{ ...num, fontWeight: t.delta ? 600 : 400 }}>{signed(t.delta)}</td>
                  <td style={td}>
                    <Sparkline values={t.daily} width={150} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
      ))}
    </>
  );
}

// =====================================================================
// PDF 出力（jsPDF + html2canvas。ブロック単位で画像化して A4 縦に並べる）
// =====================================================================

async function exportPdf(root: HTMLElement, filename: string) {
  const [{ jsPDF }, h2c] = await Promise.all([import("jspdf"), import("html2canvas")]);
  const html2canvas = h2c.default;

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const pageW = 210;
  const pageH = 297;
  const margin = 10;
  const contentW = pageW - margin * 2;
  const bottom = pageH - margin - 6; // ページ番号の分をあける
  const usableH = bottom - margin;
  let y = margin;

  const blocks = Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-block]"));
  for (const el of blocks) {
    if (el.dataset.pdfBreak === "before" && y > margin) {
      pdf.addPage();
      y = margin;
    }
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", logging: false });
    const pxPerMm = canvas.width / contentW;
    const imgH = canvas.height / pxPerMm;

    if (imgH <= usableH) {
      if (y + imgH > bottom) {
        pdf.addPage();
        y = margin;
      }
      pdf.addImage(canvas, "PNG", margin, y, contentW, imgH, undefined, "FAST");
      y += imgH + 3;
      continue;
    }

    // 1 ページに収まらないブロックは縦に分割する
    let offset = 0;
    while (offset < canvas.height) {
      if (y > margin + 0.5) {
        pdf.addPage();
        y = margin;
      }
      const sliceH = Math.min(canvas.height - offset, Math.floor(usableH * pxPerMm));
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceH;
      const ctx = slice.getContext("2d");
      if (!ctx) throw new Error("canvas が使えません");
      ctx.drawImage(canvas, 0, offset, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      pdf.addImage(slice, "PNG", margin, y, contentW, sliceH / pxPerMm, undefined, "FAST");
      y += sliceH / pxPerMm + 3;
      offset += sliceH;
    }
  }

  // ページ番号
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(120);
    pdf.text(`${i} / ${total}`, pageW - margin, pageH - 6, { align: "right" });
  }

  pdf.save(filename);
}
