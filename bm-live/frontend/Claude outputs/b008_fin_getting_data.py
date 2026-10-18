# -*- coding: utf-8 -*-
"""
B008: fin/b008_fin_getting_data_N.json（B012 が出力）を読み、各試合の終了後データを Flashscore から取得して
S3 に 1 試合 1 CSV で保存する。

2026-10 修正
  - 1 件でも失敗すると入力 JSON を消さずに止まり、以降の JSON も処理されなかった
    → 入力 JSON は処理後に必ず削除し、失敗した試合だけ fin/retry/ に退避する（最大 MAX_ATTEMPTS 回）。
      MAX_ATTEMPTS を超えた試合は fin/dead/ に退避（手動確認用）。
  - 次回起動時、fin/retry/ のファイル（起動時点にあったもの）を 1 回ずつ処理する（同じ実行内で無限ループしない）。
  - matchUrl の mid が matchKey と一致しない行は、別の試合のページを読むことになるため取得しない（unresolved 扱い）。
  - 試合が「終了」になっていなければ保存しない（試合中の画面を終了データとして保存しない）。
    → 再試行に回すが、試行回数には数えない。中止・延期は再試行せず fin/dead/ へ。
  - DEADLINE_JST（既定 22:00）を過ぎたら、残りを fin/retry/ に退避して終了（試行回数には数えない）。

2026-10 修正2
  - 時刻を日本時間で記録（コンテナが UTC のため「取得時刻」「スコア時間」が 9 時間ずれていた → record_time がずれる）。
  - スタッツが 0 件になっていた（ページ構造の変更で .sectionsWrapper が無い）→ 統計行を文書全体から集める。
  - 国・リーグが空になっていた → パンくずのリンク（/soccer/国/リーグ/）からも取る。

2026-10 修正3
  - 「試合国及びカテゴリ」を future.py と同じやり方で「国: リーグ - ラウンド N」の形で取る。
    → 試合ページのパンくず（[data-testid='wcl-breadcrumbsItem']）を最大 PAGE_WAIT_BREADCRUMB_MS 待って読む。
      href で判定（/soccer/<国>/ = 国、/soccer/<国>/<リーグ>/ = リーグ部分「プレミアリーグ - ラウンド 7」）。
      取れなければ 1 回だけ再読み込みして読み直す。それでも取れなければ従来の取り方（ヘッダー・タイトル・リンク）で代用。
  - 全角・半角やダッシュの揺れを NFKC でそろえる（「－」「—」「–」→「-」、前後の空白は「 - 」に統一）。
  - ラウンドが付かなかった試合は「⚠️ ラウンドなし」をログに出し、run_summary に noRoundCount / noRoundMatches を出す
    （カップ戦の「準決勝」などラウンド表記の無い大会もあるため、保存は止めない）。
"""

import json
import csv
import os
import unicodedata
import re
import traceback
import datetime
from io import StringIO
from urllib.parse import urlsplit, urlunsplit, urlparse, parse_qs
from typing import Dict, List, Iterator, Tuple, Any, Optional
import sys
import time
import threading
import boto3
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
from datetime import timezone
from zoneinfo import ZoneInfo


# =========================
# 設定
# =========================
AWS_REGION = "ap-northeast-1"
S3_BUCKET = "aws-s3-outputs-fin-csv"

INPUT_JSON_PREFIX = "fin/"
INPUT_JSON_FILE_PREFIX = "b008_fin_getting_data_"
INPUT_JSON_PATTERN = re.compile(
    rf"^{re.escape(INPUT_JSON_PREFIX + INPUT_JSON_FILE_PREFIX)}(\d+)\.json$"
)

# 失敗した試合の退避先（INPUT_JSON_PATTERN には当たらない場所）
RETRY_JSON_PREFIX = "fin/retry/"
RETRY_JSON_FILE_PREFIX = "b008_fin_retry_"
RETRY_JSON_PATTERN = re.compile(
    rf"^{re.escape(RETRY_JSON_PREFIX + RETRY_JSON_FILE_PREFIX)}(\d+)_[0-9T+\-]+\.json$"
)
DEAD_JSON_PREFIX = "fin/dead/"

# 1 試合あたりの最大試行回数（初回を含む。未終了・時間切れは数えない）
MAX_ATTEMPTS = 3

# 稼働の終了時刻（日本時間）。これを過ぎたら残りを retry に退避して終了する
DEADLINE_JST = datetime.time(22, 0)

# 試合が終わっている表示 / 中止・延期の表示（Flashscore の試合時間欄）
FINISHED_PAT = re.compile(r"終了|FT|延長後|PK後|PK戦後|After\s*(ET|Pen)", re.IGNORECASE)
CANCELLED_PAT = re.compile(r"中止|延期|没収|不戦|Postponed|Cancel+ed|Abandoned|Awarded", re.IGNORECASE)

JST = ZoneInfo("Asia/Tokyo")

HEADLESS = True
NAVIGATION_TIMEOUT_MS = 60000
WAIT_TIMEOUT_MS = 10000
DEFAULT_WAIT_MS = 1200

TIMEZONE_ID = "Asia/Tokyo"
LOCALE = "ja-JP"
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

VERBOSE = True

# 2026-10 修正3: 試合ページのパンくず（future.py と同じ）
BREADCRUMB_ITEM_SEL = "[data-testid='wcl-breadcrumbsItem']"
# 即時性は不要なので長めに待ってよい
PAGE_WAIT_BREADCRUMB_MS = int(os.getenv("PAGE_WAIT_BREADCRUMB_MS", "10000"))

BOT_WALL_PAT = r"Just a moment|Access Denied|verify you are human|チェック|確認"
START_TIME_PAT = re.compile(r"\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}")


# =========================
# HEADER（固定列）
# =========================
HEADER = [
    "ホーム順位","試合国及びカテゴリ","試合時間","ホームチーム","ホームスコア","アウェー順位","アウェーチーム",
    "アウェースコア","ホーム期待値","アウェー期待値","ホーム枠内ゴール期待値","アウェー枠内ゴール期待値",
    "ホームボール支配率","アウェーボール支配率","ホームシュート数","アウェーシュート数",
    "ホーム枠内シュート数","アウェー枠内シュート数","ホーム枠外シュート数","アウェー枠外シュート数",
    "ホームブロックシュート","アウェーブロックシュート","ホームビッグチャンス","アウェービッグチャンス",
    "ホームコーナーキック","アウェーコーナーキック","ホームボックス内シュート","アウェーボックス内シュート",
    "ホームボックス外シュート","アウェーボックス外シュート","ホームゴールポスト","アウェーゴールポスト","ホームヘディングゴール","アウェーヘディングゴール",
    "ホームキーパーセーブ","アウェーキーパーセーブ","ホームフリーキック","アウェーフリーキック",
    "ホームオフサイド","アウェーオフサイド","ホームファウル","アウェーファウル",
    "ホームイエローカード","アウェーイエローカード","ホームレッドカード","アウェーレッドカード","ホームスローイン","アウェースローイン",
    "ホーム相手ボックスタッチ","アウェー相手ボックスタッチ","ホームパス","アウェーパス","ホームロングパス","アウェーロングパス","ホームファイナルサードパス","アウェーファイナルサードパス",
    "ホームクロス","アウェークロス","ホームタックル","アウェータックル","ホームクリア","アウェークリア","ホームデュエル勝利数","アウェーデュエル勝利数",
    "ホームインターセプト","アウェーインターセプト",
    "スコア時間","天気","気温","湿度","審判名","ホーム監督名","アウェー監督名","ホームフォーメーション","アウェーフォーメーション",
    "スタジアム","収容人数","観客数","場所","ホームチーム最大得点取得者","アウェーチーム最大得点取得者","ホームチーム最大得点取得者出場状況","アウェーチーム最大得点取得者出場状況",
    "ホームチームホーム得点","ホームチームホーム失点","アウェーチームホーム得点","アウェーチームホーム失点","ホームチームアウェー得点","ホームチームアウェー失点",
    "アウェーチームアウェー得点","アウェーチームアウェー失点","通知フラグ","試合リンク文字列","ゴール時間","選手名","判定結果","ホームチームスタイル","アウェイチームスタイル",
    "ゴール確率","得点予想時間","試合ID","通番","ソート用秒","当時の試合時間"
]


# =========================
# 統計キー -> HEADER列対応
# =========================
STAT_KEY_MAP = {
    "アタック:期待値（xG）": ("ホーム期待値", "アウェー期待値"),
    "アタック:枠内ゴール期待値": ("ホーム枠内ゴール期待値", "アウェー枠内ゴール期待値"),
    "ポゼッション:ボール支配率": ("ホームボール支配率", "アウェーボール支配率"),
    "シュート:シュート数": ("ホームシュート数", "アウェーシュート数"),
    "シュート:枠内シュート数": ("ホーム枠内シュート数", "アウェー枠内シュート数"),
    "シュート:枠外シュート数": ("ホーム枠外シュート数", "アウェー枠外シュート数"),
    "シュート:ブロックシュート": ("ホームブロックシュート", "アウェーブロックシュート"),
    "アタック:ビッグチャンス": ("ホームビッグチャンス", "アウェービッグチャンス"),
    "セットプレー:コーナーキック": ("ホームコーナーキック", "アウェーコーナーキック"),
    "シュート:ボックス内シュート": ("ホームボックス内シュート", "アウェーボックス内シュート"),
    "シュート:ボックス外シュート": ("ホームボックス外シュート", "アウェーボックス外シュート"),
    "シュート:ポストヒット": ("ホームゴールポスト", "アウェーゴールポスト"),
    "シュート:ヘディングゴール": ("ホームヘディングゴール", "アウェーヘディングゴール"),

    "ディフェンス:キーパーセーブ": ("ホームキーパーセーブ", "アウェーキーパーセーブ"),
    "ディフェンス:フリーキック": ("ホームフリーキック", "アウェーフリーキック"),
    "ディフェンス:オフサイド": ("ホームオフサイド", "アウェーオフサイド"),
    "ディフェンス:ファウル": ("ホームファウル", "アウェーファウル"),
    "カード:イエローカード": ("ホームイエローカード", "アウェーイエローカード"),
    "カード:レッドカード": ("ホームレッドカード", "アウェーレッドカード"),
    "ディフェンス:スローイン": ("ホームスローイン", "アウェースローイン"),

    "パス:相手ボックスタッチ": ("ホーム相手ボックスタッチ", "アウェー相手ボックスタッチ"),
    "パス:総パス数": ("ホームパス", "アウェーパス"),
    "パス:ロングパス": ("ホームロングパス", "アウェーロングパス"),
    "パス:ファイナルサードパス": ("ホームファイナルサードパス", "アウェーファイナルサードパス"),
    "パス:クロス": ("ホームクロス", "アウェークロス"),

    "ディフェンス:タックル": ("ホームタックル", "アウェータックル"),
    "ディフェンス:クリア": ("ホームクリア", "アウェークリア"),
    "ディフェンス:デュエル勝利": ("ホームデュエル勝利数", "アウェーデュエル勝利数"),
    "ディフェンス:インターセプト": ("ホームインターセプト", "アウェーインターセプト"),
}


