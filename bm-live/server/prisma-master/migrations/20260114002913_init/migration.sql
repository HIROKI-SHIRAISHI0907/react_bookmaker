-- AlterTable
ALTER TABLE "team_member_master" ADD COLUMN     "del_flg" VARCHAR(1) NOT NULL DEFAULT '0';

-- CreateTable
CREATE TABLE "batch_job_exec" (
    "job_id" TEXT NOT NULL,
    "batch_cd" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "register_id" VARCHAR(100),
    "register_time" TIMESTAMPTZ(0),
    "update_id" VARCHAR(100),
    "update_time" TIMESTAMPTZ(0),

    CONSTRAINT "batch_job_exec_pkey" PRIMARY KEY ("job_id")
);
