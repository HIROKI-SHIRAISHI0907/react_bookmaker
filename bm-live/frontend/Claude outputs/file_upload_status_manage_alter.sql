-- ============================================================
-- soccer_bm: 既に作った file_upload_status_manage を最新の定義に合わせる
--   前回までの作成用 SQL で既にテーブルを作った場合だけ流す（まだなら file_upload_status_manage_create.sql）。
--
--   1. upload_user を login_user（ログインユーザー・必須）に変える（名前を変えるだけ）
--   2. 状態の決まりを変える（旧: RECEIVED / SUCCESS / ROW_ERROR / FILE_ERROR / DB_ERROR
--                          → 新: PENDING 判定前 / PROCESSING 判定中 / SUCCESS 正常終了 / ERROR 異常終了 ＋ error_phase）
--   3. error_phase を message の前、s3_bucket / s3_key を register_id の前に入れる
--      PostgreSQL は列を途中に追加できないため、テーブルを file_upload_status_manage_bk に退避して作り直す
--      （件数が一致しなければ中止 → _bk を削除 → 制約・インデックス等を付け直す）
--   すべて 1 つのトランザクション。途中で失敗したら元のまま。何度流しても同じ結果になる。
--
--   psql のバックスラッシュコマンドは使っていない（貼り付け・GUI でもそのまま流せる）。最後に COMMIT する。
--   流している間はテーブルがロックされるので、CSV アップロードをしていないときに流す。
-- ============================================================
BEGIN;

-- ---------- 1. upload_user → login_user ----------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = current_schema() AND table_name = 'file_upload_status_manage' AND column_name = 'upload_user') THEN
    ALTER TABLE file_upload_status_manage RENAME COLUMN upload_user TO login_user;
    ALTER TABLE file_upload_status_manage ALTER COLUMN login_user TYPE VARCHAR(255);
    UPDATE file_upload_status_manage SET login_user = 'UNKNOWN' WHERE login_user IS NULL OR BTRIM(login_user) = '';
    ALTER TABLE file_upload_status_manage ALTER COLUMN login_user SET NOT NULL;
    RAISE NOTICE 'upload_user を login_user に変えました。';
  ELSE
    RAISE NOTICE 'upload_user はありません（login_user 済み）。';
  END IF;
END
$$;

-- ---------- 2. 状態の決まり（古い CHECK を外してから作り直す） ----------
ALTER TABLE file_upload_status_manage DROP CONSTRAINT IF EXISTS ck_file_upload_status_manage_status;
ALTER TABLE file_upload_status_manage DROP CONSTRAINT IF EXISTS ck_file_upload_status_manage_phase;

-- ---------- 3. 列を入れる ----------
-- ------------------------------------------------------------
-- 列を指定位置に入れてテーブルを作り直す（このセッションだけの一時関数）
--   1. 退避前に定義（列・制約・インデックス・トリガー・コメント・権限・他テーブルからの外部キー）を読み取る
--   2. テーブルを <テーブル>_bk に名前変更して退避
--   3. 新しい列を p_before の前に入れて作り直し、退避したデータを入れる（件数が一致しなければ中止）
--   4. 連番（serial / identity）を引き継ぎ、_bk を消し、制約・インデックス等を付け直す
--   すでに p_col が p_before の直前にあれば何もしない。p_col が別の位置にあれば、その位置から移す（値は引き継ぐ）。
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.rebuild_with_column(p_table text, p_col text, p_coldef text, p_before text)
RETURNS void LANGUAGE plpgsql AS $f$
DECLARE
  v_rel     regclass := to_regclass(p_table);
  v_bk      text := p_table || '_bk';
  v_schema  text;
  v_create  text[] := '{}';
  v_ins     text[] := '{}';
  v_idcols  text[] := '{}';
  v_pre     text[] := '{}';
  v_seq     text[] := '{}';
  v_post    text[] := '{}';
  v_exists  boolean;
  v_next    text;
  v_old     bigint;
  v_new     bigint;
  r         record;
  s         text;
