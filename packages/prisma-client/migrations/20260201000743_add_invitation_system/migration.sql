-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'AGRONOMIST', 'FIELD_WORKER', 'CLIENT_ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "SoilType" AS ENUM ('CHERNOZEM', 'LOAM', 'SANDY', 'CLAY', 'PODZOLIC', 'SODDY', 'GRAY_FOREST', 'CHESTNUT');

-- CreateEnum
CREATE TYPE "FieldStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'IN_PROCESSING');

-- CreateEnum
CREATE TYPE "CropType" AS ENUM ('WINTER', 'SPRING', 'PERENNIAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "UserAccessLevel" AS ENUM ('DEMO', 'INVITED', 'ACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "phone" TEXT,
    "telegramId" TEXT,
    "companyId" TEXT,
    "clientId" TEXT,
    "accessLevel" "UserAccessLevel" NOT NULL DEFAULT 'DEMO',
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "demoExpiresAt" TIMESTAMP(3),
    "coreUserId" TEXT,
    "coreWalletId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "email" TEXT,
    "telegramId" TEXT,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT,
    "role" "UserRole" NOT NULL,
    "accessLevel" "UserAccessLevel" NOT NULL DEFAULT 'INVITED',
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" TEXT NOT NULL,
    "cadastreNumber" TEXT NOT NULL,
    "name" TEXT,
    "area" DOUBLE PRECISION NOT NULL,
    "coordinates" JSONB NOT NULL,
    "centroid" JSONB,
    "soilType" "SoilType" NOT NULL,
    "status" "FieldStatus" NOT NULL DEFAULT 'ACTIVE',
    "clientId" TEXT NOT NULL,
    "coreObjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crops" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variety" TEXT,
    "reproduction" TEXT,
    "type" "CropType" NOT NULL,
    "vegetationPeriod" INTEGER NOT NULL,
    "sowingNormMin" DOUBLE PRECISION,
    "sowingNormMax" DOUBLE PRECISION,
    "sowingDepthMin" DOUBLE PRECISION,
    "sowingDepthMax" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "SeasonStatus" NOT NULL DEFAULT 'PLANNING',
    "fieldId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "technologyCardId" TEXT,
    "coreProcessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technology_cards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technology_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technology_card_operations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "technologyCardId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technology_card_operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegramId_key" ON "users"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "users_coreUserId_key" ON "users"("coreUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_coreWalletId_key" ON "users"("coreWalletId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_shortCode_key" ON "invitations"("shortCode");

-- CreateIndex
CREATE INDEX "invitations_token_idx" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_shortCode_idx" ON "invitations"("shortCode");

-- CreateIndex
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

-- CreateIndex
CREATE INDEX "invitations_telegramId_idx" ON "invitations"("telegramId");

-- CreateIndex
CREATE INDEX "invitations_status_idx" ON "invitations"("status");

-- CreateIndex
CREATE INDEX "invitations_expiresAt_idx" ON "invitations"("expiresAt");

-- CreateIndex
CREATE INDEX "invitations_inviterId_idx" ON "invitations"("inviterId");

-- CreateIndex
CREATE UNIQUE INDEX "fields_cadastreNumber_key" ON "fields"("cadastreNumber");

-- CreateIndex
CREATE UNIQUE INDEX "fields_coreObjectId_key" ON "fields"("coreObjectId");

-- CreateIndex
CREATE INDEX "fields_coordinates_idx" ON "fields"("coordinates");

-- CreateIndex
CREATE INDEX "fields_clientId_idx" ON "fields"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_coreProcessId_key" ON "seasons"("coreProcessId");

-- CreateIndex
CREATE INDEX "seasons_fieldId_idx" ON "seasons"("fieldId");

-- CreateIndex
CREATE INDEX "seasons_cropId_idx" ON "seasons"("cropId");

-- CreateIndex
CREATE INDEX "technology_card_operations_technologyCardId_idx" ON "technology_card_operations"("technologyCardId");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_technologyCardId_fkey" FOREIGN KEY ("technologyCardId") REFERENCES "technology_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technology_card_operations" ADD CONSTRAINT "technology_card_operations_technologyCardId_fkey" FOREIGN KEY ("technologyCardId") REFERENCES "technology_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
