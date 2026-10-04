/**
 * 月次レポートの「AWS 料金」セクション（PDF 用・白背景前提）。
 *
 * - 金額は円を主、USD を従に表示する
 * - 円換算のレートと出どころは必ず PDF に載せる（ツールチップだけにしない）
 * - 月別の棒は各月のレート（月末時点）で換算した円
 *
 * ※ import のパスとカードの見た目は、既存のレポート画面に合わせて変えてください。
 */
import { chart, MonthlyBarChart, ShareBar, reportNumber as fmt } from "./AwsReportCharts";

export type ExchangeRate = { rate: number; date: string | null; source: string; fallback: boolean };
export type CostItem = { name: string; amount: number; amountJpy: number; share: number };
export type CostMonth = { month: string; total: number; totalJpy: number; estimated: boolean; rate: ExchangeRate };
export type CostMonthly = {
  unit: string;
  total: number;
  totalJpy: number;
  estimated: boolean;
  rate: ExchangeRate | null;
  byService: CostItem[];
  byUsageType: CostItem[];
  monthly: CostMonth[];
  error: string | null;
  fetchedAt: string;
};

const yen = (v: number) => `¥${fmt(Math.round(v))}`;
const usd = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const rateText = (r: ExchangeRate) => `1 USD = ${r.rate.toFixed(2)} 円`;
const rateNote = (r: ExchangeRate) => [r.date, r.source].filter(Boolean).join("・");

const card: React.CSSProperties = {
  border: `1px solid ${chart.grid}`,
  borderRadius: 4,
  padding: "18px 16px",
  marginBottom: 12,
  background: chart.surface,
  breakInside: "avoid",
};
const h2: React.CSSProperties = { fontSize: 15, fontWeight: 700, margin: "0 0 4px", color: chart.text };
const sub: React.CSSProperties = { fontSize: 11, color: chart.text2, margin: "0 0 12px" };
const th: React.CSSProperties = { fontSize: 11, fontWeight: 400, color: chart.text2, textAlign: "left", padding: "4px 6px", borderBottom: `1px solid ${chart.axis}` };
const td: React.CSSProperties = { fontSize: 12, padding: "7px 6px", borderBottom: `1px solid ${chart.grid}`, color: chart.text };
const num: React.CSSProperties = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };

export function CostSection({ cost, month }: { cost: CostMonthly | null | undefined; month: string }) {
  if (!cost) return null;

  if (cost.error) {
    return (
      <section style={card}>
        <h2 style={h2}>AWS 料金</h2>
        <p style={{ ...sub, margin: 0 }}>{cost.error}</p>
      </section>
    );
  }

  const rate = cost.rate;
  const ym = month.replace("-", "年") + "月";

  return (
    <>
      {/* ---- 合計 ---- */}
      <section style={card}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <h2 style={h2}>AWS 料金（{ym}利用分）</h2>
          {cost.estimated && <span style={{ fontSize: 11, color: chart.text2, border: `1px solid ${chart.axis}`, borderRadius: 3, padding: "0 6px" }}>確定前</span>}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "6px 0 4px" }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: chart.text }}>{yen(cost.totalJpy)}</span>
          <span style={{ fontSize: 14, color: chart.text2 }}>{usd(cost.total)}</span>
        </div>
        {rate && (
          <p style={{ ...sub, margin: "0 0 2px", color: rate.fallback ? "#b42318" : chart.text2 }}>
            換算レート：{rateText(rate)}（{rateNote(rate)}）
          </p>
        )}
        <p style={{ ...sub, margin: 0 }}>
          Cost Explorer の UnblendedCost（税を含む）。カードには翌月 2 日ごろ請求されます。AWS が請求時に使う為替レートとは異なるため、カード明細とは数 % ずれることがあります。
        </p>
      </section>

      {/* ---- 月別推移 ---- */}
      <section style={card}>
        <h2 style={h2}>月別の料金（直近 6 か月）</h2>
        <p style={sub}>濃い棒が対象月。各月の月末時点のレートで円に換算しています。</p>
        <MonthlyBarChart
          items={cost.monthly.map((m) => ({ month: m.month, total: m.totalJpy, dataDays: 1 }))}
          highlight={month}
          format={yen}
          tooltip={(it) => {
            const m = cost.monthly.find((x) => x.month === it.month)!;
            return `${m.month}: ${yen(m.totalJpy)}（${usd(m.total)}・${rateText(m.rate)}）${m.estimated ? " 確定前" : ""}`;
          }}
        />
        {/* PDF ではツールチップが見えないので、各月のレートを表でも出す */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
          <thead>
            <tr>
              <th style={th}>月</th>
              <th style={{ ...th, textAlign: "right" }}>円</th>
              <th style={{ ...th, textAlign: "right" }}>USD</th>
              <th style={{ ...th, textAlign: "right" }}>レート（円/USD）</th>
              <th style={th}>レートの日付・出どころ</th>
            </tr>
          </thead>
          <tbody>
            {cost.monthly.map((m) => (
              <tr key={m.month} style={{ fontWeight: m.month === month ? 700 : 400 }}>
                <td style={td}>
                  {m.month.replace("-", "/")}
                  {m.estimated ? "（確定前）" : ""}
                </td>
                <td style={num}>{yen(m.totalJpy)}</td>
                <td style={num}>{usd(m.total)}</td>
                <td style={{ ...num, color: m.rate.fallback ? "#b42318" : chart.text }}>{m.rate.rate.toFixed(2)}</td>
                <td style={{ ...td, fontSize: 11, color: chart.text2 }}>{rateNote(m.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <CostTable title="サービス別" note="対象月の料金の内訳。" items={cost.byService} />
      <CostTable title="使用タイプ別（上位 15）" note="何に料金がかかっているかの詳細（例: APN1-NatGateway-Bytes = NAT のデータ処理量）。" items={cost.byUsageType} />
    </>
  );
}

function CostTable({ title, note, items }: { title: string; note: string; items: CostItem[] }) {
  const max = Math.max(0, ...items.map((i) => i.amountJpy));
  return (
    <section style={card}>
      <h2 style={h2}>{title}</h2>
      <p style={sub}>{note}</p>
      {items.length === 0 ? (
        <p style={{ ...sub, textAlign: "center", margin: "12px 0" }}>この月の料金はありません</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>名前</th>
              <th style={{ ...th, textAlign: "right" }}>円</th>
              <th style={{ ...th, textAlign: "right" }}>USD</th>
              <th style={{ ...th, textAlign: "right" }}>割合</th>
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.name}>
                <td style={{ ...td, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", wordBreak: "break-all" }}>{it.name}</td>
                <td style={num}>{yen(it.amountJpy)}</td>
                <td style={{ ...num, color: chart.text2 }}>{usd(it.amount)}</td>
                <td style={num}>{it.share.toFixed(1)}%</td>
                <td style={{ ...td, width: 130 }}>
                  <ShareBar value={Math.max(0, it.amountJpy)} max={max} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
