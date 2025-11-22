-- CreateTable
CREATE TABLE "public"."users" (
    "userid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("userid")
);

-- CreateTable
CREATE TABLE "public"."favorites" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "league" VARCHAR(100) NOT NULL,
    "team" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "idx_fav_user" ON "public"."favorites"("userId");

-- CreateIndex
CREATE INDEX "idx_fav_country_league" ON "public"."favorites"("country", "league", "team");

-- CreateIndex
CREATE UNIQUE INDEX "uk_user_country_league" ON "public"."favorites"("userId", "country", "league");

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("userid") ON DELETE CASCADE ON UPDATE CASCADE;
