# -*- coding: utf-8 -*-
"""
RebuildSeasonDates.py（ローカル実行用）

country_league_season_master の CSV を読み、Flashscore の各リーグの「結果」「対戦カード」タブから
シーズンの開始日・終了日を取り直して、新しい CSV を書く。

  開始日 = 「ラウンド 1」の試合のうち、いちばん早い試合日（日本時間）→ YYYY-MM-DD 00:00:00+09
  終了日 = 最終節（CSV の round、または見えた中で最大のラウンド）の試合のうち、いちばん遅い試合日（日本時間）
           → YYYY-MM-DD 23:59:59+09
  わからないとき（ラウンドが無い大会・最終節の日程がまだ出ていない など）は空にする。
  season_year はページのタイトル（例: ブンデスリーガ 2026/2027 結果）から取る。取れなければ元のまま。
  round は、最終節が見えたときだけ見えた最大のラウンドにする。それ以外は元のまま。
  ほかの列（id・country・league・path・icon・valid_flg・del_flg・登録者など）は元のまま。update_time だけ今にする。

使い方（Mac）:
  pip install playwright && playwright install chromium   # 初回だけ
  python3 RebuildSeasonDates.py ~/csv-save/20261103_1401/country_league_season_master.csv
  → 同じフォルダに country_league_season_master_rebuilt.csv と、確認用の _rebuilt_log.csv を書く
  オプション: --only 1,2,3（id を指定して一部だけ） / --headful（ブラウザを表示）
"""
import argparse
import csv
import datetime
import os
import re
import sys
from zoneinfo import ZoneInfo

from playwright.sync_api import sync_playwright

JST = ZoneInfo("Asia/Tokyo")
BASE = "https://www.flashscore.co.jp"
ROUND_RE = re.compile(r"^ラウンド\s*(\d+)$")

JS_COLLECT = r"""
async ({kind}) => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const t = e => e ? (e.textContent || '').replace(/\s+/g, ' ').trim() : '';
  for (let w = 0; w < 50 && !document.querySelector('div.event__match'); w++) await sleep(300);
  for (let i = 0; i < 25; i++) {
    const btn = [...document.querySelectorAll('a,button,[data-testid="wcl-buttonLink"]')]
      .find(e => /さらに試合を表示/.test(e.textContent || ''));
    if (!btn) break;
    const before = document.querySelectorAll('div.event__match').length;
    btn.scrollIntoView(); btn.click();
    let grew = false;
    for (let w = 0; w < 25; w++) { await sleep(300); if (document.querySelectorAll('div.event__match').length > before) { grew = true; break; } }
    if (!grew) break;
  }
  let round = ''; const rows = [];
  for (const n of document.querySelectorAll('.event__round, div.event__match')) {
    if (n.classList.contains('event__round')) { round = t(n); continue; }
    rows.push([round, t(n.querySelector("[class*='wcl-dateContent'], .event__time"))]);
  }
  return {title: document.title, rows};
}
"""


def parse_day(s, kind, today):
    """ "29.08. 03:30"（年なし）/ "13.02.2027"（年あり）→ date。結果は今日より先にならない年、対戦カードは今日より前にならない年。"""
    m = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{4})?", s or "")
    if not m:
        return None
    d, mo = int(m.group(1)), int(m.group(2))
    try:
        if m.group(3):
            return datetime.date(int(m.group(3)), mo, d)
        day = datetime.date(today.year, mo, d)
        if kind == "results" and day > today + datetime.timedelta(days=1):
            day = datetime.date(today.year - 1, mo, d)
        if kind == "fixtures" and day < today - datetime.timedelta(days=1):
            day = datetime.date(today.year + 1, mo, d)
        return day
    except ValueError:
        return None


def collect(page, path, kind):
    url = BASE + path + kind + "/"
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=45000)
    except Exception as e:
        print(f"  開けません {url}: {e}", flush=True)
        return "", []
    for sel in ["#onetrust-reject-all-handler", "#onetrust-accept-btn-handler"]:
        try:
            if page.locator(sel).count():
                page.locator(sel).first.click(timeout=1500)
                break
        except Exception:
            pass
    try:
        r = page.evaluate(JS_COLLECT, {"kind": kind})
    except Exception as e:
        print(f"  読めません {url}: {e}", flush=True)
        return "", []
    return r.get("title", ""), r.get("rows", [])


