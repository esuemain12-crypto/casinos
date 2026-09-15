-- CreateTable
CREATE TABLE "CryptoDeposit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" VARCHAR(100) NOT NULL,
    "privateKey" VARCHAR(200) NOT NULL,
    "currency" VARCHAR(20) NOT NULL DEFAULT 'USDT_TRC20',
    "amountUSD" DECIMAL(18,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "txHash" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "CryptoDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CryptoDeposit_address_key" ON "CryptoDeposit"("address");

-- CreateIndex
CREATE INDEX "CryptoDeposit_userId_idx" ON "CryptoDeposit"("userId");

-- CreateIndex
CREATE INDEX "CryptoDeposit_status_idx" ON "CryptoDeposit"("status");

-- CreateIndex
CREATE INDEX "CryptoDeposit_address_idx" ON "CryptoDeposit"("address");

-- AddForeignKey
ALTER TABLE "CryptoDeposit" ADD CONSTRAINT "CryptoDeposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
