-- CreateTable
CREATE TABLE "public"."team_member_master" (
    "id" SERIAL NOT NULL,
    "country" TEXT,
    "league" TEXT,
    "team" TEXT NOT NULL,
    "score" TEXT,
    "loan_belong" TEXT,
    "jersey" TEXT NOT NULL,
    "member" TEXT NOT NULL,
    "face_pic_path" TEXT NOT NULL,
    "belong_list" TEXT,
    "height" TEXT,
    "weight" TEXT,
    "position" TEXT,
    "birth" TEXT,
    "age" TEXT,
    "market_value" TEXT,
    "injury" TEXT,
    "versus_team_score_data" TEXT,
    "retire_flg" CHAR(1),
    "deadline" CHAR(1),
    "deadline_contract_date" TEXT,
    "latest_info_date" TEXT,
    "upd_stamp" TEXT,
    "register_id" VARCHAR(100) NOT NULL,
    "register_time" TIMESTAMPTZ(0) NOT NULL,
    "update_id" VARCHAR(100) NOT NULL,
    "update_time" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "team_member_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."country_league_master" (
    "id" SERIAL NOT NULL,
    "country" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "register_id" VARCHAR(100) NOT NULL,
    "register_time" TIMESTAMPTZ(0) NOT NULL,
    "update_id" VARCHAR(100) NOT NULL,
    "update_time" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "country_league_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."country_league_season_master" (
    "id" SERIAL NOT NULL,
    "country" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "season_year" TEXT NOT NULL,
    "start_season_date" TIMESTAMPTZ(0),
    "end_season_date" TIMESTAMPTZ(0),
    "round" VARCHAR(2),
    "path" TEXT,
    "icon" TEXT,
    "valid_flg" VARCHAR(1) NOT NULL DEFAULT '0',
    "register_id" VARCHAR(100),
    "register_time" TIMESTAMPTZ(0),
    "update_id" VARCHAR(100),
    "update_time" TIMESTAMPTZ(0),

    CONSTRAINT "country_league_season_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."team_color_master" (
    "id" SERIAL NOT NULL,
    "country" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "team_color_hex" VARCHAR(7),
    "register_id" VARCHAR(100),
    "register_time" TIMESTAMPTZ(0),
    "update_id" VARCHAR(100),
    "update_time" TIMESTAMPTZ(0),

    CONSTRAINT "team_color_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."future_master" (
    "seq" BIGSERIAL NOT NULL,
    "game_team_category" TEXT NOT NULL,
    "future_time" TIMESTAMPTZ(0) NOT NULL,
    "home_rank" TEXT,
    "away_rank" TEXT,
    "home_team_name" TEXT,
    "away_team_name" TEXT,
    "home_max_getting_scorer" TEXT,
    "away_max_getting_scorer" TEXT,
    "home_team_home_score" TEXT,
    "home_team_home_lost" TEXT,
    "away_team_home_score" TEXT,
    "away_team_home_lost" TEXT,
    "home_team_away_score" TEXT,
    "home_team_away_lost" TEXT,
    "away_team_away_score" TEXT,
    "away_team_away_lost" TEXT,
    "game_link" TEXT,
    "data_time" TIMESTAMPTZ(0),
    "start_flg" VARCHAR(1) NOT NULL DEFAULT '0',
    "register_id" TEXT,
    "register_time" TIMESTAMPTZ(0),
    "update_id" TEXT,
    "update_time" TIMESTAMPTZ(0),

    CONSTRAINT "future_master_pkey" PRIMARY KEY ("seq")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_member_master_team_jersey_member_face_pic_path_key" ON "public"."team_member_master"("team", "jersey", "member", "face_pic_path");
