-- AlterTable
ALTER TABLE "Deposit" ADD COLUMN     "network" TEXT,
ADD COLUMN     "token" TEXT,
ADD COLUMN     "txHash" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roqquCheckedAt" TIMESTAMP(3),
ADD COLUMN     "roqquStatus" TEXT;

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "refid" TEXT;

-- CreateTable
CREATE TABLE "DepositAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "sandbox" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepositAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoqquTx" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "live" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "reference" TEXT,
    "hash" TEXT,
    "token" TEXT,
    "network" TEXT,
    "value" DOUBLE PRECISION,
    "amountNgn" INTEGER,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoqquTx_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DepositAddress_address_idx" ON "DepositAddress"("address");

-- CreateIndex
CREATE UNIQUE INDEX "DepositAddress_userId_network_key" ON "DepositAddress"("userId", "network");

-- CreateIndex
CREATE INDEX "RoqquTx_kind_createdAt_idx" ON "RoqquTx"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "RoqquTx_hash_idx" ON "RoqquTx"("hash");

-- AddForeignKey
ALTER TABLE "DepositAddress" ADD CONSTRAINT "DepositAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
