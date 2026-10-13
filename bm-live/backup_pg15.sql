--
-- PostgreSQL database cluster dump
--

\restrict 2ZQpbwiPrQcrC7C4VLCXgtB2H0aYeYS77FKXJDgenzm8gRjiss2dvUE7V3tZWdO

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:tEQQ0wodoOYQnRfTm2JZcw==$rP/cP2ZnUlyUGX/mZSGdiibE45saYp6GGOQCwncxpJA=:NaIr5wNjwxjFMsMYRtd12V5gC2cFijGsEein096NT38=';

--
-- User Configurations
--








\unrestrict 2ZQpbwiPrQcrC7C4VLCXgtB2H0aYeYS77FKXJDgenzm8gRjiss2dvUE7V3tZWdO

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict PvIEGzB72kifvjL3GixmGL0x73h3YPCtV3HPIMnhmODFVw9V7fdbs99Ts4APT8K

-- Dumped from database version 15.19 (Debian 15.19-1.pgdg13+2)
-- Dumped by pg_dump version 15.19 (Debian 15.19-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict PvIEGzB72kifvjL3GixmGL0x73h3YPCtV3HPIMnhmODFVw9V7fdbs99Ts4APT8K

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict 9zwT4aSyFtxHG4805XmAIbtZE7KlN5uFCNRbciEz0RXaO6Bx6czQfbf5dbtLKa9

-- Dumped from database version 15.19 (Debian 15.19-1.pgdg13+2)
-- Dumped by pg_dump version 15.19 (Debian 15.19-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict 9zwT4aSyFtxHG4805XmAIbtZE7KlN5uFCNRbciEz0RXaO6Bx6czQfbf5dbtLKa9

--
-- Database "soccer_bm" dump
--

--
-- PostgreSQL database dump
--

\restrict FVNPkdZLhB9XcSqxtJsmaZ8zgdhEqbuMwtMNczWnJWkgKWe5LVvrOImZFsluM4h

-- Dumped from database version 15.19 (Debian 15.19-1.pgdg13+2)
-- Dumped by pg_dump version 15.19 (Debian 15.19-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: soccer_bm; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE soccer_bm WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE soccer_bm OWNER TO postgres;

\unrestrict FVNPkdZLhB9XcSqxtJsmaZ8zgdhEqbuMwtMNczWnJWkgKWe5LVvrOImZFsluM4h
\connect soccer_bm
\restrict FVNPkdZLhB9XcSqxtJsmaZ8zgdhEqbuMwtMNczWnJWkgKWe5LVvrOImZFsluM4h

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: average_statistics_csv_tmp_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.average_statistics_csv_tmp_data (
    id integer NOT NULL,
    score character varying(10),
    country character varying(255),
    league character varying(255),
    team character varying(255),
    game_count character varying(255),
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.average_statistics_csv_tmp_data OWNER TO postgres;

--
-- Name: average_statistics_team_detail_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.average_statistics_team_detail_data (
    id integer NOT NULL,
    situation character varying(255),
    team character varying(100),
    opposite_team character varying(100),
    ha character varying(1),
    country character varying(255),
    league character varying(255),
    exp_stat character varying(256),
    donation_stat character varying(256),
    shoot_all_stat character varying(256),
    shoot_in_stat character varying(256),
    shoot_out_stat character varying(256),
    block_shoot_stat character varying(256),
    big_chance_stat character varying(256),
    corner_stat character varying(256),
    box_shoot_in_stat character varying(256),
    box_shoot_out_stat character varying(256),
    goal_post_stat character varying(256),
    goal_head_stat character varying(256),
    keeper_save_stat character varying(256),
    free_kick_stat character varying(256),
    offside_stat character varying(256),
    foul_stat character varying(256),
    yellow_card_stat character varying(256),
    red_card_stat character varying(256),
    slow_in_stat character varying(256),
    box_touch_stat character varying(256),
    pass_count_stat character varying(256),
    final_third_pass_count_stat character varying(256),
    cross_count_stat character varying(256),
    tackle_count_stat character varying(256),
    clear_count_stat character varying(256),
    intercept_count_stat character varying(256),
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.average_statistics_team_detail_data OWNER TO postgres;

--
-- Name: calc_correlation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calc_correlation (
    id integer NOT NULL,
    file character varying(255),
    country character varying(40),
    league character varying(40),
    home character varying(255),
    away character varying(255),
    score character varying(5),
    chk_body character varying(40),
    home_exp_info character varying(255),
    away_exp_info character varying(255),
    home_in_goal_exp_info text,
    away_in_goal_exp_info text,
    home_donation_info character varying(255),
    away_donation_info character varying(255),
    home_shoot_all_info character varying(255),
    away_shoot_all_info character varying(255),
    home_shoot_in_info character varying(255),
    away_shoot_in_info character varying(255),
    home_shoot_out_info character varying(255),
    away_shoot_out_info character varying(255),
    home_block_shoot_info character varying(255),
    away_block_shoot_info character varying(255),
    home_big_chance_info character varying(255),
    away_big_chance_info character varying(255),
    home_corner_info character varying(255),
    away_corner_info character varying(255),
    home_box_shoot_in_info character varying(255),
    away_box_shoot_in_info character varying(255),
    home_box_shoot_out_info character varying(255),
    away_box_shoot_out_info character varying(255),
    home_goal_post_info character varying(255),
    away_goal_post_info character varying(255),
    home_goal_head_info character varying(255),
    away_goal_head_info character varying(255),
    home_keeper_save_info character varying(255),
    away_keeper_save_info character varying(255),
    home_free_kick_info character varying(255),
    away_free_kick_info character varying(255),
    home_offside_info character varying(255),
    away_offside_info character varying(255),
    home_foul_info character varying(255),
    away_foul_info character varying(255),
    home_yellow_card_info character varying(255),
    away_yellow_card_info character varying(255),
    home_red_card_info character varying(255),
    away_red_card_info character varying(255),
    home_slow_in_info character varying(255),
    away_slow_in_info character varying(255),
    home_box_touch_info character varying(255),
    away_box_touch_info character varying(255),
    home_pass_count_info_on_success_ratio character varying(255),
    home_pass_count_info_on_success_count character varying(255),
    home_pass_count_info_on_try_count character varying(255),
    away_pass_count_info_on_success_ratio character varying(255),
    away_pass_count_info_on_success_count character varying(255),
    away_pass_count_info_on_try_count character varying(255),
    home_final_third_pass_count_info_on_success_ratio character varying(255),
    home_final_third_pass_count_info_on_success_count character varying(255),
    home_final_third_pass_count_info_on_try_count character varying(255),
    away_final_third_pass_count_info_on_success_ratio character varying(255),
    away_final_third_pass_count_info_on_success_count character varying(255),
    away_final_third_pass_count_info_on_try_count character varying(255),
    home_cross_count_info_on_success_ratio character varying(255),
    home_cross_count_info_on_success_count character varying(255),
    home_cross_count_info_on_try_count character varying(255),
    away_cross_count_info_on_success_ratio character varying(255),
    away_cross_count_info_on_success_count character varying(255),
    away_cross_count_info_on_try_count character varying(255),
    home_tackle_count_info_on_success_ratio character varying(255),
    home_tackle_count_info_on_success_count character varying(255),
    home_tackle_count_info_on_try_count character varying(255),
    away_tackle_count_info_on_success_ratio character varying(255),
    away_tackle_count_info_on_success_count character varying(255),
    away_tackle_count_info_on_try_count character varying(255),
    home_clear_count_info character varying(255),
    away_clear_count_info character varying(255),
    home_intercept_count_info character varying(255),
    away_intercept_count_info character varying(255),
    logic_flg character varying(1) DEFAULT '0'::character varying,
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.calc_correlation OWNER TO postgres;

--
-- Name: calc_correlation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.calc_correlation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.calc_correlation_id_seq OWNER TO postgres;

--
-- Name: calc_correlation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.calc_correlation_id_seq OWNED BY public.calc_correlation.id;


--
-- Name: calc_correlation_ranking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calc_correlation_ranking (
    id integer NOT NULL,
    country character varying(255),
    league character varying(255),
    home character varying(255),
    away character varying(255),
    score character varying(255),
    "chkBody" text,
    rank_1th text,
    rank_2th text,
    rank_3th text,
    rank_4th text,
    rank_5th text,
    rank_6th text,
    rank_7th text,
    rank_8th text,
    rank_9th text,
    rank_10th text,
    rank_11th text,
    rank_12th text,
    rank_13th text,
    rank_14th text,
    rank_15th text,
    rank_16th text,
    rank_17th text,
    rank_18th text,
    rank_19th text,
    rank_20th text,
    rank_21th text,
    rank_22th text,
    rank_23th text,
    rank_24th text,
    rank_25th text,
    rank_26th text,
    rank_27th text,
    rank_28th text,
    rank_29th text,
    rank_30th text,
    rank_31th text,
    rank_32th text,
    rank_33th text,
    rank_34th text,
    rank_35th text,
    rank_36th text,
    rank_37th text,
    rank_38th text,
    rank_39th text,
    rank_40th text,
    rank_41th text,
    rank_42th text,
    rank_43th text,
    rank_44th text,
    rank_45th text,
    rank_46th text,
    rank_47th text,
    rank_48th text,
    rank_49th text,
    rank_50th text,
    rank_51th text,
    rank_52th text,
    rank_53th text,
    rank_54th text,
    rank_55th text,
    rank_56th text,
    rank_57th text,
    rank_58th text,
    rank_59th text,
    rank_60th text,
    rank_61th text,
    rank_62th text,
    rank_63th text,
    rank_64th text,
    rank_65th text,
    rank_66th text,
    rank_67th text,
    rank_68th text,
    rank_69th text,
    rank_70th text,
    rank_71th text,
    rank_72th text,
    rank_73th text,
    rank_74th text,
    logic_flg character varying(1) DEFAULT '0'::character varying,
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.calc_correlation_ranking OWNER TO postgres;

--
-- Name: calc_correlation_ranking_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.calc_correlation_ranking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.calc_correlation_ranking_id_seq OWNER TO postgres;

--
-- Name: calc_correlation_ranking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.calc_correlation_ranking_id_seq OWNED BY public.calc_correlation_ranking.id;


--
-- Name: condition_result_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.condition_result_data (
    data_seq integer NOT NULL,
    mail_target_count character(30),
    mail_anonymous_target_count character(30),
    mail_target_success_count character(30),
    mail_target_fail_count character(30),
    ex_mail_target_to_no_result_count character(30),
    ex_no_fin_data_to_no_result_count character(30),
    goal_delete character(30),
    alter_target_mail_anonymous character(30),
    alter_target_mail_fail character(30),
    no_result_count character(30),
    err_data character(30),
    condition_data bytea NOT NULL,
    hash character varying(256),
    register_id character varying(100) NOT NULL,
    register_time timestamp(0) with time zone NOT NULL,
    update_id character varying(100) NOT NULL,
    update_time timestamp(0) with time zone NOT NULL
);


ALTER TABLE public.condition_result_data OWNER TO postgres;

--
-- Name: condition_result_data_data_seq_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.condition_result_data_data_seq_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.condition_result_data_data_seq_seq OWNER TO postgres;

--
-- Name: condition_result_data_data_seq_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.condition_result_data_data_seq_seq OWNED BY public.condition_result_data.data_seq;


--
-- Name: country_league_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.country_league_master (
    id integer NOT NULL,
    country character varying(50) NOT NULL,
    league character varying(50) NOT NULL,
    team character varying(100) NOT NULL,
    link character varying(200) NOT NULL,
    register_id character varying(100) NOT NULL,
    register_time timestamp(0) with time zone NOT NULL,
    update_id character varying(100) NOT NULL,
    update_time timestamp(0) with time zone NOT NULL
);


ALTER TABLE public.country_league_master OWNER TO postgres;

--
-- Name: country_league_master_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.country_league_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.country_league_master_id_seq OWNER TO postgres;

--
-- Name: country_league_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.country_league_master_id_seq OWNED BY public.country_league_master.id;


--
-- Name: country_league_season_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.country_league_season_master (
    id integer NOT NULL,
    country character varying(100) NOT NULL,
    league character varying(200) NOT NULL,
    start_season_date timestamp(0) without time zone,
    end_season_date timestamp(0) without time zone,
    round character varying(2),
    path character varying(500),
    disp_valid_flg character varying(1) DEFAULT '0'::character varying NOT NULL,
    upd_stamp timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.country_league_season_master OWNER TO postgres;

--
-- Name: country_league_season_master_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.country_league_season_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.country_league_season_master_id_seq OWNER TO postgres;

--
-- Name: country_league_season_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.country_league_season_master_id_seq OWNED BY public.country_league_season_master.id;


--
-- Name: country_league_summary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.country_league_summary (
    id integer NOT NULL,
    country character varying(50) NOT NULL,
    league character varying(50) NOT NULL,
    data_count character varying(100) NOT NULL,
    csv_count character varying(100) NOT NULL,
    logic_flg character varying(1) DEFAULT '0'::character varying,
    register_id character varying(100) NOT NULL,
    register_time timestamp(0) with time zone NOT NULL,
    update_id character varying(100) NOT NULL,
    update_time timestamp(0) with time zone NOT NULL
);


ALTER TABLE public.country_league_summary OWNER TO postgres;

--
-- Name: country_league_summary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.country_league_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.country_league_summary_id_seq OWNER TO postgres;

--
-- Name: country_league_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.country_league_summary_id_seq OWNED BY public.country_league_summary.id;


--
-- Name: data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data (
    seq integer NOT NULL,
    condition_result_data_seq_id character varying(3),
    data_category character(100),
    times character(50),
    home_rank character(30),
    home_team_name character(100),
    home_score character(20) DEFAULT '0'::bpchar,
    away_rank character(30),
    away_team_name character(100),
    away_score character(20) DEFAULT '0'::bpchar,
    home_exp character(50),
    away_exp character(50),
    home_in_goal_exp character(50),
    away_in_goal_exp character(50),
    home_donation character(50),
    away_donation character(50),
    home_shoot_all character(3),
    away_shoot_all character(30),
    home_shoot_in character(30),
    away_shoot_in character(30),
    home_shoot_out character(30),
    away_shoot_out character(30),
    home_block_shoot character(30),
    away_block_shoot character(30),
    home_big_chance character(30),
    away_big_chance character(30),
    home_corner character(30),
    away_corner character(30),
    home_box_shoot_in character(30),
    away_box_shoot_in character(30),
    home_box_shoot_out character(30),
    away_box_shoot_out character(30),
    home_goal_post character(30),
    away_goal_post character(30),
    home_goal_head character(30),
    away_goal_head character(30),
    home_keeper_save character(30),
    away_keeper_save character(30),
    home_free_kick character(30),
    away_free_kick character(30),
    home_offside character(30),
    away_offside character(30),
    home_foul character(30),
    away_foul character(30),
    home_yellow_card character(30),
    away_yellow_card character(30),
    home_red_card character(30),
    away_red_card character(30),
    home_slow_in character(30),
    away_slow_in character(30),
    home_box_touch character(30),
    away_box_touch character(30),
    home_pass_count character(30),
    away_pass_count character(30),
    home_long_pass_count character(30),
    away_long_pass_count character(30),
    home_final_third_pass_count character(30),
    away_final_third_pass_count character(30),
    home_cross_count character(30),
    away_cross_count character(30),
    home_tackle_count character(30),
    away_tackle_count character(30),
    home_clear_count character(30),
    away_clear_count character(30),
    home_duel_count character(30),
    away_duel_count character(30),
    home_intercept_count character(30),
    away_intercept_count character(30),
    record_time timestamp(0) without time zone,
    weather character(5),
    temparature character(10),
    humid character(5),
    judge_member character(50),
    home_manager character(50),
    away_manager character(50),
    home_formation character(20),
    away_formation character(20),
    studium character(250),
    capacity character(20),
    audience character(20),
    home_max_getting_scorer character(50),
    away_max_getting_scorer character(50),
    home_max_getting_scorer_game_situation character(20),
    away_max_getting_scorer_game_situation character(20),
    home_team_home_score character(20),
    home_team_home_lost character(20),
    away_team_home_score character(20),
    away_team_home_lost character(20),
    home_team_away_score character(20),
    home_team_away_lost character(20),
    away_team_away_score character(20),
    away_team_away_lost character(20),
    notice_flg character(8),
    goal_time character(8),
    goal_team_member text,
    judge character(50),
    home_team_style character(50),
    away_team_style character(50),
    probablity character(50),
    prediction_score_time character(50),
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.data OWNER TO postgres;

--
-- Name: data_seq_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.data_seq_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.data_seq_seq OWNER TO postgres;

--
-- Name: data_seq_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.data_seq_seq OWNED BY public.data.seq;


--
-- Name: each_team_score_based_feature_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.each_team_score_based_feature_stats (
    id integer NOT NULL,
    situation character varying(255),
    score character varying(10),
    country character varying(255),
    league character varying(255),
    team character varying(255),
    home_exp_stat character varying(256),
    away_exp_stat character varying(256),
    home_in_goal_exp_stat text,
    away_in_goal_exp_stat text,
    home_donation_stat character varying(256),
    away_donation_stat character varying(256),
    home_shoot_all_stat character varying(256),
    away_shoot_all_stat character varying(256),
    home_shoot_in_stat character varying(256),
    away_shoot_in_stat character varying(256),
    home_shoot_out_stat character varying(256),
    away_shoot_out_stat character varying(256),
    home_block_shoot_stat character varying(256),
    away_block_shoot_stat character varying(256),
    home_big_chance_stat character varying(256),
    away_big_chance_stat character varying(256),
    home_corner_stat character varying(256),
    away_corner_stat character varying(256),
    home_box_shoot_in_stat character varying(256),
    away_box_shoot_in_stat character varying(256),
    home_box_shoot_out_stat character varying(256),
    away_box_shoot_out_stat character varying(256),
    home_goal_post_stat character varying(256),
    away_goal_post_stat character varying(256),
    home_goal_head_stat character varying(256),
    away_goal_head_stat character varying(256),
    home_keeper_save_stat character varying(256),
    away_keeper_save_stat character varying(256),
    home_free_kick_stat character varying(256),
    away_free_kick_stat character varying(256),
    home_offside_stat character varying(256),
    away_offside_stat character varying(256),
    home_foul_stat character varying(256),
    away_foul_stat character varying(256),
    home_yellow_card_stat character varying(256),
    away_yellow_card_stat character varying(256),
    home_red_card_stat character varying(256),
    away_red_card_stat character varying(256),
    home_slow_in_stat character varying(256),
    away_slow_in_stat character varying(256),
    home_box_touch_stat character varying(256),
    away_box_touch_stat character varying(256),
    home_pass_count_stat character varying(256),
    away_pass_count_stat character varying(256),
    home_long_pass_count_stat character varying(256),
    away_long_pass_count_stat character varying(256),
    home_final_third_pass_count_stat character varying(256),
    away_final_third_pass_count_stat character varying(256),
    home_cross_count_stat character varying(256),
    away_cross_count_stat character varying(256),
    home_tackle_count_stat character varying(256),
    away_tackle_count_stat character varying(256),
    home_clear_count_stat character varying(256),
    away_clear_count_stat character varying(256),
    home_duel_count_stat character varying(256),
    away_duel_count_stat character varying(256),
    home_intercept_count_stat character varying(256),
    away_intercept_count_stat character varying(256),
    logic_flg character varying(1) DEFAULT '0'::character varying,
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.each_team_score_based_feature_stats OWNER TO postgres;

--
-- Name: each_team_score_based_feature_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.each_team_score_based_feature_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.each_team_score_based_feature_stats_id_seq OWNER TO postgres;

--
-- Name: each_team_score_based_feature_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.each_team_score_based_feature_stats_id_seq OWNED BY public.each_team_score_based_feature_stats.id;


--
-- Name: future_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.future_master (
    seq bigint NOT NULL,
    game_team_category character varying(50) NOT NULL,
    future_time timestamp(0) with time zone NOT NULL,
    home_rank character(30),
    away_rank character(30),
    home_team_name character varying(100),
    away_team_name character varying(100),
    home_max_getting_scorer character varying(100),
    away_max_getting_scorer character varying(100),
    home_team_home_score character(30),
    home_team_home_lost character(30),
    away_team_home_score character(30),
    away_team_home_lost character(30),
    home_team_away_score character(30),
    home_team_away_lost character(30),
    away_team_away_score character(30),
    away_team_away_lost character(30),
    game_link character varying(255),
    data_time timestamp(0) with time zone,
    start_flg character varying(1) DEFAULT '0'::character varying NOT NULL,
    register_id character varying(50),
    register_time timestamp(0) with time zone,
    update_id character varying(50),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.future_master OWNER TO postgres;

--
-- Name: future_master_seq_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.future_master_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.future_master_seq_seq OWNER TO postgres;

--
-- Name: future_master_seq_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.future_master_seq_seq OWNED BY public.future_master.seq;


--
-- Name: league_score_time_band_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.league_score_time_band_stats (
    id integer NOT NULL,
    country character varying(50),
    league character varying(50),
    sum_score_value character varying(50),
    time_range_area character varying(200),
    target character varying(50),
    search character varying(50),
    ratio character varying(50),
    logic_flg character varying(1) DEFAULT '0'::character varying,
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.league_score_time_band_stats OWNER TO postgres;

--
-- Name: league_score_time_band_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.league_score_time_band_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.league_score_time_band_stats_id_seq OWNER TO postgres;

--
-- Name: league_score_time_band_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.league_score_time_band_stats_id_seq OWNED BY public.league_score_time_band_stats.id;


--
-- Name: league_score_time_band_stats_split_score; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.league_score_time_band_stats_split_score (
    id integer NOT NULL,
    country character varying(50),
    league character varying(50),
    home_score_value character varying(50),
    away_score_value character varying(50),
    home_time_range_area character varying(200),
    away_time_range_area character varying(200),
    target character varying(50),
    search character varying(50),
    ratio character varying(50),
    logic_flg character varying(1) DEFAULT '0'::character varying,
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.league_score_time_band_stats_split_score OWNER TO postgres;

--
-- Name: league_score_time_band_stats_split_score_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.league_score_time_band_stats_split_score_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.league_score_time_band_stats_split_score_id_seq OWNER TO postgres;

--
-- Name: league_score_time_band_stats_split_score_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.league_score_time_band_stats_split_score_id_seq OWNED BY public.league_score_time_band_stats_split_score.id;


--
-- Name: match_classification_result; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.match_classification_result (
    id integer NOT NULL,
    classify_mode character varying(2),
    data_category character(100),
    times character(50),
    home_rank character(30),
    home_team_name character(100),
    home_score character(20) DEFAULT '0'::bpchar,
    away_rank character(30),
    away_team_name character(100),
    away_score character(20) DEFAULT '0'::bpchar,
    home_exp character(50),
    away_exp character(50),
    home_in_goal_exp character(50),
    away_in_goal_exp character(50),
    home_donation character(50),
    away_donation character(50),
    home_shoot_all character(3),
    away_shoot_all character(30),
    home_shoot_in character(30),
    away_shoot_in character(30),
    home_shoot_out character(30),
    away_shoot_out character(30),
    home_block_shoot character(30),
    away_block_shoot character(30),
    home_big_chance character(30),
    away_big_chance character(30),
    home_corner character(30),
    away_corner character(30),
    home_box_shoot_in character(30),
    away_box_shoot_in character(30),
    home_box_shoot_out character(30),
    away_box_shoot_out character(30),
    home_goal_post character(30),
    away_goal_post character(30),
    home_goal_head character(30),
    away_goal_head character(30),
    home_keeper_save character(30),
    away_keeper_save character(30),
    home_free_kick character(30),
    away_free_kick character(30),
    home_offside character(30),
    away_offside character(30),
    home_foul character(30),
    away_foul character(30),
    home_yellow_card character(30),
    away_yellow_card character(30),
    home_red_card character(30),
    away_red_card character(30),
    home_slow_in character(30),
    away_slow_in character(30),
    home_box_touch character(30),
    away_box_touch character(30),
    home_pass_count character(30),
    away_pass_count character(30),
    home_final_third_pass_count character(30),
    away_final_third_pass_count character(30),
    home_cross_count character(30),
    away_cross_count character(30),
    home_tackle_count character(30),
    away_tackle_count character(30),
    home_clear_count character(30),
    away_clear_count character(30),
    home_intercept_count character(30),
    away_intercept_count character(30),
    record_time timestamp(0) without time zone,
    weather character(5),
    temparature character(10),
    humid character(5),
    judge_member character(50),
    home_manager character(50),
    away_manager character(50),
    home_formation character(20),
    away_formation character(20),
    studium character varying(300),
    capacity character(20),
    audience character(20),
    home_max_getting_scorer character(50),
    away_max_getting_scorer character(50),
    home_max_getting_scorer_game_situation character(20),
    away_max_getting_scorer_game_situation character(20),
    home_team_home_score character(20),
    home_team_home_lost character(20),
    away_team_home_score character(20),
    away_team_home_lost character(20),
    home_team_away_score character(20),
    home_team_away_lost character(20),
    away_team_away_score character(20),
    away_team_away_lost character(20),
    notice_flg character(8),
    goal_time character(8),
    goal_team_member character(50),
    judge character(50),
    home_team_style character(50),
    away_team_style character(50),
    probablity character(50),
    prediction_score_time character(50),
    logic_flg character varying(1) DEFAULT '0'::character varying,
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.match_classification_result OWNER TO postgres;

--
-- Name: match_classification_result_count; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.match_classification_result_count (
    id integer NOT NULL,
    country character varying(50),
    league character varying(50),
    classify_mode character varying(2),
    count character varying(50),
    remarks character varying(3000),
    logic_flg character varying(1) DEFAULT '0'::character varying,
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.match_classification_result_count OWNER TO postgres;

--
-- Name: match_classification_result_count_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.match_classification_result_count_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.match_classification_result_count_id_seq OWNER TO postgres;

--
-- Name: match_classification_result_count_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.match_classification_result_count_id_seq OWNED BY public.match_classification_result_count.id;


--
-- Name: match_classification_result_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.match_classification_result_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.match_classification_result_id_seq OWNER TO postgres;

--
-- Name: match_classification_result_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.match_classification_result_id_seq OWNED BY public.match_classification_result.id;


--
-- Name: no_goal_match_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.no_goal_match_stats (
    id integer NOT NULL,
    seq character(100),
    data_category character(100),
    times character(50),
    home_rank character(30),
    home_team_name character(100),
    home_score character(20) DEFAULT '0'::bpchar,
    away_rank character(30),
    away_team_name character(100),
    away_score character(20) DEFAULT '0'::bpchar,
    home_exp character(50),
    away_exp character(50),
    home_in_goal_exp character(50),
    away_in_goal_exp character(50),
    home_donation character(50),
    away_donation character(50),
    home_shoot_all character(3),
    away_shoot_all character(30),
    home_shoot_in character(30),
    away_shoot_in character(30),
    home_shoot_out character(30),
    away_shoot_out character(30),
    home_block_shoot character(30),
    away_block_shoot character(30),
    home_big_chance character(30),
    away_big_chance character(30),
    home_corner character(30),
    away_corner character(30),
    home_box_shoot_in character(30),
    away_box_shoot_in character(30),
    home_box_shoot_out character(30),
    away_box_shoot_out character(30),
    home_goal_post character(30),
    away_goal_post character(30),
    home_goal_head character(30),
    away_goal_head character(30),
    home_keeper_save character(30),
    away_keeper_save character(30),
    home_free_kick character(30),
    away_free_kick character(30),
    home_offside character(30),
    away_offside character(30),
    home_foul character(30),
    away_foul character(30),
    home_yellow_card character(30),
    away_yellow_card character(30),
    home_red_card character(30),
    away_red_card character(30),
    home_slow_in character(30),
    away_slow_in character(30),
    home_box_touch character(30),
    away_box_touch character(30),
    home_pass_count character(30),
    away_pass_count character(30),
    home_long_pass_count character(30),
    away_long_pass_count character(30),
    home_final_third_pass_count character(30),
    away_final_third_pass_count character(30),
    home_cross_count character(30),
    away_cross_count character(30),
    home_tackle_count character(30),
    away_tackle_count character(30),
    home_clear_count character(30),
    away_clear_count character(30),
    home_duel_count character(30),
    away_duel_count character(30),
    home_intercept_count character(30),
    away_intercept_count character(30),
    record_time timestamp(0) without time zone,
    weather character(5),
    temparature character(10),
    humid character(5),
    judge_member character(50),
    home_manager character(50),
    away_manager character(50),
    home_formation character(20),
    away_formation character(20),
    studium character(50),
    capacity character(20),
    audience character(20),
    home_max_getting_scorer character(50),
    away_max_getting_scorer character(50),
    home_max_getting_scorer_game_situation character(20),
    away_max_getting_scorer_game_situation character(20),
    home_team_home_score character(20),
    home_team_home_lost character(20),
    away_team_home_score character(20),
    away_team_home_lost character(20),
    home_team_away_score character(20),
    home_team_away_lost character(20),
    away_team_away_score character(20),
    away_team_away_lost character(20),
    notice_flg character(8),
    goal_time character(8),
    goal_team_member character(50),
    judge character(50),
    home_team_style character(50),
    away_team_style character(50),
    probablity character(50),
    prediction_score_time character(50),
    logic_flg character varying(1) DEFAULT '0'::character varying,
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.no_goal_match_stats OWNER TO postgres;

--
-- Name: no_goal_match_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.no_goal_match_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.no_goal_match_stats_id_seq OWNER TO postgres;

--
-- Name: no_goal_match_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.no_goal_match_stats_id_seq OWNED BY public.no_goal_match_stats.id;


--
-- Name: score_based_feature_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.score_based_feature_stats (
    id integer NOT NULL,
    situation character varying(255),
    score character varying(10),
    country character varying(255),
    league character varying(255),
    home_exp_stat character varying(256),
    away_exp_stat character varying(256),
    home_in_goal_exp_stat text,
    away_in_goal_exp_stat text,
    home_donation_stat character varying(256),
    away_donation_stat character varying(256),
    home_shoot_all_stat character varying(256),
    away_shoot_all_stat character varying(256),
    home_shoot_in_stat character varying(256),
    away_shoot_in_stat character varying(256),
    home_shoot_out_stat character varying(256),
    away_shoot_out_stat character varying(256),
    home_block_shoot_stat character varying(256),
    away_block_shoot_stat character varying(256),
    home_big_chance_stat character varying(256),
    away_big_chance_stat character varying(256),
    home_corner_stat character varying(256),
    away_corner_stat character varying(256),
    home_box_shoot_in_stat character varying(256),
    away_box_shoot_in_stat character varying(256),
    home_box_shoot_out_stat character varying(256),
    away_box_shoot_out_stat character varying(256),
    home_goal_post_stat character varying(256),
    away_goal_post_stat character varying(256),
    home_goal_head_stat character varying(256),
    away_goal_head_stat character varying(256),
    home_keeper_save_stat character varying(256),
    away_keeper_save_stat character varying(256),
    home_free_kick_stat character varying(256),
    away_free_kick_stat character varying(256),
    home_offside_stat character varying(256),
    away_offside_stat character varying(256),
    home_foul_stat character varying(256),
    away_foul_stat character varying(256),
    home_yellow_card_stat character varying(256),
    away_yellow_card_stat character varying(256),
    home_red_card_stat character varying(256),
    away_red_card_stat character varying(256),
    home_slow_in_stat character varying(256),
    away_slow_in_stat character varying(256),
    home_box_touch_stat character varying(256),
    away_box_touch_stat character varying(256),
    home_pass_count_stat character varying(256),
    away_pass_count_stat character varying(256),
    home_long_pass_count_stat character varying(256),
    away_long_pass_count_stat character varying(256),
    home_final_third_pass_count_stat character varying(256),
    away_final_third_pass_count_stat character varying(256),
    home_cross_count_stat character varying(256),
    away_cross_count_stat character varying(256),
    home_tackle_count_stat character varying(256),
    away_tackle_count_stat character varying(256),
    home_clear_count_stat character varying(256),
    away_clear_count_stat character varying(256),
    home_duel_count_stat character varying(256),
    away_duel_count_stat character varying(256),
    home_intercept_count_stat character varying(256),
    away_intercept_count_stat character varying(256),
    logic_flg character varying(1) DEFAULT '0'::character varying,
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.score_based_feature_stats OWNER TO postgres;

--
-- Name: score_based_feature_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.score_based_feature_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.score_based_feature_stats_id_seq OWNER TO postgres;

--
-- Name: score_based_feature_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.score_based_feature_stats_id_seq OWNED BY public.score_based_feature_stats.id;


--
-- Name: scoring_playstyle_past_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scoring_playstyle_past_data (
    id integer NOT NULL,
    data_category character varying(255),
    home_team_name character varying(255),
    away_team_name character varying(255),
    diff_home_score character varying(255),
    diff_away_score character varying(255),
    diff_home_donation character varying(255),
    diff_away_donation character varying(255),
    diff_home_shoot_all character varying(255),
    diff_away_shoot_all character varying(255),
    diff_home_shoot_in character varying(255),
    diff_away_shoot_in character varying(255),
    diff_home_shoot_out character varying(255),
    diff_away_shoot_out character varying(255),
    diff_home_block_shoot character varying(255),
    diff_away_block_shoot character varying(255),
    diff_home_big_chance character varying(255),
    diff_away_big_chance character varying(255),
    diff_home_corner character varying(255),
    diff_away_corner character varying(255),
    diff_home_box_shoot_in character varying(255),
    diff_away_box_shoot_in character varying(255),
    diff_home_box_shoot_out character varying(255),
    diff_away_box_shoot_out character varying(255),
    diff_home_goal_post character varying(255),
    diff_away_goal_post character varying(255),
    diff_home_goal_head character varying(255),
    diff_away_goal_head character varying(255),
    diff_home_keeper_save character varying(255),
    diff_away_keeper_save character varying(255),
    diff_home_free_kick character varying(255),
    diff_away_free_kick character varying(255),
    diff_home_offside character varying(255),
    diff_away_offside character varying(255),
    diff_home_foul character varying(255),
    diff_away_foul character varying(255),
    diff_home_yellow_card character varying(255),
    diff_away_yellow_card character varying(255),
    diff_home_red_card character varying(255),
    diff_away_red_card character varying(255),
    diff_home_slow_in character varying(255),
    diff_away_slow_in character varying(255),
    diff_home_box_touch character varying(255),
    diff_away_box_touch character varying(255),
    diff_home_pass_count character varying(255),
    diff_away_pass_count character varying(255),
    diff_home_final_third_pass_count character varying(255),
    diff_away_final_third_pass_count character varying(255),
    diff_home_cross_count character varying(255),
    diff_away_cross_count character varying(255),
    diff_home_tackle_count character varying(255),
    diff_away_tackle_count character varying(255),
    diff_home_clear_count character varying(255),
    diff_away_clear_count character varying(255),
    diff_home_intercept_count character varying(255),
    diff_away_intercept_count character varying(255),
    home_play_style character varying(255),
    away_play_style character varying(255),
    register_id character varying(100) NOT NULL,
    register_time timestamp(0) with time zone NOT NULL,
    update_id character varying(100) NOT NULL,
    update_time timestamp(0) with time zone NOT NULL
);


ALTER TABLE public.scoring_playstyle_past_data OWNER TO postgres;

--
-- Name: stat_encryption; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stat_encryption (
    id bigint NOT NULL,
    country character varying(64),
    league character varying(64),
    home character varying(128),
    away character varying(128),
    team character varying(128),
    chk_body character varying(20),
    home_exp_info text,
    away_exp_info text,
    home_in_goal_exp_info text,
    away_in_goal_exp_info text,
    home_donation_info text,
    away_donation_info text,
    home_shoot_all_info text,
    away_shoot_all_info text,
    home_shoot_in_info text,
    away_shoot_in_info text,
    home_shoot_out_info text,
    away_shoot_out_info text,
    home_block_shoot_info text,
    away_block_shoot_info text,
    home_big_chance_info text,
    away_big_chance_info text,
    home_corner_info text,
    away_corner_info text,
    home_box_shoot_in_info text,
    away_box_shoot_in_info text,
    home_box_shoot_out_info text,
    away_box_shoot_out_info text,
    home_goal_post_info text,
    away_goal_post_info text,
    home_goal_head_info text,
    away_goal_head_info text,
    home_keeper_save_info text,
    away_keeper_save_info text,
    home_free_kick_info text,
    away_free_kick_info text,
    home_offside_info text,
    away_offside_info text,
    home_foul_info text,
    away_foul_info text,
    home_yellow_card_info text,
    away_yellow_card_info character varying(255),
    home_red_card_info text,
    away_red_card_info text,
    home_slow_in_info text,
    away_slow_in_info text,
    home_box_touch_info text,
    away_box_touch_info text,
    home_pass_count_info_on_success_count text,
    away_pass_count_info_on_success_count text,
    home_long_pass_count_info_on_success_count text,
    away_long_pass_count_info_on_success_count text,
    home_final_third_pass_count_info_on_success_count text,
    away_final_third_pass_count_info_on_success_count text,
    home_cross_count_info_on_success_count text,
    away_cross_count_info_on_success_count text,
    home_tackle_count_info_on_success_count text,
    away_tackle_count_info_on_success_count text,
    home_clear_count_info text,
    away_clear_count_info text,
    home_duel_count_info text,
    away_duel_count_info text,
    home_intercept_count_info text,
    away_intercept_count_info text,
    register_id character varying(100) NOT NULL,
    register_time timestamp(0) with time zone NOT NULL,
    update_id character varying(100) NOT NULL,
    update_time timestamp(0) with time zone NOT NULL
);


ALTER TABLE public.stat_encryption OWNER TO postgres;

--
-- Name: stat_encryption_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stat_encryption_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stat_encryption_id_seq OWNER TO postgres;

--
-- Name: stat_encryption_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stat_encryption_id_seq OWNED BY public.stat_encryption.id;


--
-- Name: stat_size_finalize_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stat_size_finalize_master (
    id integer NOT NULL,
    option_num character varying(1) DEFAULT '0'::character varying NOT NULL,
    options character varying(255) NOT NULL,
    flg character varying(1) DEFAULT '0'::character varying NOT NULL,
    register_id character varying(100) NOT NULL,
    register_time timestamp(0) with time zone NOT NULL,
    update_id character varying(100) NOT NULL,
    update_time timestamp(0) with time zone NOT NULL
);


ALTER TABLE public.stat_size_finalize_master OWNER TO postgres;

--
-- Name: stat_size_finalize_master_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stat_size_finalize_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stat_size_finalize_master_id_seq OWNER TO postgres;

--
-- Name: stat_size_finalize_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stat_size_finalize_master_id_seq OWNED BY public.stat_size_finalize_master.id;


--
-- Name: surface_overview; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.surface_overview (
    id integer NOT NULL,
    country character varying(128) NOT NULL,
    league character varying(128) NOT NULL,
    game_year character(4) NOT NULL,
    game_month smallint NOT NULL,
    team character varying(128) NOT NULL,
    games integer DEFAULT 0 NOT NULL,
    rank integer,
    win integer DEFAULT 0 NOT NULL,
    lose integer DEFAULT 0 NOT NULL,
    draw integer DEFAULT 0 NOT NULL,
    winning_points integer DEFAULT 0 NOT NULL,
    home_1st_half_score text,
    home_2nd_half_score text,
    home_sum_score text,
    home_1st_half_score_ratio character varying(5),
    home_2nd_half_score_ratio character varying(5),
    home_clean_sheet text,
    away_1st_half_score text,
    away_2nd_half_score text,
    away_sum_score text,
    away_1st_half_score_ratio character varying(5),
    away_2nd_half_score_ratio character varying(5),
    away_clean_sheet text,
    fail_to_score_game_count integer DEFAULT 0 NOT NULL,
    consecutive_win_disp character varying(64),
    consecutive_lose_disp character varying(64),
    unbeaten_streak_count integer DEFAULT 0 NOT NULL,
    unbeaten_streak_disp character varying(64),
    consecutive_score_count integer DEFAULT 0 NOT NULL,
    consecutive_score_count_disp character varying(64),
    first_week_game_win_count integer DEFAULT 0 NOT NULL,
    first_week_game_lost_count integer DEFAULT 0 NOT NULL,
    first_week_game_win_disp character varying(64),
    mid_week_game_win_count integer DEFAULT 0 NOT NULL,
    mid_week_game_lost_count integer DEFAULT 0 NOT NULL,
    mid_week_game_win_disp character varying(64),
    last_week_game_win_count integer DEFAULT 0 NOT NULL,
    last_week_game_lost_count integer DEFAULT 0 NOT NULL,
    last_week_game_win_disp character varying(64),
    home_win_count integer DEFAULT 0 NOT NULL,
    home_lose_count integer DEFAULT 0 NOT NULL,
    home_first_goal_count integer DEFAULT 0 NOT NULL,
    home_win_behind_count integer DEFAULT 0 NOT NULL,
    home_lose_behind_count integer DEFAULT 0 NOT NULL,
    home_win_behind_0vs1_count integer DEFAULT 0 NOT NULL,
    home_lose_behind_1vs0_count integer DEFAULT 0 NOT NULL,
    home_win_behind_0vs2_count integer DEFAULT 0 NOT NULL,
    home_lose_behind_2vs0_count integer DEFAULT 0 NOT NULL,
    home_win_behind_other_count integer DEFAULT 0 NOT NULL,
    home_lose_behind_other_count integer DEFAULT 0 NOT NULL,
    home_adversity_disp character varying(64),
    away_win_count integer DEFAULT 0 NOT NULL,
    away_lose_count integer DEFAULT 0 NOT NULL,
    away_first_goal_count integer DEFAULT 0 NOT NULL,
    away_win_behind_count integer DEFAULT 0 NOT NULL,
    away_lose_behind_count integer DEFAULT 0 NOT NULL,
    away_win_behind_1vs0_count integer DEFAULT 0 NOT NULL,
    away_lose_behind_0vs1_count integer DEFAULT 0 NOT NULL,
    away_win_behind_2vs0_count integer DEFAULT 0 NOT NULL,
    away_lose_behind_0vs2_count integer DEFAULT 0 NOT NULL,
    away_win_behind_other_count integer DEFAULT 0 NOT NULL,
    away_lose_behind_other_count integer DEFAULT 0 NOT NULL,
    away_adversity_disp character varying(64),
    promote_disp character varying(64),
    descend_disp character varying(64),
    first_win_disp character varying(64),
    lose_streak_disp character varying(64),
    round_conc text,
    logic_flg character varying(1) DEFAULT '0'::character varying,
    register_id character varying(100) NOT NULL,
    register_time timestamp(0) with time zone NOT NULL,
    update_id character varying(100) NOT NULL,
    update_time timestamp(0) with time zone NOT NULL
);


ALTER TABLE public.surface_overview OWNER TO postgres;

--
-- Name: surface_overview_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.surface_overview_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.surface_overview_id_seq OWNER TO postgres;

--
-- Name: surface_overview_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.surface_overview_id_seq OWNED BY public.surface_overview.id;


--
-- Name: team_match_final_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_match_final_stats (
    seq integer NOT NULL,
    team_name character varying(255),
    versus_team_name character varying(255),
    ha character varying(1),
    score character varying(10),
    result character varying(10),
    game_fin_rank character varying(255),
    opposite_game_fin_rank character varying(255),
    exp character varying(255),
    opposite_exp character varying(255),
    in_goal_exp text,
    opposite_in_goal_exp text,
    donation character varying(255),
    opposite_donation character varying(255),
    shoot_all character varying(255),
    opposite_shoot_all character varying(255),
    shoot_in character varying(255),
    opposite_shoot_in character varying(255),
    shoot_out character varying(255),
    opposite_shoot_out character varying(255),
    block_shoot character varying(255),
    opposite_block_shoot character varying(255),
    big_chance character varying(255),
    opposite_big_chance character varying(255),
    corner character varying(255),
    opposite_corner character varying(255),
    box_shoot_in character varying(255),
    opposite_box_shoot_in character varying(255),
    box_shoot_out character varying(255),
    opposite_box_shoot_out character varying(255),
    goal_post character varying(255),
    opposite_goal_post character varying(255),
    goal_head character varying(255),
    opposite_goal_head character varying(255),
    keeper_save character varying(255),
    opposite_keeper_save character varying(255),
    free_kick character varying(255),
    opposite_free_kick character varying(255),
    offside character varying(255),
    opposite_offside character varying(255),
    foul character varying(255),
    opposite_foul character varying(255),
    yellow_card character varying(255),
    opposite_yellow_card character varying(255),
    red_card character varying(255),
    opposite_red_card character varying(255),
    slow_in character varying(255),
    opposite_slow_in character varying(255),
    box_touch character varying(255),
    opposite_box_touch character varying(255),
    pass_count_success_ratio character varying(255),
    pass_count_success_count character varying(255),
    pass_count_try_count character varying(255),
    opposite_pass_count_success_ratio character varying(255),
    opposite_pass_count_success_count character varying(255),
    opposite_pass_count_try_count character varying(255),
    long_pass_count_success_ratio character varying(255),
    long_pass_count_success_count character varying(255),
    long_pass_count_try_count character varying(255),
    opposite_long_pass_count_success_ratio character varying(255),
    opposite_long_pass_count_success_count character varying(255),
    opposite_long_pass_count_try_count character varying(255),
    final_third_pass_count_success_ratio character varying(255),
    final_third_pass_count_success_count character varying(255),
    final_third_pass_count_try_count character varying(255),
    opposite_final_third_pass_count_success_ratio character varying(255),
    opposite_final_third_pass_count_success_count character varying(255),
    opposite_final_third_pass_count_try_count character varying(255),
    cross_count_success_ratio character varying(255),
    cross_count_success_count character varying(255),
    cross_count_try_count character varying(255),
    opposite_cross_count_success_ratio character varying(255),
    opposite_cross_count_success_count character varying(255),
    opposite_cross_count_try_count character varying(255),
    tackle_count_success_ratio character varying(255),
    tackle_count_success_count character varying(255),
    tackle_count_try_count character varying(255),
    opposite_tackle_count_success_ratio character varying(255),
    opposite_tackle_count_success_count character varying(255),
    opposite_tackle_count_try_count character varying(255),
    clear_count character varying(255),
    opposite_clear_count character varying(255),
    duel_count character varying(255),
    opposite_duel_count character varying(255),
    intercept_count character varying(255),
    opposite_intercept_count character varying(255),
    weather character varying(255),
    temperature character varying(255),
    humid character varying(255),
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.team_match_final_stats OWNER TO postgres;

--
-- Name: team_match_final_stats_seq_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.team_match_final_stats_seq_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.team_match_final_stats_seq_seq OWNER TO postgres;

--
-- Name: team_match_final_stats_seq_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.team_match_final_stats_seq_seq OWNED BY public.team_match_final_stats.seq;


--
-- Name: team_member_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_member_master (
    id integer NOT NULL,
    country text,
    league text,
    team character varying(255) NOT NULL,
    score text,
    loan_belong text,
    jersey character varying(255) NOT NULL,
    member character varying(255) NOT NULL,
    face_pic_path character varying(255) NOT NULL,
    belong_list text,
    height text,
    weight text,
    "position" text,
    birth text,
    age text,
    market_value text,
    injury text,
    versus_team_score_data text,
    retire_flg character(1),
    deadline character(1),
    deadline_contract_date text,
    latest_info_date text,
    upd_stamp text,
    register_id character varying(100) NOT NULL,
    register_time timestamp(0) with time zone NOT NULL,
    update_id character varying(100) NOT NULL,
    update_time timestamp(0) with time zone NOT NULL
);


ALTER TABLE public.team_member_master OWNER TO postgres;

--
-- Name: team_member_master_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.team_member_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.team_member_master_id_seq OWNER TO postgres;

--
-- Name: team_member_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.team_member_master_id_seq OWNED BY public.team_member_master.id;


--
-- Name: team_monthly_score_summary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_monthly_score_summary (
    seq integer NOT NULL,
    country character varying(100),
    league character varying(100),
    team_name character(100),
    "HA" character varying(1),
    year character varying(4),
    jar_sum_score character(8),
    feb_sum_score character(8),
    mar_sum_score character(8),
    apr_sum_score character(8),
    may_sum_score character(8),
    jun_sum_score character(8),
    jul_sum_score character(8),
    aug_sum_score character(8),
    sep_sum_score character(8),
    oct_sum_score character(8),
    nov_sum_score character(8),
    dec_sum_score character(8),
    logic_flg character varying(1) DEFAULT '0'::character varying,
    register_id character varying(100) NOT NULL,
    register_time timestamp(0) with time zone NOT NULL,
    update_id character varying(100) NOT NULL,
    update_time timestamp(0) with time zone NOT NULL
);


ALTER TABLE public.team_monthly_score_summary OWNER TO postgres;

--
-- Name: team_monthly_score_summary_seq_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.team_monthly_score_summary_seq_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.team_monthly_score_summary_seq_seq OWNER TO postgres;

--
-- Name: team_monthly_score_summary_seq_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.team_monthly_score_summary_seq_seq OWNED BY public.team_monthly_score_summary.seq;


--
-- Name: team_time_segment_shooting_stat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_time_segment_shooting_stat (
    id integer NOT NULL,
    data_category character(100),
    team_name character(100),
    away_team_name character(100),
    team_0_10_mean_shoot_count character(8),
    team_11_20_mean_shoot_count character(8),
    team_21_30_mean_shoot_count character(8),
    team_31_40_mean_shoot_count character(8),
    team_41_45_mean_shoot_count character(8),
    team_46_50_mean_shoot_count character(8),
    team_51_60_mean_shoot_count character(8),
    team_61_70_mean_shoot_count character(8),
    team_71_80_mean_shoot_count character(8),
    team_81_90_mean_shoot_count character(8),
    team_addi_mean_shoot_count character(8),
    team_0_10_mean_shoot_in_count character(8),
    team_11_20_mean_shoot_in_count character(8),
    team_21_30_mean_shoot_in_count character(8),
    team_31_40_mean_shoot_in_count character(8),
    team_41_45_mean_shoot_in_count character(8),
    team_46_50_mean_shoot_in_count character(8),
    team_51_60_mean_shoot_in_count character(8),
    team_61_70_mean_shoot_in_count character(8),
    team_71_80_mean_shoot_in_count character(8),
    team_81_90_mean_shoot_in_count character(8),
    team_addi_mean_shoot_in_count character(8),
    team_0_10_mean_big_chance_count character(8),
    team_11_20_mean_big_chance_count character(8),
    team_21_30_mean_big_chance_count character(8),
    team_31_40_mean_big_chance_count character(8),
    team_41_45_mean_big_chance_count character(8),
    team_46_50_mean_big_chance_count character(8),
    team_51_60_mean_big_chance_count character(8),
    team_61_70_mean_big_chance_count character(8),
    team_71_80_mean_big_chance_count character(8),
    team_81_90_mean_big_chance_count character(8),
    team_addi_mean_big_chance_count character(8),
    team_0_10_mean_free_kick_count character(8),
    team_11_20_mean_free_kick_count character(8),
    team_21_30_mean_free_kick_count character(8),
    team_31_40_mean_free_kick_count character(8),
    team_41_45_mean_free_kick_count character(8),
    team_46_50_mean_free_kick_count character(8),
    team_51_60_mean_free_kick_count character(8),
    team_61_70_mean_free_kick_count character(8),
    team_71_80_mean_free_kick_count character(8),
    team_81_90_mean_free_kick_count character(8),
    team_addi_mean_free_kick_count character(8),
    team_0_10_mean_offside_count character(8),
    team_11_20_mean_offside_count character(8),
    team_21_30_mean_offside_count character(8),
    team_31_40_mean_offside_count character(8),
    team_41_45_mean_offside_count character(8),
    team_46_50_mean_offside_count character(8),
    team_51_60_mean_offside_count character(8),
    team_61_70_mean_offside_count character(8),
    team_71_80_mean_offside_count character(8),
    team_81_90_mean_offside_count character(8),
    team_addi_mean_offside_count character(8),
    team_0_10_mean_foul_count character(8),
    team_11_20_mean_foul_count character(8),
    team_21_30_mean_foul_count character(8),
    team_31_40_mean_foul_count character(8),
    team_41_45_mean_foul_count character(8),
    team_46_50_mean_foul_count character(8),
    team_51_60_mean_foul_count character(8),
    team_61_70_mean_foul_count character(8),
    team_71_80_mean_foul_count character(8),
    team_81_90_mean_foul_count character(8),
    team_addi_mean_foul_count character(8),
    team_0_10_mean_yellow_card_count character(8),
    team_11_20_mean_yellow_card_count character(8),
    team_21_30_mean_yellow_card_count character(8),
    team_31_40_mean_yellow_card_count character(8),
    team_41_45_mean_yellow_card_count character(8),
    team_46_50_mean_yellow_card_count character(8),
    team_51_60_mean_yellow_card_count character(8),
    team_61_70_mean_yellow_card_count character(8),
    team_71_80_mean_yellow_card_count character(8),
    team_81_90_mean_yellow_card_count character(8),
    team_addi_mean_yellow_card_count character(8),
    team_0_10_mean_red_card_count character(8),
    team_11_20_mean_red_card_count character(8),
    team_21_30_mean_red_card_count character(8),
    team_31_40_mean_red_card_count character(8),
    team_41_45_mean_red_card_count character(8),
    team_46_50_mean_red_card_count character(8),
    team_51_60_mean_red_card_count character(8),
    team_61_70_mean_red_card_count character(8),
    team_71_80_mean_red_card_count character(8),
    team_81_90_mean_red_card_count character(8),
    team_addi_mean_red_card_count character(8),
    logic_flg character varying(1) DEFAULT '0'::character varying,
    register_id character varying(100) NOT NULL,
    register_time timestamp(0) with time zone NOT NULL,
    update_id character varying(100) NOT NULL,
    update_time timestamp(0) with time zone NOT NULL
);


ALTER TABLE public.team_time_segment_shooting_stat OWNER TO postgres;

--
-- Name: team_time_segment_shooting_stat_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.team_time_segment_shooting_stat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.team_time_segment_shooting_stat_id_seq OWNER TO postgres;

--
-- Name: team_time_segment_shooting_stat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.team_time_segment_shooting_stat_id_seq OWNED BY public.team_time_segment_shooting_stat.id;


--
-- Name: within_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.within_data (
    id integer NOT NULL,
    seq character varying(10),
    time_range_feature_id character varying(3),
    data_category character(100),
    times character(50),
    home_rank character(30),
    home_team_name character(100),
    home_score character(20) DEFAULT '0'::bpchar,
    away_rank character(30),
    away_team_name character(100),
    away_score character(20) DEFAULT '0'::bpchar,
    home_exp character(50),
    away_exp character(50),
    home_donation character(50),
    away_donation character(50),
    home_shoot_all character(3),
    away_shoot_all character(30),
    home_shoot_in character(30),
    away_shoot_in character(30),
    home_shoot_out character(30),
    away_shoot_out character(30),
    home_block_shoot character(30),
    away_block_shoot character(30),
    home_big_chance character(30),
    away_big_chance character(30),
    home_corner character(30),
    away_corner character(30),
    home_box_shoot_in character(30),
    away_box_shoot_in character(30),
    home_box_shoot_out character(30),
    away_box_shoot_out character(30),
    home_goal_post character(30),
    away_goal_post character(30),
    home_goal_head character(30),
    away_goal_head character(30),
    home_keeper_save character(30),
    away_keeper_save character(30),
    home_free_kick character(30),
    away_free_kick character(30),
    home_offside character(30),
    away_offside character(30),
    home_foul character(30),
    away_foul character(30),
    home_yellow_card character(30),
    away_yellow_card character(30),
    home_red_card character(30),
    away_red_card character(30),
    home_slow_in character(30),
    away_slow_in character(30),
    home_box_touch character(30),
    away_box_touch character(30),
    home_pass_count character(30),
    away_pass_count character(30),
    home_long_pass_count character(30),
    away_long_pass_count character(30),
    home_final_third_pass_count character(30),
    away_final_third_pass_count character(30),
    home_cross_count character(30),
    away_cross_count character(30),
    home_tackle_count character(30),
    away_tackle_count character(30),
    home_clear_count character(30),
    away_clear_count character(30),
    home_duel_count character(30),
    away_duel_count character(30),
    home_intercept_count character(30),
    away_intercept_count character(30),
    record_time timestamp(0) without time zone,
    weather character(5),
    temparature character(10),
    humid character(5),
    judge_member character(50),
    home_manager character(50),
    away_manager character(50),
    home_formation character(20),
    away_formation character(20),
    studium character(50),
    capacity character(20),
    audience character(20),
    home_max_getting_scorer character(50),
    away_max_getting_scorer character(50),
    home_max_getting_scorer_game_situation character(20),
    away_max_getting_scorer_game_situation character(20),
    home_team_home_score character(20),
    home_team_home_lost character(20),
    away_team_home_score character(20),
    away_team_home_lost character(20),
    home_team_away_score character(20),
    home_team_away_lost character(20),
    away_team_away_score character(20),
    away_team_away_lost character(20),
    notice_flg character(8),
    goal_time character(8),
    goal_team_member character(50),
    judge character(50),
    home_team_style character(50),
    away_team_style character(50),
    probablity character(50),
    prediction_score_time character(50),
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.within_data OWNER TO postgres;

--
-- Name: within_data_20minutes_away_all_league; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.within_data_20minutes_away_all_league (
    id integer NOT NULL,
    time_range character varying(50),
    feature character varying(50),
    threshold character varying(50),
    target character varying(50),
    search character varying(50),
    ratio character varying(50),
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.within_data_20minutes_away_all_league OWNER TO postgres;

--
-- Name: within_data_20minutes_away_all_league_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.within_data_20minutes_away_all_league_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.within_data_20minutes_away_all_league_id_seq OWNER TO postgres;

--
-- Name: within_data_20minutes_away_all_league_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.within_data_20minutes_away_all_league_id_seq OWNED BY public.within_data_20minutes_away_all_league.id;


--
-- Name: within_data_20minutes_away_scored; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.within_data_20minutes_away_scored (
    id integer NOT NULL,
    country character varying(50),
    category character varying(50),
    time_range character varying(50),
    feature character varying(50),
    threshold character varying(50),
    target character varying(50),
    search character varying(50),
    ratio character varying(50),
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.within_data_20minutes_away_scored OWNER TO postgres;

--
-- Name: within_data_20minutes_away_scored_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.within_data_20minutes_away_scored_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.within_data_20minutes_away_scored_id_seq OWNER TO postgres;

--
-- Name: within_data_20minutes_away_scored_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.within_data_20minutes_away_scored_id_seq OWNED BY public.within_data_20minutes_away_scored.id;


--
-- Name: within_data_20minutes_home_all_league; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.within_data_20minutes_home_all_league (
    id integer NOT NULL,
    time_range character varying(50),
    feature character varying(50),
    threshold character varying(50),
    target character varying(50),
    search character varying(50),
    ratio character varying(50),
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.within_data_20minutes_home_all_league OWNER TO postgres;

--
-- Name: within_data_20minutes_home_all_league_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.within_data_20minutes_home_all_league_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.within_data_20minutes_home_all_league_id_seq OWNER TO postgres;

--
-- Name: within_data_20minutes_home_all_league_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.within_data_20minutes_home_all_league_id_seq OWNED BY public.within_data_20minutes_home_all_league.id;


--
-- Name: within_data_20minutes_home_scored; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.within_data_20minutes_home_scored (
    id integer NOT NULL,
    country character varying(50),
    category character varying(50),
    time_range character varying(50),
    feature character varying(50),
    threshold character varying(50),
    target character varying(50),
    search character varying(50),
    ratio character varying(50),
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.within_data_20minutes_home_scored OWNER TO postgres;

--
-- Name: within_data_20minutes_home_scored_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.within_data_20minutes_home_scored_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.within_data_20minutes_home_scored_id_seq OWNER TO postgres;

--
-- Name: within_data_20minutes_home_scored_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.within_data_20minutes_home_scored_id_seq OWNED BY public.within_data_20minutes_home_scored.id;


--
-- Name: within_data_20minutes_same_scored; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.within_data_20minutes_same_scored (
    id integer NOT NULL,
    country character varying(50),
    category character varying(50),
    time_range character varying(50),
    feature character varying(50),
    threshold character varying(50),
    target character varying(50),
    search character varying(50),
    ratio character varying(50),
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.within_data_20minutes_same_scored OWNER TO postgres;

--
-- Name: within_data_20minutes_same_scored_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.within_data_20minutes_same_scored_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.within_data_20minutes_same_scored_id_seq OWNER TO postgres;

--
-- Name: within_data_20minutes_same_scored_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.within_data_20minutes_same_scored_id_seq OWNED BY public.within_data_20minutes_same_scored.id;


--
-- Name: within_data_45minutes_away_all_league; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.within_data_45minutes_away_all_league (
    id integer NOT NULL,
    time_range character varying(50),
    feature character varying(50),
    threshold character varying(50),
    target character varying(50),
    search character varying(50),
    ratio character varying(50),
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.within_data_45minutes_away_all_league OWNER TO postgres;

--
-- Name: within_data_45minutes_away_all_league_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.within_data_45minutes_away_all_league_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.within_data_45minutes_away_all_league_id_seq OWNER TO postgres;

--
-- Name: within_data_45minutes_away_all_league_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.within_data_45minutes_away_all_league_id_seq OWNED BY public.within_data_45minutes_away_all_league.id;


--
-- Name: within_data_45minutes_away_scored; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.within_data_45minutes_away_scored (
    id integer NOT NULL,
    country character varying(50),
    category character varying(50),
    time_range character varying(50),
    feature character varying(50),
    threshold character varying(50),
    target character varying(50),
    search character varying(50),
    ratio character varying(50),
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.within_data_45minutes_away_scored OWNER TO postgres;

--
-- Name: within_data_45minutes_away_scored_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.within_data_45minutes_away_scored_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.within_data_45minutes_away_scored_id_seq OWNER TO postgres;

--
-- Name: within_data_45minutes_away_scored_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.within_data_45minutes_away_scored_id_seq OWNED BY public.within_data_45minutes_away_scored.id;


--
-- Name: within_data_45minutes_home_all_league; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.within_data_45minutes_home_all_league (
    id integer NOT NULL,
    time_range character varying(50),
    feature character varying(50),
    threshold character varying(50),
    target character varying(50),
    search character varying(50),
    ratio character varying(50),
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.within_data_45minutes_home_all_league OWNER TO postgres;

--
-- Name: within_data_45minutes_home_all_league_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.within_data_45minutes_home_all_league_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.within_data_45minutes_home_all_league_id_seq OWNER TO postgres;

--
-- Name: within_data_45minutes_home_all_league_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.within_data_45minutes_home_all_league_id_seq OWNED BY public.within_data_45minutes_home_all_league.id;


--
-- Name: within_data_45minutes_home_scored; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.within_data_45minutes_home_scored (
    id integer NOT NULL,
    country character varying(50),
    category character varying(50),
    time_range character varying(50),
    feature character varying(50),
    threshold character varying(50),
    target character varying(50),
    search character varying(50),
    ratio character varying(50),
    register_id character varying(100),
    register_time timestamp(0) with time zone,
    update_id character varying(100),
    update_time timestamp(0) with time zone
);


ALTER TABLE public.within_data_45minutes_home_scored OWNER TO postgres;

--
-- Name: within_data_45minutes_home_scored_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.within_data_45minutes_home_scored_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.within_data_45minutes_home_scored_id_seq OWNER TO postgres;

--
-- Name: within_data_45minutes_home_scored_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.within_data_45minutes_home_scored_id_seq OWNED BY public.within_data_45minutes_home_scored.id;


--
-- Name: within_data_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.within_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.within_data_id_seq OWNER TO postgres;

--
-- Name: within_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.within_data_id_seq OWNED BY public.within_data.id;


--
-- Name: calc_correlation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calc_correlation ALTER COLUMN id SET DEFAULT nextval('public.calc_correlation_id_seq'::regclass);


--
-- Name: calc_correlation_ranking id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calc_correlation_ranking ALTER COLUMN id SET DEFAULT nextval('public.calc_correlation_ranking_id_seq'::regclass);


--
-- Name: condition_result_data data_seq; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.condition_result_data ALTER COLUMN data_seq SET DEFAULT nextval('public.condition_result_data_data_seq_seq'::regclass);


--
-- Name: country_league_master id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.country_league_master ALTER COLUMN id SET DEFAULT nextval('public.country_league_master_id_seq'::regclass);


--
-- Name: country_league_season_master id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.country_league_season_master ALTER COLUMN id SET DEFAULT nextval('public.country_league_season_master_id_seq'::regclass);


--
-- Name: country_league_summary id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.country_league_summary ALTER COLUMN id SET DEFAULT nextval('public.country_league_summary_id_seq'::regclass);


--
-- Name: data seq; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data ALTER COLUMN seq SET DEFAULT nextval('public.data_seq_seq'::regclass);


--
-- Name: each_team_score_based_feature_stats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.each_team_score_based_feature_stats ALTER COLUMN id SET DEFAULT nextval('public.each_team_score_based_feature_stats_id_seq'::regclass);


--
-- Name: future_master seq; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.future_master ALTER COLUMN seq SET DEFAULT nextval('public.future_master_seq_seq'::regclass);


--
-- Name: league_score_time_band_stats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.league_score_time_band_stats ALTER COLUMN id SET DEFAULT nextval('public.league_score_time_band_stats_id_seq'::regclass);


--
-- Name: league_score_time_band_stats_split_score id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.league_score_time_band_stats_split_score ALTER COLUMN id SET DEFAULT nextval('public.league_score_time_band_stats_split_score_id_seq'::regclass);


--
-- Name: match_classification_result id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_classification_result ALTER COLUMN id SET DEFAULT nextval('public.match_classification_result_id_seq'::regclass);


--
-- Name: match_classification_result_count id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_classification_result_count ALTER COLUMN id SET DEFAULT nextval('public.match_classification_result_count_id_seq'::regclass);


--
-- Name: no_goal_match_stats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.no_goal_match_stats ALTER COLUMN id SET DEFAULT nextval('public.no_goal_match_stats_id_seq'::regclass);


--
-- Name: score_based_feature_stats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.score_based_feature_stats ALTER COLUMN id SET DEFAULT nextval('public.score_based_feature_stats_id_seq'::regclass);


--
-- Name: stat_encryption id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stat_encryption ALTER COLUMN id SET DEFAULT nextval('public.stat_encryption_id_seq'::regclass);


--
-- Name: stat_size_finalize_master id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stat_size_finalize_master ALTER COLUMN id SET DEFAULT nextval('public.stat_size_finalize_master_id_seq'::regclass);


--
-- Name: surface_overview id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.surface_overview ALTER COLUMN id SET DEFAULT nextval('public.surface_overview_id_seq'::regclass);


--
-- Name: team_match_final_stats seq; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_match_final_stats ALTER COLUMN seq SET DEFAULT nextval('public.team_match_final_stats_seq_seq'::regclass);


--
-- Name: team_member_master id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_member_master ALTER COLUMN id SET DEFAULT nextval('public.team_member_master_id_seq'::regclass);


--
-- Name: team_monthly_score_summary seq; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_monthly_score_summary ALTER COLUMN seq SET DEFAULT nextval('public.team_monthly_score_summary_seq_seq'::regclass);


--
-- Name: team_time_segment_shooting_stat id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_time_segment_shooting_stat ALTER COLUMN id SET DEFAULT nextval('public.team_time_segment_shooting_stat_id_seq'::regclass);


--
-- Name: within_data id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data ALTER COLUMN id SET DEFAULT nextval('public.within_data_id_seq'::regclass);


--
-- Name: within_data_20minutes_away_all_league id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_20minutes_away_all_league ALTER COLUMN id SET DEFAULT nextval('public.within_data_20minutes_away_all_league_id_seq'::regclass);


--
-- Name: within_data_20minutes_away_scored id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_20minutes_away_scored ALTER COLUMN id SET DEFAULT nextval('public.within_data_20minutes_away_scored_id_seq'::regclass);


--
-- Name: within_data_20minutes_home_all_league id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_20minutes_home_all_league ALTER COLUMN id SET DEFAULT nextval('public.within_data_20minutes_home_all_league_id_seq'::regclass);


--
-- Name: within_data_20minutes_home_scored id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_20minutes_home_scored ALTER COLUMN id SET DEFAULT nextval('public.within_data_20minutes_home_scored_id_seq'::regclass);


--
-- Name: within_data_20minutes_same_scored id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_20minutes_same_scored ALTER COLUMN id SET DEFAULT nextval('public.within_data_20minutes_same_scored_id_seq'::regclass);


--
-- Name: within_data_45minutes_away_all_league id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_45minutes_away_all_league ALTER COLUMN id SET DEFAULT nextval('public.within_data_45minutes_away_all_league_id_seq'::regclass);


--
-- Name: within_data_45minutes_away_scored id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_45minutes_away_scored ALTER COLUMN id SET DEFAULT nextval('public.within_data_45minutes_away_scored_id_seq'::regclass);


--
-- Name: within_data_45minutes_home_all_league id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_45minutes_home_all_league ALTER COLUMN id SET DEFAULT nextval('public.within_data_45minutes_home_all_league_id_seq'::regclass);


--
-- Name: within_data_45minutes_home_scored id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_45minutes_home_scored ALTER COLUMN id SET DEFAULT nextval('public.within_data_45minutes_home_scored_id_seq'::regclass);


--
-- Data for Name: average_statistics_csv_tmp_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.average_statistics_csv_tmp_data (id, score, country, league, team, game_count, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: average_statistics_team_detail_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.average_statistics_team_detail_data (id, situation, team, opposite_team, ha, country, league, exp_stat, donation_stat, shoot_all_stat, shoot_in_stat, shoot_out_stat, block_shoot_stat, big_chance_stat, corner_stat, box_shoot_in_stat, box_shoot_out_stat, goal_post_stat, goal_head_stat, keeper_save_stat, free_kick_stat, offside_stat, foul_stat, yellow_card_stat, red_card_stat, slow_in_stat, box_touch_stat, pass_count_stat, final_third_pass_count_stat, cross_count_stat, tackle_count_stat, clear_count_stat, intercept_count_stat, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: calc_correlation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.calc_correlation (id, file, country, league, home, away, score, chk_body, home_exp_info, away_exp_info, home_in_goal_exp_info, away_in_goal_exp_info, home_donation_info, away_donation_info, home_shoot_all_info, away_shoot_all_info, home_shoot_in_info, away_shoot_in_info, home_shoot_out_info, away_shoot_out_info, home_block_shoot_info, away_block_shoot_info, home_big_chance_info, away_big_chance_info, home_corner_info, away_corner_info, home_box_shoot_in_info, away_box_shoot_in_info, home_box_shoot_out_info, away_box_shoot_out_info, home_goal_post_info, away_goal_post_info, home_goal_head_info, away_goal_head_info, home_keeper_save_info, away_keeper_save_info, home_free_kick_info, away_free_kick_info, home_offside_info, away_offside_info, home_foul_info, away_foul_info, home_yellow_card_info, away_yellow_card_info, home_red_card_info, away_red_card_info, home_slow_in_info, away_slow_in_info, home_box_touch_info, away_box_touch_info, home_pass_count_info_on_success_ratio, home_pass_count_info_on_success_count, home_pass_count_info_on_try_count, away_pass_count_info_on_success_ratio, away_pass_count_info_on_success_count, away_pass_count_info_on_try_count, home_final_third_pass_count_info_on_success_ratio, home_final_third_pass_count_info_on_success_count, home_final_third_pass_count_info_on_try_count, away_final_third_pass_count_info_on_success_ratio, away_final_third_pass_count_info_on_success_count, away_final_third_pass_count_info_on_try_count, home_cross_count_info_on_success_ratio, home_cross_count_info_on_success_count, home_cross_count_info_on_try_count, away_cross_count_info_on_success_ratio, away_cross_count_info_on_success_count, away_cross_count_info_on_try_count, home_tackle_count_info_on_success_ratio, home_tackle_count_info_on_success_count, home_tackle_count_info_on_try_count, away_tackle_count_info_on_success_ratio, away_tackle_count_info_on_success_count, away_tackle_count_info_on_try_count, home_clear_count_info, away_clear_count_info, home_intercept_count_info, away_intercept_count_info, logic_flg, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: calc_correlation_ranking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.calc_correlation_ranking (id, country, league, home, away, score, "chkBody", rank_1th, rank_2th, rank_3th, rank_4th, rank_5th, rank_6th, rank_7th, rank_8th, rank_9th, rank_10th, rank_11th, rank_12th, rank_13th, rank_14th, rank_15th, rank_16th, rank_17th, rank_18th, rank_19th, rank_20th, rank_21th, rank_22th, rank_23th, rank_24th, rank_25th, rank_26th, rank_27th, rank_28th, rank_29th, rank_30th, rank_31th, rank_32th, rank_33th, rank_34th, rank_35th, rank_36th, rank_37th, rank_38th, rank_39th, rank_40th, rank_41th, rank_42th, rank_43th, rank_44th, rank_45th, rank_46th, rank_47th, rank_48th, rank_49th, rank_50th, rank_51th, rank_52th, rank_53th, rank_54th, rank_55th, rank_56th, rank_57th, rank_58th, rank_59th, rank_60th, rank_61th, rank_62th, rank_63th, rank_64th, rank_65th, rank_66th, rank_67th, rank_68th, rank_69th, rank_70th, rank_71th, rank_72th, rank_73th, rank_74th, logic_flg, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: condition_result_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.condition_result_data (data_seq, mail_target_count, mail_anonymous_target_count, mail_target_success_count, mail_target_fail_count, ex_mail_target_to_no_result_count, ex_no_fin_data_to_no_result_count, goal_delete, alter_target_mail_anonymous, alter_target_mail_fail, no_result_count, err_data, condition_data, hash, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: country_league_master; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.country_league_master (id, country, league, team, link, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: country_league_season_master; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.country_league_season_master (id, country, league, start_season_date, end_season_date, round, path, disp_valid_flg, upd_stamp, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: country_league_summary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.country_league_summary (id, country, league, data_count, csv_count, logic_flg, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.data (seq, condition_result_data_seq_id, data_category, times, home_rank, home_team_name, home_score, away_rank, away_team_name, away_score, home_exp, away_exp, home_in_goal_exp, away_in_goal_exp, home_donation, away_donation, home_shoot_all, away_shoot_all, home_shoot_in, away_shoot_in, home_shoot_out, away_shoot_out, home_block_shoot, away_block_shoot, home_big_chance, away_big_chance, home_corner, away_corner, home_box_shoot_in, away_box_shoot_in, home_box_shoot_out, away_box_shoot_out, home_goal_post, away_goal_post, home_goal_head, away_goal_head, home_keeper_save, away_keeper_save, home_free_kick, away_free_kick, home_offside, away_offside, home_foul, away_foul, home_yellow_card, away_yellow_card, home_red_card, away_red_card, home_slow_in, away_slow_in, home_box_touch, away_box_touch, home_pass_count, away_pass_count, home_long_pass_count, away_long_pass_count, home_final_third_pass_count, away_final_third_pass_count, home_cross_count, away_cross_count, home_tackle_count, away_tackle_count, home_clear_count, away_clear_count, home_duel_count, away_duel_count, home_intercept_count, away_intercept_count, record_time, weather, temparature, humid, judge_member, home_manager, away_manager, home_formation, away_formation, studium, capacity, audience, home_max_getting_scorer, away_max_getting_scorer, home_max_getting_scorer_game_situation, away_max_getting_scorer_game_situation, home_team_home_score, home_team_home_lost, away_team_home_score, away_team_home_lost, home_team_away_score, home_team_away_lost, away_team_away_score, away_team_away_lost, notice_flg, goal_time, goal_team_member, judge, home_team_style, away_team_style, probablity, prediction_score_time, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: each_team_score_based_feature_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.each_team_score_based_feature_stats (id, situation, score, country, league, team, home_exp_stat, away_exp_stat, home_in_goal_exp_stat, away_in_goal_exp_stat, home_donation_stat, away_donation_stat, home_shoot_all_stat, away_shoot_all_stat, home_shoot_in_stat, away_shoot_in_stat, home_shoot_out_stat, away_shoot_out_stat, home_block_shoot_stat, away_block_shoot_stat, home_big_chance_stat, away_big_chance_stat, home_corner_stat, away_corner_stat, home_box_shoot_in_stat, away_box_shoot_in_stat, home_box_shoot_out_stat, away_box_shoot_out_stat, home_goal_post_stat, away_goal_post_stat, home_goal_head_stat, away_goal_head_stat, home_keeper_save_stat, away_keeper_save_stat, home_free_kick_stat, away_free_kick_stat, home_offside_stat, away_offside_stat, home_foul_stat, away_foul_stat, home_yellow_card_stat, away_yellow_card_stat, home_red_card_stat, away_red_card_stat, home_slow_in_stat, away_slow_in_stat, home_box_touch_stat, away_box_touch_stat, home_pass_count_stat, away_pass_count_stat, home_long_pass_count_stat, away_long_pass_count_stat, home_final_third_pass_count_stat, away_final_third_pass_count_stat, home_cross_count_stat, away_cross_count_stat, home_tackle_count_stat, away_tackle_count_stat, home_clear_count_stat, away_clear_count_stat, home_duel_count_stat, away_duel_count_stat, home_intercept_count_stat, away_intercept_count_stat, logic_flg, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: future_master; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.future_master (seq, game_team_category, future_time, home_rank, away_rank, home_team_name, away_team_name, home_max_getting_scorer, away_max_getting_scorer, home_team_home_score, home_team_home_lost, away_team_home_score, away_team_home_lost, home_team_away_score, home_team_away_lost, away_team_away_score, away_team_away_lost, game_link, data_time, start_flg, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: league_score_time_band_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.league_score_time_band_stats (id, country, league, sum_score_value, time_range_area, target, search, ratio, logic_flg, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: league_score_time_band_stats_split_score; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.league_score_time_band_stats_split_score (id, country, league, home_score_value, away_score_value, home_time_range_area, away_time_range_area, target, search, ratio, logic_flg, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: match_classification_result; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.match_classification_result (id, classify_mode, data_category, times, home_rank, home_team_name, home_score, away_rank, away_team_name, away_score, home_exp, away_exp, home_in_goal_exp, away_in_goal_exp, home_donation, away_donation, home_shoot_all, away_shoot_all, home_shoot_in, away_shoot_in, home_shoot_out, away_shoot_out, home_block_shoot, away_block_shoot, home_big_chance, away_big_chance, home_corner, away_corner, home_box_shoot_in, away_box_shoot_in, home_box_shoot_out, away_box_shoot_out, home_goal_post, away_goal_post, home_goal_head, away_goal_head, home_keeper_save, away_keeper_save, home_free_kick, away_free_kick, home_offside, away_offside, home_foul, away_foul, home_yellow_card, away_yellow_card, home_red_card, away_red_card, home_slow_in, away_slow_in, home_box_touch, away_box_touch, home_pass_count, away_pass_count, home_final_third_pass_count, away_final_third_pass_count, home_cross_count, away_cross_count, home_tackle_count, away_tackle_count, home_clear_count, away_clear_count, home_intercept_count, away_intercept_count, record_time, weather, temparature, humid, judge_member, home_manager, away_manager, home_formation, away_formation, studium, capacity, audience, home_max_getting_scorer, away_max_getting_scorer, home_max_getting_scorer_game_situation, away_max_getting_scorer_game_situation, home_team_home_score, home_team_home_lost, away_team_home_score, away_team_home_lost, home_team_away_score, home_team_away_lost, away_team_away_score, away_team_away_lost, notice_flg, goal_time, goal_team_member, judge, home_team_style, away_team_style, probablity, prediction_score_time, logic_flg, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: match_classification_result_count; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.match_classification_result_count (id, country, league, classify_mode, count, remarks, logic_flg, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: no_goal_match_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.no_goal_match_stats (id, seq, data_category, times, home_rank, home_team_name, home_score, away_rank, away_team_name, away_score, home_exp, away_exp, home_in_goal_exp, away_in_goal_exp, home_donation, away_donation, home_shoot_all, away_shoot_all, home_shoot_in, away_shoot_in, home_shoot_out, away_shoot_out, home_block_shoot, away_block_shoot, home_big_chance, away_big_chance, home_corner, away_corner, home_box_shoot_in, away_box_shoot_in, home_box_shoot_out, away_box_shoot_out, home_goal_post, away_goal_post, home_goal_head, away_goal_head, home_keeper_save, away_keeper_save, home_free_kick, away_free_kick, home_offside, away_offside, home_foul, away_foul, home_yellow_card, away_yellow_card, home_red_card, away_red_card, home_slow_in, away_slow_in, home_box_touch, away_box_touch, home_pass_count, away_pass_count, home_long_pass_count, away_long_pass_count, home_final_third_pass_count, away_final_third_pass_count, home_cross_count, away_cross_count, home_tackle_count, away_tackle_count, home_clear_count, away_clear_count, home_duel_count, away_duel_count, home_intercept_count, away_intercept_count, record_time, weather, temparature, humid, judge_member, home_manager, away_manager, home_formation, away_formation, studium, capacity, audience, home_max_getting_scorer, away_max_getting_scorer, home_max_getting_scorer_game_situation, away_max_getting_scorer_game_situation, home_team_home_score, home_team_home_lost, away_team_home_score, away_team_home_lost, home_team_away_score, home_team_away_lost, away_team_away_score, away_team_away_lost, notice_flg, goal_time, goal_team_member, judge, home_team_style, away_team_style, probablity, prediction_score_time, logic_flg, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: score_based_feature_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.score_based_feature_stats (id, situation, score, country, league, home_exp_stat, away_exp_stat, home_in_goal_exp_stat, away_in_goal_exp_stat, home_donation_stat, away_donation_stat, home_shoot_all_stat, away_shoot_all_stat, home_shoot_in_stat, away_shoot_in_stat, home_shoot_out_stat, away_shoot_out_stat, home_block_shoot_stat, away_block_shoot_stat, home_big_chance_stat, away_big_chance_stat, home_corner_stat, away_corner_stat, home_box_shoot_in_stat, away_box_shoot_in_stat, home_box_shoot_out_stat, away_box_shoot_out_stat, home_goal_post_stat, away_goal_post_stat, home_goal_head_stat, away_goal_head_stat, home_keeper_save_stat, away_keeper_save_stat, home_free_kick_stat, away_free_kick_stat, home_offside_stat, away_offside_stat, home_foul_stat, away_foul_stat, home_yellow_card_stat, away_yellow_card_stat, home_red_card_stat, away_red_card_stat, home_slow_in_stat, away_slow_in_stat, home_box_touch_stat, away_box_touch_stat, home_pass_count_stat, away_pass_count_stat, home_long_pass_count_stat, away_long_pass_count_stat, home_final_third_pass_count_stat, away_final_third_pass_count_stat, home_cross_count_stat, away_cross_count_stat, home_tackle_count_stat, away_tackle_count_stat, home_clear_count_stat, away_clear_count_stat, home_duel_count_stat, away_duel_count_stat, home_intercept_count_stat, away_intercept_count_stat, logic_flg, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: scoring_playstyle_past_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scoring_playstyle_past_data (id, data_category, home_team_name, away_team_name, diff_home_score, diff_away_score, diff_home_donation, diff_away_donation, diff_home_shoot_all, diff_away_shoot_all, diff_home_shoot_in, diff_away_shoot_in, diff_home_shoot_out, diff_away_shoot_out, diff_home_block_shoot, diff_away_block_shoot, diff_home_big_chance, diff_away_big_chance, diff_home_corner, diff_away_corner, diff_home_box_shoot_in, diff_away_box_shoot_in, diff_home_box_shoot_out, diff_away_box_shoot_out, diff_home_goal_post, diff_away_goal_post, diff_home_goal_head, diff_away_goal_head, diff_home_keeper_save, diff_away_keeper_save, diff_home_free_kick, diff_away_free_kick, diff_home_offside, diff_away_offside, diff_home_foul, diff_away_foul, diff_home_yellow_card, diff_away_yellow_card, diff_home_red_card, diff_away_red_card, diff_home_slow_in, diff_away_slow_in, diff_home_box_touch, diff_away_box_touch, diff_home_pass_count, diff_away_pass_count, diff_home_final_third_pass_count, diff_away_final_third_pass_count, diff_home_cross_count, diff_away_cross_count, diff_home_tackle_count, diff_away_tackle_count, diff_home_clear_count, diff_away_clear_count, diff_home_intercept_count, diff_away_intercept_count, home_play_style, away_play_style, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: stat_encryption; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stat_encryption (id, country, league, home, away, team, chk_body, home_exp_info, away_exp_info, home_in_goal_exp_info, away_in_goal_exp_info, home_donation_info, away_donation_info, home_shoot_all_info, away_shoot_all_info, home_shoot_in_info, away_shoot_in_info, home_shoot_out_info, away_shoot_out_info, home_block_shoot_info, away_block_shoot_info, home_big_chance_info, away_big_chance_info, home_corner_info, away_corner_info, home_box_shoot_in_info, away_box_shoot_in_info, home_box_shoot_out_info, away_box_shoot_out_info, home_goal_post_info, away_goal_post_info, home_goal_head_info, away_goal_head_info, home_keeper_save_info, away_keeper_save_info, home_free_kick_info, away_free_kick_info, home_offside_info, away_offside_info, home_foul_info, away_foul_info, home_yellow_card_info, away_yellow_card_info, home_red_card_info, away_red_card_info, home_slow_in_info, away_slow_in_info, home_box_touch_info, away_box_touch_info, home_pass_count_info_on_success_count, away_pass_count_info_on_success_count, home_long_pass_count_info_on_success_count, away_long_pass_count_info_on_success_count, home_final_third_pass_count_info_on_success_count, away_final_third_pass_count_info_on_success_count, home_cross_count_info_on_success_count, away_cross_count_info_on_success_count, home_tackle_count_info_on_success_count, away_tackle_count_info_on_success_count, home_clear_count_info, away_clear_count_info, home_duel_count_info, away_duel_count_info, home_intercept_count_info, away_intercept_count_info, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: stat_size_finalize_master; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stat_size_finalize_master (id, option_num, options, flg, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: surface_overview; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.surface_overview (id, country, league, game_year, game_month, team, games, rank, win, lose, draw, winning_points, home_1st_half_score, home_2nd_half_score, home_sum_score, home_1st_half_score_ratio, home_2nd_half_score_ratio, home_clean_sheet, away_1st_half_score, away_2nd_half_score, away_sum_score, away_1st_half_score_ratio, away_2nd_half_score_ratio, away_clean_sheet, fail_to_score_game_count, consecutive_win_disp, consecutive_lose_disp, unbeaten_streak_count, unbeaten_streak_disp, consecutive_score_count, consecutive_score_count_disp, first_week_game_win_count, first_week_game_lost_count, first_week_game_win_disp, mid_week_game_win_count, mid_week_game_lost_count, mid_week_game_win_disp, last_week_game_win_count, last_week_game_lost_count, last_week_game_win_disp, home_win_count, home_lose_count, home_first_goal_count, home_win_behind_count, home_lose_behind_count, home_win_behind_0vs1_count, home_lose_behind_1vs0_count, home_win_behind_0vs2_count, home_lose_behind_2vs0_count, home_win_behind_other_count, home_lose_behind_other_count, home_adversity_disp, away_win_count, away_lose_count, away_first_goal_count, away_win_behind_count, away_lose_behind_count, away_win_behind_1vs0_count, away_lose_behind_0vs1_count, away_win_behind_2vs0_count, away_lose_behind_0vs2_count, away_win_behind_other_count, away_lose_behind_other_count, away_adversity_disp, promote_disp, descend_disp, first_win_disp, lose_streak_disp, round_conc, logic_flg, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: team_match_final_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.team_match_final_stats (seq, team_name, versus_team_name, ha, score, result, game_fin_rank, opposite_game_fin_rank, exp, opposite_exp, in_goal_exp, opposite_in_goal_exp, donation, opposite_donation, shoot_all, opposite_shoot_all, shoot_in, opposite_shoot_in, shoot_out, opposite_shoot_out, block_shoot, opposite_block_shoot, big_chance, opposite_big_chance, corner, opposite_corner, box_shoot_in, opposite_box_shoot_in, box_shoot_out, opposite_box_shoot_out, goal_post, opposite_goal_post, goal_head, opposite_goal_head, keeper_save, opposite_keeper_save, free_kick, opposite_free_kick, offside, opposite_offside, foul, opposite_foul, yellow_card, opposite_yellow_card, red_card, opposite_red_card, slow_in, opposite_slow_in, box_touch, opposite_box_touch, pass_count_success_ratio, pass_count_success_count, pass_count_try_count, opposite_pass_count_success_ratio, opposite_pass_count_success_count, opposite_pass_count_try_count, long_pass_count_success_ratio, long_pass_count_success_count, long_pass_count_try_count, opposite_long_pass_count_success_ratio, opposite_long_pass_count_success_count, opposite_long_pass_count_try_count, final_third_pass_count_success_ratio, final_third_pass_count_success_count, final_third_pass_count_try_count, opposite_final_third_pass_count_success_ratio, opposite_final_third_pass_count_success_count, opposite_final_third_pass_count_try_count, cross_count_success_ratio, cross_count_success_count, cross_count_try_count, opposite_cross_count_success_ratio, opposite_cross_count_success_count, opposite_cross_count_try_count, tackle_count_success_ratio, tackle_count_success_count, tackle_count_try_count, opposite_tackle_count_success_ratio, opposite_tackle_count_success_count, opposite_tackle_count_try_count, clear_count, opposite_clear_count, duel_count, opposite_duel_count, intercept_count, opposite_intercept_count, weather, temperature, humid, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: team_member_master; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.team_member_master (id, country, league, team, score, loan_belong, jersey, member, face_pic_path, belong_list, height, weight, "position", birth, age, market_value, injury, versus_team_score_data, retire_flg, deadline, deadline_contract_date, latest_info_date, upd_stamp, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: team_monthly_score_summary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.team_monthly_score_summary (seq, country, league, team_name, "HA", year, jar_sum_score, feb_sum_score, mar_sum_score, apr_sum_score, may_sum_score, jun_sum_score, jul_sum_score, aug_sum_score, sep_sum_score, oct_sum_score, nov_sum_score, dec_sum_score, logic_flg, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: team_time_segment_shooting_stat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.team_time_segment_shooting_stat (id, data_category, team_name, away_team_name, team_0_10_mean_shoot_count, team_11_20_mean_shoot_count, team_21_30_mean_shoot_count, team_31_40_mean_shoot_count, team_41_45_mean_shoot_count, team_46_50_mean_shoot_count, team_51_60_mean_shoot_count, team_61_70_mean_shoot_count, team_71_80_mean_shoot_count, team_81_90_mean_shoot_count, team_addi_mean_shoot_count, team_0_10_mean_shoot_in_count, team_11_20_mean_shoot_in_count, team_21_30_mean_shoot_in_count, team_31_40_mean_shoot_in_count, team_41_45_mean_shoot_in_count, team_46_50_mean_shoot_in_count, team_51_60_mean_shoot_in_count, team_61_70_mean_shoot_in_count, team_71_80_mean_shoot_in_count, team_81_90_mean_shoot_in_count, team_addi_mean_shoot_in_count, team_0_10_mean_big_chance_count, team_11_20_mean_big_chance_count, team_21_30_mean_big_chance_count, team_31_40_mean_big_chance_count, team_41_45_mean_big_chance_count, team_46_50_mean_big_chance_count, team_51_60_mean_big_chance_count, team_61_70_mean_big_chance_count, team_71_80_mean_big_chance_count, team_81_90_mean_big_chance_count, team_addi_mean_big_chance_count, team_0_10_mean_free_kick_count, team_11_20_mean_free_kick_count, team_21_30_mean_free_kick_count, team_31_40_mean_free_kick_count, team_41_45_mean_free_kick_count, team_46_50_mean_free_kick_count, team_51_60_mean_free_kick_count, team_61_70_mean_free_kick_count, team_71_80_mean_free_kick_count, team_81_90_mean_free_kick_count, team_addi_mean_free_kick_count, team_0_10_mean_offside_count, team_11_20_mean_offside_count, team_21_30_mean_offside_count, team_31_40_mean_offside_count, team_41_45_mean_offside_count, team_46_50_mean_offside_count, team_51_60_mean_offside_count, team_61_70_mean_offside_count, team_71_80_mean_offside_count, team_81_90_mean_offside_count, team_addi_mean_offside_count, team_0_10_mean_foul_count, team_11_20_mean_foul_count, team_21_30_mean_foul_count, team_31_40_mean_foul_count, team_41_45_mean_foul_count, team_46_50_mean_foul_count, team_51_60_mean_foul_count, team_61_70_mean_foul_count, team_71_80_mean_foul_count, team_81_90_mean_foul_count, team_addi_mean_foul_count, team_0_10_mean_yellow_card_count, team_11_20_mean_yellow_card_count, team_21_30_mean_yellow_card_count, team_31_40_mean_yellow_card_count, team_41_45_mean_yellow_card_count, team_46_50_mean_yellow_card_count, team_51_60_mean_yellow_card_count, team_61_70_mean_yellow_card_count, team_71_80_mean_yellow_card_count, team_81_90_mean_yellow_card_count, team_addi_mean_yellow_card_count, team_0_10_mean_red_card_count, team_11_20_mean_red_card_count, team_21_30_mean_red_card_count, team_31_40_mean_red_card_count, team_41_45_mean_red_card_count, team_46_50_mean_red_card_count, team_51_60_mean_red_card_count, team_61_70_mean_red_card_count, team_71_80_mean_red_card_count, team_81_90_mean_red_card_count, team_addi_mean_red_card_count, logic_flg, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: within_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.within_data (id, seq, time_range_feature_id, data_category, times, home_rank, home_team_name, home_score, away_rank, away_team_name, away_score, home_exp, away_exp, home_donation, away_donation, home_shoot_all, away_shoot_all, home_shoot_in, away_shoot_in, home_shoot_out, away_shoot_out, home_block_shoot, away_block_shoot, home_big_chance, away_big_chance, home_corner, away_corner, home_box_shoot_in, away_box_shoot_in, home_box_shoot_out, away_box_shoot_out, home_goal_post, away_goal_post, home_goal_head, away_goal_head, home_keeper_save, away_keeper_save, home_free_kick, away_free_kick, home_offside, away_offside, home_foul, away_foul, home_yellow_card, away_yellow_card, home_red_card, away_red_card, home_slow_in, away_slow_in, home_box_touch, away_box_touch, home_pass_count, away_pass_count, home_long_pass_count, away_long_pass_count, home_final_third_pass_count, away_final_third_pass_count, home_cross_count, away_cross_count, home_tackle_count, away_tackle_count, home_clear_count, away_clear_count, home_duel_count, away_duel_count, home_intercept_count, away_intercept_count, record_time, weather, temparature, humid, judge_member, home_manager, away_manager, home_formation, away_formation, studium, capacity, audience, home_max_getting_scorer, away_max_getting_scorer, home_max_getting_scorer_game_situation, away_max_getting_scorer_game_situation, home_team_home_score, home_team_home_lost, away_team_home_score, away_team_home_lost, home_team_away_score, home_team_away_lost, away_team_away_score, away_team_away_lost, notice_flg, goal_time, goal_team_member, judge, home_team_style, away_team_style, probablity, prediction_score_time, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: within_data_20minutes_away_all_league; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.within_data_20minutes_away_all_league (id, time_range, feature, threshold, target, search, ratio, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: within_data_20minutes_away_scored; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.within_data_20minutes_away_scored (id, country, category, time_range, feature, threshold, target, search, ratio, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: within_data_20minutes_home_all_league; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.within_data_20minutes_home_all_league (id, time_range, feature, threshold, target, search, ratio, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: within_data_20minutes_home_scored; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.within_data_20minutes_home_scored (id, country, category, time_range, feature, threshold, target, search, ratio, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: within_data_20minutes_same_scored; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.within_data_20minutes_same_scored (id, country, category, time_range, feature, threshold, target, search, ratio, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: within_data_45minutes_away_all_league; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.within_data_45minutes_away_all_league (id, time_range, feature, threshold, target, search, ratio, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: within_data_45minutes_away_scored; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.within_data_45minutes_away_scored (id, country, category, time_range, feature, threshold, target, search, ratio, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: within_data_45minutes_home_all_league; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.within_data_45minutes_home_all_league (id, time_range, feature, threshold, target, search, ratio, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Data for Name: within_data_45minutes_home_scored; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.within_data_45minutes_home_scored (id, country, category, time_range, feature, threshold, target, search, ratio, register_id, register_time, update_id, update_time) FROM stdin;
\.


--
-- Name: calc_correlation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.calc_correlation_id_seq', 1, false);


--
-- Name: calc_correlation_ranking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.calc_correlation_ranking_id_seq', 1, false);


--
-- Name: condition_result_data_data_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.condition_result_data_data_seq_seq', 1, false);


--
-- Name: country_league_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.country_league_master_id_seq', 1, false);


--
-- Name: country_league_season_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.country_league_season_master_id_seq', 1, false);


--
-- Name: country_league_summary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.country_league_summary_id_seq', 1, false);


--
-- Name: data_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.data_seq_seq', 1, false);


--
-- Name: each_team_score_based_feature_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.each_team_score_based_feature_stats_id_seq', 1, false);


--
-- Name: future_master_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.future_master_seq_seq', 1, false);


--
-- Name: league_score_time_band_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.league_score_time_band_stats_id_seq', 1, false);


--
-- Name: league_score_time_band_stats_split_score_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.league_score_time_band_stats_split_score_id_seq', 1, false);


--
-- Name: match_classification_result_count_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.match_classification_result_count_id_seq', 1, false);


--
-- Name: match_classification_result_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.match_classification_result_id_seq', 1, false);


--
-- Name: no_goal_match_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.no_goal_match_stats_id_seq', 1, false);


--
-- Name: score_based_feature_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.score_based_feature_stats_id_seq', 1, false);


--
-- Name: stat_encryption_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stat_encryption_id_seq', 1, false);


--
-- Name: stat_size_finalize_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stat_size_finalize_master_id_seq', 1, false);


--
-- Name: surface_overview_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.surface_overview_id_seq', 1, false);


--
-- Name: team_match_final_stats_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.team_match_final_stats_seq_seq', 1, false);


--
-- Name: team_member_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.team_member_master_id_seq', 1, false);


--
-- Name: team_monthly_score_summary_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.team_monthly_score_summary_seq_seq', 1, false);


--
-- Name: team_time_segment_shooting_stat_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.team_time_segment_shooting_stat_id_seq', 1, false);


--
-- Name: within_data_20minutes_away_all_league_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.within_data_20minutes_away_all_league_id_seq', 1, false);


--
-- Name: within_data_20minutes_away_scored_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.within_data_20minutes_away_scored_id_seq', 1, false);


--
-- Name: within_data_20minutes_home_all_league_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.within_data_20minutes_home_all_league_id_seq', 1, false);


--
-- Name: within_data_20minutes_home_scored_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.within_data_20minutes_home_scored_id_seq', 1, false);


--
-- Name: within_data_20minutes_same_scored_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.within_data_20minutes_same_scored_id_seq', 1, false);


--
-- Name: within_data_45minutes_away_all_league_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.within_data_45minutes_away_all_league_id_seq', 1, false);


--
-- Name: within_data_45minutes_away_scored_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.within_data_45minutes_away_scored_id_seq', 1, false);


--
-- Name: within_data_45minutes_home_all_league_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.within_data_45minutes_home_all_league_id_seq', 1, false);


--
-- Name: within_data_45minutes_home_scored_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.within_data_45minutes_home_scored_id_seq', 1, false);


--
-- Name: within_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.within_data_id_seq', 1, false);


--
-- Name: average_statistics_csv_tmp_data average_statistics_csv_tmp_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.average_statistics_csv_tmp_data
    ADD CONSTRAINT average_statistics_csv_tmp_data_pkey PRIMARY KEY (id);


--
-- Name: average_statistics_team_detail_data average_statistics_team_detail_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.average_statistics_team_detail_data
    ADD CONSTRAINT average_statistics_team_detail_data_pkey PRIMARY KEY (id);


--
-- Name: calc_correlation calc_correlation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calc_correlation
    ADD CONSTRAINT calc_correlation_pkey PRIMARY KEY (id);


--
-- Name: calc_correlation_ranking calc_correlation_ranking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calc_correlation_ranking
    ADD CONSTRAINT calc_correlation_ranking_pkey PRIMARY KEY (id);


--
-- Name: condition_result_data condition_result_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.condition_result_data
    ADD CONSTRAINT condition_result_data_pkey PRIMARY KEY (data_seq);


--
-- Name: country_league_master country_league_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.country_league_master
    ADD CONSTRAINT country_league_master_pkey PRIMARY KEY (id);


--
-- Name: country_league_season_master country_league_season_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.country_league_season_master
    ADD CONSTRAINT country_league_season_master_pkey PRIMARY KEY (id);


--
-- Name: country_league_summary country_league_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.country_league_summary
    ADD CONSTRAINT country_league_summary_pkey PRIMARY KEY (id);


--
-- Name: data data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data
    ADD CONSTRAINT data_pkey PRIMARY KEY (seq);


--
-- Name: each_team_score_based_feature_stats each_team_score_based_feature_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.each_team_score_based_feature_stats
    ADD CONSTRAINT each_team_score_based_feature_stats_pkey PRIMARY KEY (id);


--
-- Name: future_master future_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.future_master
    ADD CONSTRAINT future_master_pkey PRIMARY KEY (seq);


--
-- Name: league_score_time_band_stats league_score_time_band_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.league_score_time_band_stats
    ADD CONSTRAINT league_score_time_band_stats_pkey PRIMARY KEY (id);


--
-- Name: league_score_time_band_stats_split_score league_score_time_band_stats_split_score_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.league_score_time_band_stats_split_score
    ADD CONSTRAINT league_score_time_band_stats_split_score_pkey PRIMARY KEY (id);


--
-- Name: match_classification_result_count match_classification_result_count_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_classification_result_count
    ADD CONSTRAINT match_classification_result_count_pkey PRIMARY KEY (id);


--
-- Name: match_classification_result match_classification_result_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_classification_result
    ADD CONSTRAINT match_classification_result_pkey PRIMARY KEY (id);


--
-- Name: no_goal_match_stats no_goal_match_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.no_goal_match_stats
    ADD CONSTRAINT no_goal_match_stats_pkey PRIMARY KEY (id);


--
-- Name: score_based_feature_stats score_based_feature_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.score_based_feature_stats
    ADD CONSTRAINT score_based_feature_stats_pkey PRIMARY KEY (id);


--
-- Name: scoring_playstyle_past_data scoring_playstyle_past_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoring_playstyle_past_data
    ADD CONSTRAINT scoring_playstyle_past_data_pkey PRIMARY KEY (id);


--
-- Name: stat_encryption stat_encryption_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stat_encryption
    ADD CONSTRAINT stat_encryption_pkey PRIMARY KEY (id);


--
-- Name: stat_size_finalize_master stat_size_finalize_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stat_size_finalize_master
    ADD CONSTRAINT stat_size_finalize_master_pkey PRIMARY KEY (id);


--
-- Name: surface_overview surface_overview_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.surface_overview
    ADD CONSTRAINT surface_overview_pkey PRIMARY KEY (id);


--
-- Name: team_match_final_stats team_match_final_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_match_final_stats
    ADD CONSTRAINT team_match_final_stats_pkey PRIMARY KEY (seq);


--
-- Name: team_member_master team_member_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_member_master
    ADD CONSTRAINT team_member_master_pkey PRIMARY KEY (id, team, jersey, member, face_pic_path);


--
-- Name: team_monthly_score_summary team_monthly_score_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_monthly_score_summary
    ADD CONSTRAINT team_monthly_score_summary_pkey PRIMARY KEY (seq);


--
-- Name: team_time_segment_shooting_stat team_time_segment_shooting_stat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_time_segment_shooting_stat
    ADD CONSTRAINT team_time_segment_shooting_stat_pkey PRIMARY KEY (id);


--
-- Name: within_data_20minutes_away_all_league within_data_20minutes_away_all_league_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_20minutes_away_all_league
    ADD CONSTRAINT within_data_20minutes_away_all_league_pkey PRIMARY KEY (id);


--
-- Name: within_data_20minutes_away_scored within_data_20minutes_away_scored_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_20minutes_away_scored
    ADD CONSTRAINT within_data_20minutes_away_scored_pkey PRIMARY KEY (id);


--
-- Name: within_data_20minutes_home_all_league within_data_20minutes_home_all_league_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_20minutes_home_all_league
    ADD CONSTRAINT within_data_20minutes_home_all_league_pkey PRIMARY KEY (id);


--
-- Name: within_data_20minutes_home_scored within_data_20minutes_home_scored_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_20minutes_home_scored
    ADD CONSTRAINT within_data_20minutes_home_scored_pkey PRIMARY KEY (id);


--
-- Name: within_data_20minutes_same_scored within_data_20minutes_same_scored_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_20minutes_same_scored
    ADD CONSTRAINT within_data_20minutes_same_scored_pkey PRIMARY KEY (id);


--
-- Name: within_data_45minutes_away_all_league within_data_45minutes_away_all_league_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_45minutes_away_all_league
    ADD CONSTRAINT within_data_45minutes_away_all_league_pkey PRIMARY KEY (id);


--
-- Name: within_data_45minutes_away_scored within_data_45minutes_away_scored_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_45minutes_away_scored
    ADD CONSTRAINT within_data_45minutes_away_scored_pkey PRIMARY KEY (id);


--
-- Name: within_data_45minutes_home_all_league within_data_45minutes_home_all_league_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_45minutes_home_all_league
    ADD CONSTRAINT within_data_45minutes_home_all_league_pkey PRIMARY KEY (id);


--
-- Name: within_data_45minutes_home_scored within_data_45minutes_home_scored_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data_45minutes_home_scored
    ADD CONSTRAINT within_data_45minutes_home_scored_pkey PRIMARY KEY (id);


--
-- Name: within_data within_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.within_data
    ADD CONSTRAINT within_data_pkey PRIMARY KEY (id);


--
-- Name: country_UNIQUE; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "country_UNIQUE" ON public.country_league_summary USING btree (country);


--
-- Name: idx_data_keys_times_seq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_data_keys_times_seq ON public.data USING btree (data_category, home_team_name, away_team_name, times, seq);


--
-- Name: idx_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lookup ON public.surface_overview USING btree (country, league, game_year, game_month, team);


--
-- Name: league_UNIQUE; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "league_UNIQUE" ON public.country_league_summary USING btree (league);


--
-- Name: uk_team_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uk_team_month ON public.surface_overview USING btree (country, league, team, game_year, game_month);


--
-- PostgreSQL database dump complete
--

\unrestrict FVNPkdZLhB9XcSqxtJsmaZ8zgdhEqbuMwtMNczWnJWkgKWe5LVvrOImZFsluM4h

--
-- Database "soccer_bm_user" dump
--

--
-- PostgreSQL database dump
--

\restrict aqdFz31gegSYKY66c1JvKIF5ind4KxfEFnKxh6TQk6CHyKPYi9oy9Ayx2sukabu

-- Dumped from database version 15.19 (Debian 15.19-1.pgdg13+2)
-- Dumped by pg_dump version 15.19 (Debian 15.19-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: soccer_bm_user; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE soccer_bm_user WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE soccer_bm_user OWNER TO postgres;

\unrestrict aqdFz31gegSYKY66c1JvKIF5ind4KxfEFnKxh6TQk6CHyKPYi9oy9Ayx2sukabu
\connect soccer_bm_user
\restrict aqdFz31gegSYKY66c1JvKIF5ind4KxfEFnKxh6TQk6CHyKPYi9oy9Ayx2sukabu

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    userid text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (userid, email, "passwordHash", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (userid);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- PostgreSQL database dump complete
--

\unrestrict aqdFz31gegSYKY66c1JvKIF5ind4KxfEFnKxh6TQk6CHyKPYi9oy9Ayx2sukabu

--
-- PostgreSQL database cluster dump complete
--

