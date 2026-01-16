-- CreateTable
CREATE TABLE "users" (
    "userid" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "register_id" VARCHAR(100) NOT NULL,
    "register_time" TIMESTAMPTZ(0) NOT NULL,
    "update_id" VARCHAR(100) NOT NULL,
    "update_time" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("userid")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "level" SMALLINT NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "league" VARCHAR(100) NOT NULL DEFAULT '',
    "team" VARCHAR(100) NOT NULL DEFAULT '',
    "register_id" VARCHAR(100) NOT NULL,
    "register_time" TIMESTAMPTZ(0) NOT NULL,
    "update_id" VARCHAR(100) NOT NULL,
    "update_time" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_fav_user" ON "favorites"("userId");

-- CreateIndex
CREATE INDEX "idx_fav_user_country" ON "favorites"("userId", "country");

-- CreateIndex
CREATE INDEX "idx_fav_user_country_league" ON "favorites"("userId", "country", "league");

-- CreateIndex
CREATE UNIQUE INDEX "uk_fav_scope" ON "favorites"("userId", "level", "country", "league", "team");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userid") ON DELETE CASCADE ON UPDATE CASCADE;

-- =========================
-- (1) level整合性チェック
-- =========================
ALTER TABLE favorites
ADD CONSTRAINT favorites_level_chk CHECK (
  (level = 1 AND league = '' AND team = '') OR
  (level = 2 AND league <> '' AND team = '') OR
  (level = 3 AND league <> '' AND team <> '')
);

-- =========================
-- (2) 親が無い子は禁止（A）
-- =========================
CREATE OR REPLACE FUNCTION favorites_parent_check()
RETURNS trigger AS $$
BEGIN
  -- league(level=2) は country(level=1) が必須
  IF (NEW.level = 2) THEN
    IF NOT EXISTS (
      SELECT 1 FROM favorites f
      WHERE f.user_id = NEW.user_id
        AND f.level = 1
        AND f.country = NEW.country
    ) THEN
      RAISE EXCEPTION 'Parent country favorite not found (user_id=%, country=%)', NEW.user_id, NEW.country;
    END IF;
  END IF;

  -- team(level=3) は league(level=2) が必須
  IF (NEW.level = 3) THEN
    IF NOT EXISTS (
      SELECT 1 FROM favorites f
      WHERE f.user_id = NEW.user_id
        AND f.level = 2
        AND f.country = NEW.country
        AND f.league = NEW.league
    ) THEN
      RAISE EXCEPTION 'Parent league favorite not found (user_id=%, country=%, league=%)', NEW.user_id, NEW.country, NEW.league;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_favorites_parent_check ON favorites;

CREATE TRIGGER trg_favorites_parent_check
BEFORE INSERT OR UPDATE ON favorites
FOR EACH ROW
EXECUTE FUNCTION favorites_parent_check();

-- =========================
-- (3) 親削除で子も削除（B）
-- =========================
CREATE OR REPLACE FUNCTION favorites_cascade_delete()
RETURNS trigger AS $$
BEGIN
  -- 国(level=1)削除 → その国の league/team を削除
  IF (OLD.level = 1) THEN
    DELETE FROM favorites
     WHERE user_id = OLD.user_id
       AND country = OLD.country
       AND level IN (2,3);
  END IF;

  -- リーグ(level=2)削除 → その国リーグの team を削除
  IF (OLD.level = 2) THEN
    DELETE FROM favorites
     WHERE user_id = OLD.user_id
       AND country = OLD.country
       AND league  = OLD.league
       AND level = 3;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_favorites_cascade_delete ON favorites;

CREATE TRIGGER trg_favorites_cascade_delete
AFTER DELETE ON favorites
FOR EACH ROW
EXECUTE FUNCTION favorites_cascade_delete();

