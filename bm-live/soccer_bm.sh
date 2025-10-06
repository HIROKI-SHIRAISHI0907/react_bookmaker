#!/usr/bin/env bash
# soccer_bm CSV import/export helper (Docker版)
set -euo pipefail

# ===== 設定 =====
SERVICE_NAME="db"                # docker compose のサービス名
DB_USER="postgres"
DB_NAME="soccer_bm"
SCHEMA="public"
DUMPDIR="/Users/shiraishitoshio/dumps/soccer_bm_dumps"
FILE_PREFIX="soccer_bm_"
FILE_SUFFIX=".csv"

# ZIP対象（このテーブルのCSVのみzip化）
ZIP_ONLY_TABLE="data"
ZIP_EXT=".zip"

# 取り込み前に TRUNCATE したい場合は true
TRUNCATE_BEFORE_IMPORT=false
RESTART_IDENTITY=true

# ===== テーブル一覧 (JavaのTABLE_MAPに対応) =====
TABLES=(
  league_score_time_band_stats
  league_score_time_band_stats_split_score
  no_goal_match_stats
  within_data_20minutes_away_all_league
  within_data_20minutes_away_scored
  within_data_20minutes_same_scored
  within_data_45minutes_home_all_league
  within_data_45minutes_home_scored
  within_data_45minutes_away_all_league
  within_data_45minutes_away_scored
  match_classification_result
  match_classification_result_count
  score_based_feature_stats
  team_monthly_score_summary
  team_time_segment_shooting_stat
  condition_result_data
  calc_correlation
  calc_correlation_ranking
  stat_encryption
  surface_overview
  country_league_summary
  within_data
  each_team_score_based_feature_stats
  country_league_master
  country_league_season_master
  team_member_master
  future_master
  data
)

# ===== 内部関数 =====
ensure_dumpdir() { mkdir -p "$DUMPDIR"; }

dc() {
  # docker compose or docker-compose のどちらでも動くように
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}

compose_psql() {
  # $1: psql -c に渡すSQL
  dc exec -T "$SERVICE_NAME" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "$1"
}

export_table() {
  local t="$1"
  local outfile="${DUMPDIR}/${FILE_PREFIX}${t}${FILE_SUFFIX}"
  echo "🔼 Exporting ${SCHEMA}.${t} -> ${outfile}"
  # \copy TO STDOUT をコンテナ内で実行し、ホスト側にリダイレクト
  dc exec -T "$SERVICE_NAME" \
    psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 \
      -c "\copy (SELECT * FROM ${SCHEMA}.\"${t}\") TO STDOUT WITH (FORMAT CSV, HEADER true)" \
    > "$outfile"

  # ===== dataテーブルのみzip化 =====
  if [[ "$t" == "$ZIP_ONLY_TABLE" ]]; then
    local zipfile="${outfile}${ZIP_EXT}"
    echo "🗜️  Zipping ${outfile} -> ${zipfile}"
    # zipコマンドで同名.zipを作成し、元CSVは削除
    (cd "$DUMPDIR" && zip -q -j "$(basename "$zipfile")" "$(basename "$outfile")")
    rm -f "$outfile"
  fi
}

import_table() {
  local t="$1"
  local infile="${DUMPDIR}/${FILE_PREFIX}${t}${FILE_SUFFIX}"
  local extracted_tmp=false

  # ===== dataテーブルはzipがあれば展開 =====
  if [[ "$t" == "$ZIP_ONLY_TABLE" ]]; then
    local zipfile="${infile}${ZIP_EXT}"
    if [[ ! -f "$infile" && -f "$zipfile" ]]; then
      echo "🗜️  Unzipping ${zipfile} -> ${DUMPDIR}/"
      unzip -oq -d "$DUMPDIR" "$zipfile"
      extracted_tmp=true
    fi
  fi

  if [[ ! -f "$infile" ]]; then
    # CSVもZIPも無い（またはZIP展開失敗）場合はスキップ
    if [[ "$t" == "$ZIP_ONLY_TABLE" ]]; then
      echo "⚠️  Skip ${t}: CSV/ZIPが見つかりません -> ${infile} / ${infile}${ZIP_EXT}"
    else
      echo "⚠️  Skip ${t}: ファイルなし -> ${infile}"
    fi
    return 0
  fi

  if $TRUNCATE_BEFORE_IMPORT; then
    local restart=""
    $RESTART_IDENTITY && restart=" RESTART IDENTITY"
    echo "🧹 TRUNCATE ${SCHEMA}.\"${t}\"${restart}"
    compose_psql "TRUNCATE ${SCHEMA}.\"${t}\"${restart} CASCADE;"
  fi

  echo "🔽 Importing ${infile} -> ${SCHEMA}.${t}"
  # コンテナ内の STDIN にホストのCSVを流し込む
  dc exec -T "$SERVICE_NAME" \
    psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 \
      -c "\copy ${SCHEMA}.\"${t}\" FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8', NULL 'NULL')" \
    < "$infile"

  # ZIPから展開した一時CSVは後片付け
  if [[ "$extracted_tmp" == true ]]; then
    echo "🧹 Removing extracted temp file ${infile}"
    rm -f "$infile"
  fi
}

export_all() {
  ensure_dumpdir
  local targets=("$@"); [[ ${#targets[@]} -eq 0 ]] && targets=("${TABLES[@]}")
  for t in "${targets[@]}"; do export_table "$t"; done
  echo "✅ Export completed."
}

import_all() {
  ensure_dumpdir
  local targets=("$@"); [[ ${#targets[@]} -eq 0 ]] && targets=("${TABLES[@]}")
  for t in "${targets[@]}"; do import_table "$t"; done
  echo "✅ Import completed."
}

usage() {
  cat <<EOF
Usage:
  $(basename "$0") export [table ...]   # 全CSVを書き出し（または指定テーブルのみ）
  $(basename "$0") import [table ...]   # 全CSVを取り込み（または指定テーブルのみ）
  $(basename "$0") both   [table ...]   # 書き出し→取り込み

Notes:
  - docker compose のサービス名は "${SERVICE_NAME}" を想定。違う場合は変えてください。
  - 出力/入力ディレクトリ: ${DUMPDIR}
  - ファイル名: ${FILE_PREFIX}<テーブル名>${FILE_SUFFIX}
  - テーブル "${ZIP_ONLY_TABLE}" のみ、CSVは "${FILE_SUFFIX}${ZIP_EXT}" へzip化（例: soccer_bm_data.csv.zip）。
  - import時は "${ZIP_ONLY_TABLE}" のZIPがあれば展開してから取り込み、取り込み後は展開CSVを削除します。
EOF
}

# ===== エントリポイント =====
cmd="${1:-}"; shift || true
case "$cmd" in
  export) export_all "$@" ;;
  import) import_all "$@" ;;
  both)   export_all "$@"; import_all "$@";;
  *) usage; exit 1 ;;
esac
