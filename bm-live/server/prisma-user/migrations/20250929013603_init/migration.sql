-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."Favorite" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "country" VARCHAR(128) NOT NULL,
    "league" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "userid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "User_pkey" PRIMARY KEY ("userid")
);

-- CreateIndex
CREATE INDEX "idx_fav_country_league" ON "public"."Favorite"("country" ASC, "league" ASC);

-- CreateIndex
CREATE INDEX "idx_fav_user" ON "public"."Favorite"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uk_user_country_league" ON "public"."Favorite"("userId" ASC, "country" ASC, "league" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("userid") ON DELETE CASCADE ON UPDATE CASCADE;

