// src/api/correlations.ts

export type CorrItem = { metric: string; value: number };
export type CorrelationsByScore = { "1st": CorrItem[]; "2nd": CorrItem[]; ALL: CorrItem[] };

// サーバは { team, country, league, correlations } を返す実装（オブジェクト）です。
// ただし、もし古いサーバで [row, row, row] 形式（配列）が返っても動くようにフォールバックを入れています。
export async function fetchTeamCorrelations(country: string, league: string, team: string): Promise<CorrelationsByScore> {
  const url = `/api/leagues/${encodeURIComponent(country)}/${encodeURIComponent(league)}/${encodeURIComponent(team)}/correlations`;

  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // ここで詳細をコンソールに吐いておくとデバッグしやすい
    console.error("fetchTeamCorrelations failed:", res.status, text);
    throw new Error(`Failed to fetch correlations: ${res.status}`);
  }

  const json = await res.json();

  // --- 正式形: { correlations: { 1st:[], 2nd:[], ALL:[] } } ---
  if (json && json.correlations && typeof json.correlations === "object") {
    return json.correlations as CorrelationsByScore;
  }

  // --- フォールバック: [row,row,row] 形式を受けた場合に上位5つを抽出 ---
  // row の rank_1th～rank_5th から "metric,value" をパース
  if (Array.isArray(json)) {
    const parseMetric = (raw?: string | null) => {
      if (!raw) return null;
      const [m, v] = String(raw).split(",");
      if (!m) return null;
      const num = Number(v);
      if (!Number.isFinite(num)) return null;
      return { metric: m, value: num };
    };

    const pickTop5 = (row?: any): CorrItem[] => {
      if (!row) return [];
      const out: CorrItem[] = [];
      for (let i = 1; i <= 5; i++) {
        const item = parseMetric(row[`rank_${i}th`]);
        if (item) out.push(item);
      }
      return out;
    };

    const find = (s: "1st" | "2nd" | "ALL") => json.find((r: any) => r.score === s);
    return {
      "1st": pickTop5(find("1st")),
      "2nd": pickTop5(find("2nd")),
      ALL: pickTop5(find("ALL")),
    };
  }

  // どちらでもなければ形式不一致
  console.error("Unexpected correlations payload:", json);
  throw new Error("Unexpected correlations payload");
}