BEGIN
  IF v_rel IS NULL THEN
    RAISE EXCEPTION 'テーブル % がありません', p_table;
  END IF;
  SELECT n.nspname INTO v_schema
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.oid = v_rel;
  IF to_regclass(format('%I.%I', v_schema, v_bk)) IS NOT NULL THEN
    RAISE EXCEPTION '退避先 %.% が既にあります（前回の残りの可能性。中身を確認して消してから流してください）', v_schema, v_bk;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = v_rel AND attname = p_before AND attnum > 0 AND NOT attisdropped) THEN
    RAISE EXCEPTION '列 %.% がありません', p_table, p_before;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_depend d JOIN pg_rewrite rw ON rw.oid = d.objid
              WHERE d.refobjid = v_rel AND rw.ev_class <> v_rel) THEN
    RAISE EXCEPTION '% を参照しているビューがあります。ビューを消してから流し、あとで作り直してください', p_table;
  END IF;

  -- 既に正しい位置にあれば何もしない
  SELECT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = v_rel AND attname = p_col AND attnum > 0 AND NOT attisdropped)
    INTO v_exists;
  IF v_exists THEN
    SELECT (SELECT a2.attname FROM pg_attribute a2
             WHERE a2.attrelid = v_rel AND a2.attnum > a.attnum AND NOT a2.attisdropped
             ORDER BY a2.attnum LIMIT 1)
      INTO v_next
      FROM pg_attribute a WHERE a.attrelid = v_rel AND a.attname = p_col;
    IF v_next = p_before THEN
      RAISE NOTICE '%.% は既に % の前にあります。何もしません。', p_table, p_col, p_before;
      RETURN;
    END IF;
  END IF;

  -- 列の定義
  FOR r IN
    SELECT a.attnum, a.attname, format_type(a.atttypid, a.atttypmod) AS typ, a.attnotnull,
           a.attidentity, a.attgenerated, pg_get_expr(d.adbin, d.adrelid) AS def,
           CASE WHEN a.attcollation <> 0 AND a.attcollation <> t.typcollation
                THEN (SELECT quote_ident(collname) FROM pg_collation WHERE oid = a.attcollation) END AS coll,
           col_description(a.attrelid, a.attnum) AS cmt
      FROM pg_attribute a
      JOIN pg_type t ON t.oid = a.atttypid
      LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
     WHERE a.attrelid = v_rel AND a.attnum > 0 AND NOT a.attisdropped
     ORDER BY a.attnum
  LOOP
    IF r.attname = p_before THEN
      v_create := v_create || (quote_ident(p_col) || ' ' || p_coldef);
    END IF;
    IF r.attname = p_col THEN
      v_ins := v_ins || quote_ident(r.attname)::text;   -- 既存の値を引き継ぐ（定義は p_coldef）
      CONTINUE;
    END IF;

    s := quote_ident(r.attname) || ' ' || r.typ;
    IF r.coll IS NOT NULL THEN
      s := s || ' COLLATE ' || r.coll;
    END IF;
    IF r.attgenerated = 's' THEN
      s := s || ' GENERATED ALWAYS AS (' || r.def || ') STORED';      -- 生成列は INSERT しない
    ELSIF r.attidentity IN ('a', 'd') THEN
      s := s || CASE r.attidentity WHEN 'a' THEN ' GENERATED ALWAYS AS IDENTITY' ELSE ' GENERATED BY DEFAULT AS IDENTITY' END;
      v_idcols := v_idcols || r.attname::text;
      v_ins := v_ins || quote_ident(r.attname)::text;
    ELSE
      IF r.def IS NOT NULL THEN
        s := s || ' DEFAULT ' || r.def;
      END IF;
      v_ins := v_ins || quote_ident(r.attname)::text;
    END IF;
    IF r.attnotnull THEN
      s := s || ' NOT NULL';
    END IF;
    v_create := v_create || s;

    IF r.cmt IS NOT NULL THEN
      v_post := v_post || format('COMMENT ON COLUMN %I.%I.%I IS %L', v_schema, p_table, r.attname, r.cmt);
    END IF;
  END LOOP;

  -- 制約（主キー → 一意 → その他）
  FOR r IN
    SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
     WHERE conrelid = v_rel AND contype IN ('p', 'u', 'c', 'f', 'x')
     ORDER BY CASE contype WHEN 'p' THEN 0 WHEN 'u' THEN 1 ELSE 2 END, conname
  LOOP
    v_post := v_post || format('ALTER TABLE %I.%I ADD CONSTRAINT %I %s', v_schema, p_table, r.conname, r.def);
  END LOOP;

  -- インデックス（制約で作られるもの以外）。退避前に読むので ON 句は元のテーブル名になる
  FOR r IN
    SELECT pg_get_indexdef(i.indexrelid) AS def
      FROM pg_index i
     WHERE i.indrelid = v_rel
       AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid AND c.conrelid = v_rel)
  LOOP
    v_post := v_post || r.def;
  END LOOP;

  -- トリガー
  FOR r IN SELECT pg_get_triggerdef(oid) AS def FROM pg_trigger WHERE tgrelid = v_rel AND NOT tgisinternal
  LOOP
    v_post := v_post || r.def;
  END LOOP;

  -- テーブルのコメント
  IF obj_description(v_rel, 'pg_class') IS NOT NULL THEN
    v_post := v_post || format('COMMENT ON TABLE %I.%I IS %L', v_schema, p_table, obj_description(v_rel, 'pg_class'));
  END IF;

  -- 権限（持ち主以外への GRANT）
  FOR r IN
    SELECT grantee, string_agg(privilege_type, ', ') AS privs
      FROM information_schema.role_table_grants
     WHERE table_schema = v_schema AND table_name = p_table
       AND grantee <> (SELECT pg_get_userbyid(relowner) FROM pg_class WHERE oid = v_rel)
     GROUP BY grantee
  LOOP
    v_post := v_post || format('GRANT %s ON %I.%I TO %s', r.privs, v_schema, p_table,
                               CASE WHEN r.grantee = 'PUBLIC' THEN 'PUBLIC' ELSE quote_ident(r.grantee) END);
  END LOOP;

  -- 他のテーブルからこのテーブルへの外部キー（いったん外して、最後に付け直す）
  FOR r IN
    SELECT conrelid::regclass::text AS child, conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
     WHERE confrelid = v_rel AND contype = 'f' AND conrelid <> v_rel
  LOOP
    v_pre  := v_pre  || format('ALTER TABLE %s DROP CONSTRAINT %I', r.child, r.conname);
    v_post := v_post || format('ALTER TABLE %s ADD CONSTRAINT %I %s', r.child, r.conname, r.def);
  END LOOP;

  -- serial の連番（_bk を消すと一緒に消えるので、新しいテーブルに付け替える）
  FOR r IN
    SELECT d.objid::regclass::text AS seq, a.attname
      FROM pg_depend d
      JOIN pg_class c ON c.oid = d.objid AND c.relkind = 'S'
      JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
     WHERE d.refobjid = v_rel AND d.deptype = 'a'
  LOOP
    v_seq := v_seq || format('ALTER SEQUENCE %s OWNED BY %I.%I.%I', r.seq, v_schema, p_table, r.attname);
  END LOOP;

  -- ===== ここから変更 =====
  FOREACH s IN ARRAY v_pre LOOP EXECUTE s; END LOOP;

  EXECUTE format('ALTER TABLE %I.%I RENAME TO %I', v_schema, p_table, v_bk);
  RAISE NOTICE '退避: %.% → %.%', v_schema, p_table, v_schema, v_bk;

  EXECUTE format('CREATE TABLE %I.%I (%s)', v_schema, p_table, array_to_string(v_create, ', '));

  EXECUTE format('INSERT INTO %I.%I (%s)%s SELECT %s FROM %I.%I',
                 v_schema, p_table, array_to_string(v_ins, ', '),
                 CASE WHEN cardinality(v_idcols) > 0 THEN ' OVERRIDING SYSTEM VALUE' ELSE '' END,
                 array_to_string(v_ins, ', '), v_schema, v_bk);

  EXECUTE format('SELECT COUNT(*) FROM %I.%I', v_schema, v_bk) INTO v_old;
  EXECUTE format('SELECT COUNT(*) FROM %I.%I', v_schema, p_table) INTO v_new;
  IF v_old <> v_new THEN
    RAISE EXCEPTION '件数が一致しません（退避 % 件 / 作り直し % 件）。中止します', v_old, v_new;
  END IF;
  RAISE NOTICE 'データ移行: % 件', v_new;

  FOREACH s IN ARRAY v_seq LOOP EXECUTE s; END LOOP;

  -- identity の連番を最大値の次に合わせる
  FOREACH s IN ARRAY v_idcols LOOP
    EXECUTE format('SELECT setval(pg_get_serial_sequence(%L, %L), COALESCE((SELECT MAX(%I) FROM %I.%I), 0) + 1, false)',
                   format('%I.%I', v_schema, p_table), s, s, v_schema, p_table);
  END LOOP;

  EXECUTE format('DROP TABLE %I.%I', v_schema, v_bk);
  RAISE NOTICE '退避テーブル %.% を削除', v_schema, v_bk;

  FOREACH s IN ARRAY v_post LOOP EXECUTE s; END LOOP;