# =========================
# Flashscoreラベル -> canonicalキー
# =========================
LABEL_TO_CANON: Dict[str, str] = {
    "ゴール期待値（xG）": "アタック:期待値（xG）",
    "枠内ゴール期待値（xGOT）": "アタック:枠内ゴール期待値",

    "ボール支配率": "ポゼッション:ボール支配率",
    "合計シュート": "シュート:シュート数",
    "枠内シュート": "シュート:枠内シュート数",
    "枠外シュート": "シュート:枠外シュート数",
    "シュートブロック": "シュート:ブロックシュート",
    "ボックス内からのシュート": "シュート:ボックス内シュート",
    "ボックス外からのシュート": "シュート:ボックス外シュート",
    "ゴール枠に当たる": "シュート:ポストヒット",
    "ゴール枠に当たるシュート": "シュート:ポストヒット",

    "ビッグチャンス": "アタック:ビッグチャンス",
    "コーナーキック": "セットプレー:コーナーキック",

    "イエローカード": "カード:イエローカード",
    "レッドカード": "カード:レッドカード",
    "ファウル": "ディフェンス:ファウル",
    "オフサイド": "ディフェンス:オフサイド",
    "フリーキック": "ディフェンス:フリーキック",
    "スローイン": "ディフェンス:スローイン",
    "タックル": "ディフェンス:タックル",
    "デュエル勝利数": "ディフェンス:デュエル勝利",
    "クリアリング": "ディフェンス:クリア",
    "クリア": "ディフェンス:クリア",
    "インターセプト": "ディフェンス:インターセプト",
    "キーパーセーブ": "ディフェンス:キーパーセーブ",

    "相手ボックス内でのタッチ": "パス:相手ボックスタッチ",
    "相手ボックス内タッチ": "パス:相手ボックスタッチ",
    "パス": "パス:総パス数",
    "ロングパス": "パス:ロングパス",
    "ファイナルサードでのパス": "パス:ファイナルサードパス",
    "ファイナルサードのパス": "パス:ファイナルサードパス",
    "クロス": "パス:クロス",
}

SECTION_PREFER = ["主なスタッツ", "シュート", "アタック", "パス", "ディフェンス", "ゴールキーパー"]


# =========================
# ログ
# =========================
def log_info(msg: str) -> None:
    if VERBOSE:
        print(f"[INFO] {msg}", flush=True)


def log_warn(msg: str) -> None:
    if VERBOSE:
        print(f"[WARN] {msg}", flush=True)


def log_error(msg: str) -> None:
    if VERBOSE:
        print(f"[ERROR] {msg}", flush=True)


# =========================
# 例外（再試行の扱いを分けるため）
# =========================
class NotFinishedError(RuntimeError):
    """試合がまだ終わっていない → 再試行（試行回数に数えない）"""


class MatchCancelledError(RuntimeError):
    """中止・延期など → 再試行しない（fin/dead/ へ）"""


def is_past_deadline() -> bool:
    return datetime.datetime.now(JST).time() >= DEADLINE_JST


# =========================
# 共通
# =========================
def utc_ts_for_filename() -> str:
    return datetime.datetime.now(JST).strftime("%Y%m%dT%H%M%S%z")


def utc_ts_iso() -> str:
    return datetime.datetime.now(JST).isoformat()


def normalize_space(text: Any) -> str:
    if text is None:
        return ""
    return re.sub(r"\s+", " ", str(text)).strip()


def text_clean(s: str) -> str:
    return normalize_space(s)


