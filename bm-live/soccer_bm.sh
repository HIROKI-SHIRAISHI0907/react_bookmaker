#!/usr/bin/env bash
# soccer_bm CSV import/export helper (Docker版・コア5テーブル専用)
set -euo pipefail

# ===== 設定 =====
SERVICE_NAME="db"
DB_USER="postgres"
DB_NAME="soccer_bm"
SCHEMA="public"
DUMPDIR="/Users/shiraishitoshio/dumps/soccer_bm_dumps"
FILE_PREFIX="soccer_bm_"
FILE_SUFFIX=".csv"
ZIP_EXT=".zip"

TABLES_CORE=(
  country_league_master
  country_league_season_master
  team_member_master
  future_master
  data
)

# ===== 共通関数 =====
dc() {
  if docker compose version >/dev/null 2>/dev/null; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}

compose_psql() {
  dc exec -T "$SERVICE_NAME" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "$1"
}

# ===== FORCE_NULL 対象列検出 =====
get_force_null_cols() {
  local t="$1"
  dc exec -T "$SERVICE_NAME" \
    psql -U "$DB_USER" -d "$DB_NAME" -At -v ON_ERROR_STOP=1 -c "
      SELECT COALESCE(string_agg('\"' || column_name || '\"', ',' ORDER BY ordinal_position),'')
      FROM information_schema.columns
      WHERE table_schema='${SCHEMA}'
        AND table_name='${t}'
        AND data_type IN ('timestamp with time zone','timestamp without time zone','date');
    " | tr -d '\r\n'
}

build_copy_opts() {
  local t="$1"
  local fnc; fnc="$(get_force_null_cols "$t")"
  local opts="(FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8', NULL '', QUOTE '\"'"
  if [[ -n "${fnc//[[:space:]]/}" ]]; then
    opts="${opts}, FORCE_NULL (${fnc})"
  fi
  echo "${opts})"
}

# ===== シーケンス同期 =====
sync_seq_auto() {
  local t="$1"
  echo "🔧 Syncing sequences for ${SCHEMA}.${t}"
  compose_psql "
    DO \$\$
    DECLARE
      tname text := '${t}';
      sch   text := '${SCHEMA}';
      col   text;
      seqreg regclass;
      sqltext text;
    BEGIN
      -- seq または id を優先して検出
      FOR col IN
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = sch
          AND table_name   = tname
          AND column_name IN ('seq','id')
        ORDER BY CASE column_name WHEN 'seq' THEN 1 WHEN 'id' THEN 2 ELSE 3 END
      LOOP
        SELECT pg_get_serial_sequence(format('%I.%I', sch, tname), col) INTO seqreg;
        IF seqreg IS NOT NULL THEN
          sqltext := format(
            'SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I.%I),0), true)',
            seqreg::text, col, sch, tname
          );
          EXECUTE sqltext;
          RETURN;
        END IF;
      END LOOP;

      -- Identity列にも対応
      SELECT column_name INTO col
      FROM information_schema.columns
      WHERE table_schema = sch
        AND table_name   = tname
        AND is_identity = 'YES'
      LIMIT 1;

      IF col IS NOT NULL THEN
        SELECT pg_get_serial_sequence(format('%I.%I', sch, tname), col) INTO seqreg;
        IF seqreg IS NOT NULL THEN
          sqltext := format(
            'SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I.%I),0), true)',
            seqreg::text, col, sch, tname
          );
          EXECUTE sqltext;
        END IF;
      END IF;
    END
    \$\$;
  "
  echo "✅ Sequences synced for ${t}"
}

# ===== CSV Export =====
export_table() {
  local t="$1"
  local outfile="${DUMPDIR}/${FILE_PREFIX}${t}${FILE_SUFFIX}"

  echo "🔼 Export ${SCHEMA}.${t} -> ${outfile}"
  dc exec -T "$SERVICE_NAME" \
    psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 \
      -c "\copy (SELECT * FROM ${SCHEMA}.\"${t}\") TO STDOUT WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')" \
    > "$outfile"

  # data テーブルだけ zip 化
  if [[ "$t" == "data" ]]; then
    local zipfile="${outfile}${ZIP_EXT}"
    echo "🗜️  Zipping ${outfile} -> ${zipfile}"
    (cd "$DUMPDIR" && zip -q -j "$(basename "$zipfile")" "$(basename "$outfile")")
    rm -f "$outfile"
  fi
}

export_core() {
  mkdir -p "$DUMPDIR"
  for t in "${TABLES_CORE[@]}"; do
    export_table "$t"
  done
  echo "✅ Export completed for 5 core tables."
}

# ===== CSV Import =====
import_table() {
  local t="$1"
  local infile="${DUMPDIR}/${FILE_PREFIX}${t}${FILE_SUFFIX}"
  local zipfile="${infile}${ZIP_EXT}"

  if [[ ! -f "$infile" && -f "$zipfile" ]]; then
    echo "🗜️  Unzipping ${zipfile}"
    unzip -oq -d "$DUMPDIR" "$zipfile"
  fi

  if [[ ! -f "$infile" ]]; then
    echo "⚠️  Skip ${t}: CSV not found -> ${infile}"
    return 0
  fi

  echo "🔽 Import ${infile} -> ${SCHEMA}.${t}"
  local opts; opts="$(build_copy_opts "$t")"
  dc exec -T "$SERVICE_NAME" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 \
    -c "\copy ${SCHEMA}.\"${t}\" FROM STDIN WITH ${opts}" < "$infile"

  sync_seq_auto "$t"
}

truncate_core() {
  local joined=""
  for t in "${TABLES_CORE[@]}"; do
    [[ -n "$joined" ]] && joined+=","
    joined+="\"${SCHEMA}\".\"${t}\""
  done
  echo "🧹 TRUNCATE ${joined} RESTART IDENTITY CASCADE"
  compose_psql "TRUNCATE ${joined} RESTART IDENTITY CASCADE;"
}

reset_import_core() {
  truncate_core
  for t in "${TABLES_CORE[@]}"; do
    import_table "$t"
  done
  echo "🎉 reset-import-core done."
}

# ===== Usage =====
usage() {
  cat <<EOF
Usage:
  $(basename "$0") export-core        # 5テーブルをCSVエクスポート
  $(basename "$0") reset-import-core  # 5テーブル(TRUNCATE→CSVインポート→シーケンス同期)

対象テーブル:
  - country_league_master
  - country_league_season_master
  - team_member_master
  - future_master
  - data

Notes:
  - data は seq をCSV側で採番済み。通常のCOPYで取込。
  - 各テーブル取込後に自動でシーケンスを MAX(id/seq) に同期。
  - timestamp/date列は自動で FORCE_NULL を付与。
EOF
}

cmd="${1:-}"; shift || true
case "$cmd" in
  export-core) export_core ;;
  reset-import-core) reset_import_core ;;
  *) usage ;;
esac
