import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

type S3PrefixScope = "DEFAULT" | "ROOT" | "PARENT" | "CUSTOM";

type S3FileCountRequest = {
  batchCode: string;
  day?: string | null;
  scope?: S3PrefixScope | null;
  prefixOverride?: string | null;
};

type S3FileCountResponse = {
  batchCode?: string;
  bucket?: string | null;
  prefix?: string | null;
  recursive?: boolean | null;
  dayJst?: string | null;
  totalCount?: number | null;
  countOnDay?: number | null;
  message?: string | null;
};

type S3FileListRequest = {
  batchCode: string;
  scope?: S3PrefixScope | null;
  prefixOverride?: string | null;
  recursiveOverride?: boolean | null;
  limit?: number | null;
};

type S3FileListResponse = {
  batchCode: string;
  bucket: string;
  prefix: string;
  recursive: boolean;
  returnedCount: number; // JavaはlongだがJS側はnumber
  message: string;
  items: Array<{
    key: string;
    size: number; // Javaはlong
    lastModifiedIso: string;
  }>;
};

const COUNT_URL = `/v1/api/admin/s3/files/count`;
const LIST_URL = `/v1/api/admin/s3/files/list`;

function defaultDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function S3FileCountPage() {
  const batchCodes = ["B002", "B003", "B004", "B005", "B006", "B008", "B009"];

  const [batchCode, setBatchCode] = useState(batchCodes[0]);
  const [scope, setScope] = useState<S3PrefixScope>("DEFAULT");
  const [useDate, setUseDate] = useState(true);
  const [day, setDay] = useState(defaultDate());

  const countReq = useMemo<S3FileCountRequest>(
    () => ({
      batchCode,
      scope,
      day: useDate ? day : null,
    }),
    [batchCode, scope, useDate, day],
  );

  const countQuery = useQuery({
    queryKey: ["s3-file-count", countReq],
    queryFn: async () => {
      const res = await fetch(COUNT_URL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(countReq),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      return (await res.json()) as S3FileCountResponse;
    },
  });

  const listMutation = useMutation({
    mutationFn: async () => {
      const listReq: S3FileListRequest = {
        batchCode,
        scope,
        // サーバ側も limit を見ているので、そもそも返却を100に絞るのが一番軽い
        limit: 100,
      };

      const res = await fetch(LIST_URL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listReq),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      return (await res.json()) as S3FileListResponse;
    },
  });

  const totalCountText = typeof countQuery.data?.totalCount === "number" ? countQuery.data.totalCount.toLocaleString() : "-";

  const countOnDayText = typeof countQuery.data?.countOnDay === "number" ? countQuery.data.countOnDay.toLocaleString() : "-";

  const dayLabel = typeof countQuery.data?.dayJst === "string" && countQuery.data.dayJst ? `指定日（${countQuery.data.dayJst} / JST）` : "指定日";

  // ===== list 表示制限（描画は最大100件） =====
  const LIST_RENDER_LIMIT = 100;
  const listItems = listMutation.data?.items ?? [];
  const getNum = (key: string) => {
    const name = key.split("/").pop() ?? key;
    const m = name.match(/_(\d+)\.csv$/i);
    return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
  };
  const sortedItems = [...listItems].sort((a, b) => getNum(a.key) - getNum(b.key));
  const isTruncatedForRender = sortedItems.length > LIST_RENDER_LIMIT;
  const renderItems = isTruncatedForRender ? sortedItems.slice(0, LIST_RENDER_LIMIT) : sortedItems;

  function sortByTrailingNumber(a: { key: string }, b: { key: string }) {
    const getNum = (key: string) => {
      // 例: "path/to/teamMemberData_100.csv" -> 100
      const name = key.split("/").pop() ?? key; // フォルダ付き対策
      const m = name.match(/_(\d+)\.csv$/i);
      return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
    };

    return getNum(a.key) - getNum(b.key);
  }

  return (
    <div style={{ maxWidth: 980 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>S3 フォルダ件数</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Batch</div>
          <select value={batchCode} onChange={(e) => setBatchCode(e.target.value)} disabled={countQuery.isFetching || listMutation.isPending}>
            {batchCodes.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Prefix</div>
          <select value={scope} onChange={(e) => setScope(e.target.value as S3PrefixScope)} disabled={countQuery.isFetching || listMutation.isPending}>
            <option value="DEFAULT">json/（DEFAULT）</option>
            <option value="ROOT">ルート（ROOT）</option>
          </select>
        </div>

        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={useDate} onChange={(e) => setUseDate(e.target.checked)} disabled={countQuery.isFetching || listMutation.isPending} />
          <span style={{ fontSize: 12, color: "#666" }}>日付指定（未指定なら今日JST）</span>
        </label>

        <input type="date" value={day} onChange={(e) => setDay(e.target.value)} disabled={!useDate || countQuery.isFetching || listMutation.isPending} />

        <button onClick={() => countQuery.refetch()} disabled={countQuery.isFetching}>
          {countQuery.isFetching ? "更新中…" : "件数を更新"}
        </button>

        <button onClick={() => listMutation.mutate()} disabled={listMutation.isPending}>
          {listMutation.isPending ? "一覧取得中…" : "一覧を取得（最大100件）"}
        </button>
      </div>

      {countQuery.isError && <div style={{ color: "#b91c1c", marginBottom: 10 }}>件数取得エラー: {(countQuery.error as Error).message}</div>}
      {listMutation.isError && <div style={{ color: "#b91c1c", marginBottom: 10 }}>一覧取得エラー: {(listMutation.error as Error).message}</div>}

      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Bucket</div>
            <div style={{ fontWeight: 900 }}>{countQuery.data?.bucket ?? "-"}</div>
          </div>
          <div style={{ minWidth: 360 }}>
            <div style={{ fontSize: 12, color: "#666" }}>Prefix（解決後）</div>
            <div style={{ fontWeight: 900, wordBreak: "break-all" }}>{countQuery.data?.prefix ?? "-"}</div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 18, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Total（prefix配下）</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{totalCountText}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>{dayLabel}</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{countOnDayText}</div>
          </div>
        </div>

        {countQuery.data?.message && <div style={{ marginTop: 10, fontSize: 12, color: "#374151" }}>{countQuery.data.message}</div>}
      </div>

      {listMutation.data && (
        <div style={{ marginTop: 14, border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
            <div style={{ fontWeight: 900 }}>一覧（返却: {listMutation.data.returnedCount.toLocaleString()} 件）</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {listMutation.data.bucket} / {listMutation.data.prefix || "(root)"} / recursive: {String(listMutation.data.recursive)}
            </div>
          </div>

          {/* ★ 警告（100件以上は描画しない） */}
          {isTruncatedForRender && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #f59e0b",
                background: "#fffbeb",
                color: "#92400e",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              ⚠ 表示負荷軽減のため、先頭 {LIST_RENDER_LIMIT} 件のみ表示しています（実データ: {listItems.length.toLocaleString()} 件）。
            </div>
          )}

          <div style={{ overflow: "auto", marginTop: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: 8, minWidth: 520 }}>key</th>
                  <th style={{ padding: 8, minWidth: 160 }}>size</th>
                  <th style={{ padding: 8, minWidth: 220 }}>lastModifiedIso</th>
                </tr>
              </thead>
              <tbody>
                {renderItems.map((it) => (
                  <tr key={it.key} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: 8, wordBreak: "break-all" }}>{it.key}</td>
                    <td style={{ padding: 8 }}>{typeof it.size === "number" ? it.size.toLocaleString() : "-"}</td>
                    <td style={{ padding: 8 }}>{it.lastModifiedIso ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {listMutation.data.message && <div style={{ marginTop: 10, fontSize: 12, color: "#374151" }}>{listMutation.data.message}</div>}
        </div>
      )}
    </div>
  );
}
