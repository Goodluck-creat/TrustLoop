-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "contributorId" TEXT NOT NULL,
    "note" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalWork" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceUrl" TEXT NOT NULL,
    "clientName" TEXT,
    "refereeToken" TEXT NOT NULL,
    "refereeName" TEXT,
    "refereeEmail" TEXT,
    "refereeComment" TEXT,
    "refereeResponse" TEXT,
    "respondedAt" TIMESTAMP(3),
    "check" JSONB,
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalWork_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Application_taskId_idx" ON "Application"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_taskId_contributorId_key" ON "Application"("taskId", "contributorId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalWork_refereeToken_key" ON "ExternalWork"("refereeToken");

-- CreateIndex
CREATE INDEX "ExternalWork_userId_idx" ON "ExternalWork"("userId");

-- CreateIndex
CREATE INDEX "ExternalWork_evidenceUrl_idx" ON "ExternalWork"("evidenceUrl");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalWork" ADD CONSTRAINT "ExternalWork_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