def decide(row, res, fx, today):
    """開始日・終了日・round・メモ"""
    def items(rows, kind):
        out = []
        for rnd, ds in rows:
            m = ROUND_RE.match(rnd or "")
            day = parse_day(ds, kind, today)
            if day:
                out.append((int(m.group(1)) if m else None, day))
        return out

    r_items, f_items = items(res, "results"), items(fx, "fixtures")
    all_items = r_items + f_items
    rounds = [r for r, _ in all_items if r is not None]
    note = []
    if not all_items:
        return "", "", row.get("round", ""), "試合が読めない"
    if not rounds:
        note.append("ラウンドなし（大会など）")
        start = min(d for _, d in all_items) if r_items and not f_items else None
        end = max(d for _, d in all_items) if r_items and not f_items else None
        if start is None:
            note.append("開催中のため空")
        return start, end, row.get("round", ""), "／".join(note)

    r1 = [d for r, d in all_items if r == 1]
    start = min(r1) if r1 else None
    if not r1:
        note.append("ラウンド 1 が見えない")

    try:
        csv_final = int(row.get("round") or 0)
    except ValueError:
        csv_final = 0
    max_seen = max(rounds)
    final = max(csv_final, max_seen)
    finished = bool(r_items) and not f_items       # 対戦カードが無い = シーズン終了
    last = [d for r, d in all_items if r == final]
    end = None
    new_round = row.get("round", "")
    if last and (final == csv_final or finished or csv_final == 0 and finished):
        end = max(last)
        new_round = str(final)
    elif finished:
        end = max(d for r, d in all_items if r == max_seen)
        new_round = str(max_seen)
        note.append(f"終了済み。最終は ラウンド {max_seen}")
    else:
        note.append(f"最終節（ラウンド {csv_final or '?'}）の日程がまだ出ていない（見えた最大 ラウンド {max_seen}）")
    return start, end, new_round, "／".join(note)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv")
    ap.add_argument("--only", default="")
    ap.add_argument("--headful", action="store_true")
    a = ap.parse_args()
    src = os.path.expanduser(a.csv)
    with open(src, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        fields = reader.fieldnames
        rows = list(reader)
    only = {x.strip() for x in a.only.split(",") if x.strip()}
    today = datetime.datetime.now(JST).date()
    now_s = datetime.datetime.now(JST).strftime("%Y-%m-%d %H:%M:%S+09")
    log = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not a.headful)
        ctx = browser.new_context(locale="ja-JP", timezone_id="Asia/Tokyo", viewport={"width": 1280, "height": 2000})
        page = ctx.new_page()
        for i, row in enumerate(rows, 1):
            if only and row["id"] not in only:
                continue
            path = (row.get("path") or "").strip()
            if not path:
                log.append({"id": row["id"], "league": row["league"], "note": "path なし"})
                continue
            print(f"[{i}/{len(rows)}] {row['country']} / {row['league']} {path}", flush=True)
            t1, res = collect(page, path, "results")
            t2, fx = collect(page, path, "fixtures")
            start, end, rnd, note = decide(row, res, fx, today)
            m = re.search(r"(\d{4}(?:/\d{4})?)", t1 or t2 or "")
            season = m.group(1) if m else row.get("season_year", "")
            row["season_year"] = season
            row["start_season_date"] = f"{start.isoformat()} 00:00:00+09" if start else ""
            row["end_season_date"] = f"{end.isoformat()} 23:59:59+09" if end else ""
            row["round"] = rnd
            row["update_time"] = now_s
            log.append({"id": row["id"], "league": f"{row['country']} / {row['league']}", "season": season,
                        "start": row["start_season_date"], "end": row["end_season_date"], "round": rnd,
                        "results": len(res), "fixtures": len(fx), "note": note})
            print(f"   → {season} {row['start_season_date'] or '（空）'} 〜 {row['end_season_date'] or '（空）'} round={rnd} {note}", flush=True)
        browser.close()
    out = os.path.join(os.path.dirname(src), "country_league_season_master_rebuilt.csv")
    with open(out, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    lg = os.path.join(os.path.dirname(src), "_rebuilt_log.csv")
    with open(lg, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["id", "league", "season", "start", "end", "round", "results", "fixtures", "note"])
        w.writeheader()
        w.writerows(log)
    print(f"書きました: {out}\n確認用: {lg}")


if __name__ == "__main__":
    sys.exit(main())