def normalize_text(s: Any) -> str:
    """NFKC で全角・半角をそろえ、空白を 1 つにまとめる（future.py と同じ）"""
    if s is None:
        return ""
    s = unicodedata.normalize("NFKC", str(s))
    s = s.replace("\u3000", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def normalize_category_name(s: str) -> str:
    """カテゴリ文字列の正規化（future.py と同じ）: ダッシュの揺れを「 - 」にそろえる"""
    s = normalize_text(s)
    s = s.replace("－", "-").replace("—", "-").replace("–", "-")
    s = re.sub(r"\s*-\s*", " - ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def split_category_text(s: str) -> Tuple[str, str]:
    s = normalize_category_name(s)
    if ":" not in s:
        return s, ""
    country, league = s.split(":", 1)
    return normalize_category_name(country), normalize_category_name(league)


def normalize_league_for_compare(s: str) -> str:
    s = normalize_category_name(s)
    s = re.sub(r"\s*-\s*ラウンド\s*\d+\s*$", "", s)
    return s


def is_same_category_exact(a: str, b: str) -> bool:
    return normalize_category_name(a) == normalize_category_name(b)


def is_same_category_base(a: str, b: str) -> bool:
    ac, al = split_category_text(a)
    bc, bl = split_category_text(b)

    if not ac or not bc or not al or not bl:
        return False

    return ac == bc and normalize_league_for_compare(al) == normalize_league_for_compare(bl)


def _section_rank(section: str) -> int:
    try:
        return SECTION_PREFER.index(section)
    except ValueError:
        return 999


def parse_live_time_to_seconds(tstr: str) -> int:
    if not tstr:
        return 0
    t = tstr.strip()
    if "終了" in t or "FT" in t.upper():
        return 5400
    if "前半" in t:
        num = re.sub(r"[^0-9]", "", t)
        return int(num) * 60 if num else 0
    if "後半" in t:
        num = re.sub(r"[^0-9]", "", t)
        return 2700 + int(num) * 60 if num else 2700
    if re.match(r"^\d+\+\d+$", t):
        a, b = t.split("+")
        return (int(a) + int(b)) * 60
    if t.isdigit():
        return int(t) * 60
    return 0


def verify_header_and_stat_map():
    bad = []
    for k, (hcol, acol) in STAT_KEY_MAP.items():
        if hcol not in HEADER:
            bad.append(("HOME", k, hcol))
        if acol not in HEADER:
            bad.append(("AWAY", k, acol))
    if bad:
        for side, k, col in bad:
            log_error(f"STAT_KEY_MAP mismatch: {side} key={k} col={col}")
        raise RuntimeError("STAT_KEY_MAP column mismatch with HEADER")
    log_info("STAT_KEY_MAP と HEADER の整合性OK")


def verify_stats_mapping(stats_pairs: Dict[str, Tuple[str, str]]):
    scraped_keys = set(stats_pairs.keys())
    mapped_keys = set(STAT_KEY_MAP.keys())
    direct_hit = sorted(scraped_keys & mapped_keys)
    miss_scraped = sorted(scraped_keys - mapped_keys)

    log_info(f"stats mapping hit={len(direct_hit)} miss={len(miss_scraped)}")
    for k in direct_hit[:30]:
        hv, av = stats_pairs.get(k, ("", ""))
        log_info(f"  hit {k} = ({hv}, {av})")
    for k in miss_scraped[:30]:
        hv, av = stats_pairs.get(k, ("", ""))
        log_warn(f"  miss {k} = ({hv}, {av})")


def verify_row_filled(row: Dict[str, Any], limit: int = 120):
    filled = []
    for col in HEADER:
        v = row.get(col, "")
        if v not in ("", None):
            filled.append((col, v))
    log_info(f"row filled columns={len(filled)}")
    for col, v in filled[:limit]:
        log_info(f"  {col} = {v}")


# =========================
# ログ / 進捗
# =========================
def log(msg: str) -> None:
    ts = datetime.datetime.now(JST).strftime("%Y-%m-%d %H:%M:%S")
    print(f"{ts} {msg}", flush=True)
    try:
        sys.stdout.flush()
    except Exception:
        pass


HEARTBEAT_SEC = 30
PROGRESS_SEC = 20


class Progress:
    """
    ECS の CloudWatch Logs から latest progress を拾えるようにするための進捗管理。

    Java 側は以下の形式を拾う:
      [PROGRESS] teams=3/20

    なので必ずこの文字列を含める。
    """

    def __init__(self):
        self.started = time.time()
        self.last_progress = 0.0
        self.lock = threading.Lock()

        self.counters = {
            "teams_total": 0,
            "teams_done": 0,
            "uploaded": 0,
            "failed": 0,
            "goto_fail": 0,
        }

        self.state = "INIT"
        self.current_date = ""
        self.current_mid = ""
        self.current_url = ""
        self.phase = "boot"

    def reset_for_batch(self, total: int) -> None:
        with self.lock:
            self.started = time.time()
            self.last_progress = 0.0

            self.counters = {
                "teams_total": max(int(total), 0),
                "teams_done": 0,
                "uploaded": 0,
                "failed": 0,
                "goto_fail": 0,
            }

            self.state = "INIT"
            self.current_date = ""
            self.current_mid = ""
            self.current_url = ""
            self.phase = "boot"

    def set_total(self, total: int) -> None:
        with self.lock:
            self.counters["teams_total"] = max(int(total), 0)

    def start_item(self, date_str: str, mid: str, url: str, phase: str = "start") -> None:
        with self.lock:
            self.current_date = date_str or ""
            self.current_mid = mid or ""
            self.current_url = url or ""
            self.phase = phase
            self.state = "RUNNING"

    def set_phase(self, phase: str) -> None:
        with self.lock:
            self.phase = phase

    def inc_done(self, n: int = 1) -> None:
        with self.lock:
            self.counters["teams_done"] += n

    def inc_uploaded(self, n: int = 1) -> None:
        with self.lock:
            self.counters["uploaded"] += n

    def inc_failed(self, n: int = 1) -> None:
        with self.lock:
            self.counters["failed"] += n

    def inc_goto_fail(self, n: int = 1) -> None:
        with self.lock:
            self.counters["goto_fail"] += n

    def set_state(self, state: str) -> None:
        with self.lock:
            self.state = state

    def snapshot(self) -> dict:
        with self.lock:
            snap = {
                "started": self.started,
                "last_progress": self.last_progress,
                "state": self.state,
                "current_date": self.current_date,
                "current_mid": self.current_mid,
                "current_url": self.current_url,
                "phase": self.phase,
                **self.counters,
            }
        return snap

    def maybe_log(self, force: bool = False) -> None:
        now = time.time()
        with self.lock:
            if (not force) and (now - self.last_progress < PROGRESS_SEC):
                return
            self.last_progress = now

            elapsed = int(now - self.started)
            teams_done = self.counters["teams_done"]
            teams_total = self.counters["teams_total"]
            uploaded = self.counters["uploaded"]
            failed = self.counters["failed"]
            goto_fail = self.counters["goto_fail"]
            state = self.state
            current_date = self.current_date
            current_mid = self.current_mid
            phase = self.phase

        log(
            "[PROGRESS] "
            f"teams={teams_done}/{teams_total} "
            f"state={state} "
            f"elapsed={elapsed}s "
            f"uploaded={uploaded} "
            f"failed={failed} "
            f"goto_fail={goto_fail} "
            f"current_date={current_date} "
            f"current_mid={current_mid} "
            f"phase={phase}"
        )


progress = Progress()


class ProgressHeartbeat(threading.Thread):
    def __init__(self, interval_sec: int = HEARTBEAT_SEC):
        super().__init__(daemon=True)
        self.interval_sec = interval_sec
        self._stop_event = threading.Event()

    def stop(self):
        self._stop_event.set()

    def run(self):
        while not self._stop_event.is_set():
            time.sleep(self.interval_sec)
            try:
                progress.maybe_log(force=True)
            except Exception as e:
                log(f"[WARN] heartbeat log failed: {e}")


# =========================
# S3 I/O
# =========================
def list_keys_by_pattern(s3_client, bucket: str, prefix: str, pattern: "re.Pattern") -> List[Tuple[int, str]]:
    """
    prefix 以下で pattern に一致するキーを (連番, key) の連番昇順で返す（group(1) が連番）
    """
    results: List[Tuple[int, str]] = []
    continuation_token = None

    while True:
        kwargs = {
            "Bucket": bucket,
            "Prefix": prefix,
            "MaxKeys": 1000,
        }
        if continuation_token:
            kwargs["ContinuationToken"] = continuation_token

        resp = s3_client.list_objects_v2(**kwargs)

        for item in resp.get("Contents", []):
            key = item["Key"]
            m = pattern.match(key)
            if not m:
                continue
            results.append((int(m.group(1)), key))

        if not resp.get("IsTruncated"):
            break

        continuation_token = resp.get("NextContinuationToken")

    results.sort(key=lambda x: (x[0], x[1]))
    return results


def list_input_json_keys(s3_client, bucket: str) -> List[Tuple[int, str]]:
    """
    fin/b008_fin_getting_data_1.json, _2.json, ... を連番昇順で返す
    （fin/retry/ ・ fin/dead/ は INPUT_JSON_PATTERN に当たらないので含まれない）
    """
    return list_keys_by_pattern(s3_client, bucket, INPUT_JSON_PREFIX, INPUT_JSON_PATTERN)


def list_retry_json_keys(s3_client, bucket: str) -> List[Tuple[int, str]]:
    return list_keys_by_pattern(s3_client, bucket, RETRY_JSON_PREFIX, RETRY_JSON_PATTERN)


def delete_s3_object(s3_client, bucket: str, key: str) -> None:
    s3_client.delete_object(Bucket=bucket, Key=key)
    log_info(f"deleted s3 object -> s3://{bucket}/{key}")


def get_s3_client():
    return boto3.client("s3", region_name=AWS_REGION)


def load_json_from_s3(s3_client, bucket: str, key: str) -> Dict[str, Any]:
    obj = s3_client.get_object(Bucket=bucket, Key=key)
    body = obj["Body"].read().decode("utf-8")
    return json.loads(body)


def put_json_to_s3(s3_client, bucket: str, key: str, data: Any) -> None:
    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8"),
        ContentType="application/json"
    )
    log_info(f"uploaded json -> s3://{bucket}/{key}")


def put_single_row_csv_to_s3(s3_client, bucket: str, key: str, row: Dict[str, Any]) -> None:
    buf = StringIO()
    writer = csv.writer(buf, lineterminator="\n")
    writer.writerow(HEADER)
    writer.writerow([row.get(col, "") for col in HEADER])

    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=buf.getvalue().encode("utf-8-sig"),
        ContentType="text/csv"
    )
    log_info(f"uploaded csv -> s3://{bucket}/{key}")


# =========================
# JSON 正規化
# =========================
def iter_b008_records(data: Dict[str, Any]) -> Iterator[Dict[str, Any]]:
    for date_str, matches in data.items():
        if not isinstance(matches, list):
            log_warn(f"date={date_str} の値が list ではありません: {type(matches)}")
            continue

        for idx, match in enumerate(matches, start=1):
            if not isinstance(match, dict):
                log_warn(f"date={date_str} index={idx} が dict ではありません: {type(match)}")
                continue

            category = (
                match.get("category")
                or match.get("top_category")
                or match.get("topCategory")
                or match.get("countryLeague")
                or match.get("試合国及びカテゴリ")
                or ""
            )

            try:
                attempt = int(match.get("attempt", 0) or 0)
            except (TypeError, ValueError):
                attempt = 0

            yield {
                "date": match.get("date", date_str),
                "matchKey": match.get("matchKey"),
                "matchUrl": match.get("matchUrl"),
                "category": text_clean(category),
                "attempt": attempt,
            }