END
$f$;

SELECT pg_temp.rebuild_with_column('file_upload_status_manage', 's3_key', 'VARCHAR(1024)', 'register_id');
SELECT pg_temp.rebuild_with_column('file_upload_status_manage', 's3_bucket', 'VARCHAR(255)', 's3_key');
SELECT pg_temp.rebuild_with_column('file_upload_status_manage', 'error_phase', 'VARCHAR(20)', 'message');

-- 旧の状態を新しい状態に読み替える
UPDATE file_upload_status_manage SET status = 'PENDING' WHERE status = 'RECEIVED';
UPDATE file_upload_status_manage SET status = 'ERROR', error_phase = 'VALIDATION' WHERE status IN ('ROW_ERROR', 'FILE_ERROR');
UPDATE file_upload_status_manage SET status = 'ERROR', error_phase = 'DB' WHERE status = 'DB_ERROR';

ALTER TABLE file_upload_status_manage
  ADD CONSTRAINT ck_file_upload_status_manage_status CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'ERROR'));
ALTER TABLE file_upload_status_manage
  ADD CONSTRAINT ck_file_upload_status_manage_phase CHECK (error_phase IS NULL OR error_phase IN ('VALIDATION', 'STORE', 'DB'));

CREATE INDEX IF NOT EXISTS idx_file_upload_status_manage_started
    ON file_upload_status_manage (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_upload_status_manage_master_started
    ON file_upload_status_manage (master_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_upload_status_manage_login_user
    ON file_upload_status_manage (login_user, started_at DESC);
-- バッチサービスが判定前を古い順に取り出すため
CREATE INDEX IF NOT EXISTS idx_file_upload_status_manage_status_started
    ON file_upload_status_manage (status, started_at);

COMMENT ON TABLE  file_upload_status_manage IS 'ファイルアップロード状況管理（CSVアップロード 1 回ごとの受付と結果）';
COMMENT ON COLUMN file_upload_status_manage.id            IS 'ID（S3 のキーのフォルダにも使う）';
COMMENT ON COLUMN file_upload_status_manage.master_name   IS '種類 season:シーズン team:チーム future:試合予定 realtime:リアルタイム';
COMMENT ON COLUMN file_upload_status_manage.file_name     IS 'アップロードした zip の名前';
COMMENT ON COLUMN file_upload_status_manage.csv_file_name IS 'zip の中の CSV の名前（zip と同じ名前）';
COMMENT ON COLUMN file_upload_status_manage.file_size     IS 'zip のサイズ（バイト）';
COMMENT ON COLUMN file_upload_status_manage.status        IS '状態 PENDING:判定前 PROCESSING:判定中 SUCCESS:正常終了 ERROR:異常終了';
COMMENT ON COLUMN file_upload_status_manage.error_phase   IS 'エラーの段階 VALIDATION:バリデーション STORE:S3保管 DB:DBチェック・反映（異常終了のときだけ）';
COMMENT ON COLUMN file_upload_status_manage.message       IS '結果メッセージ';
COMMENT ON COLUMN file_upload_status_manage.total_count   IS 'CSV の行数（見出し・空行を除く）';
COMMENT ON COLUMN file_upload_status_manage.insert_count  IS '登録件数（バッチ）';
COMMENT ON COLUMN file_upload_status_manage.update_count  IS '更新件数（バッチ）';
COMMENT ON COLUMN file_upload_status_manage.delete_count  IS '削除件数（バッチ）';
COMMENT ON COLUMN file_upload_status_manage.hide_count    IS '非表示件数（バッチ）';
COMMENT ON COLUMN file_upload_status_manage.show_count    IS '再表示件数（バッチ）';
COMMENT ON COLUMN file_upload_status_manage.error_count   IS 'エラー行数';
COMMENT ON COLUMN file_upload_status_manage.error_detail  IS 'エラー行（[{rowNo, operation, key, message}]。最大 1000 行。rowNo=0 はファイル全体）';
COMMENT ON COLUMN file_upload_status_manage.login_user    IS 'アップロードしたログインユーザー（メールアドレス。JWT の sub）';
COMMENT ON COLUMN file_upload_status_manage.started_at    IS '受付日時';
COMMENT ON COLUMN file_upload_status_manage.finished_at   IS '終了日時（正常終了・異常終了になった日時）';
COMMENT ON COLUMN file_upload_status_manage.s3_bucket     IS '置いた S3 バケット（aws-s3-upload-check-csv）';
COMMENT ON COLUMN file_upload_status_manage.s3_key        IS '置いた S3 キー（uploaded/ ・ success/ ・ error/ の {種類}/{yyyyMMdd}/{id}/ファイル名）';

-- 確認（error_phase が message の前、s3_bucket / s3_key が register_id の前 / bk が残っていないこと）
SELECT ordinal_position, column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = current_schema() AND table_name = 'file_upload_status_manage'
 ORDER BY ordinal_position;
SELECT status, error_phase, COUNT(*) FROM file_upload_status_manage GROUP BY status, error_phase ORDER BY 1, 2;
SELECT to_regclass('file_upload_status_manage_bk') AS bk_table_should_be_null;

COMMIT;

ANALYZE file_upload_status_manage;
