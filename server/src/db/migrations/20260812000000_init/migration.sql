-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'COMPLETE', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "githubId" TEXT NOT NULL,
    "githubLogin" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoreConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "encryptedApiKey" TEXT NOT NULL,
    "coreVersion" TEXT,
    "instanceType" TEXT,
    "identity" TEXT,
    "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CoreConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DatabaseConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedDatabaseUrl" TEXT NOT NULL,
    "migratedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DatabaseConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "speciesTaxonomyId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "coreRunId" TEXT,
    "status" "RunStatus" NOT NULL DEFAULT 'PENDING',
    "request" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");
CREATE UNIQUE INDEX "CoreConnection_userId_key" ON "CoreConnection"("userId");
CREATE UNIQUE INDEX "DatabaseConnection_userId_key" ON "DatabaseConnection"("userId");
CREATE INDEX "Project_userId_updatedAt_idx" ON "Project"("userId", "updatedAt");
CREATE UNIQUE INDEX "Run_projectId_coreRunId_key" ON "Run"("projectId", "coreRunId");
CREATE INDEX "Run_projectId_createdAt_idx" ON "Run"("projectId", "createdAt");
CREATE INDEX "Run_status_idx" ON "Run"("status");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- AddForeignKey
ALTER TABLE "CoreConnection" ADD CONSTRAINT "CoreConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DatabaseConnection" ADD CONSTRAINT "DatabaseConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Run" ADD CONSTRAINT "Run_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