def split_records(records: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    resolved: matchKey と matchUrl があり、URL の mid が matchKey と一致するもの
    unresolved: それ以外（理由を reason に入れる）
    """
    resolved = []
    unresolved = []

    for record in records:
        key = (record.get("matchKey") or "").strip()
        url = (record.get("matchUrl") or "").strip()
        if not key or not url:
            unresolved.append({**record, "reason": "no_match_key_or_url"})
            continue
        mid = extract_mid(url)
        if mid and mid != key:
            # 別の試合のページを読んで matchKey の試合として保存してしまうため取得しない
            log_warn(f"[SPLIT] mid mismatch matchKey={key} mid={mid} url={url}")
            unresolved.append({**record, "reason": f"mid_mismatch(mid={mid})"})
            continue
        resolved.append(record)

    return resolved, unresolved


CATEGORY_BAD_PAT = re.compile(
    r"Flashscore\.co\.jp|サマリー:|プレビュー:|H2H|順位表|vs\s|｜サッカー|\|",
    re.IGNORECASE
)

# NFKC 後に判定する（全角数字は半角になっている）
ROUND_PAT = re.compile(r"ラウンド\s*\d+")

# 2026-10 修正3: 入力 JSON 1 つ分の「ラウンドなし」集計（process_one_input_json の先頭で reset）
CATEGORY_STATS: Dict[str, Any] = {"noRoundCount": 0, "noRoundMatches": []}


def reset_category_stats() -> None:
    CATEGORY_STATS["noRoundCount"] = 0
    CATEGORY_STATS["noRoundMatches"] = []


def is_valid_match_category_text(s: str) -> bool:
    s = text_clean(s)
    if not s:
        return False
    if CATEGORY_BAD_PAT.search(s):
        return False
    return ":" in s


def is_suspicious_meta_text(s: str) -> bool:
    s = text_clean(s)
    if not s:
        return False
    return bool(CATEGORY_BAD_PAT.search(s))


def build_match_category(meta: Dict[str, str], fallback: str = "") -> str:
    full_category = normalize_category_name(meta.get("カテゴリ全文", ""))
    fallback = normalize_category_name(fallback)

    country = normalize_category_name(meta.get("国", ""))
    league = normalize_category_name(meta.get("リーグ", ""))

    meta_joined = normalize_category_name(f"{country}: {league}" if country and league else "")
    meta_suspicious = is_suspicious_meta_text(country) or is_suspicious_meta_text(league)

    if is_valid_match_category_text(full_category):
        return full_category

    if is_valid_match_category_text(fallback):
        if meta_suspicious or not meta_joined:
            return fallback

        if is_same_category_exact(fallback, meta_joined):
            return fallback

        if is_same_category_base(fallback, meta_joined) and len(fallback) > len(meta_joined):
            return fallback

    if country and league and not meta_suspicious:
        return meta_joined
    if country and not is_suspicious_meta_text(country):
        return country
    if league and not is_suspicious_meta_text(league):
        return league

    if is_valid_match_category_text(fallback):
        return fallback

    return ""


# =========================
# S3上の既存CSVから次SEQ
# =========================
SEQ_PATTERN = re.compile(r"seq=(\d{6})_")


def find_next_seq_from_s3(s3_client, bucket: str, date_str: str, mid: str) -> int:
    prefix = f"{date_str}/mid={mid}/"
    max_seq = 0
    continuation_token = None

    while True:
        kwargs = {
            "Bucket": bucket,
            "Prefix": prefix,
            "MaxKeys": 1000,
        }
        if continuation_token:
            kwargs["ContinuationToken"] = continuation_token

        resp = s3_client.list_objects_v2(**kwargs)

        for item in resp.get("Contents", []):
            key = item["Key"]
            m = SEQ_PATTERN.search(key)
            if m:
                seq_num = int(m.group(1))
                max_seq = max(max_seq, seq_num)

        if not resp.get("IsTruncated"):
            break

        continuation_token = resp.get("NextContinuationToken")

    return max_seq + 1


def build_csv_key(date_str: str, mid: str, seq: int, ts: str) -> str:
    return f"{date_str}/mid={mid}/seq={seq:06d}_{ts}.csv"


# =========================
# URL builders
# =========================
_MATCH_ROOT_RE = re.compile(r"^(/match/[^/]+/[^/]+/[^/]+/)")


def extract_mid(any_url: str) -> Optional[str]:
    if not any_url:
        return None
    qs = parse_qs(urlparse(any_url).query)
    v = qs.get("mid", [None])[0]
    return v.strip() if v else None


def _match_root_from_any_url(any_url: str) -> Tuple[Tuple[str, str, str], str]:
    parts = urlsplit(any_url)
    path = parts.path or ""
    m = _MATCH_ROOT_RE.search(path)
    if not m:
        raise ValueError(f"match root not found: {any_url}")
    match_root_path = m.group(1)
    mid = extract_mid(any_url) or ""
    return (parts.scheme, parts.netloc, match_root_path), mid


def build_stats_url(any_url: str) -> str:
    (scheme, netloc, root), mid = _match_root_from_any_url(any_url)
    path = root + "summary/stats/overall/"
    query = f"mid={mid}" if mid else ""
    return urlunsplit((scheme, netloc, path, query, ""))


def build_summary_url(any_url: str) -> str:
    (scheme, netloc, root), mid = _match_root_from_any_url(any_url)
    path = root + "summary/"
    query = f"mid={mid}" if mid else ""
    return urlunsplit((scheme, netloc, path, query, ""))


def build_live_standings_url(any_url: str) -> str:
    (scheme, netloc, root), mid = _match_root_from_any_url(any_url)
    path = root + "standings/live-standings/"
    query = f"mid={mid}" if mid else ""
    return urlunsplit((scheme, netloc, path, query, ""))


def build_overall_standings_url(any_url: str) -> str:
    (scheme, netloc, root), mid = _match_root_from_any_url(any_url)
    path = root + "standings/standings/overall/"
    query = f"mid={mid}" if mid else ""
    return urlunsplit((scheme, netloc, path, query, ""))


# =========================
# ページ遷移/バナー
# =========================
def safe_goto(pg, url: str, timeout_ms: int = NAVIGATION_TIMEOUT_MS, tag: str = "") -> bool:
    ttag = f" {tag}" if tag else ""
    log_info(f"[GOTO]{ttag} try1 commit: {url}")
    try:
        pg.goto(url, timeout=timeout_ms, wait_until="commit")
        return True
    except PlaywrightTimeoutError as e:
        log_warn(f"[GOTO]{ttag} try1 timeout: {e}")
    except Exception as e:
        log_warn(f"[GOTO]{ttag} try1 error: {type(e).__name__}: {e}")

    try:
        pg.evaluate("() => window.stop()")
    except Exception:
        pass

    log_info(f"[GOTO]{ttag} try2 domcontentloaded: {url}")
    try:
        pg.goto(url, timeout=8000, wait_until="domcontentloaded")
        return True
    except Exception as e:
        log_warn(f"[GOTO]{ttag} try2 error: {type(e).__name__}: {e}")

    try:
        pg.goto("about:blank", timeout=3000, wait_until="commit")
    except Exception:
        pass

    log_info(f"[GOTO]{ttag} try3 domcontentloaded(after blank): {url}")
    try:
        pg.goto(url, timeout=8000, wait_until="domcontentloaded")
        return True
    except Exception as e:
        log_error(f"[GOTO]{ttag} try3 failed: {type(e).__name__}: {e}")
        progress.inc_goto_fail(1)
        progress.set_phase("goto_failed")
        progress.maybe_log(force=True)
        return False


def safe_click_if_exists(page, selectors: List[str], timeout_ms: int = 1500, wait_ms: int = 800) -> bool:
    for sel in selectors:
        try:
            locator = page.locator(sel)
            if locator.count() > 0:
                locator.first.click(timeout=timeout_ms, force=True)
                page.wait_for_timeout(wait_ms)
                return True
        except Exception:
            pass
    return False


def kill_onetrust(page):
    try:
        btn = page.locator("#onetrust-accept-btn-handler")
        if btn.count():
            btn.click(timeout=1200, force=True)
    except Exception:
        pass

    try:
        page.evaluate("""
        () => {
          const ids = ["onetrust-consent-sdk", "onetrust-banner-sdk"];
          ids.forEach(id => document.getElementById(id)?.remove());
          document.querySelectorAll(".ot-sdk-container, .ot-sdk-row, .otOverlay, .ot-pc-footer, .ot-pc-header")
            .forEach(el => el.remove());
        }
        """)
    except Exception:
        pass


def kill_consent_banners(page):
    kill_onetrust(page)

    candidates = [
        "button:has-text('すべて拒否する')",
        "button:has-text('全て拒否する')",
        "button:has-text('拒否する')",
        "button:has-text('同意します')",
        "button:has-text('同意する')",
        "button:has-text('Reject all')",
        "button:has-text('Accept all')",
        "[role='button']:has-text('すべて拒否する')",
        "[role='button']:has-text('同意します')",
    ]
    safe_click_if_exists(page, candidates, timeout_ms=1500, wait_ms=800)

    try:
        page.evaluate("""
        () => {
          const kill = [
            "#qc-cmp2-container",
            "#didomi-host",
            "#sp_message_container_",
            ".fc-consent-root",
            ".message-component",
            ".pmConsentWall"
          ];
          kill.forEach(s => document.querySelectorAll(s).forEach(el => el.remove()));
        }
        """)
    except Exception:
        pass


def is_bot_wall(pg) -> bool:
    try:
        return pg.locator(f"text=/{BOT_WALL_PAT}/i").first.is_visible(timeout=900)
    except Exception:
        return False


def setup_route_blocking(ctx):
    def _route(route):
        try:
            rtype = route.request.resource_type
            url = (route.request.url or "").lower()
            if rtype in ("image", "media", "font"):
                return route.abort()
            if any(x in url for x in ("doubleclick", "googlesyndication", "adservice", "adsystem", "taboola", "outbrain")):
                return route.abort()
        except Exception:
            pass
        return route.continue_()
    ctx.route("**/*", _route)


# =========================
# 試合ページ情報
# =========================
def get_home_away_names(pg) -> Tuple[str, str]:
    try:
        cont = pg.locator("div.duelParticipant__container").first
        if not cont.count():
            cont = pg

        h = cont.locator(".duelParticipant__home a.participant__participantName").first
        a = cont.locator(".duelParticipant__away a.participant__participantName").first

        home = text_clean(h.text_content()) if h.count() else ""
        away = text_clean(a.text_content()) if a.count() else ""

        if not home:
            img = cont.locator(".duelParticipant__home img.participant__image").first
            home = text_clean(img.get_attribute("alt") or "")
        if not away:
            img = cont.locator(".duelParticipant__away img.participant__image").first
            away = text_clean(img.get_attribute("alt") or "")

        return home, away
    except Exception:
        return "", ""


def get_scores(pg) -> Tuple[str, str]:
    def _clean(s: str) -> str:
        return re.sub(r"\s+", "", (s or "").replace(" ", " ")).strip()

    def _from_container(el):
        try:
            spans = el.locator("span")
            vals = []
            for i in range(spans.count()):
                sp = spans.nth(i)
                cls = (sp.get_attribute("class") or "")
                if "divider" in cls:
                    continue
                txt = _clean(sp.text_content() or "")
                if re.fullmatch(r"\d+", txt):
                    vals.append(txt)
            if len(vals) >= 2:
                return vals[0], vals[-1]
        except Exception:
            pass

        try:
            t = _clean(el.inner_text() or "")
            m = re.search(r"(\d+)\s*[\-−‒–—―:]\s*(\d+)", t)
            if m:
                return m.group(1), m.group(2)
        except Exception:
            pass

        return "", ""

    try:
        fx = pg.locator(".fixedHeaderDuel:not(.fixedHeaderDuel--isHidden) .fixedScore").first
        if fx.count():
            h, a = _from_container(fx)
            if h and a:
                return h, a
    except Exception:
        pass

    try:
        live = pg.locator("div.detailScore__wrapper.detailScore__live").first
        if live.count():
            h, a = _from_container(live)
            if h and a:
                return h, a
    except Exception:
        pass

    try:
        wrap = pg.locator("div.detailScore__wrapper").first
        if wrap.count():
            h, a = _from_container(wrap)
            if h and a:
                return h, a
    except Exception:
        pass

    return "", ""


def get_match_time_text(pg) -> str:
    def _txt(locator) -> str:
        try:
            if locator.count():
                t = (locator.first.text_content() or "").strip().replace(" ", " ")
                return t
        except Exception:
            pass
        return ""

    event_selectors = [
        ".fixedHeaderDuel:not(.fixedHeaderDuel--isHidden) .eventAndAddedTime .eventTime",
        "div.detailScore__status .eventAndAddedTime .eventTime",
        ".eventAndAddedTime .eventTime",
    ]
    for s in event_selectors:
        t = _txt(pg.locator(f"{s} >> visible=true"))
        if t:
            return t

    testid_selectors = [
        "[data-testid='wcl-time']",
    ]
    for s in testid_selectors:
        t = _txt(pg.locator(f"{s} >> visible=true"))
        if t:
            return t

    status_selectors = [
        ".fixedHeaderDuel:not(.fixedHeaderDuel--isHidden) .fixedHeaderDuel__detailStatus",
        "div.detailScore__status .fixedHeaderDuel__detailStatus",
        "div.detailScore__status",
    ]
    for s in status_selectors:
        t = _txt(pg.locator(f"{s} >> visible=true"))
        if t:
            return t

    return ""


def get_original_match_start_time(pg) -> str:
    """
    試合ページ上部の開始日時を取得する。
    例: 14.07.2026 07:00
    """
    selectors = [
        "div.duelParticipant__startTime > div",
        ".duelParticipant__startTime div",
        ".duelParticipant__startTime",
    ]

    for sel in selectors:
        try:
            loc = pg.locator(sel).first
            if loc.count():
                txt = text_clean(loc.text_content() or "")
                if txt and START_TIME_PAT.search(txt):
                    return txt
        except Exception:
            pass

    try:
        html = pg.content()
        m = START_TIME_PAT.search(html)
        if m:
            return m.group(0)
    except Exception:
        pass

    return ""


# =========================
# meta(summary)
# =========================
def parse_breadcrumb_from_match_page(page) -> Tuple[str, str]:
    """
    試合ページのパンくずから (国, リーグ部分) を取る（2026-10 修正3: future.py と同じやり方）
      <ol> の各 li[data-testid='wcl-breadcrumbsItem'] の [itemprop='name']
      例: ["サッカー", "イングランド", "プレミアリーグ - ラウンド 7"]
        → ("イングランド", "プレミアリーグ - ラウンド 7")
    href でも判定する（/soccer/<国>/ = 国、/soccer/<国>/<リーグ>/ = リーグ）。
    パンくずの描画を最大 PAGE_WAIT_BREADCRUMB_MS 待つ。
    """
    try:
        page.wait_for_selector(BREADCRUMB_ITEM_SEL, timeout=PAGE_WAIT_BREADCRUMB_MS)
    except PlaywrightTimeoutError:
        return "", ""
    except Exception:
        return "", ""

    try:
        got = page.evaluate(
            """
            (sel) => {
              const norm = (s) => (s || '').normalize('NFKC').replace(/\\s+/g, ' ').trim();
              const items = Array.from(document.querySelectorAll(sel)).map((li) => {
                const a = li.querySelector("a[href]");
                const name = li.querySelector("[itemprop='name']") || li.querySelector("[data-testid='wcl-overline-03']") || a;
                let path = '';
                try { path = a ? new URL(a.getAttribute('href'), location.href).pathname : ''; } catch (e) {}
                return { text: norm(name ? name.textContent : ''), parts: path.split('/').filter(Boolean) };
              });
              let country = '', league = '';
              for (const it of items) {
                if (!it.text) continue;
                if (it.parts[0] === 'soccer' && it.parts.length === 2) country = it.text;
                if (it.parts[0] === 'soccer' && it.parts.length >= 3) league = it.text;
              }
              // href で判定できないときは並び順（サッカー > 国 > リーグ）
              const texts = items.map((it) => it.text).filter(Boolean);
              if (!country && texts.length >= 3) country = texts[texts.length - 2];
              if (!league && texts.length >= 2) league = texts[texts.length - 1];
              return { country, league, count: items.length };
            }
            """,
            BREADCRUMB_ITEM_SEL,
        ) or {}
    except Exception:
        return "", ""

    country = normalize_text(got.get("country") or "")
    league = normalize_text(got.get("league") or "")
    if country in ("サッカー", "ホーム"):
        country = ""
    if is_suspicious_meta_text(country):
        country = ""
    if is_suspicious_meta_text(league):
        league = ""
    return country, league


def read_breadcrumb_with_retry(pg) -> Tuple[str, str]:
    """パンくずを読む。リーグが取れなければ 1 回だけ再読み込みして読み直す（future.py と同じ）"""
    crumb_country, crumb_league = parse_breadcrumb_from_match_page(pg)
    if not crumb_league:
        log_info("[CRUMB] パンくずが取れないため再読み込み")
        try:
            pg.reload(timeout=NAVIGATION_TIMEOUT_MS, wait_until="domcontentloaded")
            kill_consent_banners(pg)
            crumb_country, crumb_league = parse_breadcrumb_from_match_page(pg)
        except Exception as e:
            log_warn(f"[CRUMB] 再読み込み失敗: {type(e).__name__}: {e}")
    log_info(f"[CRUMB] country='{crumb_country}' league='{crumb_league}'")
    return crumb_country, crumb_league


def build_category_from_crumb(country: str, crumb_league: str) -> str:
    """「国: リーグ - ラウンド N」を作る（future.py の build_game_team_category と同じ考え方）"""
    country = normalize_text(country)
    league_part = normalize_text(crumb_league)
    if not country:
        return normalize_category_name(league_part)
    if not league_part:
        return normalize_category_name(country)
    return normalize_category_name(f"{country}: {league_part}")


def get_match_meta(pg, base_url: str) -> Dict[str, str]:
    meta: Dict[str, str] = {}
    summary_url = build_summary_url(base_url)

    if "/summary/" not in pg.url or "/summary/stats" in pg.url:
        log_info(f"[META] goto: {summary_url}")
        ok = safe_goto(pg, summary_url, timeout_ms=NAVIGATION_TIMEOUT_MS, tag="META")
        if not ok:
            meta["試合時間"] = get_match_time_text(pg)
            meta["取得時刻"] = datetime.datetime.now(JST).strftime("%Y-%m-%d %H:%M:%S")
            return meta
        kill_consent_banners(pg)

    if is_bot_wall(pg):
        meta["試合時間"] = get_match_time_text(pg)
        meta["取得時刻"] = datetime.datetime.now(JST).strftime("%Y-%m-%d %H:%M:%S")
        return meta

    # 2026-10 修正3: まず future.py と同じパンくずの読み方で「国」「リーグ - ラウンド N」を取る
    crumb_country, crumb_league = read_breadcrumb_with_retry(pg)

    try:
        pg.wait_for_selector(
            "ol li span[itemprop='name'], [data-testid*='breadcrumbs'], .tournamentHeader, .duelParticipant",
            timeout=WAIT_TIMEOUT_MS
        )
    except Exception:
        pass

    country = ""
    league = ""

    try:
        crumb_txts = []
        cand = pg.locator("ol li span[itemprop='name'], [data-testid*='breadcrumbs'] span[itemprop='name']")
        for i in range(cand.count()):
            t = text_clean(cand.nth(i).text_content() or "")
            if t:
                crumb_txts.append(t)

        if len(crumb_txts) >= 2:
            country = crumb_txts[1]
        if len(crumb_txts) >= 3:
            league = crumb_txts[2]

        if country and league:
            meta["カテゴリ全文"] = f"{country}: {league}"
    except Exception:
        pass

    if not country or not league:
        try:
            c = pg.locator(".tournamentHeader__country, .tournamentHeader__category, [class*='tournamentHeader__category']").first
            t = text_clean(c.text_content() or "")
            if t:
                if is_valid_match_category_text(t):
                    meta["カテゴリ全文"] = t

                if ":" in t and (not country or not league):
                    a, b = [x.strip() for x in t.split(":", 1)]
                    if not country:
                        country = a
                    if not league:
                        league = b
                elif not country and not is_suspicious_meta_text(t):
                    country = t
        except Exception:
            pass

    if not country or not league:
        try:
            title = text_clean(pg.title() or "")
            if is_valid_match_category_text(title):
                meta["カテゴリ全文"] = title

                if ":" in title:
                    a, b = [x.strip() for x in title.split(":", 1)]
                    if not country:
                        country = a
                    if not league:
                        league = b
            else:
                log_info(f"[META] title fallback skipped title='{title}'")

            log_info(f"[META] title fallback result country='{country}' league='{league}' full='{meta.get('カテゴリ全文', '')}'")
        except Exception as e:
            log_warn(f"[META] title fallback error: {type(e).__name__}: {e}")

    # 2026-10 追加: パンくずの構造が変わっても取れるように、リンクの href から国・リーグを取る
    #   /soccer/<国>/          → 国
    #   /soccer/<国>/<リーグ>/ → リーグ（/match/ や /team/ は除く）
    if not country or not league:
        try:
            got = pg.evaluate("""
            () => {
              const clean = (s) => (s || '').replace(/\\u00A0/g, ' ').replace(/\\s+/g, ' ').trim();
              const skip = new Set(['match', 'team', 'player', 'standings', 'results', 'fixtures']);
              let c = '', l = '';
              const roots = document.querySelectorAll(
                "[data-testid*='breadcrumb'], nav, .tournamentHeader, .tournamentHeader__country, [class*='breadcrumb']");
              const scan = (root) => {
                for (const a of root.querySelectorAll("a[href]")) {
                  let path = '';
                  try { path = new URL(a.getAttribute('href'), location.href).pathname; } catch (e) { continue; }
                  const p = path.split('/').filter(Boolean);
                  if (p[0] !== 'soccer' || p.length < 2 || skip.has(p[1])) continue;
                  const t = clean(a.textContent);
                  if (!t) continue;
                  if (p.length === 2 && !c) c = t;
                  if (p.length === 3 && !skip.has(p[2]) && !l) l = t;
                }
              };
              roots.forEach(scan);
              return { country: c, league: l };
            }
            """) or {}
            c2 = text_clean(got.get("country") or "")
            l2 = text_clean(got.get("league") or "")
            if not country and c2 and not is_suspicious_meta_text(c2):
                country = c2
            if not league and l2 and not is_suspicious_meta_text(l2):
                league = l2
            if country and league and not meta.get("カテゴリ全文"):
                meta["カテゴリ全文"] = f"{country}: {league}"
            log_info(f"[META] link fallback country='{c2}' league='{l2}'")
        except Exception as e:
            log_warn(f"[META] link fallback error: {type(e).__name__}: {e}")

    # 2026-10 修正3: パンくずで取れた値を優先する（リーグ部分は「- ラウンド N」付き）
    if crumb_country:
        country = crumb_country
    if crumb_league:
        league = crumb_league
        meta["カテゴリ全文"] = build_category_from_crumb(country, crumb_league)
        log_info(f"[META] category from breadcrumb full='{meta['カテゴリ全文']}'")

    log_info(f"[META] extracted country='{country}' league='{league}'")

    meta["国"] = country
    meta["リーグ"] = league

    label_aliases = {
        "レフェリー": "レフェリー",
        "審判": "レフェリー",
        "主審": "レフェリー",
        "開催地": "開催地",
        "スタジアム": "開催地",
        "会場": "開催地",
        "収容人数": "収容人数",
        "キャパシティ": "収容人数",
        "観客": "観客",
        "観客数": "観客",
        "参加": "観客",
    }

    def put_meta(label: str, value: str):
        label = text_clean(label).replace(":", "").replace("：", "").strip()
        value = text_clean(value)
        if not label or not value:
            return
        norm = label_aliases.get(label, label)
        if norm not in meta:
            meta[norm] = value

    try:
        root = pg.locator("[data-testid='wcl-summaryMatchInformation']").first
        if root.count():
            labels = root.locator(".wcl-infoLabelWrapper_DXbvw")
            n = labels.count()

            for i in range(n):
                lab_el = labels.nth(i)
                label = text_clean(lab_el.text_content() or "")
                label = label.replace(":", "").replace("：", "").strip()

                value_el = lab_el.locator("xpath=following-sibling::div[1]").first
                if not value_el.count():
                    continue

                spans = value_el.locator("span[data-testid='wcl-scores-simple-text-01']")
                values = []
                for j in range(spans.count()):
                    txt = text_clean(spans.nth(j).text_content() or "")
                    if txt:
                        values.append(txt)

                if not values:
                    raw_value = text_clean(value_el.text_content() or "")
                    if raw_value:
                        values = [raw_value]

                if not values:
                    continue

                if label in ("開催地", "スタジアム", "会場"):
                    stadium = values[0]
                    put_meta("開催地", stadium)

                    if len(values) >= 2:
                        place = values[1]
                        place = re.sub(r"^[（(]", "", place)
                        place = re.sub(r"[）)]$", "", place)
                        place = text_clean(place)
                        if place and "場所" not in meta:
                            meta["場所"] = place
                    continue

                joined = text_clean(" ".join(values))
                put_meta(label, joined)

    except Exception as e:
        log_warn(f"[META] summaryMatchInformation parse error: {type(e).__name__}: {e}")

    try:
        dts = pg.locator("dl dt")
        n = dts.count()
        for i in range(n):
            dt = dts.nth(i)
            lab = text_clean(dt.text_content() or "")
            dd = dt.locator("xpath=following-sibling::dd[1]").first
            val = text_clean(dd.text_content() or "") if dd.count() else ""
            put_meta(lab, val)
    except Exception:
        pass

    meta["試合時間"] = get_match_time_text(pg)
    meta["取得時刻"] = datetime.datetime.now(JST).strftime("%Y-%m-%d %H:%M:%S")
    return meta


# =========================
# standings
# =========================
def goto_standings_page(pg, base_url: str) -> Optional[str]:
    url1 = build_live_standings_url(base_url)
    url2 = build_overall_standings_url(base_url)

    log_info(f"[RANK] goto(live): {url1}")
    ok = safe_goto(pg, url1, timeout_ms=NAVIGATION_TIMEOUT_MS, tag="RANK-LIVE")
    if ok:
        kill_consent_banners(pg)
        try:
            pg.wait_for_selector(".ui-table__body .ui-table__row", timeout=WAIT_TIMEOUT_MS)
            return url1
        except Exception as e:
            log_warn(f"[RANK] live wait failed: {type(e).__name__}: {e}")

    log_info(f"[RANK] goto(overall): {url2}")
    ok = safe_goto(pg, url2, timeout_ms=NAVIGATION_TIMEOUT_MS, tag="RANK-OVERALL")
    if ok:
        kill_consent_banners(pg)
        try:
            pg.wait_for_selector(".ui-table__body .ui-table__row", timeout=WAIT_TIMEOUT_MS)
            return url2
        except Exception as e:
            log_warn(f"[RANK] overall wait failed: {type(e).__name__}: {e}")

    return None


def get_match_standings(pg, base_url: str, home_name: str, away_name: str) -> Dict[str, Any]:
    url = goto_standings_page(pg, base_url)
    if not url:
        return {}

    rows = pg.locator(".ui-table__body .ui-table__row")
    try:
        n = rows.count()
    except Exception:
        n = 0
    if n == 0:
        return {}

    table = {}
    for i in range(n):
        r = rows.nth(i)
        rank_txt = text_clean(r.locator(".table__cell--rank .tableCellRank").first.text_content() or "")
        team_name = text_clean(r.locator(".table__cell--participant .tableCellParticipant__name").first.text_content() or "")
        pts_txt = text_clean(r.locator(".table__cell--value").last.text_content() or "")

        try:
            rank = int(rank_txt.strip().rstrip("."))
        except Exception:
            rank = None
        try:
            pts = int(pts_txt)
        except Exception:
            pts = None

        if team_name:
            table[team_name] = {"rank": rank, "pts": pts}

    h = text_clean(home_name)
    a = text_clean(away_name)

    home = next((v for k, v in table.items() if (h and (h in k or k in h))), None)
    away = next((v for k, v in table.items() if (a and (a in k or k in a))), None)

    return {
        "url": url,
        "home_rank": home["rank"] if home else None,
        "home_pts": home["pts"] if home else None,
        "away_rank": away["rank"] if away else None,
        "away_pts": away["pts"] if away else None,
    }


# =========================
# stats raw（加工なし）
# =========================
STAT_ROW_SELECTOR = "[data-testid='wcl-statistics']"


def goto_statistics_page(pg, base_url: str) -> bool:
    stats_url = build_stats_url(base_url)

    kill_consent_banners(pg)

    if "/summary/stats/" not in pg.url:
        log_info(f"[STATS] goto: {stats_url}")
        ok = safe_goto(pg, stats_url, timeout_ms=NAVIGATION_TIMEOUT_MS, tag="STATS")
        if not ok:
            log_warn("[STATS] goto失敗")
            return False
        kill_consent_banners(pg)

    if is_bot_wall(pg):
        log_warn("[STATS] BOT壁っぽい → statsスキップ")
        return False

    for attempt in range(2):
        try:
            pg.wait_for_selector(STAT_ROW_SELECTOR, timeout=WAIT_TIMEOUT_MS)
            log_info("[STATS] statistics selector appeared")
            return True
        except Exception as e:
            log_warn(f"[STATS] wait_for_selector failed({attempt+1}/2): {type(e).__name__}: {e}")
            kill_consent_banners(pg)

    log_warn("[STATS] 統計出ない")
    return False


def scrape_stats_raw(pg, base_url: str) -> Dict[str, List[str]]:
    """
    out: {"主なスタッツ:パス": ["34%（31/90）","51%（24/47）"], ...}
    値は加工しない
    """
    if not goto_statistics_page(pg, base_url):
        return {}

    try:
        pg.wait_for_selector('[data-testid="wcl-statistics"]', timeout=WAIT_TIMEOUT_MS)
    except Exception:
        log_warn("[STATS] statistics selector not found")
        return {}

    stats = pg.evaluate("""
    () => {
      // 2026-10 修正: .sectionsWrapper / .section / .sectionHeader が無いページでも取れるようにした
      //   1) 統計行（wcl-statistics）を文書全体から集める
      //   2) セクション名は、行より前にある見出し（.sectionHeader / [class*='sectionHeader'] / h3 など）の最後のもの
      //   3) 値は wcl-scores-simple-text-01 → 無ければセルの文字列
      const out = {};
      const clean = (s) =>
        (s || '')
          .replace(/\\u00A0/g, ' ')
          .replace(/\\s+/g, ' ')
          .trim();

      const pickValue = (cell) => {
        if (!cell) return '';
        const spans = cell.querySelectorAll("span[data-testid='wcl-scores-simple-text-01']");
        const parts = [];
        for (const sp of spans) {
          const t = clean(sp.textContent);
          if (t) parts.push(t);
        }
        if (parts.length) return parts.join(' ');
        return clean(cell.textContent);
      };

      const HEADER_SEL = ".sectionHeader, [class*='sectionHeader'], [data-testid*='sectionHeader'], h3, h4";
      const rows = Array.from(document.querySelectorAll('[data-testid="wcl-statistics"]'));
      const headers = Array.from(document.querySelectorAll(HEADER_SEL));

      const sectionOf = (row) => {
        // 旧構造: .section の中の .sectionHeader
        const sec = row.closest('.section, [class*="section"]');
        const own = sec ? clean(sec.querySelector(HEADER_SEL)?.textContent) : '';
        if (own) return own;
        // 新構造: 行より前にある最後の見出し
        let last = '';
        for (const h of headers) {
          if (h.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING) last = clean(h.textContent);
          else break;
        }
        return last || '主なスタッツ';
      };

      for (const row of rows) {
        const label = clean(
          row.querySelector('[data-testid="wcl-statistics-category"] span')?.textContent ||
          row.querySelector('[data-testid="wcl-statistics-category"]')?.textContent
        );
        if (!label) continue;

        const values = row.querySelectorAll('[data-testid="wcl-statistics-value"]');
        if (!values || values.length < 2) continue;

        const home = pickValue(values[0]);
        const away = pickValue(values[values.length - 1]);
        const key = `${sectionOf(row)}:${label}`;
        if (!(key in out)) out[key] = [home, away];
      }
      return out;
    }
    """) or {}

    log_info(f"[STATS] extracted items = {len(stats)}")
    return stats


def normalize_stats_raw_to_canon(stats_raw: Dict[str, Any]) -> Dict[str, Tuple[str, str]]:
    if not stats_raw:
        return {}

    best_by_label: Dict[str, Tuple[int, Tuple[str, str]]] = {}

    for k, v in stats_raw.items():
        if not isinstance(v, (list, tuple)) or len(v) < 2:
            continue
        if ":" not in k:
            continue

        section, label = k.split(":", 1)
        section = (section or "").strip()
        label = (label or "").strip()

        canon = LABEL_TO_CANON.get(label)
        if not canon:
            continue

        hv, av = str(v[0]), str(v[1])
        rank = _section_rank(section)

        if (label not in best_by_label) or (rank < best_by_label[label][0]):
            best_by_label[label] = (rank, (hv, av))

    out: Dict[str, Tuple[str, str]] = {}
    for label, (_, pair) in best_by_label.items():
        canon = LABEL_TO_CANON.get(label)
        if canon:
            out[canon] = pair

    return out


# =========================
# RowBuilder
# =========================
class RowBuilder:
    def __init__(self, header: List[str], match_tag: str = ""):
        self.header = header
        self.d = {col: "" for col in header}
        self.match_tag = match_tag

    def put(self, key: str, value: Any):
        if key not in self.d:
            return
        self.d[key] = "" if value is None else value

    def put_pair(self, home_key: str, away_key: str, home_val: Any, away_val: Any):
        self.put(home_key, home_val)
        self.put(away_key, away_val)


def apply_stats_to_row(rb: RowBuilder, canon_pairs: Dict[str, Tuple[str, str]]):
    for stat_key, (hcol, acol) in STAT_KEY_MAP.items():
        if stat_key in canon_pairs:
            hv, av = canon_pairs[stat_key]
            rb.put_pair(hcol, acol, hv, av)


# =========================
# 1試合ぶんのCSV行構築
# =========================
def build_reference_row(page, record: Dict[str, Any]) -> Dict[str, Any]:
    match_url = record["matchUrl"]
    mid = record["matchKey"]

    rb = RowBuilder(HEADER, match_tag=mid)
    rb.put("試合ID", mid)
    rb.put("試合リンク文字列", match_url)

    progress.set_phase("goto_match")
    ok = safe_goto(page, match_url, timeout_ms=NAVIGATION_TIMEOUT_MS, tag="MATCH")
    if not ok:
        raise RuntimeError("match_goto_failed")

    kill_consent_banners(page)

    if is_bot_wall(page):
        progress.set_phase("bot_wall")
        progress.maybe_log(force=True)
        raise RuntimeError("bot_wall")

    progress.set_phase("read_basic")
    home, away = get_home_away_names(page)
    hs, aw = get_scores(page)
    ttxt = get_match_time_text(page)
    original_match_start_time = get_original_match_start_time(page)

    # 試合が終わっていなければ保存しない（試合中の画面を「終了データ」として保存しない）
    if CANCELLED_PAT.search(ttxt or ""):
        raise MatchCancelledError(f"cancelled: {ttxt}")
    if not FINISHED_PAT.search(ttxt or ""):
        raise NotFinishedError(f"not_finished: '{ttxt}'")

    rb.put("ホームチーム", home)
    rb.put("アウェーチーム", away)
    rb.put("ホームスコア", hs)
    rb.put("アウェースコア", aw)
    rb.put("試合時間", ttxt)
    rb.put("当時の試合時間", original_match_start_time)

    progress.set_phase("read_meta")
    meta = get_match_meta(page, match_url)

    fallback_category = text_clean(
        record.get("category")
        or record.get("top_category")
        or record.get("topCategory")
        or record.get("countryLeague")
        or record.get("試合国及びカテゴリ")
        or ""
    )

    final_category = build_match_category(meta, fallback_category)

    log_info(
        f"[CATEGORY] meta_country='{meta.get('国','')}' "
        f"meta_league='{meta.get('リーグ','')}' "
        f"fallback='{fallback_category}' "
        f"final='{final_category}'"
    )

    if not final_category:
        log_warn(f"[CATEGORY] empty category mid={mid} url={match_url}")

    # 2026-10 修正3: ラウンドが付かなかった試合を記録する（保存は止めない）
    if not ROUND_PAT.search(final_category or ""):
        CATEGORY_STATS["noRoundCount"] += 1
        CATEGORY_STATS["noRoundMatches"].append({
            "matchKey": mid,
            "category": final_category,
            "matchUrl": match_url,
        })
        log_warn(f"⚠️ ラウンドなし: '{final_category}' / {home} vs {away} / {match_url}")

    rb.put("試合国及びカテゴリ", final_category)
    rb.put("スコア時間", meta.get("取得時刻", ""))

    if meta.get("開催地"):
        rb.put("スタジアム", meta.get("開催地"))
    if meta.get("場所"):
        rb.put("場所", meta.get("場所"))
    if meta.get("収容人数"):
        rb.put("収容人数", meta.get("収容人数"))
    if meta.get("観客"):
        rb.put("観客数", meta.get("観客"))
    if meta.get("レフェリー"):
        rb.put("審判名", meta.get("レフェリー"))

    progress.set_phase("read_standings")
    st = get_match_standings(page, match_url, home, away)
    if st:
        if st.get("home_rank") is not None:
            rb.put("ホーム順位", st.get("home_rank"))
        if st.get("away_rank") is not None:
            rb.put("アウェー順位", st.get("away_rank"))

    progress.set_phase("read_stats")
    stats_raw = scrape_stats_raw(page, match_url)
    canon_pairs = normalize_stats_raw_to_canon(stats_raw)

    verify_stats_mapping(canon_pairs)
    apply_stats_to_row(rb, canon_pairs)

    rb.put("ソート用秒", parse_live_time_to_seconds(rb.d.get("試合時間", "")))

    progress.set_phase("row_built")
    verify_row_filled(rb.d)
    return rb.d


# =========================
# 1試合ごとのCSV保存
# =========================
def export_one_match_csv(s3_client, page, record: Dict[str, Any]) -> str:
    date_str = record["date"]
    mid = record["matchKey"]

    row = build_reference_row(page, record)

    seq = find_next_seq_from_s3(s3_client, S3_BUCKET, date_str, mid)
    row["通番"] = seq
    row["試合ID"] = mid

    ts = utc_ts_for_filename()
    key = build_csv_key(date_str, mid, seq, ts)

    put_single_row_csv_to_s3(s3_client, S3_BUCKET, key, row)
    return key


# =========================
# 失敗した試合の退避
# =========================
def next_attempt_of(r: Dict[str, Any]) -> int:
    """次回の attempt（未終了・時間切れは数えないので据え置き）"""
    attempt = int(r.get("attempt", 0) or 0)
    return attempt + 1 if r.get("countAttempt", True) else attempt


def to_date_keyed(records: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """
    [{date, matchKey, matchUrl, attempt}, ...] → {"yyyy-MM-dd": [{matchKey, matchUrl, attempt}, ...]}
    """
    out: Dict[str, List[Dict[str, Any]]] = {}
    for r in records:
        row = {"matchKey": r.get("matchKey")}
        if r.get("matchUrl"):
            row["matchUrl"] = r.get("matchUrl")
        row["attempt"] = next_attempt_of(r)
        if r.get("errorMessage"):
            row["lastError"] = str(r.get("errorMessage"))[:300]
        out.setdefault(str(r.get("date") or "unknown"), []).append(row)
    return dict(sorted(out.items()))


def stash_failed_records(s3_client, failed_records: List[Dict[str, Any]], source_seq: int) -> None:
    """
    失敗した試合を退避する。
      中止・延期（forceDead）       → fin/dead/
      次回の attempt < MAX_ATTEMPTS → fin/retry/（次回起動時に再処理）
      それ以外                      → fin/dead/（手動確認）
    未終了・時間切れ（countAttempt=False）は attempt を増やさない。
    """
    if not failed_records:
        return
    retry, dead = [], []
    for r in failed_records:
        if r.get("forceDead") or next_attempt_of(r) >= MAX_ATTEMPTS:
            dead.append(r)
        else:
            retry.append(r)

    ts = utc_ts_for_filename()
    if retry:
        key = f"{RETRY_JSON_PREFIX}{RETRY_JSON_FILE_PREFIX}{source_seq:06d}_{ts}.json"
        put_json_to_s3(s3_client, S3_BUCKET, key, to_date_keyed(retry))
        log(f"stashed {len(retry)} failed records for retry -> s3://{S3_BUCKET}/{key}")
    if dead:
        key = f"{DEAD_JSON_PREFIX}b008_fin_dead_{source_seq:06d}_{ts}.json"
        put_json_to_s3(s3_client, S3_BUCKET, key, to_date_keyed(dead))
        log_warn(f"stashed {len(dead)} records (max attempts reached) -> s3://{S3_BUCKET}/{key}")


# =========================
# メイン処理
# =========================
def process_one_input_json(s3_client, input_json_key: str, input_seq: int) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    1つの入力JSON（通常 / retry）を処理する。
    戻り値: (失敗0件なら True, 失敗した試合のリスト（attempt 付き）)
    """
    log(f"load input json: s3://{S3_BUCKET}/{input_json_key}")
    data = load_json_from_s3(s3_client, S3_BUCKET, input_json_key)

    all_records = list(iter_b008_records(data))
    resolved_records, unresolved_records = split_records(all_records)

    reset_category_stats()

    progress.reset_for_batch(len(resolved_records))
    progress.set_state("RUNNING")
    progress.set_phase("input_loaded")
    progress.maybe_log(force=True)

    now_ts = utc_ts_for_filename()

    matched_json_key = f"normalized_resolved_matches_{input_seq:06d}_{now_ts}.json"
    unresolved_json_key = f"unresolved_matches_{input_seq:06d}_{now_ts}.json"

    put_json_to_s3(s3_client, S3_BUCKET, matched_json_key, resolved_records)
    put_json_to_s3(s3_client, S3_BUCKET, unresolved_json_key, unresolved_records)

    log(f"input_json_key={input_json_key}")
    log(f"all_records={len(all_records)}")
    log(f"resolved_records={len(resolved_records)}")
    log(f"unresolved_records={len(unresolved_records)}")

    uploaded_csv_keys: List[str] = []
    failed_records: List[Dict[str, Any]] = []

    if resolved_records:
        with sync_playwright() as p:
            log("playwright launch start")
            browser = p.chromium.launch(
                headless=HEADLESS,
                args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
            )
            context = browser.new_context(
                locale=LOCALE,
                timezone_id=TIMEZONE_ID,
                user_agent=USER_AGENT,
            )
            context.set_default_timeout(NAVIGATION_TIMEOUT_MS)
            context.set_default_navigation_timeout(NAVIGATION_TIMEOUT_MS)
            setup_route_blocking(context)

            page = context.new_page()
            log("playwright ready")

            total = len(resolved_records)

            for idx, record in enumerate(resolved_records, start=1):
                date_str = record["date"]
                mid = record["matchKey"]
                url = record["matchUrl"]

                # 稼働の終了時刻を過ぎた → 残り（この試合以降）を retry に回して終了（試行回数に数えない）
                if is_past_deadline():
                    rest = resolved_records[idx - 1:]
                    log_warn(f"deadline {DEADLINE_JST} reached. stash remaining {len(rest)} records to retry")
                    for r in rest:
                        failed_records.append({
                            "date": r["date"],
                            "matchKey": r["matchKey"],
                            "matchUrl": r["matchUrl"],
                            "attempt": int(r.get("attempt", 0) or 0),
                            "countAttempt": False,
                            "errorMessage": "deadline",
                        })
                    break

                started_at = datetime.datetime.now(JST)

                progress.start_item(date_str, mid, url, phase="start_item")
                progress.maybe_log(force=True)

                try:
                    log(f"[{idx}/{total}] start export date={date_str}, mid={mid}, attempt={record.get('attempt', 0)}, url={url}")
                    key = export_one_match_csv(s3_client, page, record)
                    uploaded_csv_keys.append(key)

                    progress.inc_uploaded(1)
                    progress.inc_done(1)
                    progress.set_phase("export_done")
                    progress.set_state("RUNNING")

                    elapsed = (datetime.datetime.now(JST) - started_at).total_seconds()
                    log(f"[{idx}/{total}] done date={date_str}, mid={mid}, elapsed={elapsed:.2f}s")

                    progress.maybe_log(force=True)

                except Exception as e:
                    progress.inc_failed(1)
                    progress.inc_done(1)
                    progress.set_phase("failed")
                    progress.set_state("RUNNING")

                    elapsed = (datetime.datetime.now(JST) - started_at).total_seconds()
                    log(f"[ERROR] [{idx}/{total}] failed date={date_str}, mid={mid}, url={url}, elapsed={elapsed:.2f}s, error={e}")

                    try:
                        current_url = page.url
                    except Exception:
                        current_url = ""
                    try:
                        current_title = page.title()
                    except Exception:
                        current_title = ""

                    log(f"[FAILED_PAGE] current_url={current_url}")
                    log(f"[FAILED_PAGE] current_title={current_title}")

                    failed_records.append({
                        "date": date_str,
                        "matchKey": mid,
                        "matchUrl": url,
                        "attempt": int(record.get("attempt", 0) or 0),
                        # 未終了は数えない / 中止・延期は再試行しない
                        "countAttempt": not isinstance(e, NotFinishedError),
                        "forceDead": isinstance(e, MatchCancelledError),
                        "currentUrl": current_url,
                        "currentTitle": current_title,
                        "errorMessage": str(e),
                        "traceback": traceback.format_exc()[:4000],
                    })

                    progress.maybe_log(force=True)

            context.close()
            browser.close()
            log("playwright closed")

    run_summary = {
        "inputJson": f"s3://{S3_BUCKET}/{input_json_key}",
        "resolvedJson": f"s3://{S3_BUCKET}/{matched_json_key}",
        "unresolvedJson": f"s3://{S3_BUCKET}/{unresolved_json_key}",
        "totalRecords": len(all_records),
        "resolvedCount": len(resolved_records),
        "unresolvedCount": len(unresolved_records),
        "csvUploadedCount": len(uploaded_csv_keys),
        "failedCount": len(failed_records),
        "uploadedCsvKeys": uploaded_csv_keys,
        "failedRecords": failed_records,
        "noRoundCount": CATEGORY_STATS["noRoundCount"],
        "noRoundMatches": CATEGORY_STATS["noRoundMatches"],
        "runAtUtc": utc_ts_iso(),
        "inputSequence": input_seq,
    }

    summary_key = f"run_summary_{input_seq:06d}_{now_ts}.json"
    put_json_to_s3(s3_client, S3_BUCKET, summary_key, run_summary)

    progress.set_phase("summary_uploaded")
    progress.set_state("DONE" if not failed_records else "PARTIAL_FAILED")
    progress.maybe_log(force=True)

    log("========== BATCH SUMMARY ==========")
    log(f"input_json  = s3://{S3_BUCKET}/{input_json_key}")
    log(f"resolved    = {len(resolved_records)}")
    log(f"unresolved  = {len(unresolved_records)}")
    log(f"uploaded    = {len(uploaded_csv_keys)}")
    log(f"failed      = {len(failed_records)}")
    log(f"no_round    = {CATEGORY_STATS['noRoundCount']}")
    log(f"summary     = s3://{S3_BUCKET}/{summary_key}")
    log("===================================")

    return len(failed_records) == 0, failed_records


def process_and_commit(s3_client, key: str, seq: int) -> None:
    """
    1ファイル処理 → 失敗分を退避 → 元ファイルを必ず削除する。
    処理中に例外（JSON が壊れている等）が出た場合は、ファイルを fin/dead/ に移してから削除する。
    """
    try:
        success, failed = process_one_input_json(s3_client, key, seq)
    except Exception as e:
        log_error(f"process failed key={key} error={type(e).__name__}: {e}")
        try:
            body = load_json_from_s3(s3_client, S3_BUCKET, key)
        except Exception:
            body = {"_error": "unreadable"}
        dead_key = f"{DEAD_JSON_PREFIX}broken_{key.rsplit('/', 1)[-1]}_{utc_ts_for_filename()}.json"
        put_json_to_s3(s3_client, S3_BUCKET, dead_key, {"source": key, "error": str(e), "body": body})
        delete_s3_object(s3_client, S3_BUCKET, key)
        return

    stash_failed_records(s3_client, failed, seq)
    delete_s3_object(s3_client, S3_BUCKET, key)
    if success:
        log(f"committed and deleted input json: s3://{S3_BUCKET}/{key}")
    else:
        log_warn(f"deleted input json with {len(failed)} failed records stashed: s3://{S3_BUCKET}/{key}")


def main():
    log("===== script start =====")
    verify_header_and_stat_map()

    hb = ProgressHeartbeat(interval_sec=HEARTBEAT_SEC)
    hb.start()

    s3_client = get_s3_client()

    try:
        # 起動時点の retry ファイル（この実行で新しく作られた retry は次回に回す → 無限ループしない）
        retry_jsons_at_start = list_retry_json_keys(s3_client, S3_BUCKET)
        log(f"retry json at start: {len(retry_jsons_at_start)}")

        # 1) 通常の入力 JSON（連番の若い順。1件でも失敗しても止めない）
        processed = set()
        while True:
            if is_past_deadline():
                log_warn(f"deadline {DEADLINE_JST} reached. remaining input json is kept for next run.")
                break
            input_jsons = [x for x in list_input_json_keys(s3_client, S3_BUCKET) if x[1] not in processed]
            if not input_jsons:
                log("input json not found.")
                break

            seq, input_json_key = input_jsons[0]
            processed.add(input_json_key)
            log(f"next input json: seq={seq}, key=s3://{S3_BUCKET}/{input_json_key}")
            process_and_commit(s3_client, input_json_key, seq)

        # 2) 前回までに失敗して退避した試合（1回ずつ）
        for seq, retry_key in retry_jsons_at_start:
            if is_past_deadline():
                log_warn(f"deadline {DEADLINE_JST} reached. remaining retry json is kept for next run.")
                break
            log(f"next retry json: seq={seq}, key=s3://{S3_BUCKET}/{retry_key}")
            process_and_commit(s3_client, retry_key, seq)

        progress.set_state("DONE")
        progress.set_phase("all_done")
        progress.maybe_log(force=True)
        log("===== script end =====")

    finally:
        hb.stop()
        hb.join(timeout=2)


if __name__ == "__main__":
    main()
