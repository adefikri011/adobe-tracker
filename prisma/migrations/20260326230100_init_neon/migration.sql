-- CreateTable
CREATE TABLE "Asset" (
    "id" SERIAL NOT NULL,
    "adobeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "creator" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Premium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_adobeId_key" ON "Asset"("adobeId");
